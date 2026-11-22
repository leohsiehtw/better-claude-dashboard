import { atom, read, update } from 'claude-code'
import type {
  AgentInfo,
  EngineInterface,
  Register,
  SessionContextUsage,
  SessionRateLimit,
  Timer,
  TurnUsage,
} from 'claude-code'

import type {
  DashActivity,
  DashAgent,
  DashArm,
  DashAutoCompact,
  DashLayout,
  DashLive,
  DashLogEntry,
  DashSettings,
  DashTask,
  DashUsage,
  DashWindow,
} from '../types'
import { LOCALE_LABEL, detectLocale, isLocale, lead, nextLocale, strings, toLocale, word } from './i18n'
import type { Strings } from './i18n'
import {
  addTask,
  advancePlan,
  bgTaskOf,
  clip,
  emptyLive,
  endRun,
  endTask,
  field,
  nowLabel,
  reconcileTasks,
  sessionShare,
  setNote,
  startRun,
  turnEnded,
  turnStarted,
} from './live'
import { COMPANIONS_SVG, COMPANION_ROW, MASCOT_SVG, MOOD_MS, moodFor, spin } from './mascot'
import { DEFAULT_SETTINGS, applyArgs, cycleSetting, gridColumns, summary, toSettings } from './settings'
import type { SettingKey } from './settings'

const PANE = 'better-claude-dashboard'
const CARD_IDS = ['now', 'session', 'context', 'turn', 'permissions', 'agents', 'log']

function normalizeOrder(order: string[]): string[] {
  return [...order.filter(id => CARD_IDS.includes(id)), ...CARD_IDS.filter(id => !order.includes(id))]
}
const TITLE = 'Usage'
const DONE: readonly string[] = ['completed', 'failed', 'killed']
const KEEP_FINISHED = 5
const TICK_MS = 1_000
const USAGE_EVERY_TICKS = 3
const BREAKDOWN_EVERY_MS = 60_000
const BREAKDOWN_RETRY_MS = 5_000
const FLUSH_MS = 500
const LOG_CAP = 40
const LOG_SHOWN = 12
const TOOLS_CAP = 30
const AGENT_OUT_CAP = 20
const ARM_MS = 4_000
const RUNNING_SHOWN = 6
const NO_ARM: DashArm = { target: '', at: 0 }
const GRID_TILE_ROWS = 8
const DOING_CLIP = 28
const COMMAND_HINT = '[show | companions on|off | grid auto|1|2 | tokens both|context|plan | reset]'

const FILE_TOOLS: readonly string[] = ['Read', 'Edit', 'Write', 'Glob', 'Grep', 'NotebookEdit']
const SHELL_TOOLS: readonly string[] = ['Bash', 'PowerShell']
const EDIT_TOOLS: readonly string[] = ['Edit', 'Write', 'NotebookEdit']

const EMPTY_USAGE: DashUsage = { measuredAt: 0, context: { window: 0 }, rateLimits: [] }

function emptyActivity(sessionStartedAt: number): DashActivity {
  return {
    sessionStartedAt,
    checks: { allow: 0, ask: 0, deny: 0, auto: 0, prompted: 0, autoDenied: 0, open: 0 },
    groups: { file: 0, shell: 0, other: 0 },
    tools: {},
    turn: { calls: 0, edits: 0, errors: 0 },
    edits: 0,
    errors: 0,
    agentOut: {},
    tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  }
}

// Change a shape tag whenever that value's type in ../types changes.
const usage = atom({ plugin: 'better-claude-dashboard', key: 'usage' } as const, EMPTY_USAGE, {
  shape: 'usage-6',
})
const agents = atom({ plugin: 'better-claude-dashboard', key: 'agents' } as const, [], {
  shape: 'agents-1',
})
const clockNow = atom({ plugin: 'better-claude-dashboard', key: 'now' } as const, 0)
const activity = atom({ plugin: 'better-claude-dashboard', key: 'activity' } as const, emptyActivity(0), {
  shape: 'activity-2',
})
const layoutAtom = atom({ plugin: 'better-claude-dashboard', key: 'layout' } as const, { order: [], collapsed: [] } as DashLayout, {
  shape: 'layout-3',
})
const eventLog = atom({ plugin: 'better-claude-dashboard', key: 'log' } as const, [], {
  shape: 'log-1',
})
const liveAtom = atom({ plugin: 'better-claude-dashboard', key: 'live' } as const, emptyLive(), {
  shape: 'live-1',
})
const armAtom = atom({ plugin: 'better-claude-dashboard', key: 'arm' } as const, NO_ARM, {
  shape: 'arm-1',
})
const langAtom = atom({ plugin: 'better-claude-dashboard', key: 'lang' } as const, '')
const LANG_KEY = 'lang'
const settingsAtom = atom({ plugin: 'better-claude-dashboard', key: 'settings' } as const, DEFAULT_SETTINGS, {
  shape: 'settings-1',
})
const settingsOpenAtom = atom({ plugin: 'better-claude-dashboard', key: 'settingsOpen' } as const, false)
const SETTINGS_KEY = 'settings'

// Timer bookkeeping and not-yet-flushed deltas only (never drawn from); a reload drops them.
let ticker: Timer | undefined
let isTicking = false
let ticks = 0
let breakdownAt = 0
let flushTimer: Timer | undefined
let pendingOps: ((a: DashActivity) => void)[] = []
let pendingLog: DashLogEntry[] = []
let pendingLive: ((s: DashLive) => void)[] = []
const askedIds = new Set<string>()

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    ticker?.cancel()
    ticks = 0
    const now = await $.clock.now()
    // A reload keeps the atom (it is set already); a fresh process starts it at 0.
    await attempt(
      $,
      () => update($, activity, cur => (cur.sessionStartedAt > 0 ? cur : emptyActivity(now))),
      undefined,
    )
    await attempt($, () => initLang($), undefined)
    await attempt($, () => initSettings($), undefined)
    ticker = $.clock.every(TICK_MS, () => void tick($))
    void tick($)
    void openPane($)
    await attempt(
      $,
      () =>
        $.command.register({
          name: 'better-claude-dashboard',
          description: 'Open the usage dashboard pane, or change its settings (helpers, grid, token display)',
          argumentHint: COMMAND_HINT,
          immediate: true,
        }),
      undefined,
    )

    return next(e)
  })

  on('command.run', { command: 'better-claude-dashboard' }, async ($, e) => {
    const cur = await read($, settingsAtom)
    const S = strings(await read($, langAtom))
    const parsed = applyArgs(cur, e.args)
    if (parsed.mode === 'show') return { text: S.settingsNow(summary(cur)) }
    if (parsed.mode === 'help') return { text: S.settingsUsage }
    if (parsed.mode === 'error') return { text: `${S.settingsBad(parsed.bad ?? '')} · ${S.settingsUsage}` }
    if (parsed.mode === 'set') {
      await saveSettings($, parsed.settings)

      return { text: S.settingsNow(summary(parsed.settings)) }
    }
    const opened = await $.ui.open({ id: PANE, title: TITLE })

    return {
      text: opened.isPlaced
        ? 'Usage dashboard opened.'
        : `Usage dashboard waits to be drawn: ${opened.reason}`,
    }
  })

  on('session.measure', async ($, e, next) => {
    await attempt($, () => refreshUsage($), undefined)

    return next(e)
  })

  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      await attempt($, () => update($, agents, () => []), [])
      const now = await attempt($, () => $.clock.now(), 0)
      pendingOps = []
      pendingLog = []
      pendingLive = []
      askedIds.clear()
      await attempt($, () => update($, activity, () => emptyActivity(now)), undefined)
      await attempt($, () => update($, eventLog, () => []), [])
      await attempt($, () => update($, liveAtom, () => emptyLive()), emptyLive())
      await attempt($, () => update($, armAtom, () => NO_ARM), NO_ARM)
      await attempt($, () => update($, usage, cur => withoutPlan(cur)), EMPTY_USAGE)
    }

    return next(e)
  })

  // Observers below: each only records, then passes the event through unchanged.
  on('tool.check', async ($, e, next) => {
    const verdict = await next(e)
    await attempt($, () => noteCheck($, e.tool_use_id, verdict.decision), undefined)

    return verdict
  }).catch(($, e, next) => next(e))

  on('tool.call', async ($, e, next) => {
    const label = toolLabel(e.tool, e)
    const startedAt = await attempt($, () => noteCallStart($, e.tool, label), 0)
    if (startedAt > 0) {
      queueLive($, s =>
        startRun(s, {
          id: e.tool_use_id,
          tool: e.tool,
          label: nowLabel(e.tool, e, label),
          startedAt,
          ...(e.agentId === undefined ? {} : { agentId: e.agentId }),
        }),
      )
    }
    try {
      const ran = await next(e)
      const endedAt = await attempt($, () => noteCallEnd($, e.tool, e.tool_use_id, ran.isError === true), 0)
      if (ran.deny === undefined && ran.isError !== true) noteResult($, e.tool, e, ran.result, endedAt)

      return ran
    } finally {
      queueLive($, s => endRun(s, e.tool_use_id))
    }
  }).catch(($, e, next) => next(e))

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) await attempt($, () => noteTurnStart($, e.turnId), undefined)

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    await attempt(
      $,
      () =>
        noteTurnEnd($, e.agentId, e.durationMs, e.reason, e.usage),
      undefined,
    )

    return next(e)
  })

  on('classic.UserPromptSubmit', async ($, e, next) => {
    noteMode($, e.permission_mode, undefined)

    return next(e)
  })

  on('classic.PostToolUse', async ($, e, next) => {
    noteMode($, e.permission_mode, e.effort?.level)

    return next(e)
  })

  on('classic.Stop', async ($, e, next) => {
    noteMode($, e.permission_mode, e.effort?.level)
    const listed = e.background_tasks
    if (listed !== undefined) {
      const at = await attempt($, () => $.clock.now(), 0)
      await attempt(
        $,
        () =>
          editLive($, s => {
            s.tasks = reconcileTasks(s.tasks, listed, at)
          }),
        undefined,
      )
    }

    return next(e)
  })

  on('classic.PermissionRequest', async ($, e, next) => {
    noteMode($, e.permission_mode, e.effort?.level)
    queue($, a => {
      a.checks.prompted += 1
    })

    return next(e)
  })

  on('classic.PermissionDenied', async ($, e, next) => {
    const at = await attempt($, () => $.clock.now(), 0)
    queue(
      $,
      a => {
        a.checks.autoDenied += 1
      },
      { at, name: e.tool_name, text: 'denied', tone: 'err' },
    )

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const layout = await read($, layoutAtom)
    const order = normalizeOrder(layout.order)
    const collapsedIds = new Set(layout.collapsed)
    const toggleCard = (id: string): void =>
      void update($, layoutAtom, cur => ({
        order: normalizeOrder(cur.order),
        collapsed: cur.collapsed.includes(id) ? cur.collapsed.filter(x => x !== id) : [...cur.collapsed, id],
        ...(cur.lifting === undefined ? {} : { lifting: cur.lifting }),
      }))
    const gripCard = (id: string): void =>
      void update($, layoutAtom, cur => {
        const next = normalizeOrder(cur.order)
        const lifted = cur.lifting
        if (lifted === undefined) return { order: next, collapsed: cur.collapsed, lifting: id }
        if (lifted !== id) {
          next.splice(next.indexOf(lifted), 1)
          next.splice(next.indexOf(id), 0, lifted)
        }

        return { order: next, collapsed: cur.collapsed }
      })
    const snap = await read($, usage)
    const rows = await read($, agents)
    const now = await read($, clockNow)
    const live = rows.filter(row => row.endedAt === undefined)
    const ctx = snap.context
    const ctxPercent =
      ctx.percent ??
      (ctx.tokens !== undefined && ctx.window > 0
        ? Math.round((ctx.tokens / ctx.window) * 100)
        : undefined)
    const loc = toLocale(await read($, langAtom))
    const S = strings(loc)
    const settings = await read($, settingsAtom)
    const settingsOpen = await read($, settingsOpenAtom)
    const five = snap.rateLimits.find(w => w.kind === 'five_hour')
    const convShare = sessionShare(snap.plan, five)
    const liveNow = await read($, liveAtom)
    const liveTasks = liveNow.tasks.filter(t => t.endedAt === undefined).length
    const activeText = live.length === 0 ? S.noSubagentsActive : S.subagentsActive(live.length)

    if (e.props.placement === 'widget') {
      const firstRun = liveNow.running[0]
      const nowGlance = [
        firstRun === undefined ? '' : `${shortTool(firstRun.tool)} ${clip(firstRun.label, 24)}`.trim(),
        liveTasks > 0 ? S.bgCount(liveTasks) : '',
      ]
        .filter(x => x !== '')
        .join(' · ')
      const glance = snap.rateLimits
        .filter(w => w.kind === 'five_hour' || w.kind === 'seven_day')
        .map(w => `${w.kind === 'five_hour' ? '5h' : 'wk'} ${w.percentUsed}%`)
      if (settings.tokens !== 'context' && convShare !== undefined) glance.push(`sess ≈+${convShare}%`)
      if (ctxPercent !== undefined && settings.tokens !== 'plan') glance.push(`ctx ${ctxPercent}%`)

      return (
        <Box flexDirection="column">
          <Text>{glance.length === 0 ? S.glanceWaiting : glance.join(' · ')}</Text>
          <Text dimColor>{activeText}</Text>
          {nowGlance !== '' && <Text dimColor wrap="wrap">{nowGlance}</Text>}
        </Box>
      )
    }

    const act = await read($, activity)
    const log = await read($, eventLog)
    const ctxPct = ctxPercent ?? 0
    const uptime =
      act.sessionStartedAt > 0 && now >= act.sessionStartedAt
        ? fmtUptime(now - act.sessionStartedAt)
        : undefined
    const modeLine = [snap.model, act.mode, act.effort === undefined ? undefined : S.effort(act.effort)]
      .filter(part => part !== undefined && part !== '')
      .join(' · ')
    const repoLine = [snap.project, snap.branch === undefined ? undefined : `git ${snap.branch}`]
      .filter(part => part !== undefined && part !== '')
      .join(' · ')
    const tk = act.tokens
    const inTotal = tk.input + tk.cacheRead + tk.cacheWrite
    const tokensText =
      inTotal + tk.output > 0
        ? S.tokensLine(
            fmtCompact(inTotal),
            fmtCompact(tk.output),
            inTotal > 0 ? Math.round((tk.cacheRead / inTotal) * 100) : undefined,
          )
        : undefined
    const convParts = [
      ctx.tokens !== undefined && settings.tokens !== 'plan' ? S.convCtx(ctxPct) : '',
      convShare !== undefined && settings.tokens !== 'context' ? S.convPlan(convShare.toFixed(1)) : '',
    ]
      .filter(part => part !== '')
      .join(' · ')
    const statLine = [
      snap.turns === undefined ? undefined : S.turns(snap.turns),
      snap.costUsd === undefined ? undefined : `$${snap.costUsd.toFixed(2)}`,
    ]
      .filter(part => part !== undefined)
      .join(' · ')
    const turn = act.turn
    const turnRunning = turn.startedAt !== undefined && turn.endedAt === undefined
    const turnHead =
      turn.startedAt === undefined
        ? S.noTurnYet
        : turnRunning
          ? `${spin(now)} ${S.running(fmtElapsed(Math.max(0, now - turn.startedAt)))}`
          : S.idle
    const c = act.checks
    const topTools = Object.entries(act.tools)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, n]) => `${shortTool(name)} ${n}`)
      .join(' · ')
    const shownLog = log.slice(-LOG_SHOWN)
    const arm = await read($, armAtom)
    const isArmed = (t: string): boolean => arm.target === t && now - arm.at <= ARM_MS
    const agentItems: DashTask[] = live.map(row => ({
      id: row.id,
      kind: 'agent',
      label: row.description === '' || row.description === row.name ? row.name : `${row.name} · ${row.description}`,
      startedAt: row.startedAt,
      status: row.status,
    }))
    const liveItems = [...liveNow.tasks.filter(t => t.endedAt === undefined), ...agentItems]
    const items = [...liveItems, ...liveNow.tasks.filter(t => t.endedAt !== undefined)]
    const bgLive = liveItems.length
    const runs = liveNow.running
    const isBusy = turnRunning || live.length > 0
    const stopButton = (target: string, key: string, idle: string): JSX.Element => (
      <Button key={key} onPress={() => void attempt($, () => pressStop($, target), undefined)}>
        <Text color={RED} bold={isArmed(target)}>
          {isArmed(target) ? `⚠ ${S.confirmStop}` : idle}
        </Text>
      </Button>
    )
    const cats = snap.categories ?? []
    const win = snap.windowTokens ?? ctx.window
    const share = (tokens: number): string => (win > 0 ? `${((tokens / win) * 100).toFixed(1)}%` : '')
    const swatches = [BLUE, ORANGE, TEAL, AMBER, INDIGO, RED, GREEN, TRACK]
    const used = cats.filter(c => c.kind === 'used').sort((x, y) => y.tokens - x.tokens)
    const rest = cats.filter(c => c.kind !== 'used')
    const COLS = 24
    const ROWS = 2
    const cellsTotal = COLS * ROWS
    const usedTokens = used.reduce((sum, c) => sum + c.tokens, 0)
    const bufferTokens = rest.filter(c => c.kind === 'buffer').reduce((sum, c) => sum + c.tokens, 0)
    const gridCells: { color: string; glyph: string }[] = []
    let running = 0
    used.forEach((c, n) => {
      running += c.tokens
      const end = win > 0 ? Math.round((running / win) * cellsTotal) : 0
      while (gridCells.length < Math.min(end, cellsTotal)) {
        gridCells.push({ color: swatches[n % swatches.length] ?? TRACK, glyph: '█' })
      }
    })
    const bufferCells = win > 0 ? Math.round((bufferTokens / win) * cellsTotal) : 0
    while (gridCells.length < cellsTotal - bufferCells) gridCells.push({ color: TRACK, glyph: '░' })
    while (gridCells.length < cellsTotal) gridCells.push({ color: AMBER, glyph: '▒' })
    const totalPct = win > 0 ? Math.round((usedTokens / win) * 100) : ctxPct
    // One Text per run of same cells (about ten nodes in all) rather than one per cell.
    const contextBar = (
      <Box flexDirection="column">
        <Text bold color={levelColor(totalPct)} wrap="wrap">
          {S.usedLine(fmtCompact(usedTokens), fmtCompact(win), totalPct)}
        </Text>
        {Array.from({ length: ROWS }, (_, r) => {
          const runs: { color: string; glyph: string; n: number }[] = []
          for (const cell of gridCells.slice(r * COLS, (r + 1) * COLS)) {
            const last = runs[runs.length - 1]
            if (last !== undefined && last.color === cell.color && last.glyph === cell.glyph) last.n += 1
            else runs.push({ color: cell.color, glyph: cell.glyph, n: 1 })
          }

          return (
            <Text key={String(r)}>
              {runs.map((run, i) => (
                <Text key={String(i)} color={run.color}>
                  {run.glyph.repeat(run.n)}
                </Text>
              ))}
            </Text>
          )
        })}
      </Box>
    )
    const contextRows = [
      ...used.map((c, n) => ({ c, color: swatches[n % swatches.length] ?? TRACK, dim: false })),
      ...rest.map(c => ({ c, color: TRACK, dim: true })),
    ].map(({ c, color, dim }) => (
      <Box key={c.name} justifyContent="space-between">
        <Box>
          <Text color={color}>■ </Text>
          <Text dimColor={dim} wrap="wrap">
            {c.name}
          </Text>
        </Box>
        <Text dimColor>{c.kind === 'deferred' ? fmtCompact(c.tokens) : `${fmtCompact(c.tokens)} ${share(c.tokens)}`}</Text>
      </Box>
    ))
    const artSource = MASCOT_SVG(moodFor(now, isBusy), Math.floor((now % MOOD_MS) / 1000))
    const busyAgents = live.filter(row => row.status !== 'idle').length
    const helpers = settings.companions ? busyAgents : 0
    const helperRows = Array.from({ length: Math.ceil(helpers / COMPANION_ROW) }, (_, i) => Math.min(COMPANION_ROW, helpers - i * COMPANION_ROW))
    const art =
      e.surface === 'desktop'
        ? (() => {
            const { Svg } = $.ui.resolve(e)

            return (
              <Box flexDirection="column" alignItems="center">
                <Svg source={artSource} alt={S.mascotAlt} width={216} height={148} />
                {helperRows.map((n, i) => (
                  <Svg
                    key={`helpers-${i}`}
                    source={COMPANIONS_SVG(n, Math.floor((now % 6000) / 1000))}
                    alt={S.companionsAlt(busyAgents)}
                    width={216}
                    height={48}
                  />
                ))}
              </Box>
            )
          })()
        : null

    const settingKeys: SettingKey[] = ['companions', 'grid', 'tokens']
    const optLabel = (key: SettingKey): string =>
      key === 'companions' ? S.optCompanions : key === 'grid' ? S.optGrid : S.optTokens
    const optValue = (key: SettingKey): string => {
      const raw = key === 'companions' ? (settings.companions ? 'on' : 'off') : settings[key]

      return S.values[raw] ?? raw
    }
    const card = (id: string, title: string, color: string, hint: JSX.Element | null, body: JSX.Element): JSX.Element => {
      const isFolded = collapsedIds.has(id)
      const at = order.indexOf(id)

      return (
        <Box key={id} flexDirection="column" borderStyle="round" borderColor={color} paddingX={1}>
          <Box justifyContent="space-between">
            <Button key={`${id}-fold`} onPress={() => toggleCard(id)}>
              <Text bold color={color}>{`${isFolded ? '▸' : '▾'} ${title}`}</Text>
            </Button>
            <Box>
              {hint}
              {hint !== null && <Text> </Text>}
              <Button key={`${id}-grip`} onPress={() => gripCard(id)}>
                <Text color={layout.lifting === id ? color : undefined} dimColor={layout.lifting !== id} bold={layout.lifting === id}>
                  {' ⠿ '}
                </Text>
              </Button>
            </Box>
          </Box>
          {!isFolded && body}
        </Box>
      )
    }
    const cols = gridColumns(settings.grid, e.props.bodyColumns, e.viewport?.columns)
    const doingOf = (id: string): string | undefined => {
      const r = [...runs].reverse().find(x => x.agentId === id)

      return r === undefined ? undefined : `${spin(now)} ${shortTool(r.tool)} ${clip(r.label, DOING_CLIP)}`
    }
    const agentTile = (row: DashAgent, isGrid: boolean): JSX.Element => {
      const used = act.agentOut[row.id]
      const isLive = row.endedAt === undefined
      const isBad = row.status === 'failed' || row.status === 'killed'
      const doing = isLive ? doingOf(row.id) : undefined

      return (
        <Box
          key={row.id}
          flexDirection="column"
          borderStyle="round"
          borderColor={isLive ? AMBER : isBad ? RED : TRACK}
          paddingX={1}
          {...(isGrid ? { width: '50%' as const, flexShrink: 1, minHeight: GRID_TILE_ROWS } : {})}
        >
          <Text bold wrap="wrap">
            {row.name}
          </Text>
          <Text dimColor wrap="wrap">
            {row.description === '' || row.description === row.name ? row.type : `${row.type} · ${row.description}`}
          </Text>
          <Text color={isLive ? AMBER : isBad ? RED : GREEN} wrap="wrap">
            {`${isLive ? `${spin(now)} ` : isBad ? '✗ ' : '✓ '}${fmtElapsed((row.endedAt ?? now) - row.startedAt)}`}
            <Text dimColor>{` · ${word(S, row.status)}`}</Text>
          </Text>
          {doing !== undefined && (
            <Text dimColor wrap="wrap">
              {doing}
            </Text>
          )}
          {used !== undefined && (
            <Text dimColor wrap="wrap">
              {S.outTok(fmtCompact(used.out), used.model)}
            </Text>
          )}
        </Box>
      )
    }
    const cards: Record<string, JSX.Element | null> = {
      now: card(
        'now',
        S.now,
        turnRunning || runs.length > 0 || bgLive > 0 ? AMBER : GREEN,
        <Text color={turnRunning ? AMBER : TRACK} wrap="wrap">{turnHead}</Text>,
        <Box flexDirection="column">
          {runs.length === 0 && (turnRunning || items.length === 0) && (
            <Text dimColor wrap="wrap">{turnRunning ? S.responding : S.nothingRunning}</Text>
          )}
          {runs.length > 0 && <Text dimColor wrap="wrap">{S.runningNow(runs.length)}</Text>}
          {runs.slice(-RUNNING_SHOWN).map(r => (
            <Box key={`run-${r.id}`} flexDirection="column">
              <Text wrap="wrap">
                <Text color={AMBER}>{`${spin(now)} `}</Text>
                <Text bold>{shortTool(r.tool)}</Text>
                <Text dimColor>{` ${fmtElapsed(Math.max(0, now - r.startedAt))}`}</Text>
              </Text>
              {r.label !== '' && (
                <Text dimColor wrap="wrap">{SHELL_TOOLS.includes(r.tool) ? `$ ${r.label}` : r.label}</Text>
              )}
              {r.agentId !== undefined && (
                <Text dimColor wrap="wrap">
                  {S.inAgent(rows.find(a => a.id === r.agentId)?.name ?? r.agentId.slice(0, 8))}
                </Text>
              )}
            </Box>
          ))}
          {runs.length > RUNNING_SHOWN && <Text dimColor>{`+${runs.length - RUNNING_SHOWN}`}</Text>}
          {items.length > 0 && <Text dimColor wrap="wrap">{S.background(bgLive)}</Text>}
          {items.map(t => {
            const isLive = t.endedAt === undefined
            const isBad = t.status === 'failed' || t.status === 'killed'

            return (
              <Box key={`bg-${t.kind}-${t.id}`} flexDirection="column">
                <Box justifyContent="space-between">
                  <Text color={isLive ? AMBER : isBad ? RED : GREEN} wrap="wrap">
                    {`${isLive ? spin(now) : isBad ? '✗' : '✓'} ${word(S, t.kind)} ${fmtElapsed((t.endedAt ?? now) - t.startedAt)}`}
                    <Text dimColor>{` · ${word(S, t.status)}`}</Text>
                  </Text>
                  {isLive && stopButton(`task:${t.id}`, `now-stop-${t.id}`, S.stopOne)}
                </Box>
                {t.label !== '' && (
                  <Text dimColor wrap="wrap">{t.kind === 'shell' ? `$ ${t.label}` : t.label}</Text>
                )}
                {isLive && liveNow.notes[t.id] !== undefined && (
                  <Text color={RED} wrap="wrap">{S.stopFailed(liveNow.notes[t.id] ?? '')}</Text>
                )}
              </Box>
            )
          })}
          <Box flexWrap="wrap" gap="sm">
            {liveNow.turnId !== undefined && stopButton('turn', 'now-stop-turn', S.stopTurn)}
            {bgLive >= 1 &&
              (liveNow.turnId !== undefined || bgLive >= 2) &&
              stopButton('all', 'now-stop-all', S.stopAll(bgLive))}
          </Box>
        </Box>,
      ),
      session: card(
        'session',
        S.session,
        ORANGE,
        <Text dimColor wrap="wrap">
          {uptime !== undefined ? S.up(uptime) : snap.measuredAt === 0 ? S.waiting : S.live}
        </Text>,
        <Box flexDirection="column">
          <Text wrap="wrap">{modeLine !== '' ? modeLine : S.modelWaiting}</Text>
          {repoLine !== '' && <Text dimColor wrap="wrap">{repoLine}</Text>}
          {statLine !== '' && <Text dimColor wrap="wrap">{statLine}</Text>}
          {tokensText !== undefined && <Text dimColor wrap="wrap">{tokensText}</Text>}
          {convParts !== '' && <Text dimColor wrap="wrap">{S.convLine(convParts)}</Text>}
          {ctx.tokens === undefined ? (
            <Text dimColor>{S.ctxNoReading}</Text>
          ) : (
            <Text wrap="wrap">
              <Text dimColor>ctx </Text>
              <Text color={levelColor(ctxPct)}>{barFill(ctxPct)}</Text>
              <Text color={TRACK}>{barRest(ctxPct)}</Text>
              <Text bold>{` ${ctxPct}%`}</Text>
            </Text>
          )}
          {ctx.tokens !== undefined && (
            <Text dimColor wrap="wrap">{`    ${S.tokensOf(fmtCompact(ctx.tokens), fmtCompact(ctx.window))}`}</Text>
          )}
          {snap.autoCompact !== undefined && (
            <Text dimColor wrap="wrap">
              {autoCompactText(S, snap.autoCompact, ctx.window)}
            </Text>
          )}
          {snap.measuredAt !== 0 && snap.rateLimits.length === 0 && (
            <Text dimColor>{S.planNoReading}</Text>
          )}
          {snap.rateLimits.map(w => (
            <Box key={w.kind} flexDirection="column">
              <Text wrap="wrap">
                <Text dimColor>{`${shortWindow(w.kind)}  `}</Text>
                <Text color={levelColor(w.percentUsed)}>{barFill(w.percentUsed)}</Text>
                <Text color={TRACK}>{barRest(w.percentUsed)}</Text>
                <Text bold>{` ${w.percentUsed}%`}</Text>
              </Text>
              {resetText(S, w.resetsAt, now) !== '' && (
                <Text dimColor wrap="wrap">{`    ${resetText(S, w.resetsAt, now)}`}</Text>
              )}
            </Box>
          ))}
        </Box>,
      ),
      context:
        contextRows.length === 0
          ? null
          : card(
              'context',
              S.context,
              CYAN,
              null,
              <Box flexDirection="column">
                {contextBar}
                {contextRows}
                {snap.counts !== undefined && Object.keys(snap.counts).length > 0 && (
                  <Text dimColor wrap="wrap">
                    {[
                      snap.counts.mcp === undefined ? '' : S.mcpTools(snap.counts.mcp),
                      snap.counts.memory === undefined ? '' : S.memoryFiles(snap.counts.memory),
                      snap.counts.agents === undefined ? '' : S.agentsCount(snap.counts.agents),
                      snap.counts.skills === undefined ? '' : S.skillsCount(snap.counts.skills),
                    ]
                      .filter(part => part !== '')
                      .join(' · ')}
                  </Text>
                )}
              </Box>,
            ),
      turn: card(
        'turn',
        S.turn,
        TEAL,
        <Text color={turnRunning ? AMBER : TRACK} wrap="wrap">{turnHead}</Text>,
        <Box flexDirection="column">
          <Text wrap="wrap">
            <Text dimColor>{`${S.calls} `}</Text>
            <Text bold>{String(turn.calls)}</Text>
            <Text dimColor>{` · ${S.edits} `}</Text>
            <Text bold>{String(turn.edits)}</Text>
            <Text dimColor>{` · ${S.errors} `}</Text>
            <Text bold color={turn.errors > 0 ? RED : GREEN}>
              {String(turn.errors)}
            </Text>
          </Text>
          <Text dimColor wrap="wrap">
            {S.lastTurn(turn.lastMs === undefined ? '—' : fmtElapsed(turn.lastMs))}
          </Text>
          <Text dimColor wrap="wrap">
            {S.sessionTotals(act.edits, act.errors)}
          </Text>
        </Box>,
      ),
      permissions: card(
        'permissions',
        S.permissions,
        AMBER,
        null,
        <Box flexDirection="column">
          <Text wrap="wrap">
            <Text color={GREEN}>{S.allow(c.allow)}</Text>
            <Text dimColor> · </Text>
            <Text color={AMBER}>{S.ask(Math.max(0, c.ask - c.auto))}</Text>
            <Text dimColor> · </Text>
            <Text color={RED}>{S.deny(c.deny + c.autoDenied)}</Text>
          </Text>
          <Text dimColor wrap="wrap">
            {S.checksLine(c.auto, c.prompted, c.open)}
          </Text>
          <Text wrap="wrap">
            <Text dimColor>{`${S.file} `}</Text>
            <Text bold>{String(act.groups.file)}</Text>
            <Text dimColor>{` · ${S.shell} `}</Text>
            <Text bold>{String(act.groups.shell)}</Text>
            <Text dimColor>{` · ${S.other} `}</Text>
            <Text bold>{String(act.groups.other)}</Text>
          </Text>
          <Text dimColor wrap="wrap">
            {topTools !== '' ? topTools : S.noToolCalls}
          </Text>
        </Box>,
      ),
      agents: card(
        'agents',
        S.agents(live.length, rows.length),
        INDIGO,
        null,
        <Box flexDirection="column">
          {rows.length === 0 && <Text dimColor>{S.noSubagents}</Text>}
          <Box flexDirection="column" gap="sm">
            {cols === 1 && rows.map(row => agentTile(row, false))}
            {cols === 2 &&
              Array.from({ length: Math.ceil(rows.length / 2) }, (_, i) => {
                const left = rows[i * 2]
                const right = rows[i * 2 + 1]

                return (
                  <Box key={`agent-row-${i}`} flexDirection="row" gap="sm">
                    {left !== undefined && agentTile(left, true)}
                    {right === undefined ? <Box key={`agent-pad-${i}`} width="50%" /> : agentTile(right, true)}
                  </Box>
                )
              })}
          </Box>
        </Box>,
      ),
      log: card(
        'log',
        S.log,
        BLUE,
        null,
        <Box flexDirection="column">
          {shownLog.length === 0 && <Text dimColor>{S.noEvents}</Text>}
          {shownLog.map(entry => (
            <Text key={`${entry.at}-${entry.name}-${entry.text}`} wrap="wrap">
              <Text dimColor>{`${fmtClock(entry.at)} `}</Text>
              <Text color={toneColor(entry.tone)}>{word(S, entry.name)}</Text>
              <Text dimColor>{entry.text === '' ? '' : ` ${lead(S, entry.text)}`}</Text>
            </Text>
          ))}
        </Box>,
      ),
    }

    return (
      <Box flexDirection="column" gap="sm">
        <Box justifyContent="flex-end" gap="sm">
          <Button
            key="settings"
            label={S.settingsButton}
            onPress={() => void attempt($, () => update($, settingsOpenAtom, cur => !cur), false)}
          />
          <Button
            key="lang"
            label={LOCALE_LABEL[loc]}
            onPress={() => void attempt($, () => cycleLang($), undefined)}
          />
        </Box>
        {settingsOpen && (
          <Box flexDirection="column">
            <Box flexWrap="wrap" gap="sm">
              {settingKeys.map(key => (
                <Button key={`set-${key}`} onPress={() => void attempt($, () => cycleOption($, key), undefined)}>
                  <Text>{`${optLabel(key)}: ${optValue(key)}`}</Text>
                </Button>
              ))}
            </Box>
            <Text dimColor wrap="wrap">{`/better-claude-dashboard ${COMMAND_HINT}`}</Text>
            <Text dimColor>{`cols ${e.props.bodyColumns} · ${cols}`}</Text>
          </Box>
        )}
        {art}
        {layout.lifting !== undefined && (
          <Text dimColor wrap="wrap">{S.moving(layout.lifting)}</Text>
        )}
        {order.map(id => cards[id] ?? null)}
      </Box>
    )
  })

  // A person who closes the pane has no slash command on the desktop app, so a row above
  // the prompt keeps a button that opens it again (a press is an asked open, placed at any width).
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const { Box, Button } = $.ui.resolve(e)
    const S = strings(await read($, langAtom))

    return (
      <Box>
        <Button
          key="open-usage"
          label={S.openButton}
          onPress={() => void attempt($, () => $.ui.open({ id: PANE, title: TITLE }), undefined)}
        />
      </Box>
    )
  })
}

// ---- event accumulation (deltas flushed to the atoms at most every FLUSH_MS) ----

function queue($: EngineInterface, op: ((a: DashActivity) => void) | undefined, entry?: DashLogEntry): void {
  if (op !== undefined) pendingOps.push(op)
  if (entry !== undefined) pendingLog.push(entry)
  schedule($)
}

function schedule($: EngineInterface): void {
  if (flushTimer !== undefined) return
  flushTimer = $.clock.after(FLUSH_MS, () => {
    flushTimer = undefined
    void attempt($, () => flush($), undefined)
  })
}

function queueLive($: EngineInterface, op: (s: DashLive) => void): void {
  pendingLive.push(op)
  schedule($)
}

async function editLive($: EngineInterface, op: (s: DashLive) => void): Promise<void> {
  await update($, liveAtom, cur => {
    const next: DashLive = JSON.parse(JSON.stringify(cur))
    op(next)

    return next
  })
}

async function flush($: EngineInterface): Promise<void> {
  const ops = pendingOps
  const entries = pendingLog
  const liveOps = pendingLive
  pendingOps = []
  pendingLog = []
  pendingLive = []
  if (liveOps.length > 0) {
    await editLive($, s => {
      for (const op of liveOps) op(s)
    })
  }
  if (ops.length > 0) {
    await update($, activity, cur => {
      const next: DashActivity = JSON.parse(JSON.stringify(cur))
      for (const op of ops) op(next)

      return next
    })
  }
  if (entries.length > 0) {
    await update($, eventLog, cur => [...cur, ...entries].slice(-LOG_CAP))
  }
}

async function noteCheck($: EngineInterface, id: string | undefined, decision: string): Promise<void> {
  // A `$.tool.check` query carries no id: only real calls count.
  if (id === undefined) return
  if (decision === 'ask') askedIds.add(id)
  const open = askedIds.size
  const at = await $.clock.now()
  const isAuto = (await read($, activity)).mode === 'auto'
  queue(
    $,
    a => {
      if (decision === 'allow') a.checks.allow += 1
      else if (decision === 'deny') a.checks.deny += 1
      else {
        a.checks.ask += 1
        if (a.mode === 'auto') a.checks.auto += 1
      }
      a.checks.open = open
    },
    decision === 'allow' || (decision === 'ask' && isAuto)
      ? undefined
      : { at, name: 'check', text: decision, tone: decision === 'deny' ? 'err' : 'warn' },
  )
}

async function noteCallStart($: EngineInterface, tool: string, label: string): Promise<number> {
  const at = await $.clock.now()
  const group = FILE_TOOLS.includes(tool) ? 'file' : SHELL_TOOLS.includes(tool) ? 'shell' : 'other'
  const isEdit = EDIT_TOOLS.includes(tool)
  queue(
    $,
    a => {
      a.groups[group] += 1
      if (a.tools[tool] !== undefined || Object.keys(a.tools).length < TOOLS_CAP) {
        a.tools[tool] = (a.tools[tool] ?? 0) + 1
      }
      a.turn.calls += 1
      if (isEdit) {
        a.turn.edits += 1
        a.edits += 1
      }
    },
    // Agent spawns get their own log line from the agent list.
    tool === 'Agent' || tool === 'Task' ? undefined : { at, name: shortTool(tool), text: label, tone: 'info' },
  )

  return at
}

async function noteCallEnd(
  $: EngineInterface,
  tool: string,
  id: string | undefined,
  isError: boolean,
): Promise<number> {
  if (id !== undefined) askedIds.delete(id)
  const open = askedIds.size
  const at = await $.clock.now()
  queue(
    $,
    a => {
      a.checks.open = open
      if (isError) {
        a.turn.errors += 1
        a.errors += 1
      }
    },
    isError ? { at, name: shortTool(tool), text: 'error', tone: 'err' } : undefined,
  )

  return at
}

/** Background tasks a finished call started, and tasks a TaskStop call ended (the model's own too). */
function noteResult($: EngineInterface, tool: string, input: unknown, result: unknown, at: number): void {
  const bg = bgTaskOf(tool, input, result)
  if (bg !== undefined) queueLive($, s => addTask(s, { ...bg, startedAt: at, status: 'running' }))
  if (tool === 'TaskStop') {
    const id = field(input, 'task_id') ?? field(input, 'shell_id')
    if (id !== undefined) queueLive($, s => endTask(s, id, 'killed', at))
  }
}

async function noteTurnStart($: EngineInterface, turnId: string): Promise<void> {
  const at = await $.clock.now()
  queueLive($, s => turnStarted(s, turnId))
  queue(
    $,
    a => {
      a.turn = { startedAt: at, calls: 0, edits: 0, errors: 0, ...(a.turn.lastMs === undefined ? {} : { lastMs: a.turn.lastMs }) }
    },
    { at, name: 'turn', text: 'started', tone: 'info' },
  )
  await flush($)
}

async function noteTurnEnd(
  $: EngineInterface,
  agentId: string | undefined,
  durationMs: number,
  reason: string,
  usage: TurnUsage | undefined,
): Promise<void> {
  const at = await $.clock.now()
  queueLive($, s => turnEnded(s, agentId))
  if (agentId !== undefined) {
    if (usage === undefined) return
    queue($, a => {
      const prev = a.agentOut[agentId]
      if (prev === undefined && Object.keys(a.agentOut).length >= AGENT_OUT_CAP) {
        const oldest = Object.keys(a.agentOut)[0]
        if (oldest !== undefined) delete a.agentOut[oldest]
      }
      a.agentOut[agentId] = {
        out: (prev?.out ?? 0) + usage.output_tokens,
        model: shortModel(usage.model),
      }
    })

    return
  }
  queue(
    $,
    a => {
      a.turn.endedAt = at
      a.turn.lastMs = durationMs
      if (usage !== undefined) {
        a.tokens.input += usage.input_tokens
        a.tokens.output += usage.output_tokens
        a.tokens.cacheRead += usage.cache_read_input_tokens
        a.tokens.cacheWrite += usage.cache_creation_input_tokens
      }
    },
    {
      at,
      name: 'turn',
      text: `${reason === 'answer' ? 'done' : reason} ${fmtElapsed(durationMs)}`,
      tone: reason === 'answer' ? 'ok' : reason === 'aborted' ? 'warn' : 'err',
    },
  )
  await flush($)
}

function noteMode($: EngineInterface, mode: string | undefined, effort: string | undefined): void {
  if (mode === undefined && effort === undefined) return
  queue($, a => {
    if (mode !== undefined) a.mode = mode
    if (effort !== undefined) a.effort = effort
  })
}

/** A short, non-sensitive label: a file's basename or a command's first word, never the input itself. */
const SUBCOMMAND: readonly string[] = ['git', 'npm', 'pnpm', 'yarn', 'docker', 'gh', 'pip', 'claude', 'cargo', 'go']

function toolLabel(tool: string, input: unknown): string {
  const args = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>
  const str = (key: string): string | undefined => {
    const v = args[key]

    return typeof v === 'string' && v !== '' ? v : undefined
  }
  if (SHELL_TOOLS.includes(tool)) {
    const parts = (str('command') ?? '')
      .split(/&&|\|\||;|\|/)
      .map(part => part.trim().split(/\s+/))
      .filter(words => (words[0] ?? '') !== '')
    const main = parts.find(words => words[0] !== 'cd') ?? parts[0] ?? []
    const first = baseName(main[0] ?? '')
    const second = main[1] !== undefined && SUBCOMMAND.includes(first) ? ` ${main[1]}` : ''

    return clip(`${first}${second}`, 20)
  }
  const path = str('file_path') ?? str('notebook_path') ?? str('path')

  return path === undefined ? '' : clip(baseName(path), 24)
}

function baseName(p: string): string {
  const parts = p.split(/[\\/]/).filter(part => part !== '')

  return parts[parts.length - 1] ?? p
}

function shortTool(tool: string): string {
  if (tool.startsWith('mcp__')) {
    const parts = tool.split('__')

    return clip(parts[parts.length - 1] ?? tool, 14)
  }

  return clip(tool, 14)
}

function shortModel(model: string): string {
  return model.replace(/^claude-/, '').replace(/-\d{8}$/, '')
}

// ---- stop controls (a press arms; a second press within ARM_MS acts) ----

async function pressStop($: EngineInterface, target: string): Promise<void> {
  const at = await $.clock.now()
  const next = await update($, armAtom, cur => (cur.target === target && at - cur.at <= ARM_MS ? NO_ARM : { target, at }))
  if (next.target === target) return
  if (target === 'turn') await stopTurn($)
  else if (target === 'all') await stopAll($)
  else if (target.startsWith('task:')) await stopTask($, target.slice(5))
}

async function stopTurn($: EngineInterface): Promise<void> {
  const turnId = (await read($, liveAtom)).turnId
  if (turnId === undefined) return
  const at = await $.clock.now()
  try {
    await $.turn.abort({ turnId })
    queue($, undefined, { at, name: 'stop', text: 'turn', tone: 'warn' })
  } catch (error) {
    logError($, error)
    queue($, undefined, { at, name: 'stop', text: 'failed', tone: 'err' })
    await editLive($, s => {
      if (s.turnId === turnId) delete s.turnId
    })
  }
}

async function stopTask($: EngineInterface, id: string): Promise<void> {
  const at = await $.clock.now()
  let why: string | undefined
  try {
    const r = await $.tool.call({
      tool: 'TaskStop',
      task_id: id,
      consent: `The user pressed "Stop" on background task ${id} in the better-claude-dashboard pane.`,
    })
    why = r.deny ?? (r.isError === true ? (r.text ?? 'error') : undefined)
  } catch (error) {
    why = String(error)
  }
  if (why === undefined) {
    await editLive($, s => endTask(s, id, 'killed', at))
    queue($, undefined, { at, name: 'stop', text: 'killed', tone: 'warn' })
  } else {
    const reason = why
    await editLive($, s => setNote(s, id, clip(reason, 80)))
    queue($, undefined, { at, name: 'stop', text: 'failed', tone: 'err' })
  }
}

async function stopAll($: EngineInterface): Promise<void> {
  const cur = await read($, liveAtom)
  const rows = await read($, agents)
  const ids = [
    ...cur.tasks.filter(t => t.endedAt === undefined).map(t => t.id),
    ...rows.filter(row => row.endedAt === undefined).map(row => row.id),
  ]
  if (cur.turnId !== undefined) await stopTurn($)
  for (const id of ids) await attempt($, () => stopTask($, id), undefined)
}

// ---- polling ----

let wasLive = false

async function tick($: EngineInterface): Promise<void> {
  if (isTicking) return
  isTicking = true
  try {
    const now = await $.clock.now()
    const rows = await attempt($, () => refreshAgents($, now), [])
    if (ticks % USAGE_EVERY_TICKS === 0) await attempt($, () => refreshUsage($), undefined)
    ticks += 1
    await attempt($, () => flush($), undefined)
    const act = await read($, activity)
    const shown = await read($, clockNow)
    const liveNow = await read($, liveAtom)
    const isLive =
      rows.some(row => row.endedAt === undefined) ||
      liveNow.running.length > 0 ||
      liveNow.tasks.some(t => t.endedAt === undefined) ||
      (act.turn.startedAt !== undefined && act.turn.endedAt === undefined)
    if (isLive || wasLive || Math.floor(shown / 60_000) !== Math.floor(now / 60_000)) {
      await update($, clockNow, () => now)
    }
    wasLive = isLive
  } catch (error) {
    logError($, error)
  } finally {
    isTicking = false
  }
}

async function openPane($: EngineInterface): Promise<void> {
  try {
    const opened = await $.ui.open({ id: PANE, title: TITLE })
    if (!opened.isPlaced) $.ui.log(`better-claude-dashboard: pane waits: ${opened.reason}`, { to: 'debug' })
  } catch (error) {
    logError($, error)
  }
}

async function refreshAgents($: EngineInterface, now: number): Promise<DashAgent[]> {
  const list = await $.agent.list()
  const prev = await read($, agents)
  const merged = mergeAgents(prev, list, now)
  if (JSON.stringify(merged) !== JSON.stringify(prev)) {
    for (const row of merged) {
      const old = prev.find(p => p.id === row.id)
      if (old === undefined) {
        pendingLog.push({ at: now, name: clip(row.name, 16), text: 'spawned', tone: 'info' })
      }
      if (row.endedAt !== undefined && (old === undefined || old.endedAt === undefined)) {
        const isBad = row.status === 'failed' || row.status === 'killed'
        pendingLog.push({
          at: now,
          name: clip(row.name, 16),
          text: `${isBad ? row.status : 'done'} ${fmtElapsed(row.endedAt - row.startedAt)}`,
          tone: isBad ? 'err' : 'ok',
        })
      }
    }
    await update($, agents, current => mergeAgents(current, list, now))
  }

  return merged
}

function mergeAgents(prev: readonly DashAgent[], list: readonly AgentInfo[], now: number): DashAgent[] {
  const listed = new Set(list.map(info => info.id))
  const rows: DashAgent[] = list.map(info => {
    const old = prev.find(row => row.id === info.id)
    const endedAt = DONE.includes(info.status) ? (old?.endedAt ?? now) : undefined

    return {
      id: info.id,
      name: info.name ?? info.type,
      type: info.type,
      description: info.description,
      status: info.status,
      startedAt: old?.startedAt ?? now,
      ...(endedAt === undefined ? {} : { endedAt }),
    }
  })
  for (const old of prev) {
    if (!listed.has(old.id)) rows.push(old.endedAt === undefined ? { ...old, status: 'ended', endedAt: now } : old)
  }
  const active = rows.filter(row => row.endedAt === undefined).sort((a, b) => a.startedAt - b.startedAt)
  const finished = rows
    .filter(row => row.endedAt !== undefined)
    .sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0))
    .slice(0, KEEP_FINISHED)

  return [...active, ...finished]
}

async function refreshUsage($: EngineInterface): Promise<void> {
  const now = await $.clock.now()
  const prev = await read($, usage)
  const plain = await $.session.usage()
  const turns = await attempt($, () => $.session.turns(), prev.turns)
  let autoCompact: DashAutoCompact | undefined = prev.autoCompact
  let model: string | undefined = prev.model
  let categories: DashUsage['categories'] = prev.categories
  let windowTokens: number | undefined = prev.windowTokens
  let counts: DashUsage['counts'] = prev.counts
  let project = prev.project
  let branch = prev.branch
  const wait = autoCompact === undefined ? BREAKDOWN_RETRY_MS : BREAKDOWN_EVERY_MS
  if (plain.context.window !== prev.context.window || now - breakdownAt >= wait) {
    breakdownAt = now
    const repo = await attempt($, () => readRepo($), undefined)
    if (repo !== undefined) {
      project = repo.project
      branch = repo.branch
    }
    const breakdown = (await $.session.usage({ breakdown: 'summary' })).context.breakdown
    if (breakdown !== undefined) {
      autoCompact = {
        isEnabled: breakdown.isAutoCompactEnabled,
        ...(breakdown.autoCompactThreshold === undefined
          ? {}
          : { thresholdTokens: breakdown.autoCompactThreshold }),
      }
      model = breakdown.model
      categories = breakdown.categories
        .filter(c => c.tokens > 0)
        .map(c => ({ name: c.name, tokens: c.tokens, kind: c.kind }))
      windowTokens = breakdown.rawMaxTokens
      counts = {
        ...(breakdown.memoryFiles.length > 0 ? { memory: breakdown.memoryFiles.length } : {}),
        ...(breakdown.mcpTools.length > 0 ? { mcp: breakdown.mcpTools.length } : {}),
        ...(breakdown.agents.length > 0 ? { agents: breakdown.agents.length } : {}),
        ...(breakdown.skills !== undefined && breakdown.skills.totalSkills > 0 ? { skills: breakdown.skills.totalSkills } : {}),
      }
    }
  }
  if (model === undefined) model = await attempt($, () => $.session.model(), undefined)
  const fresh: DashUsage = {
    measuredAt: now,
    context: toContext(plain.context),
    rateLimits: plain.rateLimits.map(toWindow),
    ...(autoCompact === undefined ? {} : { autoCompact }),
    ...(plain.cost === undefined ? {} : { costUsd: plain.cost.usd }),
    ...(model === undefined ? {} : { model }),
    ...(turns === undefined ? {} : { turns }),
    ...(categories === undefined ? {} : { categories }),
    ...(windowTokens === undefined ? {} : { windowTokens }),
    ...(counts === undefined ? {} : { counts }),
    ...(project === undefined ? {} : { project }),
    ...(branch === undefined ? {} : { branch }),
  }
  const prevFive = prev.rateLimits.find(w => w.kind === 'five_hour')
  const freshFive = fresh.rateLimits.find(w => w.kind === 'five_hour')
  const plan = advancePlan(prev.plan, prevFive, freshFive)
  const next: DashUsage = plan === undefined ? fresh : { ...fresh, plan }
  if (prev.measuredAt !== 0 && sameReading(prev, next)) return
  await update($, usage, () => next)
}

async function readRepo($: EngineInterface): Promise<{ project?: string; branch?: string }> {
  const repo = await $.session.repo()
  const project = baseName(repo?.root ?? (await $.session.root()))
  if (repo === null) return { project }
  const run = await $.process.run(['git', 'branch', '--show-current'], { timeoutMs: 3_000 })
  const branch = run.exitCode === 0 ? run.stdout.trim() : ''

  return branch === '' ? { project } : { project, branch: clip(branch, 32) }
}

async function initLang($: EngineInterface): Promise<void> {
  if (isLocale(await read($, langAtom))) return
  const stored = await attempt($, () => $.store.get(LANG_KEY), undefined)
  const setting = await attempt($, () => $.settings.read({ key: 'language' }), undefined)
  const lcAll = await attempt($, () => $.env.get('LC_ALL'), undefined)
  const lcMessages = await attempt($, () => $.env.get('LC_MESSAGES'), undefined)
  const lang = await attempt($, () => $.env.get('LANG'), undefined)
  const chosen =
    (isLocale(stored) ? stored : undefined) ??
    detectLocale(setting) ??
    detectLocale(lcAll) ??
    detectLocale(lcMessages) ??
    detectLocale(lang) ??
    'en'
  await update($, langAtom, cur => (isLocale(cur) ? cur : chosen))
}

async function initSettings($: EngineInterface): Promise<void> {
  const stored = await attempt($, () => $.store.get(SETTINGS_KEY), undefined)
  if (stored === undefined) return
  await update($, settingsAtom, () => toSettings(stored))
}

async function saveSettings($: EngineInterface, next: DashSettings): Promise<void> {
  await attempt($, () => update($, settingsAtom, () => next), next)
  await attempt($, () => $.store.set(SETTINGS_KEY, next), undefined)
}

async function cycleOption($: EngineInterface, key: SettingKey): Promise<void> {
  await saveSettings($, cycleSetting(await read($, settingsAtom), key))
}

function withoutPlan(cur: DashUsage): DashUsage {
  const { plan: _plan, ...rest } = cur

  return rest
}

async function cycleLang($: EngineInterface): Promise<void> {
  const code = await update($, langAtom, cur => nextLocale(cur))
  await $.store.set(LANG_KEY, code)
}

function sameReading(a: DashUsage, b: DashUsage): boolean {
  return JSON.stringify({ ...a, measuredAt: 0 }) === JSON.stringify({ ...b, measuredAt: 0 })
}

function toContext(c: SessionContextUsage): DashUsage['context'] {
  return {
    window: c.window,
    ...(c.tokens === undefined ? {} : { tokens: c.tokens }),
    ...(c.percent === undefined ? {} : { percent: c.percent }),
  }
}

function toWindow(w: SessionRateLimit): DashWindow {
  return {
    kind: w.kind,
    percentUsed: w.percentUsed,
    ...(w.resetsAt === undefined ? {} : { resetsAt: w.resetsAt }),
  }
}

async function attempt<T>($: EngineInterface, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    logError($, error)

    return fallback
  }
}

function logError($: EngineInterface, error: unknown): void {
  $.ui.log(`better-claude-dashboard: ${String(error)}`, { to: 'debug' })
}

// ---- formatting ----

const BAR_CELLS = 10

function filledCells(percent: number): number {
  return Math.max(0, Math.min(BAR_CELLS, Math.round((percent / 100) * BAR_CELLS)))
}

function barFill(percent: number): string {
  return '▰'.repeat(filledCells(percent))
}

function barRest(percent: number): string {
  return '▱'.repeat(BAR_CELLS - filledCells(percent))
}

function shortWindow(kind: string): string {
  if (kind === 'five_hour') return '5h'
  if (kind === 'seven_day') return '7d'
  if (kind === 'spend_limit') return '$ '

  return kind.slice(0, 2)
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`

  return String(Math.round(n))
}

const GREEN = '#1f9d55'
const AMBER = '#c77800'
const RED = '#d63a3a'
const TRACK = '#9aa3b2'
const ORANGE = '#c8582f'
const INDIGO = '#4f56d9'
const TEAL = '#0e8f84'
const BLUE = '#2f6fe0'
const CYAN = '#0b7285'

function levelColor(percent: number): string {
  return percent >= 90 ? RED : percent >= 70 ? AMBER : GREEN
}

function toneColor(tone: DashLogEntry['tone']): string {
  return tone === 'ok' ? GREEN : tone === 'warn' ? AMBER : tone === 'err' ? RED : INDIGO
}

function autoCompactText(S: Strings, ac: DashAutoCompact, window: number): string {
  if (!ac.isEnabled) return S.autoCompactOff
  if (ac.thresholdTokens === undefined) return S.autoCompactOn
  const share = window > 0 ? ` (${Math.round((ac.thresholdTokens / window) * 100)}%)` : ''

  return S.autoCompactAt(fmtCompact(ac.thresholdTokens), share)
}

function resetText(S: Strings, resetsAt: string | undefined, now: number): string {
  if (resetsAt === undefined || now === 0) return ''
  const at = Date.parse(resetsAt)
  if (Number.isNaN(at)) return ''

  return at <= now ? S.resetting : S.resetsIn(fmtCountdown(at - now))
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function fmtElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const hrs = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (hrs > 0) return `${hrs}h ${pad(m)}m`
  if (m > 0) return `${m}m ${pad(s % 60)}s`

  return `${s}s`
}

/** Minute granularity: the clock atom only ticks per minute while nothing runs. */
function fmtUptime(ms: number): string {
  const min = Math.max(0, Math.floor(ms / 60_000))
  const hrs = Math.floor(min / 60)

  return hrs > 0 ? `${hrs}h ${pad(min % 60)}m` : `${min}m`
}

function fmtClock(at: number): string {
  const d = new Date(at)

  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function fmtCountdown(ms: number): string {
  const min = Math.max(1, Math.ceil(ms / 60_000))
  const d = Math.floor(min / 1440)
  const hrs = Math.floor((min % 1440) / 60)
  if (d > 0) return `${d}d ${hrs}h`
  if (hrs > 0) return `${hrs}h ${pad(min % 60)}m`

  return `${min}m`
}
