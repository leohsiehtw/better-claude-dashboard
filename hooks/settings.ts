import type { DashGrid, DashSettings, DashTokenMode } from '../types'

export const GRID_MIN_COLUMNS = 62

export const DEFAULT_SETTINGS: DashSettings = { companions: true, grid: 'auto', tokens: 'both' }

const GRIDS: readonly DashGrid[] = ['auto', '1', '2']
const TOKEN_MODES: readonly DashTokenMode[] = ['both', 'context', 'plan']

export type SettingKey = keyof DashSettings
export type ArgMode = 'open' | 'show' | 'set' | 'help' | 'error'

function pick<T extends string>(list: readonly T[], x: unknown, fallback: T): T {
  return typeof x === 'string' && (list as readonly string[]).includes(x) ? (x as T) : fallback
}

/** Validates each field on its own; anything unusable becomes that field's default. */
export function toSettings(raw: unknown): DashSettings {
  const r = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}

  return {
    companions: typeof r['companions'] === 'boolean' ? r['companions'] : DEFAULT_SETTINGS.companions,
    grid: pick(GRIDS, r['grid'], DEFAULT_SETTINGS.grid),
    tokens: pick(TOKEN_MODES, r['tokens'], DEFAULT_SETTINGS.tokens),
  }
}

export function summary(s: DashSettings): string {
  return `companions ${s.companions ? 'on' : 'off'} · grid ${s.grid} · tokens ${s.tokens}`
}

/** Reads the arguments of the slash command; the first bad token rejects the whole line. */
export function applyArgs(
  cur: DashSettings,
  args: string,
): { settings: DashSettings; mode: ArgMode; bad?: string } {
  const tokens = args
    .trim()
    .toLowerCase()
    .split(/[\s=]+/)
    .filter(t => t !== '')
  const first = tokens[0]
  if (first === undefined) return { settings: cur, mode: 'open' }
  if (tokens.length === 1 && (first === 'show' || first === 'settings' || first === 'status')) {
    return { settings: cur, mode: 'show' }
  }
  if (tokens.length === 1 && first === 'help') return { settings: cur, mode: 'help' }
  if (tokens.length === 1 && first === 'reset') return { settings: { ...DEFAULT_SETTINGS }, mode: 'set' }
  const next: DashSettings = { ...cur }
  for (let i = 0; i < tokens.length; i += 2) {
    const key = tokens[i] ?? ''
    const val = tokens[i + 1]
    if (val === undefined) return { settings: cur, mode: 'error', bad: key }
    if (key === 'companions' && (val === 'on' || val === 'off')) next.companions = val === 'on'
    else if (key === 'grid' && (GRIDS as readonly string[]).includes(val)) next.grid = val as DashGrid
    else if (key === 'tokens' && (TOKEN_MODES as readonly string[]).includes(val)) next.tokens = val as DashTokenMode
    else return { settings: cur, mode: 'error', bad: ['companions', 'grid', 'tokens'].includes(key) ? val : key }
  }

  return { settings: next, mode: 'set' }
}

/** The next value of one setting, for the pane's buttons. */
export function cycleSetting(cur: DashSettings, key: SettingKey): DashSettings {
  if (key === 'companions') return { ...cur, companions: !cur.companions }
  const list: readonly string[] = key === 'grid' ? GRIDS : TOKEN_MODES
  const at = list.indexOf(cur[key])
  const value = list[(at + 1) % list.length] ?? list[0] ?? ''

  return key === 'grid' ? { ...cur, grid: value as DashGrid } : { ...cur, tokens: value as DashTokenMode }
}

export function gridColumns(grid: DashGrid, bodyColumns: number, viewportColumns?: number): 1 | 2 {
  if (grid === '1') return 1
  if (grid === '2') return 2
  const width = bodyColumns > 0 ? bodyColumns : (viewportColumns ?? 0)

  return width >= GRID_MIN_COLUMNS ? 2 : 1
}
