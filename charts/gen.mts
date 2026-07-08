// Reconstructed generator for the aube FS-compression charts (jdalton/aube).
// The prior ad-hoc source was lost; this rebuilds the two benchmark charts in
// the zpm/napi-rs gen style (GitHub-dark, hand-rolled SVG, inline-code pills,
// green = win) from the numbers transcribed off the pr-assets PNGs, with the
// footer-overflow defect fixed: frame height leaves even bottom breathing room
// and the Reproduce code pill sits fully inside a line, never wrapping past the
// card's rounded border.
//   node aube-gen.mts   # writes fs-compress-rspack-vite.svg + fs-compress-addon-load-perf.svg here
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

const C = {
  bg: '#0d1117',
  border: '#30363d',
  ink: '#e6edf3',
  muted: '#8b949e',
  faint: '#6e7681',
  grid: '#21262d',
  gray: '#57606a',
  blue: '#2f6bff',
  green: '#3fb950',
  code: '#79c0ff',
  codeBg: '#1f2733',
  white: '#ffffff',
}
const MONO = "ui-monospace, 'SF Mono', Menlo, 'DejaVu Sans Mono', monospace"
const SANS = "-apple-system, 'Helvetica Neue', Arial, 'DejaVu Sans', sans-serif"

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function text(x, y, s, o = {}) {
  const { size = 15, fill = C.muted, weight = 'normal', font = SANS, anchor = 'start' } = o
  return `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`
}

function rect(x, y, w, h, fill, rx = 4) {
  return `<rect x="${x}" y="${y}" width="${Math.max(0, w)}" height="${h}" rx="${rx}" fill="${fill}"/>`
}

// Advance width of a plain-text run. A flat per-glyph estimate matches DejaVu's
// footer/subtitle layout well; group headers add their own explicit spacing so
// the bold name never touches the following em-dash.
function runAdvance(t, size, bold) {
  return t.length * size * (bold ? 0.545 : 0.505)
}

// A prose line mixing normal runs with pill-style inline-code tokens.
// Advance widths: mono ~0.6em, sans ~0.505em, bold sans ~0.545em.
// Slightly generous so runs never overlap the next token.
function rich(x, y, parts, size, fill, weight = 'normal') {
  let cx = x
  const out = []
  for (const p of parts) {
    if (p.code) {
      const tw = p.t.length * size * 0.6
      const w = tw + size * 0.6
      out.push(`<rect x="${cx.toFixed(1)}" y="${(y - size + 1).toFixed(1)}" width="${w.toFixed(1)}" height="${(size + 6).toFixed(1)}" rx="4" fill="${C.codeBg}"/>`)
      out.push(`<text x="${(cx + size * 0.3).toFixed(1)}" y="${y}" font-family="${MONO}" font-size="${size}" fill="${C.code}">${esc(p.t)}</text>`)
      cx += w + size * 0.18
    } else {
      out.push(`<text x="${cx.toFixed(1)}" y="${y}" xml:space="preserve" font-family="${SANS}" font-size="${size}" font-weight="${p.b ? 'bold' : weight}" fill="${p.b ? C.ink : fill}">${esc(p.t)}</text>`)
      cx += runAdvance(p.t, size, p.b)
    }
  }
  return out.join('')
}

// Mirror rich()'s advance math so swatches/legend items can be placed exactly.
function measureRich(parts, size) {
  let w = 0
  for (const p of parts) {
    if (p.code) {
      w += p.t.length * size * 0.6 + size * 0.6 + size * 0.18
    } else {
      w += runAdvance(p.t, size, p.b)
    }
  }
  return w
}

function frame(w, h, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="20" fill="${C.bg}" stroke="${C.border}" stroke-width="2"/>
${inner}
</svg>`
}

const W = 1216
const PAD = 52

// ── chart 1: store on disk (grouped MB bars) ─────────────────────────────────
function storeChart() {
  const out = []
  const grid = []

  out.push(text(PAD, 74, 'aube store on disk — transparent APFS compression of the CAS', { size: 30, fill: C.ink, weight: 'bold' }))

  const sub = [
    [{ t: 'Same bytes, same content hashes, same load speed', b: 1 }, { t: ' — ' }, { t: 'AUBE_COMPRESS_STORE', code: 1 }, { t: ' writes the content-addressed store APFS-compressed,' }],
    [{ t: 'and every project shares that one compressed copy. darwin-arm64, APFS, @rspack/core + vite at latest.' }],
  ]
  let sy = 112
  for (const l of sub) {
    out.push(rich(PAD, sy, l, 16.5, C.muted))
    sy += 26
  }

  const legY = 196
  const legend = [
    { sw: C.gray, parts: [{ t: 'compression off' }] },
    { sw: C.blue, parts: [{ t: 'default gate (' }, { t: '=1', code: 1 }, { t: ',' }, { t: '**/*.node', code: 1 }, { t: ')' }] },
    { sw: C.green, parts: [{ t: 'whole store (' }, { t: 'glob:**/*', code: 1 }, { t: ')' }] },
  ]
  let lx = PAD
  for (const it of legend) {
    out.push(rect(lx, legY - 13, 16, 16, it.sw, 3))
    out.push(rich(lx + 24, legY, it.parts, 16.5, C.muted))
    lx += 24 + measureRich(it.parts, 16.5) + 44
  }

  const groups = [
    {
      head: [{ t: '@rspack/core', b: 1 }, { t: '   — 52.9 MB store, the 40 MB @rspack/binding addon dominates' }],
      bars: [
        { c: C.gray, v: 52.9, label: '52.9 MB' },
        { c: C.blue, v: 31.0, label: '31.0 MB', delta: '−21.9 MB', pct: '−42%' },
        { c: C.green, v: 22.2, label: '22.2 MB', delta: '−30.7 MB', pct: '−59%' },
      ],
    },
    {
      head: [{ t: 'vite', b: 1 }, { t: '   — 38.9 MB store, one rolldown + one lightningcss addon' }],
      bars: [
        { c: C.gray, v: 38.9, label: '38.9 MB' },
        { c: C.blue, v: 25.6, label: '25.6 MB', delta: '−13.3 MB', pct: '−35%' },
        { c: C.green, v: 15.1, label: '15.1 MB', delta: '−23.8 MB', pct: '−62%' },
      ],
    },
  ]
  const bx = PAD
  const axisMax = 55
  const bw = 900
  const sc = bw / axisMax
  const rowH = 40
  let y = 244
  let firstTop = 0
  for (const g of groups) {
    out.push(rich(PAD, y, g.head, 17.5, C.muted))
    y += 20
    for (const b of g.bars) {
      if (!firstTop) firstTop = y
      const w = b.v * sc
      out.push(rect(bx, y, w, rowH, b.c, 6))
      out.push(text(bx + w - 14, y + rowH * 0.66, b.label, { size: 17, fill: C.white, weight: 'bold', font: MONO, anchor: 'end' }))
      if (b.delta) {
        const nx = bx + w + 16
        out.push(text(nx, y + rowH * 0.66, b.delta, { size: 17, fill: C.ink, weight: 'bold', font: MONO }))
        out.push(text(nx + b.delta.length * 10.3 + 16, y + rowH * 0.66, b.pct, { size: 17, fill: C.green, weight: 'bold', font: MONO }))
      }
      y += rowH + 8
    }
    y += 26
  }
  const barsBottom = y - 26 - 8

  const axisY = barsBottom + 10
  for (let t = 0; t <= 50; t += 10) {
    const gx = bx + t * sc
    grid.push(`<line x1="${gx}" y1="${firstTop - 2}" x2="${gx}" y2="${axisY}" stroke="${C.grid}" stroke-width="1"/>`)
    grid.push(text(gx, axisY + 24, t === 0 ? '0' : `${t} MB`, { size: 14, fill: C.faint, anchor: 'middle' }))
  }

  const ruleY = axisY + 46
  out.push(`<line x1="${PAD}" y1="${ruleY}" x2="${W - PAD}" y2="${ruleY}" stroke="${C.grid}" stroke-width="1"/>`)
  const foot = [
    [{ t: 'First load is faster compressed, not slower', b: 1 }, { t: ' — fewer bytes to read from disk beats the decompress cost:' }],
    [{ t: '@rspack/binding ' }, { t: '441 vs 656 ms', b: 1 }, { t: ', rolldown ' }, { t: '246 vs 346 ms', b: 1 }, { t: ' on a freshly-cloned copy. Steady-state (warm inode) is parity (~5 ms).' }],
    [{ t: 'The addons compress hardest — rspack binding ' }, { t: '40.4 → 18.5 MB (−55%)', b: 1 }, { t: '. Logical size and content hash are unchanged;' }],
    [{ t: 'the kernel decompresses on read. Reproduce: ' }, { t: 'node benchmarks/fs-compress-size.mjs', code: 1 }],
  ]
  let fy = ruleY + 30
  for (const l of foot) {
    out.push(rich(PAD, fy, l, 15.5, C.muted))
    fy += 25
  }
  const H = Math.round(fy - 25 + 34)
  return frame(W, H, grid.join('\n') + '\n' + out.join('\n'))
}

// ── chart 2: native addon load time (first vs second load) ───────────────────
function loadChart() {
  const out = []
  const grid = []

  out.push(text(PAD, 74, 'aube store — native addon load time, compressed vs not', { size: 30, fill: C.ink, weight: 'bold' }))

  const sub = [
    [{ t: 'First load of a freshly-cloned addon is faster compressed, not slower', b: 1 }, { t: ' — fewer bytes to read from disk beats the decompress cost.' }],
    [{ t: 'Once the inode is warm, the two are the same. darwin-arm64, APFS; lower is better.' }],
  ]
  let sy = 112
  for (const l of sub) {
    out.push(rich(PAD, sy, l, 16.5, C.muted))
    sy += 26
  }

  const legY = 196
  const legend = [
    { sw: C.gray, t: 'uncompressed' },
    { sw: C.green, t: 'compressed (APFS)' },
  ]
  let lx = PAD
  for (const it of legend) {
    out.push(rect(lx, legY - 13, 16, 16, it.sw, 3))
    out.push(text(lx + 24, legY, it.t, { size: 16.5, fill: C.muted }))
    lx += 24 + it.t.length * 16.5 * 0.505 + 44
  }

  const bx = 248
  const axisMax = 900
  const bw = 812
  const sc = bw / axisMax
  const ticks = [0, 200, 400, 600, 800]

  let y = 244
  out.push(rich(PAD, y, [{ t: 'First load', b: 1 }, { t: ' — fresh clone, cold require() in a new process (median)' }], 17.5, C.muted))
  y += 22
  const firstTop = y
  const rowH = 38
  const first = [
    { pkg: '@rspack/binding', g: 656, comp: 441, pct: '33% faster' },
    { pkg: 'rolldown', g: 346, comp: 246, pct: '29% faster' },
  ]
  for (const r of first) {
    out.push(text(PAD, y + rowH * 0.66, r.pkg, { size: 16, fill: C.ink, font: MONO }))
    let w = r.g * sc
    out.push(rect(bx, y, w, rowH, C.gray, 6))
    out.push(text(bx + w - 14, y + rowH * 0.66, `${r.g} ms`, { size: 16, fill: C.white, weight: 'bold', font: MONO, anchor: 'end' }))
    y += rowH + 6
    w = r.comp * sc
    out.push(rect(bx, y, w, rowH, C.green, 6))
    out.push(text(bx + w - 14, y + rowH * 0.66, `${r.comp} ms`, { size: 16, fill: C.white, weight: 'bold', font: MONO, anchor: 'end' }))
    out.push(text(bx + w + 16, y + rowH * 0.66, r.pct, { size: 16, fill: C.green, weight: 'bold' }))
    y += rowH + 20
  }

  y += 14
  out.push(rich(PAD, y, [{ t: 'Second load', b: 1 }, { t: ' — same inode, warm cache (median); same scale as the first load, so the warm load is the sliver on the left' }], 17.5, C.muted))
  y += 22
  const sRowH = 30
  const second = [
    { pkg: '@rspack/binding', g: 5, comp: 5, gnote: '5 ms', cnote: '5 ms · parity' },
    { pkg: 'rolldown', g: 4, comp: 4, gnote: '4 ms', cnote: '4 ms · parity' },
  ]
  for (const r of second) {
    out.push(text(PAD, y + sRowH * 0.7, r.pkg, { size: 16, fill: C.ink, font: MONO }))
    let w = Math.max(r.g * sc, 5)
    out.push(rect(bx, y, w, sRowH, C.gray, 3))
    out.push(text(bx + w + 14, y + sRowH * 0.7, r.gnote, { size: 15, fill: C.muted, weight: 'bold' }))
    y += sRowH + 6
    w = Math.max(r.comp * sc, 5)
    out.push(rect(bx, y, w, sRowH, C.green, 3))
    out.push(text(bx + w + 14, y + sRowH * 0.7, r.cnote, { size: 15, fill: C.muted, weight: 'bold' }))
    y += sRowH + 20
  }
  const barsBottom = y - 20

  const axisY = barsBottom + 10
  for (const t of ticks) {
    const gx = bx + t * sc
    grid.push(`<line x1="${gx}" y1="${firstTop - 2}" x2="${gx}" y2="${axisY}" stroke="${C.grid}" stroke-width="1"/>`)
    grid.push(text(gx, axisY + 24, t === 0 ? '0' : `${t} ms`, { size: 14, fill: C.faint, anchor: 'middle' }))
  }

  const ruleY = axisY + 46
  out.push(`<line x1="${PAD}" y1="${ruleY}" x2="${W - PAD}" y2="${ruleY}" stroke="${C.grid}" stroke-width="1"/>`)
  const foot = [
    [{ t: 'Once the inode is cached the decompress cost disappears, so a compressed addon loads exactly as fast as an uncompressed one' }],
    [{ t: 'on every load after the first. First load is a fresh clonefile per sample, so every variant pays the OS’s freshly-created-binary' }],
    [{ t: 'cost (on macOS, code-signature validation); second load reuses the warm inode. Reproduce: ' }, { t: 'node benchmarks/fs-compress-size.mjs', code: 1 }],
  ]
  let fy = ruleY + 30
  for (const l of foot) {
    out.push(rich(PAD, fy, l, 15.5, C.muted))
    fy += 25
  }
  const H = Math.round(fy - 25 + 34)
  return frame(W, H, grid.join('\n') + '\n' + out.join('\n'))
}

writeFileSync(join(here, 'fs-compress-rspack-vite.svg'), storeChart())
writeFileSync(join(here, 'fs-compress-addon-load-perf.svg'), loadChart())
