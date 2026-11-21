import { expect, mock, test } from 'claude-code/testing'

import { LOCALES, detectLocale, nextLocale, strings } from '../hooks/i18n'
import { reconcileTasks, shellLine } from '../hooks/live'

const PANE = {
  plugin: 'better-claude-dashboard',
  component: 'Pane',
  requestId: 'better-claude-dashboard',
  props: {
    title: 'Usage',
    isFocused: false,
    bodyColumns: 48,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

const WIDGET = { ...PANE, props: { ...PANE.props, placement: 'widget' } } as const

test('the pane draws before any reading, on terminal and desktop', async $ => {
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: /No subagents yet/ }))?.text).toBe('No subagents yet.')
    await ui.unmount()
  }
})

test('the new cards draw before any data, on terminal and desktop', async $ => {
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ type: 'Text', text: /PERMISSIONS$/ })).toBeTruthy()
    expect(await ui.find({ type: 'Text', text: /TURN$/ })).toBeTruthy()
    expect((await ui.find({ type: 'Text', text: /^no turn yet$/ }))?.text).toBe('no turn yet')
    expect(await ui.find({ type: 'Text', text: /SESSION LOG$/ })).toBeTruthy()
    expect((await ui.find({ type: 'Text', text: /No events yet/ }))?.text).toBe('No events yet.')
    expect((await ui.find({ type: 'Text', text: /no tool calls yet/ }))?.text).toBe('no tool calls yet')
    await ui.unmount()
  }
})

test('the widget glance draws on desktop', async $ => {
  const ui = await $.ui.mount({ ...WIDGET, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /subagents active/ }))?.text).toBe('no subagents active')
  await ui.unmount()
})

test('a card folds when its arrow is pressed and opens again', async $ => {
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /^last turn/ })).toBeTruthy()
  await ui.press({ plugin: 'better-claude-dashboard', key: 'turn-fold' })
  expect(await ui.find({ type: 'Text', text: /^last turn/ })).toBeFalsy()
  await ui.press({ plugin: 'better-claude-dashboard', key: 'turn-fold' })
  expect(await ui.find({ type: 'Text', text: /^last turn/ })).toBeTruthy()
  await ui.unmount()
})

test('a card is picked up by its handle and dropped by another handle', async $ => {
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /moving/ })).toBeFalsy()
  await ui.press({ plugin: 'better-claude-dashboard', key: 'turn-grip' })
  expect(await ui.find({ type: 'Text', text: /moving turn/ })).toBeTruthy()
  await ui.press({ plugin: 'better-claude-dashboard', key: 'log-grip' })
  expect(await ui.find({ type: 'Text', text: /moving/ })).toBeFalsy()
  await ui.unmount()
})

test('the language button cycles every locale and back to English', async ($, on) => {
  mock.store(on)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /PERMISSIONS$/ })).toBeTruthy()
  for (const title of ['權限', '权限', '権限', '권한', 'PERMISSIONS']) {
    await ui.press({ plugin: 'better-claude-dashboard', key: 'lang' })
    expect(await ui.find({ type: 'Text', text: new RegExp(`${title}$`) })).toBeTruthy()
  }
  await ui.unmount()
})

test('locale detection maps env and setting spellings', async () => {
  expect(detectLocale('zh_TW.UTF-8')).toBe('zh-TW')
  expect(detectLocale('zh-Hant')).toBe('zh-TW')
  expect(detectLocale('Traditional Chinese')).toBe('zh-TW')
  expect(detectLocale('zh_CN.UTF-8')).toBe('zh-CN')
  expect(detectLocale('简体中文')).toBe('zh-CN')
  expect(detectLocale('ja_JP.UTF-8')).toBe('ja')
  expect(detectLocale('japanese')).toBe('ja')
  expect(detectLocale('ko_KR.UTF-8')).toBe('ko')
  expect(detectLocale('en_US.UTF-8')).toBe('en')
  expect(detectLocale('C.UTF-8')).toBeUndefined()
  expect(detectLocale('fr_FR.UTF-8')).toBeUndefined()
  expect(detectLocale(undefined)).toBeUndefined()
})

test('every locale has card titles and unknown codes fall back to English', async () => {
  for (const code of LOCALES) {
    const S = strings(code)
    for (const t of [S.session, S.context, S.turn, S.permissions, S.log, S.now, S.stopTurn, S.stopOne, S.confirmStop, S.nothingRunning]) expect(t.length > 0).toBe(true)
  }
  expect(strings('xx').permissions).toBe('PERMISSIONS')
  expect(nextLocale('ko')).toBe('en')
  expect(nextLocale('')).toBe('zh-TW')
})

test('the NOW card lists a running shell command while it runs', async ($, on) => {
  const clock = mock.clock(on, { now: 1_000_000 })
  on('tool.call', { tool: 'Bash' }, async () => {
    await clock.sleep(5_000)

    return { result: { stdout: '', stderr: '', interrupted: false } }
  })
  const call = $.tool.call({ tool: 'Bash', command: 'npm test -- --token=abc123' })
  await clock.advance(600)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /^\$ npm test/ }))?.text).toBe('$ npm test -- --token=***')
  await clock.advance(5_000)
  await call
  await clock.advance(600)
  expect(await ui.find({ type: 'Text', text: /^\$ npm test/ })).toBeFalsy()
  await ui.unmount()
})

test('a background task stops only on a second press within 4 s', async ($, on) => {
  const clock = mock.clock(on, { now: 1_000_000 })
  const stopped: string[] = []
  on('tool.call', { tool: 'Bash' }, () => ({
    result: { stdout: '', stderr: '', interrupted: false, backgroundTaskId: 'bg1' },
  }))
  on('tool.call', { tool: 'TaskStop' }, (_, e) => {
    stopped.push(e.task_id ?? '')

    return { result: { message: 'stopped', task_id: e.task_id ?? '', task_type: 'local_bash' } }
  })
  await $.tool.call({ tool: 'Bash', command: 'npm run dev', run_in_background: true })
  await clock.advance(600)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /^\$ npm run dev$/ })).toBeTruthy()
  await ui.press({ plugin: 'better-claude-dashboard', key: 'now-stop-bg1' })
  expect(await ui.find({ type: 'Text', text: /press again/ })).toBeTruthy()
  await clock.advance(5_000)
  await ui.press({ plugin: 'better-claude-dashboard', key: 'now-stop-bg1' }) // expired: re-arms
  expect(stopped).toEqual([])
  await ui.press({ plugin: 'better-claude-dashboard', key: 'now-stop-bg1' })
  expect(stopped).toEqual(['bg1'])
  expect(await ui.find({ key: 'now-stop-bg1' })).toBeFalsy()
  await ui.unmount()
})

test('Stop turn aborts the running main-loop turn on the second press', async ($, on) => {
  mock.clock(on, { now: 1_000_000 })
  const aborted: string[] = []
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.abort', (_, e) => {
    aborted.push(e.turnId)

    return { value: undefined }
  })
  await $.turn.start({ text: 'go', turnId: 't1' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ plugin: 'better-claude-dashboard', key: 'now-stop-turn' })
  expect(aborted).toEqual([])
  await ui.press({ plugin: 'better-claude-dashboard', key: 'now-stop-turn' })
  expect(aborted).toEqual(['t1'])
  await ui.unmount()
})

test('shell lines are flattened, masked and clipped', async () => {
  expect(shellLine('export API_KEY=sk-abcdefgh1234 &&\n  npm   start')).toBe('export API_KEY=*** && npm start')
  expect(shellLine('curl -H Authorization:Bearer xyz123 https://a')).toBe('curl -H Authorization:Bearer *** https://a')
  expect(shellLine('run sk-ant-1234567890')).toBe('run sk-***')
  expect(shellLine('x'.repeat(200)).length).toBe(80)
})

test('the engine background list adds unseen tasks and ends missing ones', async () => {
  const next = reconcileTasks(
    [{ id: 'bg1', kind: 'shell', label: 'npm run dev', startedAt: 1, status: 'running' }],
    [
      { id: 'm1', type: 'monitor', status: 'running', description: 'watch CI' },
      { id: 'a1', type: 'subagent', status: 'running', description: 'x' },
    ],
    50,
  )
  expect(next.find(t => t.id === 'm1')?.label).toBe('watch CI')
  expect(next.find(t => t.id === 'a1')).toBeUndefined()
  expect(next.find(t => t.id === 'bg1')?.status).toBe('ended')
  expect(next.find(t => t.id === 'bg1')?.endedAt).toBe(50)
})
