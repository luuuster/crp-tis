// tools/measure.mjs — medição PARAMETRIZADA do DOM renderizado (a fonte da fidelidade Figma↔web).
//
// Substitui os dezenas de scripts measure-*.mjs descartáveis: um comando, qualquer alvo.
//
//   node tools/measure.mjs <url> <seletor> [<seletor> ...] [--viewport 1440x1200] [--all]
//
// Ex.: node tools/measure.mjs http://localhost:5173 "button[data-slot=button]" ".pagination button" --all
//
// Para cada elemento casado imprime: rect (x/y/w/h), padding, border, radius, gap, fonte
// (size/weight/lineHeight), cores RESOLVIDAS em hex+rgb01 (color, backgroundColor, borderColor)
// — OKLCH é resolvido via canvas, pronto para colar no Figma (0–1).
// Por padrão mede o 1º elemento de cada seletor; --all mede todos (máx. 40 por seletor).

import pw from '../app/node_modules/playwright/index.js'
const { chromium } = pw

const args = process.argv.slice(2)
const url = args[0]
if (!url || !url.startsWith('http')) {
  console.error('uso: node tools/measure.mjs <url> <seletor> [...] [--viewport WxH] [--all]')
  process.exit(1)
}
const vpArg = args.find((a, i) => args[i - 1] === '--viewport')
const [vw, vh] = (vpArg || '1440x1200').split('x').map(Number)
const ALL = args.includes('--all')
const selectors = args.slice(1).filter((a, i, arr) => !a.startsWith('--') && arr[i - 1] !== '--viewport')

const browser = await chromium.launch({ channel: 'msedge' }).catch(() => chromium.launch())
const page = await browser.newPage({ viewport: { width: vw, height: vh } })
await page.goto(url, { waitUntil: 'networkidle' })

const out = await page.evaluate(({ selectors, ALL }) => {
  // resolve QUALQUER cor CSS (inclusive oklch) para rgba 0-255 via canvas
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const cx = cv.getContext('2d', { willReadFrequently: true })
  const rgb = (css) => {
    if (!css || css === 'none') return null
    cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = css
    cx.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = cx.getImageData(0, 0, 1, 1).data
    const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
    return { hex, a: +(a / 255).toFixed(3), rgb01: [r, g, b].map((v) => +(v / 255).toFixed(4)) }
  }
  const results = []
  for (const sel of selectors) {
    const els = [...document.querySelectorAll(sel)].slice(0, ALL ? 40 : 1)
    if (!els.length) { results.push({ sel, error: 'nenhum elemento casou' }); continue }
    for (const el of els) {
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      results.push({
        sel,
        text: (el.textContent || '').trim().slice(0, 30),
        rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
        padding: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].join(' '),
        border: s.borderWidth + ' ' + s.borderStyle,
        radius: s.borderRadius,
        gap: s.gap,
        font: `${s.fontSize} / ${s.fontWeight} / lh ${s.lineHeight}`,
        color: rgb(s.color),
        backgroundColor: rgb(s.backgroundColor),
        borderColor: s.borderStyle !== 'none' ? rgb(s.borderTopColor) : null,
        display: s.display, minHeight: s.minHeight,
      })
    }
  }
  return results
}, { selectors, ALL })

console.log(JSON.stringify(out, null, 2))
await browser.close()
