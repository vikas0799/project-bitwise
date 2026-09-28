// Small SVG drawing helpers shared by the DSA note diagrams. No dependencies.

export const C = {
  ink: '#0A1633',
  text: '#334155',
  muted: '#64748B',
  faint: '#94A3B8',
  line: '#CBD5E1',
  grid: '#E2E8F0',
  panel: '#F8FAFC',
  brand: '#0052CC',
  brandSoft: '#E8F0FF',
  green: '#059669',
  greenSoft: '#D1FAE5',
  amber: '#D97706',
  amberSoft: '#FEF3C7',
  red: '#E11D48',
  redSoft: '#FFE4E6',
  violet: '#7C3AED',
  violetSoft: '#EDE9FE',
  teal: '#0891B2',
};

// Fill, border and text colour for each highlight state.
export const TONES = {
  plain: { fill: '#FFFFFF', stroke: '#94A3B8', text: C.ink },
  brand: { fill: C.brandSoft, stroke: C.brand, text: '#003A91' },
  active: { fill: C.amberSoft, stroke: C.amber, text: '#92400E' },
  good: { fill: C.greenSoft, stroke: C.green, text: '#065F46' },
  bad: { fill: C.redSoft, stroke: C.red, text: '#9F1239' },
  muted: { fill: '#F1F5F9', stroke: '#CBD5E1', text: '#94A3B8' },
  special: { fill: C.violetSoft, stroke: C.violet, text: '#5B21B6' },
  empty: { fill: '#FFFFFF', stroke: '#CBD5E1', text: C.faint, dash: '4 4' },
};

// Line colour for each tone, also used to pick the matching arrowhead.
export const INK = {
  plain: C.muted,
  muted: C.faint,
  brand: C.brand,
  active: C.amber,
  good: C.green,
  bad: C.red,
  special: C.violet,
  ink: C.ink,
};

const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

export const esc = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const n = (value) => Math.round(value * 10) / 10;

export function svg(width, height, title, body) {
  const markers = Object.entries(INK)
    .map(
      ([tone, color]) =>
        `<marker id="arrow-${tone}" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${color}"/></marker>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}" font-family="${SANS}">
<title>${esc(title)}</title>
<defs>${markers}</defs>
<rect width="${width}" height="${height}" fill="#FFFFFF"/>
${body}
</svg>
`;
}

export function text(x, y, value, o = {}) {
  const { size = 15, weight = 500, fill = C.ink, anchor = 'middle', mono = false, italic = false, rotate } = o;
  const transform = rotate ? ` transform="rotate(${rotate} ${n(x)} ${n(y)})"` : '';
  return `<text x="${n(x)}" y="${n(y)}" dy="0.35em" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${
    mono ? ` font-family="${MONO}"` : ''
  }${italic ? ' font-style="italic"' : ''}${transform}>${esc(value)}</text>`;
}

// Several text runs on one line, each with its own colour and weight.
export function spans(x, y, parts, o = {}) {
  const { size = 15, anchor = 'start', mono = false } = o;
  const inner = parts
    .map(([value, fill = C.text, weight = 500]) => `<tspan fill="${fill}" font-weight="${weight}">${esc(value)}</tspan>`)
    .join('');
  return `<text x="${n(x)}" y="${n(y)}" dy="0.35em" font-size="${size}" text-anchor="${anchor}"${
    mono ? ` font-family="${MONO}"` : ''
  }>${inner}</text>`;
}

// Monospace code line; leading spaces become non-breaking so indentation survives.
export const code = (x, y, value, o = {}) =>
  text(x, y, value.replace(/^ +/, (m) => '\u00a0'.repeat(m.length)), { size: 14, mono: true, anchor: 'start', ...o });

export const heading = (x, y, value) => text(x, y, value, { size: 17, weight: 700, anchor: 'start' });
export const note = (x, y, value, o = {}) => text(x, y, value, { size: 14, fill: C.muted, anchor: 'start', ...o });

export function rect(x, y, w, h, o = {}) {
  const { fill = '#FFFFFF', stroke = C.faint, sw = 1.5, rx = 8, dash } = o;
  return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${
    dash ? ` stroke-dasharray="${dash}"` : ''
  }/>`;
}

export function line(x1, y1, x2, y2, o = {}) {
  const { tone = 'plain', color, sw = 2, dash, arrow = false, arrowStart = false } = o;
  const stroke = color || INK[tone];
  return `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"${
    dash ? ` stroke-dasharray="${dash}"` : ''
  }${arrow ? ` marker-end="url(#arrow-${tone})"` : ''}${arrowStart ? ` marker-start="url(#arrow-${tone})"` : ''}/>`;
}

export function path(d, o = {}) {
  const { tone = 'plain', color, sw = 2, dash, arrow = false, arrowStart = false, fill = 'none' } = o;
  const stroke = color || INK[tone];
  return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"${
    dash ? ` stroke-dasharray="${dash}"` : ''
  }${arrow ? ` marker-end="url(#arrow-${tone})"` : ''}${arrowStart ? ` marker-start="url(#arrow-${tone})"` : ''}/>`;
}

export function circle(cx, cy, r, o = {}) {
  const { fill = '#FFFFFF', stroke = C.faint, sw = 1.5, dash } = o;
  return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${
    dash ? ` stroke-dasharray="${dash}"` : ''
  }/>`;
}

// A text label on a white pill so it stays readable on top of lines.
export function tag(x, y, value, o = {}) {
  const { size = 13, fill = C.text, weight = 600, bg = '#FFFFFF', border } = o;
  const w = String(value).length * size * 0.56 + 12;
  const h = size + 8;
  return (
    rect(x - w / 2, y - h / 2, w, h, { fill: bg, stroke: border || bg, sw: border ? 1 : 0, rx: h / 2 }) +
    text(x, y, value, { size, fill, weight })
  );
}

// A small round badge, used for visit order, indices and counts.
export function badge(x, y, value, o = {}) {
  const { tone = 'brand', r = 11, size = 12 } = o;
  const color = INK[tone];
  return circle(x, y, r, { fill: color, stroke: '#FFFFFF', sw: 2 }) + text(x, y, value, { size, weight: 700, fill: '#FFFFFF' });
}

export function legend(x, y, items, o = {}) {
  const { gap = 22, size = 13 } = o;
  let out = '';
  let cx = x;
  for (const [tone, label] of items) {
    const t = TONES[tone];
    out += rect(cx, y - 8, 16, 16, { fill: t.fill, stroke: t.stroke, rx: 4, dash: t.dash });
    out += text(cx + 22, y, label, { size, fill: C.text, anchor: 'start' });
    cx += 22 + label.length * size * 0.55 + gap;
  }
  return out;
}

// ---------- Arrays ----------

export const cellX = (x, i, w = 52, gap = 0) => x + i * (w + gap);
export const cellMid = (x, i, w = 52, gap = 0) => x + i * (w + gap) + w / 2;

export function cells(x, y, values, o = {}) {
  const { w = 52, h = 52, gap = 0, tones = {}, indices = true, indexFrom = 0, size = 18, mono = true, rx = 6, weight = 600 } = o;
  let out = '';
  values.forEach((value, i) => {
    const t = TONES[tones[i] || 'plain'];
    const cx = cellX(x, i, w, gap);
    out += rect(cx, y, w, h, { fill: t.fill, stroke: t.stroke, rx, dash: t.dash });
    if (value !== null && value !== undefined && value !== '') {
      out += text(cx + w / 2, y + h / 2, value, { size, weight, fill: t.text, mono });
    }
    if (indices) out += text(cx + w / 2, y + h + 14, i + indexFrom, { size: 12, fill: C.faint, mono: true });
  });
  return out;
}

// Arrow pointing up at a cell from a label underneath (or down from above).
export function pointer(cx, y, label, o = {}) {
  const { tone = 'brand', length = 20, above = false, size = 13 } = o;
  const color = INK[tone];
  if (above) {
    return (
      line(cx, y - length, cx, y - 3, { tone, sw: 2, arrow: true }) +
      text(cx, y - length - 11, label, { size, weight: 700, fill: color })
    );
  }
  return (
    line(cx, y + length, cx, y + 3, { tone, sw: 2, arrow: true }) +
    text(cx, y + length + 11, label, { size, weight: 700, fill: color })
  );
}

// Square bracket under (or over) a range of cells with a label.
export function bracket(x1, x2, y, label, o = {}) {
  const { tone = 'brand', above = false, size = 13 } = o;
  const color = INK[tone];
  const d = above ? -8 : 8;
  return (
    path(`M${n(x1)} ${n(y)} L${n(x1)} ${n(y + d)} L${n(x2)} ${n(y + d)} L${n(x2)} ${n(y)}`, { color, sw: 1.75 }) +
    text((x1 + x2) / 2, y + d + (above ? -12 : 13), label, { size, weight: 600, fill: color })
  );
}

// ---------- Nodes and edges ----------

// Distance from a node's centre to its border along direction (ux, uy).
function reach(node, ux, uy) {
  if (node.r) return node.r;
  const hw = node.w / 2;
  const hh = node.h / 2;
  const tx = Math.abs(ux) > 1e-6 ? hw / Math.abs(ux) : Infinity;
  const ty = Math.abs(uy) > 1e-6 ? hh / Math.abs(uy) : Infinity;
  return Math.min(tx, ty);
}

export function drawNode(node) {
  const t = TONES[node.tone || 'plain'];
  const sw = node.sw || (node.tone && node.tone !== 'plain' && node.tone !== 'muted' ? 2.25 : 1.75);
  const size = node.size || 16;
  let out;
  if (node.r) {
    out = circle(node.x, node.y, node.r, { fill: t.fill, stroke: t.stroke, sw, dash: t.dash });
  } else {
    out = rect(node.x - node.w / 2, node.y - node.h / 2, node.w, node.h, {
      fill: t.fill,
      stroke: t.stroke,
      sw,
      rx: node.rx ?? Math.min(12, node.h / 2),
      dash: t.dash,
    });
  }
  if (node.label !== undefined && node.label !== null) {
    out += text(node.x, node.y, node.label, { size, weight: node.weight || 650, fill: t.text, mono: node.mono });
  }
  return out;
}

export function connect(a, b, o = {}) {
  const { tone = 'plain', color, sw = 2, dash, directed = false, bend = 0, label, labelTone, labelSize = 13, labelShift = 0 } = o;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const gapA = reach(a, ux, uy);
  const gapB = reach(b, -ux, -uy) + (directed ? 3 : 0);
  let out;
  let lx;
  let ly;
  if (!bend) {
    const x1 = a.x + ux * gapA;
    const y1 = a.y + uy * gapA;
    const x2 = b.x - ux * gapB;
    const y2 = b.y - uy * gapB;
    out = line(x1, y1, x2, y2, { tone, color, sw, dash, arrow: directed });
    lx = (x1 + x2) / 2 - uy * labelShift;
    ly = (y1 + y2) / 2 + ux * labelShift;
  } else {
    // Quadratic curve bent to the left of a→b by `bend` pixels.
    const mx = (a.x + b.x) / 2 - uy * bend;
    const my = (a.y + b.y) / 2 + ux * bend;
    const sx = mx - a.x;
    const sy = my - a.y;
    const sl = Math.hypot(sx, sy);
    const ex = b.x - mx;
    const ey = b.y - my;
    const el = Math.hypot(ex, ey);
    const x1 = a.x + (sx / sl) * reach(a, sx / sl, sy / sl);
    const y1 = a.y + (sy / sl) * reach(a, sx / sl, sy / sl);
    const x2 = b.x - (ex / el) * (reach(b, -ex / el, -ey / el) + (directed ? 3 : 0));
    const y2 = b.y - (ey / el) * (reach(b, -ex / el, -ey / el) + (directed ? 3 : 0));
    out = path(`M${n(x1)} ${n(y1)} Q${n(mx)} ${n(my)} ${n(x2)} ${n(y2)}`, { tone, color, sw, dash, arrow: directed });
    lx = (x1 + 2 * mx + x2) / 4;
    ly = (y1 + 2 * my + y2) / 4;
  }
  if (label !== undefined) {
    out += tag(lx, ly, label, { size: labelSize, fill: INK[labelTone || tone] === C.faint ? C.muted : INK[labelTone || tone] });
  }
  return out;
}

// Position nodes stored in heap order (children of i at 2i+1 and 2i+2).
// Missing nodes are null. Each level is spread evenly across `width`.
export function heapLayout(values, { x, y, width, gap }) {
  const nodes = [];
  values.forEach((value, i) => {
    if (value === null || value === undefined) return;
    const depth = Math.floor(Math.log2(i + 1));
    const slot = i - (2 ** depth - 1);
    const count = 2 ** depth;
    nodes.push({ i, value, depth, x: x + (slot + 0.5) * (width / count), y: y + depth * gap });
  });
  return nodes;
}

// Binary tree from a heap-order array. `tones`, `edgeTones`, `labels` and
// `edgeLabels` are keyed by heap index (an edge is keyed by its child).
export function tree(values, o = {}) {
  const {
    x = 0,
    y = 60,
    width = 600,
    gap = 80,
    r = 22,
    box,
    size = 16,
    mono = false,
    tones = {},
    edgeTones = {},
    edgeWidth = {},
    edgeLabels = {},
    labels = {},
    defaultTone = 'plain',
  } = o;
  const placed = heapLayout(values, { x, y, width, gap }).map((p) => ({
    ...p,
    label: labels[p.i] ?? p.value,
    tone: tones[p.i] || defaultTone,
    size,
    mono,
    ...(box ? { w: box[0], h: box[1] } : { r }),
  }));
  const byIndex = new Map(placed.map((p) => [p.i, p]));
  let edges = '';
  for (const child of placed) {
    if (child.i === 0) continue;
    const parent = byIndex.get(Math.floor((child.i - 1) / 2));
    if (!parent) continue;
    const tone = edgeTones[child.i] || 'plain';
    edges += connect(parent, child, {
      tone,
      sw: edgeWidth[child.i] || (edgeTones[child.i] ? 3 : 2),
      label: edgeLabels[child.i],
      labelSize: 12,
    });
  }
  return { svg: edges + placed.map(drawNode).join(''), nodes: byIndex };
}

// Axis-aligned table, e.g. for DP. `rows` is an array of arrays of values.
export function table(x, y, rows, o = {}) {
  const { w = 44, h = 38, tones = {}, size = 15, mono = true, weights = {} } = o;
  let out = '';
  rows.forEach((row, r) => {
    row.forEach((value, c) => {
      const key = `${r},${c}`;
      const t = TONES[tones[key] || 'plain'];
      out += rect(x + c * w, y + r * h, w, h, { fill: t.fill, stroke: t.stroke === TONES.plain.stroke ? C.line : t.stroke, rx: 0, sw: 1 });
      if (value !== null && value !== undefined && value !== '') {
        out += text(x + c * w + w / 2, y + r * h + h / 2, value, { size, mono, weight: weights[key] || 600, fill: t.text });
      }
    });
  });
  return out;
}
