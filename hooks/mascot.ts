const SPIN = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export function spin(now: number): string {
  return SPIN[Math.floor(now / 1000) % SPIN.length] ?? '⠋'
}

export type Mood = 'idle' | 'laptop' | 'read' | 'search' | 'coffee' | 'walk' | 'bulb' | 'hop'

export const MOODS: Mood[] = ['laptop', 'read', 'search', 'coffee', 'walk', 'bulb', 'hop']

/** Moods that turn to a side view (a darker side face appears, the far arm hides). */
const PROFILE: readonly Mood[] = ['laptop', 'read', 'search', 'coffee', 'walk']

/** How long one mood plays before the next: two whole 6 s stories. */
export const MOOD_MS = 12_000

export function moodFor(now: number, busy: boolean): Mood {
  return busy ? (MOODS[Math.floor(now / MOOD_MS) % MOODS.length] ?? 'laptop') : 'idle'
}

// One drawing unit is one "pixel" of the sprite: the body is 23 wide and 18 tall, the legs 4 tall.
const C = '#d97757'
const D = '#b4593d'
const K = '#1a1a1a'
const WINK = '#7a2a12'
const SH = '#000'
const SHADOW = 'fill-opacity=".28"'
const BROWN = '#8a5a3b'
const CREAM = '#fbf3ec'

const rect = (x: number, y: number, w: number, h: number, fill: string, cls = ''): string => {
  const shadow = fill === SH ? ` ${SHADOW}` : ''

  return `<rect${cls === '' ? '' : ` class="${cls}"`} x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${shadow}/>`
}

const armL = (cls = ''): string =>
  `<g${cls === '' ? '' : ` class="${cls}"`}>${rect(0, 6, 6, 6, C)}${rect(0, 12, 6, 1, D)}${rect(6, 7, 1, 5, D)}</g>`
const armR = (): string => `${rect(29, 6, 6, 6, C)}${rect(29, 12, 6, 1, D)}${rect(28, 7, 1, 5, D)}`

/** The shared 6 s story of the profile moods: wink, a prop comes out (t1, t2), is set up (t3), the body turns to the side and uses it (t4), puts it away and turns back. */
const STORY = `.ff,.lg{transform-box:fill-box;transform-origin:left;animation:ffk 6s ease-in-out infinite}
.el{animation:elk 6s ease-in-out infinite}.er{animation:erk 6s ease-in-out infinite}.ra{animation:rak 6s ease-in-out infinite}
.la{transform-box:fill-box;transform-origin:right top;animation:lak 6s ease-in-out infinite}
.t1{animation:t1k 6s steps(1,end) infinite}.t2{animation:t2k 6s steps(1,end) infinite}
.t3{animation:t3k 6s steps(1,end) infinite}.t4{animation:t4k 6s steps(1,end) infinite}
@keyframes ffk{0%,32%{transform:scaleX(1)}40%,74%{transform:scaleX(.78)}84%,100%{transform:scaleX(1)}}
@keyframes elk{0%,32%{transform:translateX(0)}40%,74%{transform:translateX(-2px)}84%,100%{transform:translateX(0)}}
@keyframes erk{0%,32%{transform:translateX(0)}40%,74%{transform:translateX(-5px)}84%,100%{transform:translateX(0)}}
@keyframes rak{0%,32%{opacity:1}36%,80%{opacity:0}86%,100%{opacity:1}}
@keyframes lak{0%,6%{transform:none}10%,30%{transform:scaleX(.5)}36%{transform:none}42%,72%{transform:translateY(2px) scaleY(1.33)}82%,100%{transform:none}}
@keyframes t1k{0%,13%{opacity:0}14%,22%{opacity:1}24%,71%{opacity:0}72%,80%{opacity:1}82%,100%{opacity:0}}
@keyframes t2k{0%,23%{opacity:0}24%,31%{opacity:1}32%,100%{opacity:0}}
@keyframes t3k{0%,31%{opacity:0}32%,73%{opacity:1}74%,100%{opacity:0}}
@keyframes t4k{0%,40%{opacity:0}42%,72%{opacity:1}74%,100%{opacity:0}}`

const WINKCSS = `.wk2{transform-box:fill-box;transform-origin:center;animation:wk2 6s steps(1,end) infinite}
@keyframes wk2{0%,7%{transform:scaleY(1);fill:${K}}9%,15%{transform:scaleY(.5);fill:${WINK}}17%,100%{transform:scaleY(1);fill:${K}}}`

const PROPS: Record<Mood, { css: string; inside: string; above: string }> = {
  idle: {
    css: `.z1,.z2{animation:zz 4s steps(1,end) infinite;opacity:0}.z2{animation-delay:calc(2s - var(--t,0s))!important}.look{animation:look 7s steps(1,end) infinite}
@keyframes zz{0%{opacity:0;transform:translate(0,0)}20%{opacity:1}60%{opacity:1;transform:translate(2px,-3px)}80%,100%{opacity:0;transform:translate(3px,-5px)}}
@keyframes look{0%,40%{transform:translateX(0)}45%,60%{transform:translateX(-1px)}65%,85%{transform:translateX(1px)}90%,100%{transform:translateX(0)}}`,
    inside: '',
    above: `<text class="z1" x="40" y="8" font-size="6" font-family="monospace" font-weight="bold" fill="#8b9099">z</text><text class="z2" x="40" y="8" font-size="5" font-family="monospace" font-weight="bold" fill="#8b9099">z</text>`,
  },
  laptop: {
    css: `.hdi{animation:tp .3s steps(1,end) infinite}@keyframes tp{0%{transform:translateX(0)}50%{transform:translateX(-4px)}}`,
    inside:
      `<g class="t1">${rect(-6, -2, 1, 4, SH)}${rect(-6, 2, 3, 1, SH)}</g>` +
      `<g class="t2">${rect(-7, 9, 6, 2, SH)}</g>` +
      `<g class="t3">${[0, 1, 2, 3, 4, 5].map(i => rect(-6 + i, 13 + i, 2, 1, SH)).join('')}${rect(0, 19, 9, 1, SH)}</g>` +
      `<g class="t4"><g class="hdi">${rect(5, 16, 3, 3, D)}</g></g>`,
    above: '',
  },
  read: {
    css: `.pg{transform-box:fill-box;transform-origin:left;animation:pg .8s steps(1,end) infinite}@keyframes pg{0%{transform:scaleX(1)}50%{transform:scaleX(.3)}}`,
    inside:
      `<g class="t1">${rect(-8, 0, 4, 5, BROWN)}</g>` +
      `<g class="t2">${rect(-9, 10, 5, 6, BROWN)}</g>` +
      `<g class="t3">${rect(-8, 19, 14, 1, BROWN)}${rect(-7, 16, 6, 3, CREAM)}${rect(-1, 16, 6, 3, '#e9dfd3')}${rect(-1, 15, 1, 4, BROWN)}</g>` +
      `<g class="t4"><g class="pg">${rect(-1, 14, 6, 5, CREAM)}</g>${rect(5, 15, 3, 3, D)}</g>`,
    above: '',
  },
  search: {
    css: `.sw{animation:sw 1.6s steps(1,end) infinite}@keyframes sw{0%{transform:translateX(0)}50%{transform:translateX(-3px)}}`,
    inside:
      `<g class="t1">${rect(-7, 0, 4, 4, '#5aa9ff')}</g>` +
      `<g class="t2">${rect(-8, 10, 5, 5, '#5aa9ff')}</g>` +
      `<g class="t4"><g class="sw">${rect(-8, 12, 7, 1, '#5aa9ff')}${rect(-8, 18, 7, 1, '#5aa9ff')}${rect(-8, 12, 1, 7, '#5aa9ff')}${rect(-2, 12, 1, 7, '#5aa9ff')}${rect(-7, 13, 5, 5, '#bfe0ff')}${[0, 1, 2].map(i => rect(-1 + i * 2, 18 - i, 2, 1, '#8b9099')).join('')}${rect(5, 14, 3, 3, D)}</g></g>`,
    above: '',
  },
  coffee: {
    css: `.sp1,.sp2{animation:st 1.6s steps(1,end) infinite}.sp2{animation-delay:calc(.8s - var(--t,0s))!important}.sip{animation:sip 3s steps(1,end) infinite}
@keyframes st{0%{transform:translateY(0);opacity:0}25%{transform:translateY(-1px);opacity:1}50%{transform:translateY(-2px);opacity:1}75%{transform:translateY(-3px);opacity:0}}
@keyframes sip{0%{transform:translateY(0)}50%{transform:translateY(-4px)}}`,
    inside:
      `<g class="t1">${rect(-8, 0, 4, 4, CREAM)}</g>` +
      `<g class="t2">${rect(-9, 10, 5, 5, CREAM)}</g>` +
      `<g class="t3"><g class="sip">${rect(-7, 13, 6, 6, CREAM)}${rect(-7, 14, 6, 1, '#7a4a2b')}${rect(-1, 14, 2, 1, CREAM)}${rect(0, 14, 1, 3, CREAM)}${rect(-1, 16, 2, 1, CREAM)}${rect(-6, 10, 1, 3, SH, 'sp1')}${rect(-4, 10, 1, 3, SH, 'sp2')}${rect(1, 17, 3, 3, D)}</g></g>`,
    above: '',
  },
  walk: {
    css: `.gr{animation:gr .5s linear infinite}@keyframes gr{0%{transform:translateX(0)}100%{transform:translateX(-8px)}}
.d1,.d2,.d3{animation:dt 1.2s steps(1,end) infinite}.d2{animation-delay:calc(.4s - var(--t,0s))!important}.d3{animation-delay:calc(.8s - var(--t,0s))!important}@keyframes dt{0%{opacity:.15}33%,66%{opacity:1}100%{opacity:.15}}`,
    inside:
      `<g class="t3"><g class="gr">${[-12, -4, 4, 12, 20, 28, 36, 44].map(x => rect(x, 22, 4, 1, SH)).join('')}</g></g>` +
      `<g class="t4">${rect(8, -4, 3, 3, C, 'd1')}${rect(13, -4, 3, 3, C, 'd2')}${rect(18, -4, 3, 3, C, 'd3')}</g>`,
    above: '',
  },
  bulb: {
    css: `.bd{animation:bd 6s steps(1,end) infinite}.bg{animation:bg .5s steps(1,end) infinite}.up{transform-box:fill-box;transform-origin:right top;animation:up 6s ease-in-out infinite}
@keyframes bd{0%,13%{opacity:0;transform:translateY(-12px)}18%{opacity:1;transform:translateY(-8px)}22%{transform:translateY(-4px)}26%,70%{opacity:1;transform:translateY(0)}76%{opacity:1;transform:translateY(-6px)}80%,100%{opacity:0;transform:translateY(-12px)}}
@keyframes bg{0%{opacity:.55}50%{opacity:1}}
@keyframes up{0%,10%{transform:none}16%,70%{transform:translateY(-4px)}80%,100%{transform:none}}`,
    inside: `<g class="bd"><g class="bg">${rect(13, -10, 6, 5, '#f5a524')}${rect(14, -5, 4, 1, '#8b9099')}${rect(10, -12, 2, 2, '#f5a524')}${rect(20, -12, 2, 2, '#f5a524')}${rect(15, -14, 2, 2, '#f5a524')}</g></g>`,
    above: '',
  },
  hop: {
    css: `.hp{animation:hp 1s ease-in-out infinite}.ds{animation:ds 1s steps(1,end) infinite}.sp{animation:sp 1s steps(1,end) infinite}
@keyframes hp{0%{transform:translateY(0)}25%{transform:translateY(-4px)}50%{transform:translateY(-6px)}75%{transform:translateY(-3px)}}
@keyframes ds{0%,70%{opacity:0}75%,95%{opacity:1}}@keyframes sp{0%{opacity:0}30%,70%{opacity:1}100%{opacity:0}}`,
    inside: `${rect(2, 22, 3, 1, SH, 'ds')}${rect(26, 22, 3, 1, SH, 'ds')}${rect(-4, 2, 2, 2, '#f5a524', 'sp')}${rect(34, 4, 2, 2, '#5aa9ff', 'sp')}${rect(30, -2, 2, 2, '#2fb36b', 'sp')}${rect(-2, -3, 2, 2, '#d63a3a', 'sp')}`,
    above: '',
  },
}

export const MASCOT_SVG = (mood: Mood, phase = 0): string => {
  const busy = mood !== 'idle'
  const profile = PROFILE.includes(mood)
  const bob = busy ? '0.5s' : '2.4s'
  const step = mood === 'walk' ? '0.25s' : busy ? '0.4s' : '1.6s'
  const legs = [rect(6, 18, 2, 4, C, 'p1'), rect(11, 18, 3, 4, C, 'p2'), rect(20, 18, 3, 4, C, 'p2'), rect(26, 18, 3, 4, C, 'p1')].join('')
  const eyeL = rect(9, 3, 3, 2, K, 'e')
  const eyeR = rect(23, 3, 3, 2, K, 'wk2')
  const body = profile
    ? `<g class="ra">${armR()}</g>${rect(24, 0, 5, 18, D)}${rect(6, 0, 23, 18, C, 'ff')}${armL('la')}` +
      `<g class="el">${eyeL}</g><g class="er">${eyeR}</g><g class="lg">${legs}</g>`
    : `${rect(6, 0, 23, 18, C)}${armL(mood === 'bulb' ? 'up' : '')}${armR()}` +
      `<g class="${mood === 'idle' ? 'look' : ''}">${eyeL}${eyeR}</g>${legs}`
  const props = PROPS[mood]

  return `<svg xmlns="http://www.w3.org/2000/svg" style="--t:${phase}s" viewBox="0 0 54 37" width="216" height="148" shape-rendering="crispEdges"><style>
*{animation-delay:calc(var(--t,0s) * -1)!important}
.b{animation:bob ${bob} steps(2,end) infinite}.p1{animation:step ${step} steps(1,end) infinite}.p2{animation:step ${step} steps(1,end) infinite reverse}
.e{animation:blink 3.6s steps(1,end) infinite;transform-box:fill-box;transform-origin:center}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-${busy ? 1 : 0}px)}}
@keyframes step{0%{transform:translateY(0)}50%{transform:translateY(-1px)}}
@keyframes blink{0%,92%,100%{transform:scaleY(1)}94%,98%{transform:scaleY(.5)}}
${WINKCSS}
${profile ? STORY : ''}
${props.css}
</style><g transform="translate(14,12)"><g class="${mood === 'hop' ? 'hp' : ''}"><g class="b">${body}${props.inside}</g></g></g>${props.above}</svg>`
}

// ---- helpers: a row of small companions, one per busy subagent ----

export type Companion = 'bot' | 'chick' | 'blob' | 'drone'

export const COMPANIONS: Companion[] = ['bot', 'chick', 'blob', 'drone']

/** Most companions in one row; the pane stacks more rows, so there is no overall limit. */
export const COMPANION_ROW = 4

const GREY = '#8b9099'
const SLATE = '#5b6270'
const CYAN_EYE = '#22d3ee'
const ALERT = '#d63a3a'
const YELLOW = '#f5c542'
const GOLD = '#e0a92a'
const BEAK = '#f08a24'
const LIME = '#2fb36b'
const IND = '#4f56d9'
const ROTOR = '#a5b4fc'

// Each sprite is 9 x 10 units and draws into its own group; inner groups carry the animation so the
// group's transform attribute (its place in the row) stays untouched.
const SPRITES: Record<Companion, string> = {
  bot:
    `${rect(4, 1, 1, 1, GREY)}${rect(4, 0, 1, 1, ALERT, 'tip')}${rect(1, 2, 7, 5, GREY)}` +
    `${rect(2, 3, 2, 2, CYAN_EYE)}${rect(5, 3, 2, 2, CYAN_EYE)}${rect(2, 7, 5, 2, SLATE)}` +
    `${rect(2, 9, 2, 1, SLATE, 'l1')}${rect(5, 9, 2, 1, SLATE, 'l2')}`,
  chick:
    `<g class="hop">${rect(2, 3, 6, 6, YELLOW)}${rect(3, 2, 3, 1, YELLOW)}${rect(8, 5, 1, 1, BEAK)}${rect(5, 4, 1, 1, K)}` +
    `${rect(3, 5, 3, 2, GOLD, 'wg')}${rect(3, 9, 1, 1, BEAK)}${rect(5, 9, 1, 1, BEAK)}</g>`,
  blob:
    `<g class="sq">${rect(3, 3, 3, 1, LIME)}${rect(2, 4, 5, 1, LIME)}${rect(1, 5, 7, 4, LIME)}` +
    `${rect(3, 5, 1, 2, K)}${rect(5, 5, 1, 2, K)}</g>`,
  drone:
    `${rect(2, 9, 5, 1, SH, 'sh')}<g class="hv">${rect(0, 2, 9, 1, ROTOR, 'rt')}${rect(4, 3, 1, 1, SLATE)}` +
    `${rect(2, 4, 5, 2, IND)}${rect(3, 6, 1, 1, SLATE)}${rect(5, 6, 1, 1, SLATE)}</g>`,
}

// Every duration divides 6 s, so the whole row repeats seamlessly each 6 s story.
const COMPANION_CSS = `*{animation-delay:calc(var(--t,0s) * -1)!important}
.row{animation:pace 6s ease-in-out infinite}
.row .cp:nth-child(2) *{animation-delay:calc(.25s - var(--t,0s))!important}
.row .cp:nth-child(3) *{animation-delay:calc(.5s - var(--t,0s))!important}
.row .cp:nth-child(4) *{animation-delay:calc(.75s - var(--t,0s))!important}
.tip{animation:tip 1.5s steps(1,end) infinite}.l1{animation:lg 1s steps(1,end) infinite}.l2{animation:lg 1s steps(1,end) infinite reverse}
.hop{animation:hop 1s ease-in-out infinite}.wg{transform-box:fill-box;transform-origin:bottom;animation:wg .5s steps(1,end) infinite}
.sq{transform-box:fill-box;transform-origin:bottom;animation:sq 1.5s ease-in-out infinite}
.hv{animation:hv 3s ease-in-out infinite}.rt{transform-box:fill-box;transform-origin:center;animation:rt .5s steps(1,end) infinite}.sh{animation:sh 3s ease-in-out infinite}
@keyframes pace{0%,100%{transform:translateX(-2px)}50%{transform:translateX(2px)}}
@keyframes tip{0%{opacity:1}50%{opacity:.2}}
@keyframes lg{0%{transform:translateY(0)}50%{transform:translateY(-1px)}}
@keyframes hop{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
@keyframes wg{0%{transform:scaleY(1)}50%{transform:scaleY(.5)}}
@keyframes sq{0%,100%{transform:scale(1.12,.88)}50%{transform:scale(.92,1.1)}}
@keyframes hv{0%,100%{transform:translateY(0)}50%{transform:translateY(-1px)}}
@keyframes rt{0%{transform:scaleX(1)}50%{transform:scaleX(.55)}}
@keyframes sh{0%,100%{opacity:.5}50%{opacity:1}}`

const SPRITE_W = 9
const SPRITE_GAP = 4

/** One row of up to COMPANION_ROW small helpers for `count` busy subagents; '' when there is none. */
export const COMPANIONS_SVG = (count: number, phase = 0): string => {
  const n = Math.max(0, Math.min(COMPANION_ROW, Math.floor(count)))
  if (n === 0) return ''
  const total = n * SPRITE_W + (n - 1) * SPRITE_GAP
  const x0 = (54 - total) / 2
  const row = Array.from({ length: n }, (_, i) => {
    const kind = COMPANIONS[i % COMPANIONS.length] ?? 'bot'

    return `<g class="cp cp-${kind}" transform="translate(${x0 + i * (SPRITE_W + SPRITE_GAP)},1)">${SPRITES[kind]}</g>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" style="--t:${phase}s" viewBox="0 0 54 12" width="216" height="48" shape-rendering="crispEdges"><style>
${COMPANION_CSS}
</style><g class="row">${row}</g></svg>`
}
