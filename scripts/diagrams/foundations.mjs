// Diagrams for the DSA foundations notes: complexity, recursion, arrays,
// binary search, sorting and the C++ STL.
import {
  C,
  TONES,
  badge,
  bracket,
  cellMid,
  cellX,
  cells,
  code,
  heading,
  legend,
  line,
  note,
  path,
  pointer,
  rect,
  spans,
  text,
  tree,
} from './svg.mjs';

export const foundations = [];
const add = (name, width, height, title, body) => foundations.push({ name, width, height, title, body });

// ---------- Complexity ----------
{
  const W = 720;
  const H = 440;
  const X0 = 80;
  const X1 = 600;
  const Y0 = 380;
  const Y1 = 70;
  const px = (v) => X0 + (v / 16) * (X1 - X0);
  const py = (v) => Y0 - (v / 64) * (Y0 - Y1);
  let b = heading(32, 32, 'How the number of steps grows with input size');
  for (const v of [16, 32, 48, 64]) {
    b += line(X0, py(v), X1, py(v), { color: C.grid, sw: 1 });
    b += text(X0 - 10, py(v), v, { size: 12, fill: C.faint, anchor: 'end', mono: true });
  }
  for (const v of [4, 8, 12, 16]) {
    b += line(px(v), Y0, px(v), Y1, { color: C.grid, sw: 1 });
    b += text(px(v), Y0 + 16, v, { size: 12, fill: C.faint, mono: true });
  }
  b += text(X0 - 10, Y0, 0, { size: 12, fill: C.faint, anchor: 'end', mono: true });
  b += line(X0, Y0, X1 + 6, Y0, { color: C.muted, sw: 1.5 }) + line(X0, Y0, X0, Y1 - 6, { color: C.muted, sw: 1.5 });
  b += text((X0 + X1) / 2, Y0 + 40, 'input size (n)', { size: 13, fill: C.muted });
  b += text(30, (Y0 + Y1) / 2, 'steps', { size: 13, fill: C.muted, rotate: -90 });
  b += `<defs><clipPath id="plot"><rect x="${X0}" y="${Y1}" width="${X1 - X0}" height="${Y0 - Y1}"/></clipPath></defs>`;
  const curves = [
    [C.green, 0, () => 1],
    [C.teal, 1, (v) => Math.log2(v)],
    [C.brand, 0, (v) => v],
    [C.violet, 1, (v) => v * Math.log2(v)],
    [C.amber, 0, (v) => v * v],
    [C.red, 0, (v) => 2 ** v],
  ];
  for (const [color, from, f] of curves) {
    const points = [];
    for (let v = from; v <= 16.0001; v += 0.05) {
      const y = f(v);
      points.push(`${Math.round(px(v) * 10) / 10},${Math.round(py(Math.min(y, 80)) * 10) / 10}`);
      if (y > 80) break;
    }
    b += `<polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" clip-path="url(#plot)"/>`;
  }
  const label = (x, y, value, fill, anchor = 'start') => text(x, y, value, { size: 14, weight: 700, fill, anchor });
  b += label(608, py(1) + 4, 'O(1)', C.green);
  b += label(608, py(4) - 4, 'O(log n)', C.teal);
  b += label(608, py(16), 'O(n)', C.brand);
  b += label(608, py(64) + 6, 'O(n log n)', C.violet);
  b += label(px(8) + 8, Y1 - 12, 'O(n²)', C.amber);
  b += label(px(6) - 8, Y1 - 12, 'O(2ⁿ)', C.red, 'end');
  add('complexity-growth', W, H, 'Growth of common time complexities from O(1) to O(2^n)', b);
}

{
  const W = 760;
  const H = 390;
  const gx = 100;
  const gy = 92;
  const s = 38;
  let b = heading(32, 32, 'Nested loops: check every pair (i, j) with j > i');
  b += text(gx - 16, gy - 16, 'i \\ j', { size: 12, fill: C.muted, anchor: 'end' });
  for (let k = 0; k < 6; k++) {
    b += text(gx + k * s + s / 2, gy - 14, k, { size: 12, fill: C.faint, mono: true });
    b += text(gx - 14, gy + k * s + s / 2, k, { size: 12, fill: C.faint, mono: true });
  }
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      const t = j > i ? TONES.brand : j === i ? TONES.muted : TONES.plain;
      b += rect(gx + j * s, gy + i * s, s, s, { fill: t.fill, stroke: j > i ? '#8AB2FF' : C.line, rx: 0, sw: 1 });
      if (j > i) b += text(gx + j * s + s / 2, gy + i * s + s / 2, '✓', { size: 14, fill: C.brand, weight: 700 });
    }
  }
  b += rect(372, 84, 360, 104, { fill: C.panel, stroke: C.grid, rx: 12 });
  b += code(390, 110, 'for (int i = 0; i < n; i++)');
  b += code(390, 136, '  for (int j = i + 1; j < n; j++)');
  b += code(390, 162, '    check(a[i], a[j]);');
  b += spans(374, 226, [['n = 6', C.ink, 700], ['  →  15 pairs (the ✓ cells)', C.text]]);
  b += spans(374, 256, [['pairs = n(n − 1) / 2 ≈ n² / 2', C.ink, 700], ['  →  O(n²)', C.brand, 700]]);
  b += spans(374, 286, [['double n and the work grows about 4×', C.text]]);
  b += legend(gx, gy + 6 * s + 34, [
    ['brand', 'pair checked'],
    ['muted', 'i = j, skipped'],
  ]);
  add('complexity-nested-loops', W, H, 'A 6 by 6 grid showing the 15 pairs checked by two nested loops', b);
}

// ---------- Recursion ----------
{
  const W = 760;
  const H = 400;
  const x = 90;
  const w = 300;
  const h = 62;
  const frames = [
    ['fact(1)', 'n = 1 → base case, returns 1', 'good'],
    ['fact(2)', 'n = 2 → waits for fact(1)', 'brand'],
    ['fact(3)', 'n = 3 → waits for fact(2)', 'brand'],
    ['main()', 'calls fact(3)', 'plain'],
  ];
  let b = heading(32, 32, 'Call stack for fact(3): each call waits on the one above it');
  const mids = [];
  frames.forEach(([title, detail, tone], k) => {
    const y = 64 + k * (h + 14);
    const t = TONES[tone];
    b += rect(x, y, w, h, { fill: t.fill, stroke: t.stroke, rx: 12, sw: 2 });
    b += text(x + 18, y + 21, title, { size: 16, weight: 700, anchor: 'start', fill: t.text, mono: true });
    b += text(x + 18, y + 44, detail, { size: 13, anchor: 'start', fill: C.text });
    mids.push(y + h / 2);
  });
  b += line(34, mids[0], x - 8, mids[0], { tone: 'good', arrow: true, sw: 2 });
  b += text(30, mids[0], 'top', { size: 13, weight: 700, fill: C.green, anchor: 'end' });
  const returns = ['returns 1', 'returns 2 × 1 = 2', 'returns 3 × 2 = 6'];
  returns.forEach((value, k) => {
    const y1 = mids[k] + 6;
    const y2 = mids[k + 1] - 6;
    b += path(`M${x + w + 4} ${y1} C${x + w + 52} ${y1}, ${x + w + 52} ${y2}, ${x + w + 10} ${y2}`, {
      tone: 'good',
      arrow: true,
      sw: 2,
    });
    b += text(x + w + 62, (y1 + y2) / 2, value, { size: 14, weight: 700, fill: C.green, anchor: 'start' });
  });
  b += note(32, 378, 'Each call gets its own frame. No base case → frames pile up forever → stack overflow.');
  add('recursion-call-stack', W, H, 'Call stack frames for fact(3) and the values returned as the stack unwinds', b);
}

{
  const W = 720;
  const H = 350;
  const values = ['fib(4)', 'fib(3)', 'fib(2)', 'fib(2)', 'fib(1)', 'fib(1)', 'fib(0)', 'fib(1)', 'fib(0)'];
  const tones = {};
  values.forEach((v, i) => (tones[i] = /fib\([01]\)/.test(v) ? 'good' : 'brand'));
  let b = heading(32, 32, 'Recursion tree for fib(4): 9 calls in total');
  b += tree(values, { x: 30, y: 78, width: 660, gap: 66, box: [68, 32], size: 13, mono: true, tones }).svg;
  b += legend(32, 328, [
    ['brand', 'makes two more calls'],
    ['good', 'base case, returns at once'],
  ]);
  add('recursion-fib-tree', W, H, 'Recursion tree of fib(4) with base cases highlighted', b);
}

// ---------- Arrays ----------
{
  const W = 720;
  const H = 250;
  const x = 170;
  let b = heading(32, 32, 'An array keeps its items side by side in memory');
  b += text(x - 16, 84, 'address', { size: 12, fill: C.muted, anchor: 'end' });
  b += text(x - 16, 128, 'arr', { size: 16, weight: 700, anchor: 'end' });
  b += text(x - 16, 170, 'index', { size: 12, fill: C.muted, anchor: 'end' });
  [7, 2, 9, 4, 1].forEach((_, i) => {
    b += text(cellMid(x, i, 80), 84, 1000 + 4 * i, { size: 12, fill: C.muted, mono: true });
  });
  b += cells(x, 100, [7, 2, 9, 4, 1], { w: 80, h: 56, tones: { 3: 'active' }, size: 20 });
  b += spans(32, 214, [
    ['arr[3]', C.amber, 700],
    [' is at 1000 + 3 × 4 = ', C.text],
    ['1012', C.amber, 700],
    ['  →  one step to reach any index: ', C.text],
    ['O(1)', C.brand, 700],
  ]);
  add('array-indexing', W, H, 'Array of five integers with memory addresses 1000 to 1016', b);
}

{
  const W = 780;
  const H = 350;
  const x = 64;
  const w = 52;
  const h = 46;
  const arr = [2, 4, 5, 7, 9, 12];
  const steps = [
    { L: 0, R: 5, muted: [], words: [['2 + 12 = 14', C.ink, 700], ['  > 13, so move R left', C.text]] },
    { L: 0, R: 4, muted: [5], words: [['2 + 9 = 11', C.ink, 700], ['  < 13, so move L right', C.text]] },
    { L: 1, R: 4, muted: [0, 5], done: true, words: [['4 + 9 = 13', C.green, 700], ['  ✓ pair found', C.green, 600]] },
  ];
  let b = heading(32, 32, 'Two pointers on a sorted array: find a pair that sums to 13');
  steps.forEach((s, k) => {
    const y = 66 + k * 92;
    const tones = {};
    for (const m of s.muted) tones[m] = 'muted';
    tones[s.L] = s.done ? 'good' : 'brand';
    tones[s.R] = s.done ? 'good' : 'active';
    b += badge(32, y + h / 2, k + 1, { tone: 'ink' });
    b += cells(x, y, arr, { w, h, tones, indices: false });
    b += pointer(cellMid(x, s.L, w), y + h, 'L', { tone: s.done ? 'good' : 'brand' });
    b += pointer(cellMid(x, s.R, w), y + h, 'R', { tone: s.done ? 'good' : 'active' });
    b += spans(400, y + h / 2, s.words);
  });
  add('two-pointers', W, H, 'Two pointers L and R closing in on a pair with sum 13', b);
}

{
  const W = 780;
  const H = 420;
  const x = 64;
  const w = 52;
  const h = 46;
  const arr = [2, 1, 5, 1, 3, 2];
  const rows = [
    { start: 0, words: [['2 + 1 + 5 = 8', C.ink, 700]] },
    { start: 1, words: [['8 − 2 + 1 = 7', C.ink, 700]] },
    { start: 2, words: [['7 − 1 + 3 = 9', C.green, 700], ['  ← best', C.green, 600]] },
    { start: 3, words: [['9 − 5 + 2 = 6', C.ink, 700]] },
  ];
  let b = heading(32, 32, 'Sliding window: best sum of 3 items in a row');
  rows.forEach((r, k) => {
    const y = 64 + k * 76;
    const tones = { [r.start]: 'brand', [r.start + 1]: 'brand', [r.start + 2]: k === 0 ? 'brand' : 'good' };
    if (k > 0) tones[r.start - 1] = 'bad';
    b += cells(x, y, arr, { w, h, tones, indices: false });
    b += rect(cellX(x, r.start, w) - 5, y - 5, 3 * w + 10, h + 10, { fill: 'none', stroke: C.brand, sw: 2.5, rx: 10 });
    b += spans(420, y + h / 2, r.words);
  });
  b += legend(64, 372, [
    ['brand', 'in the window'],
    ['good', 'enters'],
    ['bad', 'leaves'],
  ]);
  b += note(32, 402, 'One add and one subtract per step, so the scan is O(n) instead of O(n × k).');
  add('sliding-window', W, H, 'A window of size 3 sliding across an array while keeping a running sum', b);
}

{
  const W = 780;
  const H = 320;
  const w = 56;
  const ax = 150;
  const px = ax - w / 2;
  let b = heading(32, 32, 'Prefix sums: any range sum in O(1)');
  b += text(110, 103, 'arr', { size: 15, weight: 700, anchor: 'end' });
  b += cells(ax, 80, [3, 1, 4, 1, 5, 9], { w, h: 46, tones: { 1: 'brand', 2: 'brand', 3: 'brand', 4: 'brand' } });
  b += text(110, 185, 'prefix', { size: 15, weight: 700, anchor: 'end' });
  b += cells(px, 162, [0, 3, 4, 8, 9, 14, 23], { w, h: 46, tones: { 1: 'active', 5: 'good' } });
  b += spans(60, 252, [
    ['prefix[i]', C.ink, 700],
    [' = sum of the first i items of arr', C.text],
  ]);
  b += spans(60, 284, [
    ['sum(arr[1..4]) = ', C.text],
    ['prefix[5]', C.green, 700],
    [' − ', C.text],
    ['prefix[1]', C.amber, 700],
    [' = 14 − 3 = 11', C.ink, 700],
  ]);
  add('prefix-sum', W, H, 'An array and its prefix sum array used to answer a range sum query', b);
}

// ---------- Binary search ----------
{
  const W = 840;
  const H = 420;
  const x = 48;
  const w = 50;
  const h = 44;
  const arr = [3, 8, 12, 17, 23, 31, 42, 56, 64, 77];
  const steps = [
    { lo: 0, hi: 9, mid: 4, words: [['mid = 23', C.ink, 700], ['  < 42, keep the right half', C.text]] },
    { lo: 5, hi: 9, mid: 7, words: [['mid = 56', C.ink, 700], ['  > 42, keep the left half', C.text]] },
    { lo: 5, hi: 6, mid: 5, words: [['mid = 31', C.ink, 700], ['  < 42, keep the right half', C.text]] },
    { lo: 6, hi: 6, mid: 6, done: true, words: [['mid = 42', C.green, 700], ['  found in 4 steps', C.green, 600]] },
  ];
  let b = heading(32, 32, 'Binary search for 42: the range halves every step');
  steps.forEach((s, k) => {
    const y = 64 + k * 86;
    const tones = {};
    arr.forEach((_, i) => {
      if (i < s.lo || i > s.hi) tones[i] = 'muted';
    });
    tones[s.mid] = s.done ? 'good' : 'active';
    b += badge(24, y + h / 2, k + 1, { tone: 'ink' });
    b += cells(x, y, arr, { w, h, tones, indices: false, size: 16 });
    const marks = new Map();
    for (const [name, i] of [
      ['lo', s.lo],
      ['mid', s.mid],
      ['hi', s.hi],
    ]) {
      marks.set(i, [...(marks.get(i) || []), name]);
    }
    for (const [i, names] of marks) {
      const tone = names.includes('mid') ? (s.done ? 'good' : 'active') : 'brand';
      b += pointer(cellMid(x, i, w), y + h, names.join(' = '), { tone, length: 16, size: 12 });
    }
    b += spans(580, y + h / 2, s.words);
  });
  add('binary-search-steps', W, H, 'Four steps of binary search for 42 in a sorted array of ten numbers', b);
}

{
  const W = 780;
  const H = 270;
  const x = 90;
  const w = 58;
  let b = heading(32, 32, 'Binary search on the answer: find the smallest x that works');
  b += text(x - 14, 100, 'x', { size: 15, weight: 700, anchor: 'end' });
  b += cells(x, 80, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], { w, h: 40, indices: false, size: 16 });
  b += text(x - 14, 150, 'works?', { size: 14, weight: 700, anchor: 'end' });
  const tones = {};
  const marks = [];
  for (let i = 0; i < 10; i++) {
    tones[i] = i < 4 ? 'bad' : 'good';
    marks.push(i < 4 ? '✗' : '✓');
  }
  b += cells(x, 130, marks, { w, h: 40, indices: false, tones, mono: false, size: 18 });
  b += pointer(cellMid(x, 4, w), 172, 'answer = 5', { tone: 'good', length: 22 });
  b += note(32, 246, 'Once some x works, every bigger x works too, so binary search finds the first ✓ in O(log n) checks.');
  add('binary-search-answer', W, H, 'A monotonic yes/no check over candidate answers with the first yes marked', b);
}

// ---------- Sorting ----------
{
  const W = 760;
  const H = 530;
  const cw = 34;
  const ch = 32;
  const G = 26;
  const rows = [
    [[38, 27, 43, 3, 9, 82, 10, 5]],
    [
      [38, 27, 43, 3],
      [9, 82, 10, 5],
    ],
    [
      [38, 27],
      [43, 3],
      [9, 82],
      [10, 5],
    ],
    [[38], [27], [43], [3], [9], [82], [10], [5]],
    [
      [27, 38],
      [3, 43],
      [9, 82],
      [5, 10],
    ],
    [
      [3, 27, 38, 43],
      [5, 9, 10, 82],
    ],
    [[3, 5, 9, 10, 27, 38, 43, 82]],
  ];
  const tonesByRow = ['brand', 'brand', 'brand', 'plain', 'good', 'good', 'good'];
  let b = heading(32, 32, 'Merge sort: split into halves, then merge the sorted halves');
  const geometry = rows.map((groups, r) => {
    const y = 66 + r * 62;
    const total = 8 * cw + (groups.length - 1) * G;
    const start = (W - total) / 2 + 24;
    let used = 0;
    return groups.map((g, k) => {
      const gx = start + used * cw + k * G;
      used += g.length;
      return { x: gx, y, w: g.length * cw, values: g };
    });
  });
  // Connectors first so the cells sit on top of them.
  for (let r = 0; r < rows.length - 1; r++) {
    const upper = geometry[r];
    const lower = geometry[r + 1];
    const splitting = r < 3;
    const tone = splitting ? 'brand' : 'good';
    if (splitting) {
      upper.forEach((g, k) => {
        for (const child of [lower[2 * k], lower[2 * k + 1]]) {
          b += line(g.x + g.w / 2, g.y + ch, child.x + child.w / 2, child.y, { tone, sw: 1.5 });
        }
      });
    } else {
      lower.forEach((g, k) => {
        for (const part of [upper[2 * k], upper[2 * k + 1]]) {
          b += line(part.x + part.w / 2, part.y + ch, g.x + g.w / 2, g.y, { tone, sw: 1.5 });
        }
      });
    }
  }
  geometry.forEach((groups, r) => {
    for (const g of groups) {
      const tones = {};
      g.values.forEach((_, i) => (tones[i] = tonesByRow[r]));
      b += cells(g.x, g.y, g.values, { w: cw, h: ch, tones, indices: false, size: 14, rx: 4 });
    }
  });
  b += line(70, 66, 70, 66 + 2 * 62 + ch, { tone: 'brand', sw: 3 });
  b += text(52, 66 + 62 + ch / 2, 'split', { size: 14, weight: 700, fill: C.brand, rotate: -90 });
  b += line(70, 66 + 4 * 62, 70, 66 + 6 * 62 + ch, { tone: 'good', sw: 3 });
  b += text(52, 66 + 5 * 62 + ch / 2, 'merge', { size: 14, weight: 700, fill: C.green, rotate: -90 });
  b += note(32, 508, '3 levels of splitting (log n), and each level merges all n items → O(n log n).');
  add('merge-sort-tree', W, H, 'Merge sort splitting eight numbers into single items and merging them back in order', b);
}

{
  const W = 780;
  const H = 340;
  const x = 150;
  const w = 52;
  let b = heading(32, 32, 'Quick sort: partition around a pivot (here, the last item)');
  b += text(x - 16, 112, 'before', { size: 14, weight: 700, anchor: 'end' });
  b += cells(x, 90, [7, 2, 1, 6, 8, 5, 3, 4], { w, h: 44, tones: { 7: 'active' } });
  b += pointer(cellMid(x, 7, w), 90, 'pivot', { tone: 'active', above: true, length: 16 });
  b += text(x - 16, 232, 'after', { size: 14, weight: 700, anchor: 'end' });
  b += cells(x, 210, [2, 1, 3, 4, 8, 5, 7, 6], {
    w,
    h: 44,
    tones: { 0: 'brand', 1: 'brand', 2: 'brand', 3: 'good', 4: 'special', 5: 'special', 6: 'special', 7: 'special' },
  });
  b += pointer(cellMid(x, 3, w), 210, 'pivot lands in its final place', { tone: 'good', above: true, length: 18 });
  b += bracket(cellX(x, 0, w) + 3, cellX(x, 3, w) - 3, 274, 'smaller than 4', { tone: 'brand' });
  b += bracket(cellX(x, 4, w) + 3, cellX(x, 8, w) - 3, 274, '4 or bigger', { tone: 'special' });
  b += note(32, 322, 'Then sort the left part and the right part the same way. Average O(n log n).');
  add('quick-sort-partition', W, H, 'An array before and after partitioning around the pivot 4', b);
}

{
  const W = 760;
  const H = 480;
  const x = 64;
  const w = 48;
  const h = 40;
  const arr = [5, 2, 4, 6, 1, 3];
  let b = heading(32, 32, 'Insertion sort: grow a sorted part one item at a time');
  const rows = [{ values: [...arr], sorted: 0, placed: -1, words: [['start: ', C.text], ['[5]', C.ink, 700], [' alone is sorted', C.text]] }];
  const a = [...arr];
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    let shifts = 0;
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      j--;
      shifts++;
    }
    a[j + 1] = key;
    rows.push({
      values: [...a],
      sorted: i,
      placed: j + 1,
      words: [
        [`insert ${key}`, C.ink, 700],
        [shifts ? `  → ${shifts} ${shifts > 1 ? 'items shift' : 'item shifts'} right` : '  → already in place', C.text],
      ],
    });
  }
  rows.forEach((r, k) => {
    const y = 64 + k * 62;
    const tones = {};
    for (let i = 0; i <= r.sorted; i++) tones[i] = 'good';
    if (r.placed >= 0) tones[r.placed] = 'active';
    b += cells(x, y, r.values, { w, h, tones, indices: false, size: 16 });
    b += spans(x + 6 * w + 32, y + h / 2, r.words);
  });
  b += legend(64, 452, [
    ['good', 'sorted part'],
    ['active', 'item just inserted'],
  ]);
  add('insertion-sort-steps', W, H, 'Insertion sort passes on the array 5 2 4 6 1 3', b);
}

// ---------- C++ STL ----------
{
  const W = 760;
  const H = 380;
  const x = 230;
  const w = 46;
  const states = [
    [1, 1],
    [2, 2],
    [4, 4],
    [5, 8],
  ];
  let b = heading(32, 32, 'vector::push_back: when the vector is full, capacity doubles');
  states.forEach(([size, cap], k) => {
    const y = 70 + k * 72;
    const values = [];
    const tones = {};
    for (let i = 0; i < cap; i++) {
      values.push(i < size ? (i + 1) * 10 : '');
      tones[i] = i < size ? 'brand' : 'empty';
    }
    b += text(x - 18, y + 20, `size ${size}, capacity ${cap}`, { size: 13, weight: 600, anchor: 'end', fill: C.text });
    b += cells(x, y, values, { w, h: 40, tones, indices: false, size: 15 });
    if (k > 0) b += text(x + cap * w + 14, y + 20, 'was full: copied into 2× space', { size: 12, fill: C.amber, anchor: 'start', weight: 600 });
  });
  b += note(32, 356, 'Copies happen only at sizes 1, 2, 4, 8, …, so push_back is O(1) on average (amortized).');
  add('stl-vector-growth', W, H, 'A vector doubling its capacity from 1 to 8 as items are pushed', b);
}

{
  const W = 760;
  const H = 790;
  const pw = 348;
  const ph = 170;
  const panel = (c, r) => ({ x: 24 + c * (pw + 16), y: 56 + r * (ph + 12) });
  let b = heading(32, 30, 'The C++ STL containers you use most in DSA');
  const frame = (p, title, cost) =>
    rect(p.x, p.y, pw, ph, { fill: C.panel, stroke: C.grid, rx: 14 }) +
    text(p.x + 16, p.y + 22, title, { size: 15, weight: 700, anchor: 'start', mono: true }) +
    text(p.x + 16, p.y + ph - 18, cost, { size: 12.5, anchor: 'start', fill: C.muted });

  // vector
  let p = panel(0, 0);
  b += frame(p, 'vector', 'a[i]: O(1) · push_back: O(1)*');
  b += cells(p.x + 30, p.y + 64, [3, 1, 4, 1, 5, ''], { w: 42, h: 38, indices: false, size: 15, tones: { 5: 'empty' } });
  b += pointer(p.x + 30 + 5 * 42 + 21, p.y + 64, 'push_back', { tone: 'good', above: true, length: 12, size: 12 });

  // deque
  p = panel(1, 0);
  b += frame(p, 'deque', 'push / pop at both ends: O(1)');
  b += cells(p.x + 90, p.y + 64, [2, 7, 1, 8], { w: 42, h: 38, indices: false, size: 15 });
  b += line(p.x + 40, p.y + 83, p.x + 86, p.y + 83, { tone: 'good', arrow: true });
  b += line(p.x + 90 + 4 * 42 + 50, p.y + 83, p.x + 90 + 4 * 42 + 4, p.y + 83, { tone: 'good', arrow: true });
  b += text(p.x + 60, p.y + 118, 'front', { size: 12, fill: C.green, weight: 600 });
  b += text(p.x + 90 + 4 * 42 + 28, p.y + 118, 'back', { size: 12, fill: C.green, weight: 600 });

  // stack
  p = panel(0, 1);
  b += frame(p, 'stack', 'push / pop / top: O(1)');
  const sx = p.x + 130;
  [30, 20, 10].forEach((v, k) => {
    const t = k === 0 ? TONES.brand : TONES.plain;
    b += rect(sx, p.y + 40 + k * 30, 80, 30, { fill: t.fill, stroke: t.stroke, rx: 4 });
    b += text(sx + 40, p.y + 55 + k * 30, v, { size: 15, weight: 600, mono: true, fill: t.text });
  });
  b += path(`M${sx - 6} ${p.y + 36} L${sx - 6} ${p.y + 136} L${sx + 86} ${p.y + 136} L${sx + 86} ${p.y + 36}`, { color: C.muted, sw: 2 });
  b += line(sx + 150, p.y + 55, sx + 92, p.y + 55, { tone: 'brand', arrow: true });
  b += text(sx + 156, p.y + 55, 'top', { size: 13, weight: 700, fill: C.brand, anchor: 'start' });

  // queue
  p = panel(1, 1);
  b += frame(p, 'queue', 'push (back) / pop (front): O(1)');
  b += cells(p.x + 110, p.y + 66, [10, 20, 30], { w: 44, h: 38, indices: false, size: 15, tones: { 0: 'brand' } });
  b += line(p.x + 104, p.y + 85, p.x + 44, p.y + 85, { tone: 'brand', arrow: true });
  b += line(p.x + 110 + 3 * 44 + 56, p.y + 85, p.x + 110 + 3 * 44 + 6, p.y + 85, { tone: 'good', arrow: true });
  b += text(p.x + 72, p.y + 116, 'front: out', { size: 12, fill: C.brand, weight: 600 });
  b += text(p.x + 110 + 3 * 44 + 32, p.y + 116, 'back: in', { size: 12, fill: C.green, weight: 600 });

  // priority_queue
  p = panel(0, 2);
  b += frame(p, 'priority_queue', 'push / pop: O(log n) · top: O(1)');
  b += tree([9, 5, 7, 1, 3], { x: p.x + 40, y: p.y + 48, width: 200, gap: 34, r: 15, size: 13, tones: { 0: 'brand' } }).svg;
  b += text(p.x + 250, p.y + 56, 'top() = largest', { size: 13, weight: 700, fill: C.brand, anchor: 'start' });
  b += text(p.x + 250, p.y + 80, 'smallest first:', { size: 12, fill: C.muted, anchor: 'start' });
  b += text(p.x + 250, p.y + 96, 'greater<int>', { size: 12, fill: C.muted, anchor: 'start', mono: true });

  // set / map
  p = panel(1, 2);
  b += frame(p, 'set / map', 'insert / find / erase: O(log n)');
  b += tree([20, 10, 30], { x: p.x + 30, y: p.y + 60, width: 160, gap: 46, r: 17, size: 14 }).svg;
  b += text(p.x + 210, p.y + 70, 'keys stay sorted', { size: 13, weight: 700, fill: C.ink, anchor: 'start' });
  b += text(p.x + 210, p.y + 92, '(a balanced BST', { size: 12, fill: C.muted, anchor: 'start' });
  b += text(p.x + 210, p.y + 108, 'inside)', { size: 12, fill: C.muted, anchor: 'start' });

  // unordered_map
  p = panel(0, 3);
  b += frame(p, 'unordered_map / set', 'insert / find: O(1) on average');
  [
    ['0', ['apple: 3']],
    ['1', []],
    ['2', ['kiwi: 1', 'fig: 5']],
  ].forEach(([bucket, items], k) => {
    const y = p.y + 40 + k * 32;
    b += rect(p.x + 30, y, 34, 26, { fill: '#FFFFFF', stroke: C.faint, rx: 4 });
    b += text(p.x + 47, y + 13, bucket, { size: 12, mono: true, fill: C.muted });
    let cx = p.x + 64;
    for (const item of items) {
      b += line(cx, y + 13, cx + 18, y + 13, { tone: 'plain', arrow: true, sw: 1.5 });
      b += rect(cx + 20, y + 1, 84, 24, { fill: TONES.brand.fill, stroke: TONES.brand.stroke, rx: 4 });
      b += text(cx + 62, y + 13, item, { size: 12, mono: true, fill: TONES.brand.text, weight: 600 });
      cx += 104;
    }
  });

  // how to choose
  p = panel(1, 3);
  b += rect(p.x, p.y, pw, ph, { fill: C.brandSoft, stroke: '#8AB2FF', rx: 14 });
  b += text(p.x + 16, p.y + 22, 'Pick by the operation you need most', { size: 14, weight: 700, anchor: 'start', fill: C.brand });
  [
    'index access → vector',
    'both ends → deque',
    'min or max → priority_queue',
    'sorted keys → set / map',
    'fast lookup → unordered_map',
  ].forEach((row, k) => {
    b += text(p.x + 16, p.y + 50 + k * 22, row, { size: 13, anchor: 'start', fill: C.ink });
  });
  b += text(p.x + 16, p.y + ph - 12, '* amortized, see vector growth', { size: 11.5, anchor: 'start', fill: C.muted });
  add('stl-containers', W, H, 'Pictures of the main C++ STL containers with the cost of their key operations', b);
}

