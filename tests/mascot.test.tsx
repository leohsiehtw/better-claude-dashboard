import { expect, test } from 'claude-code/testing'

import { COMPANIONS, COMPANIONS_SVG, MASCOT_SVG, MOODS, moodFor, spin } from '../hooks/mascot'

test('idle stays idle and busy rotates through every mood', async () => {
  expect(moodFor(123_456, false)).toBe('idle')
  expect(new Set(MOODS.map((_, i) => moodFor(i * 12000, true))).size).toBe(MOODS.length)
})

test('every mood is a well-formed SVG under the size limit', async () => {
  for (const mood of ['idle', ...MOODS] as const) {
    const svg = MASCOT_SVG(mood)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.endsWith('</svg>')).toBe(true)
    expect(svg.length).toBeLessThan(131_072)
  }
})

test('the spinner cycles through ten frames', async () => {
  expect(new Set(Array.from({ length: 10 }, (_, i) => spin(i * 1000))).size).toBe(10)
})

test('the helper row is empty for none and holds at most four, each a valid SVG', async () => {
  expect(COMPANIONS_SVG(0)).toBe('')
  expect(new Set(COMPANIONS).size).toBe(4)
  for (let n = 1; n <= 6; n++) {
    const svg = COMPANIONS_SVG(n, 2)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.endsWith('</svg>')).toBe(true)
    expect(svg.length).toBeLessThan(131_072)
    expect(svg.split('class="cp ').length - 1).toBe(Math.min(n, 4))
  }
})
