export const LOCALES = ['en', 'zh-TW', 'zh-CN', 'ja', 'ko'] as const
export type Locale = (typeof LOCALES)[number]
export const LOCALE_LABEL: Readonly<Record<Locale, string>> = {
  en: 'EN',
  'zh-TW': '繁中',
  'zh-CN': '简中',
  ja: '日本語',
  ko: '한국어',
}

export type Strings = {
  session: string
  context: string
  turn: string
  permissions: string
  agents: (live: number, total: number) => string
  log: string
  glanceWaiting: string
  noSubagentsActive: string
  subagentsActive: (n: number) => string
  up: (t: string) => string
  waiting: string
  live: string
  modelWaiting: string
  effort: (level: string) => string
  turns: (n: number) => string
  ctxNoReading: string
  tokensOf: (used: string, win: string) => string
  autoCompactOff: string
  autoCompactOn: string
  autoCompactAt: (tokens: string, share: string) => string
  planNoReading: string
  resetting: string
  resetsIn: (t: string) => string
  tokensLine: (input: string, output: string, cache: number | undefined) => string
  usedLine: (used: string, win: string, pct: number) => string
  mcpTools: (n: number) => string
  memoryFiles: (n: number) => string
  agentsCount: (n: number) => string
  skillsCount: (n: number) => string
  noTurnYet: string
  running: (t: string) => string
  idle: string
  calls: string
  edits: string
  errors: string
  lastTurn: (t: string) => string
  sessionTotals: (edits: number, errors: number) => string
  allow: (n: number) => string
  ask: (n: number) => string
  deny: (n: number) => string
  checksLine: (auto: number, prompted: number, open: number) => string
  file: string
  shell: string
  other: string
  noToolCalls: string
  noSubagents: string
  outTok: (n: string, model: string | undefined) => string
  noEvents: string
  moving: (id: string) => string
  mascotAlt: string
  openButton: string
  now: string
  nothingRunning: string
  responding: string
  runningNow: (n: number) => string
  background: (n: number) => string
  inAgent: (name: string) => string
  stopTurn: string
  stopAll: (n: number) => string
  stopOne: string
  confirmStop: string
  stopFailed: (why: string) => string
  bgCount: (n: number) => string
  words: Readonly<Record<string, string>>
}

export function isLocale(x: unknown): x is Locale {
  return typeof x === 'string' && (LOCALES as readonly string[]).includes(x)
}
export function toLocale(x: unknown): Locale {
  return isLocale(x) ? x : 'en'
}
export function nextLocale(cur: unknown): Locale {
  const at = LOCALES.indexOf(toLocale(cur))

  return LOCALES[(at + 1) % LOCALES.length] ?? 'en'
}
export function detectLocale(raw: unknown): Locale | undefined {
  if (typeof raw !== 'string') return undefined
  const s = raw.trim().toLowerCase().replace(/_/g, '-')
  if (s === '' || s === 'c' || s === 'posix' || s.startsWith('c.')) return undefined
  if (/^zh-(tw|hk|mo|hant)|traditional|繁/.test(s)) return 'zh-TW'
  if (/^zh|chinese|中文|简|汉/.test(s)) return 'zh-CN'
  if (/^ja|japanese|日本/.test(s)) return 'ja'
  if (/^ko|korean|한국/.test(s)) return 'ko'
  if (/^en|english/.test(s)) return 'en'

  return undefined
}
export function strings(locale: unknown): Strings {
  return TABLE[toLocale(locale)]
}
export function word(S: Strings, w: string): string {
  return S.words[w] ?? w
}
export function lead(S: Strings, text: string): string {
  const [head = '', ...rest] = text.split(' ')

  return [word(S, head), ...rest].join(' ')
}

const en: Strings = {
  session: 'SESSION',
  context: 'CONTEXT',
  turn: 'TURN',
  permissions: 'PERMISSIONS',
  agents: (live, total) => `AGENTS · ${live} running · ${total} total`,
  log: 'SESSION LOG',
  glanceWaiting: 'Usage: waiting for a reading',
  noSubagentsActive: 'no subagents active',
  subagentsActive: n => `${n} subagent${n === 1 ? '' : 's'} active`,
  up: t => `up ${t}`,
  waiting: 'waiting',
  live: 'live',
  modelWaiting: 'model · waiting for a reading',
  effort: level => `effort ${level}`,
  turns: n => `${n} turns`,
  ctxNoReading: 'ctx · no reading yet (fills after the next response)',
  tokensOf: (used, win) => `${used} / ${win} tokens`,
  autoCompactOff: 'auto-compact: off',
  autoCompactOn: 'auto-compact: on',
  autoCompactAt: (tokens, share) => `auto-compact at ${tokens}${share}`,
  planNoReading: 'plan limits · no reading yet (subscription only)',
  resetting: 'resetting',
  resetsIn: t => `resets in ${t}`,
  tokensLine: (input, output, cache) =>
    `tokens in ${input} · out ${output}${cache === undefined ? '' : ` · cache ${cache}%`}`,
  usedLine: (used, win, pct) => `${used} / ${win} · ${pct}% used`,
  mcpTools: n => `MCP tools ${n}`,
  memoryFiles: n => `memory files ${n}`,
  agentsCount: n => `agents ${n}`,
  skillsCount: n => `skills ${n}`,
  noTurnYet: 'no turn yet',
  running: t => `running ${t}`,
  idle: 'idle',
  calls: 'calls',
  edits: 'edits',
  errors: 'errors',
  lastTurn: t => `last turn ${t}`,
  sessionTotals: (edits, errors) => `session edits ${edits} · errors ${errors}`,
  allow: n => `✓ ${n} allow`,
  ask: n => `? ${n} ask`,
  deny: n => `✗ ${n} deny`,
  checksLine: (auto, prompted, open) => `classifier ${auto} · prompted ${prompted} · pending ${open}`,
  file: 'file',
  shell: 'shell',
  other: 'other',
  noToolCalls: 'no tool calls yet',
  noSubagents: 'No subagents yet.',
  outTok: (n, model) => `out ${n} tok${model === undefined ? '' : ` · ${model}`}`,
  noEvents: 'No events yet.',
  moving: id => `⠿ moving ${id}: press another card's ⠿ to drop it there, the same one to cancel`,
  mascotAlt: 'Mascot',
  openButton: 'Usage ▸',
  now: 'NOW',
  nothingRunning: 'Nothing running.',
  responding: 'Claude is responding',
  runningNow: n => `running · ${n}`,
  background: n => `background · ${n}`,
  inAgent: name => `↳ in ${name}`,
  stopTurn: '■ Stop turn',
  stopAll: n => `✕ Stop all (${n})`,
  stopOne: '✕ Stop',
  confirmStop: 'press again to stop',
  stopFailed: why => `stop failed: ${why}`,
  bgCount: n => `${n} in background`,
  words: {},
}

const zhTW: Strings = {
  session: '工作階段',
  context: '上下文',
  turn: '回合',
  permissions: '權限',
  agents: (live, total) => `子代理 · ${live} 執行中 · 共 ${total}`,
  log: '工作階段紀錄',
  glanceWaiting: '用量：等待讀數',
  noSubagentsActive: '沒有執行中的子代理',
  subagentsActive: n => `${n} 個子代理執行中`,
  up: t => `已運行 ${t}`,
  waiting: '等待中',
  live: '即時',
  modelWaiting: '模型 · 等待讀數',
  effort: level => `思考強度 ${level}`,
  turns: n => `${n} 回合`,
  ctxNoReading: 'ctx · 尚無讀數（下一次回應後顯示）',
  tokensOf: (used, win) => `${used} / ${win} tokens`,
  autoCompactOff: '自動壓縮：關',
  autoCompactOn: '自動壓縮：開',
  autoCompactAt: (tokens, share) => `自動壓縮於 ${tokens}${share}`,
  planNoReading: '方案用量 · 尚無讀數（僅限訂閱）',
  resetting: '重置中',
  resetsIn: t => `${t} 後重置`,
  tokensLine: (input, output, cache) =>
    `token 輸入 ${input} · 輸出 ${output}${cache === undefined ? '' : ` · 快取命中 ${cache}%`}`,
  usedLine: (used, win, pct) => `${used} / ${win} · 已用 ${pct}%`,
  mcpTools: n => `MCP 工具 ${n}`,
  memoryFiles: n => `記憶檔案 ${n}`,
  agentsCount: n => `自訂代理 ${n}`,
  skillsCount: n => `Skills ${n}`,
  noTurnYet: '尚無回合',
  running: t => `執行中 ${t}`,
  idle: '閒置',
  calls: '呼叫',
  edits: '編輯',
  errors: '錯誤',
  lastTurn: t => `上一回合 ${t}`,
  sessionTotals: (edits, errors) => `本工作階段 編輯 ${edits} · 錯誤 ${errors}`,
  allow: n => `✓ ${n} 允許`,
  ask: n => `? ${n} 詢問`,
  deny: n => `✗ ${n} 拒絕`,
  checksLine: (auto, prompted, open) => `分類器 ${auto} · 彈窗 ${prompted} · 等待 ${open}`,
  file: '檔案',
  shell: 'shell',
  other: '其他',
  noToolCalls: '尚無工具呼叫',
  noSubagents: '尚無子代理。',
  outTok: (n, model) => `輸出 ${n} tok${model === undefined ? '' : ` · ${model}`}`,
  noEvents: '尚無事件。',
  moving: id => `⠿ 正在移動 ${id}：按另一張卡的 ⠿ 放到該處，按同一張取消`,
  mascotAlt: '吉祥物',
  openButton: '用量 ▸',
  now: '即時動態',
  nothingRunning: '目前沒有執行中的工作。',
  responding: 'Claude 回應中',
  runningNow: n => `執行中 · ${n}`,
  background: n => `背景 · ${n}`,
  inAgent: name => `↳ 於 ${name}`,
  stopTurn: '■ 停止回合',
  stopAll: n => `✕ 全部停止 (${n})`,
  stopOne: '✕ 停止',
  confirmStop: '再按一次以停止',
  stopFailed: why => `停止失敗：${why}`,
  bgCount: n => `背景 ${n} 項`,
  words: {
    started: '開始', done: '完成', spawned: '啟動', error: '錯誤', denied: '已拒絕', ask: '詢問', deny: '拒絕',
    aborted: '中斷', refusal: '拒答', failed: '失敗', killed: '已終止', turn: '回合', check: '檢查',
    pending: '等待', running: '執行中', waiting: '等待中', idle: '閒置', completed: '已完成', ended: '已結束',
    stop:'停止', shell:'shell', monitor:'監看', agent:'子代理', workflow:'工作流程',
  },
}

const zhCN: Strings = {
  session: '会话',
  context: '上下文',
  turn: '轮次',
  permissions: '权限',
  agents: (live, total) => `子代理 · ${live} 运行中 · 共 ${total}`,
  log: '会话日志',
  glanceWaiting: '用量：等待读数',
  noSubagentsActive: '没有运行中的子代理',
  subagentsActive: n => `${n} 个子代理运行中`,
  up: t => `已运行 ${t}`,
  waiting: '等待中',
  live: '实时',
  modelWaiting: '模型 · 等待读数',
  effort: level => `思考强度 ${level}`,
  turns: n => `${n} 轮`,
  ctxNoReading: 'ctx · 暂无读数（下次响应后显示）',
  tokensOf: (used, win) => `${used} / ${win} tokens`,
  autoCompactOff: '自动压缩：关',
  autoCompactOn: '自动压缩：开',
  autoCompactAt: (tokens, share) => `自动压缩于 ${tokens}${share}`,
  planNoReading: '套餐用量 · 暂无读数（仅限订阅）',
  resetting: '重置中',
  resetsIn: t => `${t} 后重置`,
  tokensLine: (input, output, cache) =>
    `token 输入 ${input} · 输出 ${output}${cache === undefined ? '' : ` · 缓存命中 ${cache}%`}`,
  usedLine: (used, win, pct) => `${used} / ${win} · 已用 ${pct}%`,
  mcpTools: n => `MCP 工具 ${n}`,
  memoryFiles: n => `记忆文件 ${n}`,
  agentsCount: n => `自定义代理 ${n}`,
  skillsCount: n => `Skills ${n}`,
  noTurnYet: '暂无轮次',
  running: t => `运行中 ${t}`,
  idle: '空闲',
  calls: '调用',
  edits: '编辑',
  errors: '错误',
  lastTurn: t => `上一轮 ${t}`,
  sessionTotals: (edits, errors) => `本会话 编辑 ${edits} · 错误 ${errors}`,
  allow: n => `✓ ${n} 允许`,
  ask: n => `? ${n} 询问`,
  deny: n => `✗ ${n} 拒绝`,
  checksLine: (auto, prompted, open) => `分类器 ${auto} · 弹窗 ${prompted} · 等待 ${open}`,
  file: '文件',
  shell: 'shell',
  other: '其他',
  noToolCalls: '暂无工具调用',
  noSubagents: '暂无子代理。',
  outTok: (n, model) => `输出 ${n} tok${model === undefined ? '' : ` · ${model}`}`,
  noEvents: '暂无事件。',
  moving: id => `⠿ 正在移动 ${id}：点另一张卡片的 ⠿ 放到该处，点同一张取消`,
  mascotAlt: '吉祥物',
  openButton: '用量 ▸',
  now: '实时动态',
  nothingRunning: '当前没有运行中的任务。',
  responding: 'Claude 正在回复',
  runningNow: n => `运行中 · ${n}`,
  background: n => `后台 · ${n}`,
  inAgent: name => `↳ 在 ${name}`,
  stopTurn: '■ 停止本轮',
  stopAll: n => `✕ 全部停止 (${n})`,
  stopOne: '✕ 停止',
  confirmStop: '再点一次以停止',
  stopFailed: why => `停止失败：${why}`,
  bgCount: n => `后台 ${n} 项`,
  words: {
    started: '开始', done: '完成', spawned: '启动', error: '错误', denied: '已拒绝', ask: '询问', deny: '拒绝',
    aborted: '中断', refusal: '拒答', failed: '失败', killed: '已终止', turn: '轮次', check: '检查',
    pending: '等待', running: '运行中', waiting: '等待中', idle: '空闲', completed: '已完成', ended: '已结束',
    stop:'停止', shell:'shell', monitor:'监视', agent:'子代理', workflow:'工作流',
  },
}

const ja: Strings = {
  session: 'セッション',
  context: 'コンテキスト',
  turn: 'ターン',
  permissions: '権限',
  agents: (live, total) => `エージェント · 実行中 ${live} · 計 ${total}`,
  log: 'セッションログ',
  glanceWaiting: '使用量: 計測待ち',
  noSubagentsActive: '実行中のサブエージェントなし',
  subagentsActive: n => `サブエージェント ${n} 件実行中`,
  up: t => `稼働 ${t}`,
  waiting: '待機中',
  live: 'ライブ',
  modelWaiting: 'モデル · 計測待ち',
  effort: level => `エフォート ${level}`,
  turns: n => `${n} ターン`,
  ctxNoReading: 'ctx · まだ計測なし（次の応答後に表示）',
  tokensOf: (used, win) => `${used} / ${win} トークン`,
  autoCompactOff: '自動コンパクト: オフ',
  autoCompactOn: '自動コンパクト: オン',
  autoCompactAt: (tokens, share) => `${tokens}${share} で自動コンパクト`,
  planNoReading: 'プラン上限 · まだ計測なし（サブスクリプションのみ）',
  resetting: 'リセット中',
  resetsIn: t => `${t} 後にリセット`,
  tokensLine: (input, output, cache) =>
    `トークン 入力 ${input} · 出力 ${output}${cache === undefined ? '' : ` · キャッシュ ${cache}%`}`,
  usedLine: (used, win, pct) => `${used} / ${win} · ${pct}% 使用`,
  mcpTools: n => `MCP ツール ${n}`,
  memoryFiles: n => `メモリファイル ${n}`,
  agentsCount: n => `エージェント ${n}`,
  skillsCount: n => `スキル ${n}`,
  noTurnYet: 'まだターンなし',
  running: t => `実行中 ${t}`,
  idle: 'アイドル',
  calls: '呼び出し',
  edits: '編集',
  errors: 'エラー',
  lastTurn: t => `前回のターン ${t}`,
  sessionTotals: (edits, errors) => `セッション計 編集 ${edits} · エラー ${errors}`,
  allow: n => `✓ ${n} 許可`,
  ask: n => `? ${n} 確認`,
  deny: n => `✗ ${n} 拒否`,
  checksLine: (auto, prompted, open) => `分類器 ${auto} · ダイアログ ${prompted} · 保留 ${open}`,
  file: 'ファイル',
  shell: 'シェル',
  other: 'その他',
  noToolCalls: 'まだツール呼び出しなし',
  noSubagents: 'サブエージェントはまだありません。',
  outTok: (n, model) => `出力 ${n} tok${model === undefined ? '' : ` · ${model}`}`,
  noEvents: 'イベントはまだありません。',
  moving: id => `⠿ ${id} を移動中: 別のカードの ⠿ でそこへ、同じカードでキャンセル`,
  mascotAlt: 'マスコット',
  openButton: '使用量 ▸',
  now: '実行状況',
  nothingRunning: '実行中の処理はありません。',
  responding: 'Claude が応答中',
  runningNow: n => `実行中 · ${n}`,
  background: n => `バックグラウンド · ${n}`,
  inAgent: name => `↳ ${name} 内`,
  stopTurn: '■ ターンを停止',
  stopAll: n => `✕ すべて停止 (${n})`,
  stopOne: '✕ 停止',
  confirmStop: 'もう一度押すと停止',
  stopFailed: why => `停止失敗: ${why}`,
  bgCount: n => `バックグラウンド ${n} 件`,
  words: {
    started: '開始', done: '完了', spawned: '起動', error: 'エラー', denied: '拒否済み', ask: '確認', deny: '拒否',
    aborted: '中断', refusal: '拒否応答', failed: '失敗', killed: '強制終了', turn: 'ターン', check: 'チェック',
    pending: '保留', running: '実行中', waiting: '待機中', idle: 'アイドル', completed: '完了', ended: '終了',
    stop:'停止', shell:'シェル', monitor:'モニター', agent:'エージェント', workflow:'ワークフロー',
  },
}

const ko: Strings = {
  session: '세션',
  context: '컨텍스트',
  turn: '턴',
  permissions: '권한',
  agents: (live, total) => `에이전트 · 실행 중 ${live} · 전체 ${total}`,
  log: '세션 로그',
  glanceWaiting: '사용량: 측정 대기 중',
  noSubagentsActive: '실행 중인 서브에이전트 없음',
  subagentsActive: n => `서브에이전트 ${n}개 실행 중`,
  up: t => `가동 ${t}`,
  waiting: '대기 중',
  live: '실시간',
  modelWaiting: '모델 · 측정 대기 중',
  effort: level => `노력 수준 ${level}`,
  turns: n => `${n}턴`,
  ctxNoReading: 'ctx · 아직 측정값 없음 (다음 응답 후 표시)',
  tokensOf: (used, win) => `${used} / ${win} 토큰`,
  autoCompactOff: '자동 압축: 꺼짐',
  autoCompactOn: '자동 압축: 켜짐',
  autoCompactAt: (tokens, share) => `${tokens}${share}에서 자동 압축`,
  planNoReading: '플랜 한도 · 아직 측정값 없음 (구독 전용)',
  resetting: '초기화 중',
  resetsIn: t => `${t} 후 초기화`,
  tokensLine: (input, output, cache) =>
    `토큰 입력 ${input} · 출력 ${output}${cache === undefined ? '' : ` · 캐시 ${cache}%`}`,
  usedLine: (used, win, pct) => `${used} / ${win} · ${pct}% 사용`,
  mcpTools: n => `MCP 도구 ${n}`,
  memoryFiles: n => `메모리 파일 ${n}`,
  agentsCount: n => `에이전트 ${n}`,
  skillsCount: n => `스킬 ${n}`,
  noTurnYet: '아직 턴 없음',
  running: t => `실행 중 ${t}`,
  idle: '유휴',
  calls: '호출',
  edits: '편집',
  errors: '오류',
  lastTurn: t => `지난 턴 ${t}`,
  sessionTotals: (edits, errors) => `세션 합계 편집 ${edits} · 오류 ${errors}`,
  allow: n => `✓ ${n} 허용`,
  ask: n => `? ${n} 확인`,
  deny: n => `✗ ${n} 거부`,
  checksLine: (auto, prompted, open) => `분류기 ${auto} · 대화상자 ${prompted} · 대기 ${open}`,
  file: '파일',
  shell: '셸',
  other: '기타',
  noToolCalls: '아직 도구 호출 없음',
  noSubagents: '아직 서브에이전트가 없습니다.',
  outTok: (n, model) => `출력 ${n} tok${model === undefined ? '' : ` · ${model}`}`,
  noEvents: '아직 이벤트가 없습니다.',
  moving: id => `⠿ ${id} 이동 중: 다른 카드의 ⠿를 눌러 놓고, 같은 카드를 눌러 취소`,
  mascotAlt: '마스코트',
  openButton: '사용량 ▸',
  now: '실행 현황',
  nothingRunning: '실행 중인 작업이 없습니다.',
  responding: 'Claude 응답 중',
  runningNow: n => `실행 중 · ${n}`,
  background: n => `백그라운드 · ${n}`,
  inAgent: name => `↳ ${name} 안`,
  stopTurn: '■ 턴 중지',
  stopAll: n => `✕ 모두 중지 (${n})`,
  stopOne: '✕ 중지',
  confirmStop: '한 번 더 누르면 중지',
  stopFailed: why => `중지 실패: ${why}`,
  bgCount: n => `백그라운드 ${n}개`,
  words: {
    started: '시작', done: '완료', spawned: '생성', error: '오류', denied: '거부됨', ask: '확인', deny: '거부',
    aborted: '중단', refusal: '거절', failed: '실패', killed: '강제 종료', turn: '턴', check: '검사',
    pending: '대기', running: '실행 중', waiting: '대기 중', idle: '유휴', completed: '완료', ended: '종료',
    stop:'중지', shell:'셸', monitor:'모니터', agent:'에이전트', workflow:'워크플로',
  },
}

const TABLE: Readonly<Record<Locale, Strings>> = { en, 'zh-TW': zhTW, 'zh-CN': zhCN, ja, ko }
