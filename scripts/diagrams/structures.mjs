// Diagrams for the linear data structure notes: linked lists, stacks,
// queues, hashing and heaps.
import {
  C,
  TONES,
  cellMid,
  cells,
  circle,
  connect,
  drawNode,
  heading,
  line,
  note,
  path,
  pointer,
  rect,
  spans,
  table,
  tag,
  text,
  tree,
} from './svg.mjs';

export const structures = [];
const add = (name, width, height, title, body) => structures.push({ name, width, height, title, body });

// A linked list node drawn as [ data | next ]. Returns its drawing and anchor points.
function listNode(x, y, value, tone = 'plain') {
  const t = TONES[tone];
  const svgBody =
    rect(x, y, 104, 50, { fill: t.fill, stroke: t.stroke, rx: 8, sw: tone === 'plain' ? 1.5 : 2 }) +
    line(x + 64, y, x + 64, y + 50, { color: t.stroke, sw: 1.5 }) +
    text(x + 32, y + 25, value, { size: 18, weight: 700, mono: true, fill: t.text }) +
    circle(x + 84, y + 25, 4.5, { fill: C.ink, stroke: C.ink, sw: 1 });
  return { svg: svgBody, dot: { x: x + 84, y: y + 25 }, left: { x, y: y + 25 }, top: { x: x + 52, y }, bottom: { x: x + 52, y: y + 50 } };
}

// ---------- Linked lists ----------
{
  const W = 780;
  const H = 220;
  let b = heading(32, 32, 'A singly linked list: each node points to the next');
  const xs = [150, 330, 510];
  const nodes = xs.map((x, k) => listNode(x, 90, [10, 20, 30][k], k === 0 ? 'brand' : 'plain'));
  b += text(58, 115, 'head', { size: 15, weight: 700, fill: C.brand });
  b += line(84, 115, 144, 115, { tone: 'brand', arrow: true });
  ['0x1A0', '0x3F8', '0x2C4'].forEach((addr, k) => (b += text(xs[k] + 52, 76, addr, { size: 12, mono: true, fill: C.faint })));
  nodes.forEach((node, k) => {
    b += node.svg;
    const to = k < 2 ? nodes[k + 1].left.x - 4 : 668;
    b += line(node.dot.x, node.dot.y, to, node.dot.y, { tone: 'ink', arrow: true, sw: 2 });
  });
  b += text(704, 115, 'NULL', { size: 15, weight: 700, mono: true, fill: C.muted });
  b += text(xs[0] + 32, 156, 'data', { size: 12, fill: C.muted });
  b += text(xs[0] + 84, 156, 'next', { size: 12, fill: C.muted });
  b += note(32, 196, 'Nodes can sit anywhere in memory. Only the next pointers hold the list together.');
  add('linked-list-basic', W, H, 'A singly linked list of three nodes ending in NULL', b);
}

{
  const W = 780;
  const H = 330;
  let b = heading(32, 32, 'Insert 25 after 20: two pointer changes');
  const n10 = listNode(120, 80, 10);
  const n20 = listNode(300, 80, 20, 'brand');
  const n30 = listNode(480, 80, 30);
  const n25 = listNode(390, 210, 25, 'good');
  b += text(60, 105, 'head', { size: 14, weight: 700, fill: C.brand, anchor: 'middle' });
  b += line(82, 105, 114, 105, { tone: 'brand', arrow: true });
  b += n10.svg + n20.svg + n30.svg + n25.svg;
  b += line(n10.dot.x, n10.dot.y, n20.left.x - 4, n10.dot.y, { tone: 'ink', arrow: true });
  b += line(n20.dot.x, n20.dot.y, n30.left.x - 4, n20.dot.y, { tone: 'bad', dash: '6 5', arrow: true });
  b += tag((n20.dot.x + n30.left.x) / 2, n20.dot.y - 14, '✗ old link', { size: 12, fill: C.red });
  b += line(n30.dot.x, n30.dot.y, 648, n30.dot.y, { tone: 'ink', arrow: true });
  b += text(682, 105, 'NULL', { size: 14, weight: 700, mono: true, fill: C.muted });
  // step 1: new node points at 30
  b += path(`M${n25.dot.x} ${n25.dot.y} C${n25.dot.x + 60} ${n25.dot.y}, ${n30.bottom.x} 190, ${n30.bottom.x} ${n30.bottom.y + 6}`, {
    tone: 'good',
    arrow: true,
    sw: 2.5,
  });
  b += tag(640, 214, '① newNode->next = cur->next', { size: 13, fill: C.green });
  // step 2: 20 points at the new node
  b += path(`M${n20.dot.x} ${n20.dot.y + 4} C${n20.dot.x} 170, ${n25.top.x - 20} 170, ${n25.top.x - 20} ${n25.top.y - 6}`, {
    tone: 'good',
    arrow: true,
    sw: 2.5,
  });
  b += tag(300, 178, '② cur->next = newNode', { size: 13, fill: C.green });
  b += note(32, 304, 'Do ① before ②. If you change cur->next first, you lose the link to 30 and the rest of the list.');
  add('linked-list-insert', W, H, 'Inserting the node 25 between 20 and 30 in a linked list', b);
}

{
  const W = 820;
  const H = 400;
  const xs = [170, 290, 410, 530];
  const box = (x, y, value, tone = 'plain') => {
    const t = TONES[tone];
    return rect(x, y, 60, 40, { fill: t.fill, stroke: t.stroke, rx: 8, sw: tone === 'plain' ? 1.5 : 2 }) + text(x + 30, y + 20, value, { size: 17, weight: 700, mono: true, fill: t.text });
  };
  const right = (i, y, tone = 'ink') => line(xs[i] + 64, y + 20, xs[i + 1] - 4, y + 20, { tone, arrow: true });
  const left = (i, y, tone = 'brand') => line(xs[i + 1] - 4, y + 20, xs[i] + 64, y + 20, { tone, arrow: true });
  const nul = (x, y) => text(x, y + 20, 'NULL', { size: 14, weight: 700, mono: true, fill: C.muted });
  let b = heading(32, 32, 'Reverse a linked list with prev, curr and next');

  // start
  let y = 76;
  b += text(32, y - 14, 'Start', { size: 14, weight: 700, anchor: 'start', fill: C.text });
  [1, 2, 3, 4].forEach((v, i) => (b += box(xs[i], y, v)));
  b += right(0, y) + right(1, y) + right(2, y);
  b += line(xs[3] + 64, y + 20, 646, y + 20, { tone: 'ink', arrow: true }) + nul(682, y);

  // midway
  y = 190;
  b += text(32, y - 14, 'Midway: 1 and 2 already point back', { size: 14, weight: 700, anchor: 'start', fill: C.text });
  b += nul(96, y) + line(xs[0] - 4, y + 20, 128, y + 20, { tone: 'brand', arrow: true });
  b += box(xs[0], y, 1, 'brand') + box(xs[1], y, 2, 'brand') + box(xs[2], y, 3, 'active') + box(xs[3], y, 4, 'special');
  b += left(0, y);
  b += right(2, y);
  b += line(xs[3] + 64, y + 20, 646, y + 20, { tone: 'ink', arrow: true }) + nul(682, y);
  b += pointer(xs[1] + 30, y + 40, 'prev', { tone: 'brand', length: 16 });
  b += pointer(xs[2] + 30, y + 40, 'curr', { tone: 'active', length: 16 });
  b += pointer(xs[3] + 30, y + 40, 'next', { tone: 'special', length: 16 });

  // done
  y = 318;
  b += text(32, y - 14, 'Done: the last node is the new head', { size: 14, weight: 700, anchor: 'start', fill: C.text });
  b += nul(96, y) + line(xs[0] - 4, y + 20, 128, y + 20, { tone: 'brand', arrow: true });
  [1, 2, 3, 4].forEach((v, i) => (b += box(xs[i], y, v, 'brand')));
  b += left(0, y) + left(1, y) + left(2, y);
  b += line(680, y + 20, xs[3] + 66, y + 20, { tone: 'good', arrow: true });
  b += text(708, y + 20, 'head', { size: 14, weight: 700, fill: C.green });
  add('linked-list-reverse', W, H, 'Reversing the list 1 2 3 4 by turning each next pointer around', b);
}

{
  const W = 820;
  const H = 340;
  const pos = { 1: [90, 190], 2: [200, 190], 3: [310, 190], 4: [420, 104], 5: [530, 190], 6: [420, 276] };
  const nodes = {};
  for (const [id, [x, y]] of Object.entries(pos)) nodes[id] = { x, y, r: 24, label: id, tone: id === '5' ? 'good' : +id >= 3 ? 'brand' : 'plain' };
  let b = heading(32, 32, "Floyd's cycle check: slow moves 1 step, fast moves 2");
  for (const [a, c] of [
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 3],
  ]) {
    b += connect(nodes[a], nodes[c], { directed: true, tone: 'ink' });
  }
  b += Object.values(nodes).map(drawNode).join('');
  b += tag(572, 134, 'slow and fast meet', { size: 13, fill: C.green });
  b += text(365, 190, 'cycle', { size: 13, weight: 700, fill: C.brand });
  b += table(
    640,
    70,
    [
      ['step', 'slow', 'fast'],
      [0, 1, 1],
      [1, 2, 3],
      [2, 3, 5],
      [3, 4, 3],
      [4, 5, 5],
    ],
    {
      w: 56,
      h: 30,
      size: 14,
      tones: { '0,0': 'muted', '0,1': 'muted', '0,2': 'muted', '5,0': 'good', '5,1': 'good', '5,2': 'good' },
    },
  );
  b += note(32, 318, 'With no cycle, fast reaches NULL first. O(n) time and O(1) extra space.');
  add('linked-list-cycle', W, H, 'A linked list whose tail points back to node 3, with slow and fast pointers meeting at node 5', b);
}

// ---------- Stacks and queues ----------
{
  const W = 780;
  const H = 340;
  const base = 272;
  const drawStack = (cx, items, topTone) => {
    let out = path(`M${cx - 58} 110 L${cx - 58} ${base + 6} L${cx + 58} ${base + 6} L${cx + 58} 110`, { color: C.muted, sw: 2.5 });
    items.forEach((v, k) => {
      const top = k === items.length - 1;
      const t = top ? TONES[topTone] : TONES.plain;
      out += rect(cx - 50, base - (k + 1) * 42, 100, 38, { fill: t.fill, stroke: t.stroke, rx: 6, sw: top ? 2 : 1.5 });
      out += text(cx, base - (k + 1) * 42 + 19, v, { size: 17, weight: 700, mono: true, fill: t.text });
    });
    const topY = base - items.length * 42 + 19;
    out += text(cx + 64, topY, '← top', { size: 13, weight: 700, fill: C.brand, anchor: 'start' });
    return out;
  };
  let b = heading(32, 32, 'Stack: last in, first out (LIFO)');
  b += drawStack(120, [10, 20], 'brand');
  b += drawStack(390, [10, 20, 30], 'good');
  b += drawStack(660, [10, 20], 'brand');
  // popped item floating above the last stack
  b += rect(610, 58, 100, 38, { fill: TONES.bad.fill, stroke: C.red, rx: 6, dash: '5 4' });
  b += text(660, 77, 30, { size: 17, weight: 700, mono: true, fill: TONES.bad.text });
  b += line(660, 118, 660, 100, { tone: 'bad', arrow: true });
  b += line(206, 190, 300, 190, { tone: 'good', arrow: true }) + text(253, 172, 'push(30)', { size: 14, weight: 700, mono: true, fill: C.green });
  b += line(478, 190, 572, 190, { tone: 'bad', arrow: true }) + text(525, 172, 'pop()', { size: 14, weight: 700, mono: true, fill: C.red });
  b += text(120, 304, 'start', { size: 14, fill: C.text, weight: 600 });
  b += text(390, 304, 'after push(30)', { size: 14, fill: C.text, weight: 600 });
  b += text(660, 304, 'after pop() → 30', { size: 14, fill: C.text, weight: 600 });
  add('stack-push-pop', W, H, 'A stack before and after push(30) and pop()', b);
}

{
  const W = 780;
  const H = 350;
  const x = 180;
  const w = 58;
  let b = heading(32, 32, 'Queue: first in, first out (FIFO)');
  const rows = [
    { label: 'Start', values: [10, 20, 30], tones: { 0: 'brand' }, front: 0, back: 2, words: 'oldest item waits at the front' },
    { label: 'push(40)', values: [10, 20, 30, 40], tones: { 0: 'brand', 3: 'good' }, front: 0, back: 3, words: 'new items join at the back' },
    { label: 'pop()', values: [10, 20, 30, 40], tones: { 0: 'bad', 1: 'brand' }, front: 1, back: 3, words: 'the front item (10) leaves first' },
  ];
  rows.forEach((r, k) => {
    const y = 76 + k * 92;
    b += text(32, y + 22, r.label, { size: 14, weight: 700, anchor: 'start', mono: true, fill: C.text });
    b += cells(x, y, r.values, { w, h: 44, tones: r.tones, indices: false });
    b += pointer(cellMid(x, r.front, w), y + 44, 'front', { tone: 'brand', length: 14, size: 12 });
    b += pointer(cellMid(x, r.back, w), y + 44, 'back', { tone: 'good', length: 14, size: 12 });
    b += text(x + 4 * w + 36, y + 22, r.words, { size: 14, anchor: 'start', fill: C.text });
  });
  add('queue-push-pop', W, H, 'A queue before and after push(40) and pop()', b);
}

{
  const W = 780;
  const H = 420;
  const cx = 250;
  const cy = 226;
  const R = 128;
  const values = { 6: 15, 7: 22, 0: 30, 1: 41 };
  let b = heading(32, 32, 'Circular queue: the index wraps around with % capacity');
  for (let i = 0; i < 8; i++) {
    const a = ((-90 + i * 45) * Math.PI) / 180;
    const x = cx + R * Math.cos(a);
    const y = cy + R * Math.sin(a);
    const filled = i in values;
    const t = TONES[i === 6 ? 'brand' : i === 1 ? 'good' : filled ? 'plain' : 'empty'];
    b += rect(x - 29, y - 20, 58, 40, { fill: t.fill, stroke: t.stroke, rx: 8, dash: t.dash, sw: 1.75 });
    if (filled) b += text(x, y, values[i], { size: 16, weight: 700, mono: true, fill: t.text });
    b += text(cx + 80 * Math.cos(a), cy + 80 * Math.sin(a), i, { size: 12, mono: true, fill: C.faint });
    if (i === 6 || i === 1) {
      const tone = i === 6 ? 'brand' : 'good';
      b += line(cx + (R + 76) * Math.cos(a), cy + (R + 76) * Math.sin(a), cx + (R + 30) * Math.cos(a), cy + (R + 30) * Math.sin(a), { tone, arrow: true });
      b += text(cx + (R + 94) * Math.cos(a), cy + (R + 90) * Math.sin(a), i === 6 ? 'front' : 'rear', { size: 14, weight: 700, fill: C[tone === 'brand' ? 'brand' : 'green'] });
    }
  }
  b += text(cx, cy - 10, 'after slot 7', { size: 13, fill: C.muted });
  b += text(cx, cy + 12, 'comes slot 0', { size: 14, weight: 700, fill: C.amber });
  const lines = [
    [['capacity = 8', C.ink, 700]],
    [['front = 6', C.brand, 700], [', ', C.text], ['rear = 1', C.green, 700]],
    [['size = 4', C.ink, 700], [' (slots 6, 7, 0, 1)', C.text]],
    [['next push → slot ', C.text], ['(1 + 1) % 8 = 2', C.ink, 700]],
    [['No shifting, so push and pop are O(1)', C.text]],
  ];
  lines.forEach((parts, k) => (b += spans(470, 150 + k * 32, parts)));
  add('circular-queue', W, H, 'A circular queue of capacity 8 whose items wrap from slot 7 to slot 0', b);
}

{
  const W = 820;
  const H = 380;
  const arr = [2, 7, 3, 5, 4, 6, 8];
  const next = [7, 8, 5, 6, 6, 8, -1];
  const bx = (i) => 110 + i * 86;
  const base = 262;
  const top = (v) => base - v * 21;
  let b = heading(32, 32, 'Next greater element: the first taller bar to the right');
  arr.forEach((v, i) => {
    b += rect(bx(i), top(v), 56, v * 21, { fill: TONES.brand.fill, stroke: C.brand, rx: 6, sw: 1.75 });
    b += text(bx(i) + 28, base - 14, v, { size: 16, weight: 700, mono: true, fill: TONES.brand.text });
  });
  b += line(90, base, bx(6) + 76, base, { color: C.muted, sw: 1.5 });
  arr.forEach((v, i) => {
    const j = arr.findIndex((u, k) => k > i && u > v);
    if (j < 0) return;
    const x1 = bx(i) + 28;
    const x2 = bx(j) + 28;
    const peak = Math.min(top(v), top(arr[j])) - 22 - (j - i) * 6;
    b += path(`M${x1} ${top(v) - 4} C${x1} ${peak}, ${x2} ${peak}, ${x2} ${top(arr[j]) - 6}`, { tone: 'good', arrow: true, sw: 2 });
  });
  b += text(94, base + 36, 'answer', { size: 13, weight: 700, anchor: 'end', fill: C.text });
  b += cells(bx(0), base + 18, next, { w: 56, gap: 30, h: 34, indices: false, size: 15, tones: { 0: 'good', 1: 'good', 2: 'good', 3: 'good', 4: 'good', 5: 'good', 6: 'muted' } });
  b += note(32, 356, 'A stack of bars still waiting for an answer finds them all in one pass: O(n).');
  add('monotonic-stack', W, H, 'Bars 2 7 3 5 4 6 8 with arrows to their next greater element', b);
}

// ---------- Hashing ----------
{
  const W = 780;
  const H = 400;
  const chains = { 1: [15, 8, 22], 4: [11], 5: [12], 6: [27] };
  let b = heading(32, 32, 'Hash table with chaining: h(key) = key % 7');
  for (let i = 0; i < 7; i++) {
    const y = 62 + i * 44;
    b += text(106, y + 18, i, { size: 13, mono: true, fill: C.faint, anchor: 'end' });
    b += rect(116, y, 56, 36, { fill: C.panel, stroke: C.faint, rx: 6 });
    const chain = chains[i];
    if (!chain) {
      b += text(190, y + 18, 'empty', { size: 12, fill: C.faint, anchor: 'start' });
      continue;
    }
    chain.forEach((key, k) => {
      const x = 196 + k * 92;
      b += line(k === 0 ? 172 : x - 32, y + 18, x - 4, y + 18, { tone: 'ink', arrow: true, sw: 1.75 });
      const t = TONES[k > 0 ? 'active' : 'brand'];
      b += rect(x, y + 2, 60, 32, { fill: t.fill, stroke: t.stroke, rx: 6, sw: 1.75 });
      b += text(x + 30, y + 18, key, { size: 15, weight: 700, mono: true, fill: t.text });
    });
  }
  b += text(520, 70, 'insert in this order', { size: 14, weight: 700, anchor: 'start' });
  [
    ['15 % 7 = 1', false],
    ['11 % 7 = 4', false],
    ['27 % 7 = 6', false],
    ['8 % 7 = 1', true],
    ['12 % 7 = 5', false],
    ['22 % 7 = 1', true],
  ].forEach(([row, clash], k) => {
    b += text(520, 102 + k * 30, row, { size: 15, mono: true, anchor: 'start', fill: C.ink, weight: 600 });
    if (clash) b += text(640, 102 + k * 30, 'collision', { size: 13, anchor: 'start', fill: C.amber, weight: 700 });
  });
  b += note(32, 382, 'Average O(1) per lookup while chains stay short; a good hash spreads keys evenly.');
  add('hash-chaining', W, H, 'Hash table of size 7 where keys 15, 8 and 22 collide in bucket 1', b);
}

{
  const W = 780;
  const H = 300;
  const x = 124;
  const w = 74;
  let b = heading(32, 32, 'Open addressing (linear probing): take the next free slot');
  b += cells(x, 150, ['', 15, 8, 22, 11, 12, 27], {
    w,
    h: 48,
    tones: { 0: 'empty', 1: 'active', 2: 'active', 3: 'good' },
  });
  b += tag(cellMid(x, 1, w), 92, 'h(22) = 22 % 7 = 1', { size: 13, fill: C.ink, border: C.line });
  for (const [from, label] of [
    [1, 'taken'],
    [2, 'taken'],
  ]) {
    const x1 = cellMid(x, from, w);
    const x2 = cellMid(x, from + 1, w);
    b += path(`M${x1 + 8} 146 Q${(x1 + x2) / 2} 112 ${x2 - 8} 146`, { tone: 'active', arrow: true, sw: 2 });
    b += text((x1 + x2) / 2, 118, label, { size: 12, weight: 700, fill: C.amber });
  }
  b += text(cellMid(x, 3, w), 238, 'free ✓', { size: 13, weight: 700, fill: C.green });
  b += note(32, 274, 'Insert order: 15, 11, 27, 8, 12, 22. Both 8 and 22 hash to slot 1, so they probe forward.');
  add('hash-open-addressing', W, H, 'Linear probing placing key 22 in slot 3 after slots 1 and 2 are taken', b);
}

// ---------- Heaps ----------
{
  const W = 780;
  const H = 440;
  const values = [50, 30, 40, 10, 20, 35, 25];
  let b = heading(32, 32, 'A max-heap: a complete binary tree stored in an array');
  const t = tree(values, { x: 120, y: 86, width: 540, gap: 70, r: 23, tones: { 0: 'brand', 1: 'active', 3: 'good', 4: 'good' } });
  b += t.svg;
  for (const node of t.nodes.values()) b += text(node.x + 30, node.y - 18, node.i, { size: 12, mono: true, fill: C.faint });
  const ax = 166;
  const aw = 64;
  b += cells(ax, 334, values, { w: aw, h: 46, tones: { 0: 'brand', 1: 'active', 3: 'good', 4: 'good' } });
  for (const to of [3, 4]) {
    const x1 = cellMid(ax, 1, aw);
    const x2 = cellMid(ax, to, aw);
    const peak = to === 3 ? 298 : 282;
    b += path(`M${x1} 330 C${x1} ${peak}, ${x2} ${peak}, ${x2} 328`, { tone: 'good', arrow: true, sw: 2 });
  }
  b += tag(cellMid(ax, 2, aw) + 30, 268, 'children of 1: 2·1 + 1 = 3 and 2·1 + 2 = 4', { size: 12, fill: C.green });
  b += spans(32, 418, [
    ['children of i: ', C.text],
    ['2i + 1', C.green, 700],
    [' and ', C.text],
    ['2i + 2', C.green, 700],
    ['   ·   parent of i: ', C.text],
    ['(i − 1) / 2', C.brand, 700],
  ]);
  add('heap-tree-array', W, H, 'The max-heap 50 30 40 10 20 35 25 drawn as a tree and as an array', b);
}

{
  const W = 820;
  const H = 410;
  let b = heading(32, 32, 'Insert 45 into a max-heap: add at the end, then sift up');
  b += text(215, 70, '1. Add 45 at the next free spot', { size: 14, weight: 700, fill: C.text });
  b += tree([50, 30, 40, 10, 20, 35, 25, 45], {
    x: 25,
    y: 108,
    width: 380,
    gap: 68,
    r: 19,
    size: 14,
    tones: { 7: 'active' },
    edgeTones: { 7: 'active' },
  }).svg;
  b += line(405, 200, 428, 200, { tone: 'plain', arrow: true });
  b += text(620, 70, '2. Swap up while bigger than the parent', { size: 14, weight: 700, fill: C.text });
  b += tree([50, 45, 40, 30, 20, 35, 25, 10], {
    x: 430,
    y: 108,
    width: 380,
    gap: 68,
    r: 19,
    size: 14,
    tones: { 1: 'good' },
    edgeTones: { 1: 'good', 3: 'good', 7: 'good' },
  }).svg;
  b += spans(32, 362, [
    ['45 > 10', C.ink, 700],
    [' swap,  ', C.text],
    ['45 > 30', C.ink, 700],
    [' swap,  ', C.text],
    ['45 < 50', C.ink, 700],
    [' stop', C.text],
  ]);
  b += note(32, 390, 'At most one swap per level, so insert costs O(log n).');
  add('heap-insert', W, H, 'Inserting 45 into a max-heap and sifting it up past 10 and 30', b);
}

