export type DashWindow = { kind: string; percentUsed: number; resetsAt?: string }
export type DashAutoCompact = { isEnabled: boolean; thresholdTokens?: number }
/** The five-hour window's share that this conversation used, tracked across window rolls. */
export type DashPlanBase = { resetsAt?: string; base: number; carried: number }
export type DashUsage = {
  measuredAt: number
  context: { tokens?: number; window: number; percent?: number }
  rateLimits: DashWindow[]
  autoCompact?: DashAutoCompact
  costUsd?: number
  model?: string
  turns?: number
  categories?: { name: string; tokens: number; kind: string }[]
  /** the window the breakdown is measured against, in tokens */
  windowTokens?: number
  /** how many memory files, MCP tools, custom agents and skills the breakdown lists */
  counts?: { memory?: number; mcp?: number; agents?: number; skills?: number }
  /** the session's repository folder name (or working folder when not in a repo) */
  project?: string
  /** the checked-out git branch, when git answered */
  branch?: string
  /** baseline of the five-hour window at the first reading, and what earlier windows added since */
  plan?: DashPlanBase
}
export type DashAgent = {
  id: string
  name: string
  type: string
  description: string
  status: string
  startedAt: number
  endedAt?: number
}
/** tool.check verdicts seen on real calls, plus the classic permission events. */
export type DashChecks = {
  allow: number
  ask: number
  deny: number
  /** asks raised while the permission mode was `auto` (the classifier decides those) */
  auto: number
  /** classic PermissionRequest: a permission dialog was put up */
  prompted: number
  /** classic PermissionDenied */
  autoDenied: number
  /** asked calls whose tool.call has not resolved yet */
  open: number
}
export type DashTurn = {
  startedAt?: number
  endedAt?: number
  lastMs?: number
  calls: number
  edits: number
  errors: number
}
export type DashActivity = {
  /** when this mod first saw this session start in this process (not the resumed session's first launch) */
  sessionStartedAt: number
  mode?: string
  effort?: string
  checks: DashChecks
  groups: { file: number; shell: number; other: number }
  tools: Record<string, number>
  turn: DashTurn
  edits: number
  errors: number
  /** summed output tokens of each subagent's turns (turn.complete usage) */
  agentOut: Record<string, { out: number; model?: string }>
  /** main loop turns' summed token counts (turn.complete usage), since this mod loaded */
  tokens: { input: number; output: number; cacheRead: number; cacheWrite: number }
}
export type DashGrid = 'auto' | '1' | '2'
export type DashTokenMode = 'both' | 'context' | 'plan'
export type DashSettings = { companions: boolean; grid: DashGrid; tokens: DashTokenMode }
/** Card order and which cards are folded, kept across reloads. */
export type DashLayout = { order: string[]; collapsed: string[]; lifting?: string }
export type DashLogEntry = { at: number; name: string; text: string; tone: 'info' | 'ok' | 'warn' | 'err' }

/** A tool call that has started and not yet answered. */
export type DashRun = { id: string; tool: string; label: string; startedAt: number; agentId?: string }
/** A background task (shell, monitor, workflow...) this mod saw start, or classic.Stop listed. */
export type DashTask = { id: string; kind: string; label: string; startedAt: number; status: string; endedAt?: number }
/** What runs now: the main turn's id (for $.turn.abort), running calls, background tasks, stop failures by id. */
export type DashLive = { turnId?: string; running: DashRun[]; tasks: DashTask[]; notes: Record<string, string> }
/** Which Stop button awaits its confirming press, and since when. */
export type DashArm = { target: string; at: number }

declare module 'claude-code' {
  interface PluginState {
    'better-claude-dashboard': {
      usage: Shaped<DashUsage>
      agents: Shaped<DashAgent[]>
      now: number
      activity: Shaped<DashActivity>
      log: Shaped<DashLogEntry[]>
      layout: Shaped<DashLayout>
      live: Shaped<DashLive>
      arm: Shaped<DashArm>
      lang: string
      settings: Shaped<DashSettings>
      settingsOpen: boolean
    }
  }
}
