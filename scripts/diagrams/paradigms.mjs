// Diagrams for the problem-solving paradigm notes: greedy algorithms,
// dynamic programming and backtracking. DP tables are computed, not typed.
import { C, TONES, cellMid, cells, circle, heading, legend, line, note, path, rect, spans, table, tag, text, tree } from './svg.mjs';

export const paradigms = [];
const add = (name, width, height, title, body) => paradigms.push({ name, width, height, title, body });

// Horizontal time axis with ticks every `step` units.
function axis(x0, unit, from, to, y, step, format = (v) => v) {
  let out = line(x0, y, x0 + (to - from) * unit, y, { color: C.muted, sw: 1.5 });
  for (let v = from; v <= to; v += step) {
    const x = x0 + (v - from) * unit;
    out += line(x, y, x, y + 6, { color: C.muted, sw: 1.5 });
    out += text(x, y + 18, format(v), { size: 12, mono: true, fill: C.muted });
  }
  return out;
}

function bar(x, y, w, h, tone) {
  const t = TONES[tone];
  return rect(x, y, w, h, { fill: t.fill, stroke: t.stroke, rx: 6, sw: 1.75 });
}

// ---------- Greedy ----------
{
  const W = 820;
  const H = 480;
  const acts = [
    ['A', 1, 4],
    ['B', 3, 5],
    ['C', 0, 6],
    ['D', 5, 7],
    ['E', 3, 9],
    ['F', 5, 9],
    ['G', 6, 10],
    ['H', 8, 11],
    ['I', 8, 12],
    ['J', 2, 14],
    ['K', 12, 16],
  ];
  const picked = new Set();
  let end = -Infinity;
  for (const [id, s, e] of acts) {
    if (s >= end) {
      picked.add(id);
      end = e;
    }
  }
  const x0 = 150;
  const unit = 40;
  let b = heading(32, 32, 'Activity selection: always take the meeting that ends first');
  acts.forEach(([id, s, e], k) => {
    const y = 64 + k * 30;
    const chosen = picked.has(id);
    b += text(32, y + 11, `${id}  ${s}–${e}`, { size: 13, mono: true, anchor: 'start', fill: chosen ? C.green : C.muted, weight: chosen ? 700 : 500 });
    b += bar(x0 + s * unit, y, (e - s) * unit, 22, chosen ? 'good' : 'muted');
  });
  b += axis(x0, unit, 0, 16, 404, 2);
  b += spans(32, 454, [
    ['Picked ', C.text],
    [[...picked].join(', '), C.green, 700],
    [': sort by end time, then keep every meeting that starts after the last one ends.', C.text],
  ]);
  add('greedy-activity-selection', W, H, 'Eleven meetings on a timeline with the four chosen by earliest finish time highlighted', b);
}

{
  const W = 780;
  const H = 300;
  const x0 = 80;
  const unit = 36;
  const input = [
    [1, 3, 0],
    [2, 6, 1],
    [8, 10, 0],
    [9, 12, 1],
    [15, 18, 0],
  ];
  const merged = [
    [1, 6],
    [8, 12],
    [15, 18],
  ];
  let b = heading(32, 32, 'Merge overlapping intervals');
  b += text(32, 96, 'input', { size: 14, weight: 700, anchor: 'start' });
  for (const [s, e, lane] of input) {
    b += bar(x0 + s * unit, 72 + lane * 30, (e - s) * unit, 24, 'brand');
    b += text(x0 + ((s + e) / 2) * unit, 84 + lane * 30, `[${s}, ${e}]`, { size: 12, mono: true, fill: TONES.brand.text, weight: 600 });
  }
  b += text(32, 172, 'merged', { size: 14, weight: 700, anchor: 'start' });
  for (const [s, e] of merged) {
    b += bar(x0 + s * unit, 158, (e - s) * unit, 28, 'good');
    b += text(x0 + ((s + e) / 2) * unit, 172, `[${s}, ${e}]`, { size: 13, mono: true, fill: TONES.good.text, weight: 700 });
  }
  b += axis(x0, unit, 0, 18, 212, 2);
  b += note(32, 270, 'Sort by start. If the next start ≤ the current end, stretch the end; otherwise start a new interval.');
  add('greedy-merge-intervals', W, H, 'Five intervals on a number line merged into three', b);
}

{
  const W = 820;
  const H = 470;
  const trains = [
    ['T1', 9, 9 + 10 / 60],
    ['T2', 9 + 40 / 60, 12],
    ['T3', 9 + 50 / 60, 11 + 20 / 60],
    ['T4', 11, 11.5],
    ['T5', 15, 19],
    ['T6', 18, 20],
  ];
  const x0 = 120;
  const unit = 60;
  const X = (t) => x0 + (t - 9) * unit;
  let b = heading(32, 32, 'Minimum platforms: the most trains at the station at the same time');
  trains.forEach(([id, a, d], k) => {
    const y = 62 + k * 30;
    b += text(100, y + 11, id, { size: 13, mono: true, anchor: 'end', weight: 700, fill: C.text });
    b += bar(X(a), y, (d - a) * unit, 22, 'brand');
  });
  // count of trains present, as a step line
  const events = trains.flatMap(([, a, d]) => [
    [a, 1],
    [d, -1],
  ]);
  events.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const Y = (c) => 360 - c * 30;
  let count = 0;
  let d = `M${X(9)} ${Y(0)}`;
  let best = { count: 0, from: 0, to: 0 };
  events.forEach(([t, delta], k) => {
    d += ` L${X(t)} ${Y(count)}`;
    count += delta;
    d += ` L${X(t)} ${Y(count)}`;
    if (count > best.count) best = { count, from: t, to: events[k + 1][0] };
  });
  d += ` L${X(20)} ${Y(0)}`;
  b += rect(X(best.from), Y(best.count), (best.to - best.from) * unit, best.count * 30, { fill: C.amberSoft, stroke: 'none', rx: 0, sw: 0 });
  b += `<path d="${d} Z" fill="${C.brandSoft}" fill-opacity="0.6" stroke="none"/>`;
  b += path(d, { tone: 'brand', sw: 2.5 });
  b += rect(X(best.from), Y(best.count), (best.to - best.from) * unit, best.count * 30, { fill: 'none', stroke: C.amber, rx: 0, sw: 2 });
  for (let k = 1; k <= 3; k++) b += text(x0 - 8, Y(k), k, { size: 11, mono: true, anchor: 'end', fill: C.faint });
  b += tag(X(best.from) + 104, Y(best.count) - 14, '3 trains: 11:00–11:20', { size: 12.5, fill: C.amber, border: '#FCD34D' });
  b += text(92, Y(1.5) - 8, 'trains at', { size: 12, anchor: 'end', fill: C.muted });
  b += text(92, Y(1.5) + 8, 'station', { size: 12, anchor: 'end', fill: C.muted });
  b += axis(x0, unit, 9, 20, 370, 1, (v) => `${v}:00`);
  b += note(32, 440, 'Sort all arrivals and departures, then sweep: +1 on arrival, −1 on departure. The peak (3) is the answer.');
  add('greedy-min-platforms', W, H, 'Six train stays on a timeline and the number of trains at the station over time, peaking at 3', b);
}

// ---------- Dynamic programming ----------
{
  const W = 900;
  const H = 440;
  const values = ['f(5)', 'f(4)', 'f(3)', 'f(3)', 'f(2)', 'f(2)', 'f(1)', 'f(2)', 'f(1)', 'f(1)', 'f(0)', 'f(1)', 'f(0)', null, null, 'f(1)', 'f(0)'];
  const tones = {};
  values.forEach((v, i) => {
    if (v === 'f(3)') tones[i] = 'active';
    else if (v === 'f(2)') tones[i] = 'special';
    else if (v === 'f(5)' || v === 'f(4)') tones[i] = 'brand';
  });
  let b = heading(32, 32, 'fib(5) without memoisation: the same subproblems are solved again and again');
  b += tree(values, { x: 20, y: 84, width: 860, gap: 66, box: [48, 28], size: 12, mono: true, tones }).svg;
  b += legend(32, 392, [
    ['active', 'f(3) is solved 2 times'],
    ['special', 'f(2) is solved 3 times'],
  ]);
  b += note(32, 420, 'Save each answer the first time (memoise) and fib(n) needs O(n) calls instead of about O(2ⁿ).');
  add('dp-fib-overlap', W, H, 'Recursion tree of fib(5) with repeated subproblems f(3) and f(2) highlighted', b);
}

{
  const W = 780;
  const H = 290;
  const x = 120;
  const w = 76;
  const ways = [1, 1, 2, 3, 5, 8, 13];
  let b = heading(32, 32, 'Climbing stairs: ways(i) = ways(i − 1) + ways(i − 2)');
  b += text(x - 16, 175, 'ways', { size: 15, weight: 700, anchor: 'end' });
  b += cells(x, 150, ways, { w, h: 50, tones: { 3: 'brand', 4: 'brand', 5: 'good' } });
  b += text(x - 16, 214, 'step i', { size: 12, anchor: 'end', fill: C.muted });
  for (const from of [3, 4]) {
    const x1 = cellMid(x, from, w);
    const x2 = cellMid(x, 5, w) - (from === 3 ? 10 : 0);
    const peak = from === 3 ? 96 : 118;
    b += path(`M${x1} 146 C${x1} ${peak}, ${x2} ${peak}, ${x2} 144`, { tone: 'good', arrow: true, sw: 2 });
  }
  b += tag(cellMid(x, 4, w) - 40, 80, 'ways(5) = ways(4) + ways(3) = 5 + 3 = 8', { size: 13, fill: C.green, border: '#6EE7B7' });
  b += note(32, 262, 'Base cases ways(0) = ways(1) = 1. Each new answer reuses two stored ones, so the whole table is O(n).');
  add('dp-climbing-stairs', W, H, 'A one-dimensional DP table for climbing stairs with ways(5) built from ways(4) and ways(3)', b);
}

{
  const X = 'ABCBDAB';
  const Y = 'BDCABA';
  const n = X.length;
  const m = Y.length;
  const c = [...Array(n + 1)].map(() => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      c[i][j] = X[i - 1] === Y[j - 1] ? c[i - 1][j - 1] + 1 : Math.max(c[i - 1][j], c[i][j - 1]);
    }
  }
  const tones = {};
  const weights = {};
  let i = n;
  let j = m;
  let lcs = '';
  tones[`${i},${j}`] = 'active';
  while (i > 0 && j > 0) {
    if (X[i - 1] === Y[j - 1]) {
      tones[`${i},${j}`] = 'brand';
      weights[`${i},${j}`] = 800;
      lcs = X[i - 1] + lcs;
      i--;
      j--;
    } else if (c[i - 1][j] >= c[i][j - 1]) {
      if (!tones[`${i},${j}`]) tones[`${i},${j}`] = 'good';
      i--;
    } else {
      if (!tones[`${i},${j}`]) tones[`${i},${j}`] = 'good';
      j--;
    }
  }
  if (tones[`${n},${m}`] === 'good') tones[`${n},${m}`] = 'active';
  const W = 820;
  const H = 510;
  const x0 = 150;
  const y0 = 96;
  const cw = 48;
  const ch = 40;
  let b = heading(32, 32, 'Longest common subsequence: fill the table, then walk back');
  ['∅', ...Y].forEach((ch2, k) => (b += text(x0 + k * cw + cw / 2, y0 - 16, ch2, { size: 15, weight: 700, mono: true, fill: k ? C.ink : C.faint })));
  ['∅', ...X].forEach((ch2, k) => (b += text(x0 - 18, y0 + k * ch + ch / 2, ch2, { size: 15, weight: 700, mono: true, fill: k ? C.ink : C.faint })));
  b += table(x0, y0, c, { w: cw, h: ch, tones, weights, size: 15 });
  const lines = [
    [['X = ', C.text], [X, C.ink, 700], [' (rows)', C.muted]],
    [['Y = ', C.text], [Y, C.ink, 700], [' (columns)', C.muted]],
    [['letters match: ', C.text], ['1 + diagonal', C.brand, 700]],
    [['no match: ', C.text], ['max(up, left)', C.ink, 700]],
    [['LCS = ', C.text], [lcs, C.green, 700], [`, length ${c[n][m]}`, C.text]],
  ];
  lines.forEach((parts, k) => (b += spans(530, 120 + k * 34, parts)));
  b += legend(530, 310, [['brand', 'match on the path']], { size: 12.5 });
  b += legend(530, 336, [['good', 'path back']], { size: 12.5 });
  b += note(32, 470, `Table size (n + 1) × (m + 1), each cell O(1): O(n × m) time. Answer in the bottom-right cell: ${c[n][m]}.`);
  add('dp-lcs-table', W, H, `LCS table for ${X} and ${Y} with the traceback path to ${lcs}`, b);
}

{
  const items = [
    [1, 1],
    [3, 4],
    [4, 5],
    [5, 7],
  ];
  const cap = 7;
  const dp = [Array(cap + 1).fill(0)];
  items.forEach(([w, v], k) => {
    const row = [];
    for (let c = 0; c <= cap; c++) row.push(Math.max(dp[k][c], c >= w ? v + dp[k][c - w] : 0));
    dp.push(row);
  });
  const tones = { [`${items.length},${cap}`]: 'active' };
  const taken = [];
  let c = cap;
  for (let i = items.length; i > 0; i--) {
    if (dp[i][c] !== dp[i - 1][c]) {
      tones[`${i},${c}`] = tones[`${i},${c}`] === 'active' ? 'active' : 'good';
      taken.unshift(i);
      c -= items[i - 1][0];
    }
  }
  const W = 820;
  const H = 420;
  const x0 = 250;
  const y0 = 96;
  const cw = 52;
  const ch = 40;
  let b = heading(32, 32, '0/1 knapsack (capacity 7): best value for each item count and capacity');
  b += text(x0 - 12, y0 - 34, 'capacity →', { size: 12, anchor: 'end', fill: C.muted });
  for (let k = 0; k <= cap; k++) b += text(x0 + k * cw + cw / 2, y0 - 16, k, { size: 13, mono: true, fill: C.faint });
  ['no items', ...items.map(([w, v], k) => `item ${k + 1} (w ${w}, v ${v})`)].forEach((label, k) => {
    b += text(x0 - 14, y0 + k * ch + ch / 2, label, { size: 13, anchor: 'end', fill: k && taken.includes(k) ? C.green : C.text, weight: k && taken.includes(k) ? 700 : 500 });
  });
  b += table(x0, y0, dp, { w: cw, h: ch, tones, size: 15 });
  const best = dp[items.length][cap];
  const tw = taken.map((i) => items[i - 1][0]);
  const tv = taken.map((i) => items[i - 1][1]);
  b += spans(32, 324, [['dp[i][c]', C.ink, 700], [' = best value using the first i items with capacity c', C.text]]);
  b += spans(32, 352, [['= max( ', C.text], ['skip: dp[i−1][c]', C.ink, 700], [' ,  ', C.text], ['take: v + dp[i−1][c − w]', C.ink, 700], [' )', C.text]]);
  b += spans(32, 380, [
    ['Answer ', C.text],
    [`${best}`, C.amber, 700],
    [`: items ${taken.join(' and ')} (weight ${tw.join(' + ')} = ${tw.reduce((p, q) => p + q, 0)}, value ${tv.join(' + ')} = ${best})`, C.text],
  ]);
  add('dp-knapsack-table', W, H, `0/1 knapsack table for capacity 7 with the best value ${best} and the chosen items`, b);
}

// ---------- Backtracking ----------
{
  const W = 880;
  const H = 400;
  const values = ['{ }', '{1}', '{ }', '{1,2}', '{1}', '{2}', '{ }', '{1,2,3}', '{1,2}', '{1,3}', '{1}', '{2,3}', '{2}', '{3}', '{ }'];
  const tones = {};
  const edgeTones = {};
  values.forEach((_, i) => {
    if (i >= 7) tones[i] = 'good';
    if (i > 0) edgeTones[i] = i % 2 === 1 ? 'good' : 'muted';
  });
  let b = heading(32, 32, 'Subsets of {1, 2, 3}: at each level, take the next item or skip it');
  b += tree(values, { x: 40, y: 88, width: 800, gap: 80, box: [76, 30], size: 13, mono: true, tones, edgeTones, edgeWidth: Object.fromEntries(Object.keys(edgeTones).map((k) => [k, 2.5])) }).svg;
  b += line(40, 376, 80, 376, { tone: 'good', sw: 2.5 }) + text(88, 376, 'take the item', { size: 13, anchor: 'start', fill: C.text });
  b += line(220, 376, 260, 376, { tone: 'muted', sw: 2.5 }) + text(268, 376, 'skip it', { size: 13, anchor: 'start', fill: C.text });
  b += text(480, 376, '3 items → 2³ = 8 subsets (the green leaves)', { size: 13, anchor: 'start', fill: C.muted });
  add('backtracking-subsets', W, H, 'Decision tree that builds all eight subsets of 1, 2 and 3', b);
}

{
  const W = 780;
  const H = 380;
  const s = 58;
  const board = (bx, by, queens, attacked) => {
    let out = '';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const hit = attacked.some(([ar, ac]) => ar === r && ac === c);
        out += rect(bx + c * s, by + r * s, s, s, { fill: hit ? C.redSoft : (r + c) % 2 ? '#EEF2F7' : '#FFFFFF', stroke: C.line, rx: 0, sw: 1 });
      }
    }
    for (const [r, c] of queens) {
      out += circle(bx + c * s + s / 2, by + r * s + s / 2, 19, { fill: C.brand, stroke: '#FFFFFF', sw: 2 });
      out += text(bx + c * s + s / 2, by + r * s + s / 2, 'Q', { size: 18, weight: 800, fill: '#FFFFFF' });
    }
    return out + rect(bx, by, 4 * s, 4 * s, { fill: 'none', stroke: C.muted, rx: 4, sw: 2 });
  };
  const attacked = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if ((r || c) && (r === 0 || c === 0 || r === c)) attacked.push([r, c]);
    }
  }
  let b = heading(32, 32, 'N-Queens (n = 4): one queen per row, none attacking another');
  b += board(80, 70, [[0, 0]], attacked);
  b += text(80 + 2 * s, 330, 'A queen attacks its row, column', { size: 13, fill: C.text });
  b += text(80 + 2 * s, 350, 'and both diagonals (shaded)', { size: 13, fill: C.text });
  b += board(460, 70, [
    [0, 1],
    [1, 3],
    [2, 0],
    [3, 2],
  ], []);
  b += text(460 + 2 * s, 330, 'One valid answer: columns 1, 3, 0, 2', { size: 13, fill: C.text });
  b += text(460 + 2 * s, 350, 'for rows 0 to 3', { size: 13, fill: C.text });
  add('n-queens', W, H, 'A 4 by 4 board showing the squares a queen attacks and one valid four-queen placement', b);
}
