import type { DashLive, DashPlanBase, DashRun, DashTask, DashWindow } from '../types'

export const CMD_CLIP = 80
const RUNNING_CAP = 20
const TASKS_CAP = 20
const KEEP_ENDED_TASKS = 3
const NOTES_CAP = 10
const SHELL_TOOLS: readonly string[] = ['Bash', 'PowerShell']

export type BgSummary = { id: string; type: string; status: string; description: string; command?: string }

export function emptyLive(): DashLive {
  return { running: [], tasks: [], notes: {} }
}

export function clip(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

export function field(x: unknown, key: string): string | undefined {
  if (typeof x !== 'object' || x === null) return undefined
  const v = (x as Record<string, unknown>)[key]

  return typeof v === 'string' && v !== '' ? v : undefined
}

const BEARER = /\bbearer\s+[^\s"']+/gi
const KEYED = /(token|api[_-]?key|secret|password|passwd)(\s*[=:]\s*)("[^"]*"|'[^']*'|[^\s"']+)/gi
const SK = /\bsk-[A-Za-z0-9_-]{8,}/g

/** One line of a shell command, obvious secrets masked (best effort), clipped. */
export function shellLine(command: string, n = CMD_CLIP): string {
  const flat = command.replace(/\s+/g, ' ').trim()

  return clip(flat.replace(BEARER, 'Bearer ***').replace(KEYED, '$1$2***').replace(SK, 'sk-***'), n)
}

export function nowLabel(tool: string, input: unknown, fallback: string): string {
  if (SHELL_TOOLS.includes(tool)) return shellLine(field(input, 'command') ?? '')
  if (tool === 'Agent' || tool === 'Task' || tool === 'Monitor') return clip(field(input, 'description') ?? fallback, 60)

  return fallback
}

export function bgTaskOf(
  tool: string,
  input: unknown,
  result: unknown,
): { id: string; kind: string; label: string } | undefined {
  if (SHELL_TOOLS.includes(tool)) {
    const id = field(result, 'backgroundTaskId')

    return id === undefined ? undefined : { id, kind: 'shell', label: shellLine(field(input, 'command') ?? '') }
  }
  if (tool === 'Monitor') {
    const id = field(result, 'taskId')

    return id === undefined
      ? undefined
      : { id, kind: 'monitor', label: clip(field(input, 'description') ?? field(input, 'command') ?? '', 60) }
  }

  return undefined
}

export function startRun(s: DashLive, run: DashRun): void {
  if (s.running.some(r => r.id === run.id)) return
  s.running.push(run)
  if (s.running.length > RUNNING_CAP) s.running = s.running.slice(-RUNNING_CAP)
}

export function endRun(s: DashLive, id: string): void {
  s.running = s.running.filter(r => r.id !== id)
}

export function addTask(s: DashLive, task: DashTask): void {
  const at = s.tasks.findIndex(t => t.id === task.id)
  if (at >= 0) s.tasks[at] = task
  else s.tasks.push(task)
  s.tasks = trimTasks(s.tasks)
}

export function endTask(s: DashLive, id: string, status: string, at: number): void {
  const task = s.tasks.find(t => t.id === id)
  if (task === undefined || task.endedAt !== undefined) return
  task.status = status
  task.endedAt = at
  delete s.notes[id]
  s.tasks = trimTasks(s.tasks)
}

export function setNote(s: DashLive, id: string, text: string): void {
  delete s.notes[id]
  s.notes[id] = text
  const keys = Object.keys(s.notes)
  for (const key of keys.slice(0, Math.max(0, keys.length - NOTES_CAP))) delete s.notes[key]
}

export function turnStarted(s: DashLive, turnId: string): void {
  s.turnId = turnId
}

export function turnEnded(s: DashLive, agentId: string | undefined): void {
  if (agentId === undefined) delete s.turnId
  s.running = s.running.filter(r => r.agentId !== agentId)
}

export function reconcileTasks(prev: readonly DashTask[], listed: readonly BgSummary[], at: number): DashTask[] {
  const real = listed.filter(l => l.type !== 'subagent')
  const out: DashTask[] = prev.map(t => {
    if (t.endedAt !== undefined) return { ...t }
    const found = real.find(l => l.id === t.id)

    return found === undefined ? { ...t, status: 'ended', endedAt: at } : { ...t, status: found.status }
  })
  for (const l of real) {
    if (prev.some(t => t.id === l.id)) continue
    out.push({
      id: l.id,
      kind: l.type,
      label: l.type === 'shell' ? shellLine(l.command ?? l.description) : clip(l.description, 60),
      startedAt: at,
      status: l.status,
    })
  }

  return trimTasks(out)
}

function trimTasks(t: readonly DashTask[]): DashTask[] {
  const live = t.filter(x => x.endedAt === undefined).slice(-TASKS_CAP)
  const ended = t
    .filter(x => x.endedAt !== undefined)
    .sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0))
    .slice(0, KEEP_ENDED_TASKS)

  return [...live, ...ended]
}

const ROLL_MS = 60_000
const round1 = (n: number): number => Math.round(n * 10) / 10

/** True when both reset times parse and are further apart than a minute. */
function resetsApart(a: string | undefined, b: string | undefined): boolean {
  if (a === undefined || b === undefined) return false
  const x = Date.parse(a)
  const y = Date.parse(b)

  return !Number.isNaN(x) && !Number.isNaN(y) && Math.abs(x - y) > ROLL_MS
}

function hasRolled(resetsAt: string | undefined, last: number | undefined, next: DashWindow): boolean {
  if (next.resetsAt !== undefined && resetsAt !== undefined) return resetsApart(resetsAt, next.resetsAt)

  return last !== undefined && next.percentUsed < last
}

/**
 * Tracks how much of the five-hour window this conversation has used: the first reading is the
 * baseline, and what a window added is carried over when the window rolls.
 */
export function advancePlan(
  cur: DashPlanBase | undefined,
  prev: DashWindow | undefined,
  next: DashWindow | undefined,
): DashPlanBase | undefined {
  if (next === undefined) return cur
  if (cur === undefined) {
    return { ...(next.resetsAt === undefined ? {} : { resetsAt: next.resetsAt }), base: next.percentUsed, carried: 0 }
  }
  if (!hasRolled(cur.resetsAt, prev?.percentUsed, next)) {
    return cur.resetsAt === undefined && next.resetsAt !== undefined ? { ...cur, resetsAt: next.resetsAt } : cur
  }
  const sameWindow = prev !== undefined && !resetsApart(prev.resetsAt, cur.resetsAt)
  const last = sameWindow ? prev.percentUsed : cur.base

  return {
    ...(next.resetsAt === undefined ? {} : { resetsAt: next.resetsAt }),
    base: 0,
    carried: round1(cur.carried + Math.max(0, last - cur.base)),
  }
}

/** This conversation's share of the five-hour limit, or undefined without a reading. */
export function sessionShare(plan: DashPlanBase | undefined, five: DashWindow | undefined): number | undefined {
  if (plan === undefined || five === undefined) return undefined
  const rolled = hasRolled(plan.resetsAt, plan.base, five)

  return round1(plan.carried + (rolled ? 0 : Math.max(0, five.percentUsed - plan.base)))
}
