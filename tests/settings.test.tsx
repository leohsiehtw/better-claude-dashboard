import type { CommandRunInput, CommandRunResult } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { advancePlan, sessionShare } from '../hooks/live'
import { DEFAULT_SETTINGS, applyArgs, gridColumns, toSettings } from '../hooks/settings'

const PANE = {
  plugin: 'better-claude-dashboard',
  component: 'Pane',
  requestId: 'better-claude-dashboard',
  props: {
    title: 'Usage',
    isFocused: false,
    bodyColumns: 36,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

test('settings from storage are checked field by field', async () => {
  expect(toSettings(undefined)).toEqual(DEFAULT_SETTINGS)
  expect(toSettings('nope')).toEqual(DEFAULT_SETTINGS)
  expect(toSettings({ companions: 'yes', grid: 7, tokens: null })).toEqual(DEFAULT_SETTINGS)
  expect(toSettings({ companions: false })).toEqual({ ...DEFAULT_SETTINGS, companions: false })
  expect(toSettings({ companions: false, grid: '2', tokens: 'plan' })).toEqual({
    companions: false,
    grid: '2',
    tokens: 'plan',
  })
})

test('the command line is parsed into a settings change', async () => {
  expect(applyArgs(DEFAULT_SETTINGS, '').mode).toBe('open')
  expect(applyArgs(DEFAULT_SETTINGS, '  show ').mode).toBe('show')
  expect(applyArgs(DEFAULT_SETTINGS, 'help').mode).toBe('help')
  const two = applyArgs(DEFAULT_SETTINGS, 'companions off grid 2')
  expect(two.mode).toBe('set')
  expect(two.settings).toEqual({ companions: false, grid: '2', tokens: 'both' })
  expect(applyArgs(DEFAULT_SETTINGS, 'grid=1').settings.grid).toBe('1')
  const bad = applyArgs(DEFAULT_SETTINGS, 'tokens plan grid 3')
  expect(bad.mode).toBe('error')
  expect(bad.bad).toBe('3')
  expect(bad.settings).toEqual(DEFAULT_SETTINGS)
  expect(applyArgs({ companions: false, grid: '2', tokens: 'plan' }, 'reset').settings).toEqual(DEFAULT_SETTINGS)
})

test('the agent grid is two columns from 40 cells and honours a fixed choice', async () => {
  expect(gridColumns('auto', 39)).toBe(1)
  expect(gridColumns('auto', 40)).toBe(2)
  expect(gridColumns('1', 200)).toBe(1)
  expect(gridColumns('2', 30)).toBe(2)
  expect(gridColumns('auto', 0, 100)).toBe(2)
  expect(gridColumns('auto', 0, 39)).toBe(1)
  expect(gridColumns('auto', 0)).toBe(1)
})

test('the conversation share counts from the first reading and survives a window roll', async () => {
  const w = (percentUsed: number, resetsAt: string) => ({ kind: 'five_hour', percentUsed, resetsAt })
  const A = '2030-01-01T05:00:00Z'
  const B = '2030-01-01T10:00:00Z'
  expect(sessionShare(undefined, undefined)).toBeUndefined()
  expect(advancePlan(undefined, undefined, undefined)).toBeUndefined()
  const first = advancePlan(undefined, undefined, w(10, A))
  expect(first).toEqual({ resetsAt: A, base: 10, carried: 0 })
  const same = advancePlan(first, w(10, A), w(12.5, A))
  expect(sessionShare(same, w(12.5, A))).toBe(2.5)
  const mid = advancePlan(same, w(12.5, A), w(30, A))
  expect(sessionShare(mid, w(30, A))).toBe(20)
  const rolled = advancePlan(mid, w(30, A), w(4, B))
  expect(rolled).toEqual({ resetsAt: B, base: 0, carried: 20 })
  expect(sessionShare(rolled, w(4, B))).toBe(24)
})

const run = ($: { command: { run: (i: CommandRunInput) => Promise<CommandRunResult> } }, args: string) =>
  $.command.run({
    command: 'better-claude-dashboard',
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: true, columns: 100 },
  })

test('the slash command changes and reports settings, kept in the store', async ($, on) => {
  mock.clock(on, { now: 1_000_000 })
  mock.store(on)
  on('session.start', () => ({ cwd: 'C:/w' }))
  await $.session.start({ cwd: 'C:/w', surface: 'desktop', isInteractive: true })
  const set = await run($, 'grid 2')
  expect(set.text).toContain('grid 2')
  const shown = await run($, 'show')
  expect(shown.text).toContain('grid 2')
  const bad = await run($, 'grid 9')
  expect(bad.text).toContain('9')
  const still = await run($, 'show')
  expect(still.text).toContain('grid 2')
})

test('the settings strip cycles an option on the desktop pane', async ($, on) => {
  mock.store(on)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ key: 'set-grid' })).toBeFalsy()
  await ui.press({ plugin: 'better-claude-dashboard', key: 'settings' })
  expect(await ui.find({ type: 'Text', text: /grid: auto$/ })).toBeTruthy()
  await ui.press({ plugin: 'better-claude-dashboard', key: 'set-grid' })
  expect(await ui.find({ type: 'Text', text: /grid: 1$/ })).toBeTruthy()
  await ui.unmount()
})
