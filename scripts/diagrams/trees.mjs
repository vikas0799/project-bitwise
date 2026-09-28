// Diagrams for the tree notes: binary trees, traversals, tree properties,
// views, LCA and binary search trees.
import {
  C,
  cells,
  connect,
  drawNode,
  heading,
  legend,
  line,
  note,
  rect,
  spans,
  tag,
  text,
  tree,
} from './svg.mjs';

export const trees = [];
const add = (name, width, height, title, body) => trees.push({ name, width, height, title, body });

// A labelled row of small cells, used to show traversal orders and views.
function sequence(x, y, label, values, tone, labelColor) {
  return (
    text(x, y, label, { size: 14, weight: 700, anchor: 'start', fill: labelColor }) +
    cells(x, y + 16, values, { w: 38, h: 32, indices: false, size: 15, tones: Object.fromEntries(values.map((_, i) => [i, tone])) })
  );
}

// ---------- Binary tree basics ----------
{
  const W = 800;
  const H = 430;
  let b = heading(32, 32, 'Tree words: root, parent, child, sibling, leaf, subtree');
  b += rect(528, 132, 158, 160, { fill: '#F5F8FF', stroke: C.brand, dash: '6 5', rx: 16 });
  b += text(607, 120, 'subtree of C', { size: 13, weight: 700, fill: C.brand });
  const t = tree(['A', 'B', 'C', 'D', 'E', null, 'F', null, null, 'G'], {
    x: 180,
    y: 90,
    width: 520,
    gap: 80,
    r: 24,
    tones: { 0: 'brand', 3: 'good', 6: 'good', 9: 'good' },
  });
  b += t.svg;
  ['level 0', 'level 1', 'level 2', 'level 3'].forEach((label, k) => (b += text(40, 90 + k * 80, label, { size: 13, fill: C.muted, anchor: 'start' })));
  b += tag(500, 90, 'root', { size: 13, fill: C.brand, border: C.brand });
  b += text(274, 170, 'parent of D and E', { size: 13, weight: 600, fill: C.text, anchor: 'end' });
  b += tag(310, 262, 'siblings', { size: 12, fill: C.text, border: C.line });
  b += legend(40, 382, [
    ['brand', 'root'],
    ['good', 'leaf: no children'],
  ]);
  b += note(40, 410, 'Height of this tree = 3: the longest root-to-leaf path A → B → E → G has 3 edges.');
  add('tree-terminology', W, H, 'A labelled tree showing root, parent, siblings, leaves, levels and a subtree', b);
}

{
  const W = 820;
  const H = 300;
  const shapes = [
    ['Full', ['', '', '', '', ''], ['every node has', '0 or 2 children']],
    ['Complete', ['', '', '', '', '', ''], ['levels full except the last,', 'which fills from the left']],
    ['Perfect', ['', '', '', '', '', '', ''], ['every level is', 'completely full']],
    ['Skewed', ['', null, '', null, null, null, ''], ['one child per node,', 'like a linked list']],
  ];
  let b = heading(32, 32, 'Four shapes of binary tree');
  shapes.forEach(([name, values, rule], k) => {
    const x0 = 20 + k * 200;
    b += rect(x0, 54, 190, 230, { fill: '#FFFFFF', stroke: C.grid, rx: 14 });
    b += tree(values, { x: x0 + 10, y: 84, width: 170, gap: 50, r: 13, defaultTone: 'brand' }).svg;
    b += text(x0 + 95, 222, name, { size: 16, weight: 700 });
    b += text(x0 + 95, 246, rule[0], { size: 12.5, fill: C.muted });
    b += text(x0 + 95, 264, rule[1], { size: 12.5, fill: C.muted });
  });
  add('tree-types', W, H, 'Full, complete, perfect and skewed binary trees side by side', b);
}

{
  const W = 820;
  const H = 390;
  let b = heading(32, 32, 'Four ways to visit the same tree');
  b += tree([1, 2, 3, 4, 5, null, 6], { x: 30, y: 110, width: 330, gap: 90, r: 24 }).svg;
  b += sequence(410, 74, 'Preorder: root, left, right', [1, 2, 4, 5, 3, 6], 'brand', C.brand);
  b += sequence(410, 152, 'Inorder: left, root, right', [4, 2, 5, 1, 3, 6], 'good', C.green);
  b += sequence(410, 230, 'Postorder: left, right, root', [4, 5, 2, 6, 3, 1], 'special', C.violet);
  b += sequence(410, 308, 'Level order: level by level, left to right', [1, 2, 3, 4, 5, 6], 'active', C.amber);
  add('tree-traversals', W, H, 'Preorder, inorder, postorder and level order of the same six-node tree', b);
}

{
  const W = 820;
  const H = 390;
  let b = heading(32, 32, 'Level order (BFS): use a queue, one level at a time');
  [0, 1, 2].forEach((k) => {
    b += rect(24, 70 + k * 84, 390, 64, { fill: C.panel, stroke: C.grid, rx: 12 });
    b += text(40, 102 + k * 84, `level ${k}`, { size: 13, fill: C.muted, anchor: 'start' });
  });
  b += tree([1, 2, 3, 4, 5, null, 6], {
    x: 100,
    y: 102,
    width: 300,
    gap: 84,
    r: 22,
    tones: { 0: 'brand', 1: 'good', 2: 'good', 3: 'special', 4: 'special', 6: 'special' },
  }).svg;
  const steps = [
    ['start', [1], 'brand'],
    ['after level 0', [2, 3], 'good'],
    ['after level 1', [4, 5, 6], 'special'],
    ['after level 2', ['empty'], 'muted'],
  ];
  b += text(450, 76, 'queue', { size: 14, weight: 700, anchor: 'start' });
  steps.forEach(([label, values, tone], k) => {
    const y = 96 + k * 50;
    b += text(450, y + 15, label, { size: 13, fill: C.text, anchor: 'start' });
    const shown = values[0] === 'empty' ? [''] : values;
    b += cells(560, y, shown, {
      w: values[0] === 'empty' ? 70 : 38,
      h: 30,
      indices: false,
      size: 14,
      tones: Object.fromEntries(shown.map((_, i) => [i, values[0] === 'empty' ? 'empty' : tone])),
    });
    if (values[0] === 'empty') b += text(595, y + 15, 'empty', { size: 12, fill: C.faint });
  });
  b += spans(450, 320, [['result: ', C.text], ['[[1], [2, 3], [4, 5, 6]]', C.ink, 700]], { mono: true, size: 14 });
  add('tree-level-order', W, H, 'Level order traversal with the queue contents after each level', b);
}

// ---------- Tree properties ----------
{
  const W = 800;
  const H = 440;
  const heights = { 0: 3, 1: 2, 2: 1, 3: 1, 4: 0, 6: 0, 7: 0 };
  let b = heading(32, 32, 'Depth counts down from the root, height counts up from the leaves');
  const t = tree([1, 2, 3, 4, 5, null, 6, 7], { x: 170, y: 90, width: 520, gap: 82, r: 22, tones: { 0: 'brand' } });
  b += t.svg;
  ['depth 0', 'depth 1', 'depth 2', 'depth 3'].forEach((label, k) => (b += text(40, 90 + k * 82, label, { size: 13, fill: C.brand, anchor: 'start', weight: 600 })));
  for (const node of t.nodes.values()) b += tag(node.x + 44, node.y - 16, `h = ${heights[node.i]}`, { size: 12, fill: C.amber, border: '#FCD34D' });
  b += note(32, 392, 'Counting edges: a leaf has height 0 and depth = number of edges from the root.');
  b += spans(32, 420, [['height(node) = 1 + max(height(left), height(right))', C.ink, 700]], { size: 14, mono: true });
  add('tree-height-depth', W, H, 'A tree labelled with the depth of each level and the height of each node', b);
}

{
  const W = 800;
  const H = 430;
  const onPath = { 7: 'good', 3: 'brand', 1: 'brand', 0: 'brand', 2: 'brand', 6: 'brand', 14: 'good' };
  let b = heading(32, 32, 'Diameter: the longest path between any two nodes');
  b += tree([1, 2, 3, 4, 5, 6, 7, 8, null, null, null, null, null, null, 9], {
    x: 60,
    y: 90,
    width: 680,
    gap: 80,
    r: 21,
    tones: onPath,
    edgeTones: { 7: 'brand', 3: 'brand', 1: 'brand', 2: 'brand', 6: 'brand', 14: 'brand' },
  }).svg;
  b += spans(32, 376, [
    ['diameter = 6 edges', C.brand, 700],
    ['  (8 → 4 → 2 → 1 → 3 → 7 → 9)', C.text],
  ]);
  b += note(32, 404, 'At each node, left depth + right depth = the longest path through that node. Keep the max.');
  add('tree-diameter', W, H, 'A tree with its longest path of six edges highlighted from node 8 to node 9', b);
}

{
  const W = 820;
  const H = 430;
  const pos = { 1: [0, 0], 2: [-1, 1], 3: [1, 1], 4: [-2, 2], 5: [0, 2], 6: [2, 2], 8: [-1, 3] };
  const nodes = {};
  for (const [id, [hd, depth]] of Object.entries(pos)) nodes[id] = { x: 250 + hd * 90, y: 100 + depth * 80, r: 22, label: id };
  let b = heading(32, 32, 'Tree views: what you see from each side');
  for (let hd = -2; hd <= 2; hd++) {
    b += line(250 + hd * 90, 66, 250 + hd * 90, 360, { color: C.grid, sw: 1.5, dash: '5 6' });
    b += text(250 + hd * 90, 380, `hd ${hd > 0 ? '+' : hd < 0 ? '−' : ''}${Math.abs(hd)}`, { size: 12, fill: C.muted, mono: true });
  }
  for (const [a, c] of [
    [1, 2],
    [1, 3],
    [2, 4],
    [2, 5],
    [5, 8],
    [3, 6],
  ]) {
    b += connect(nodes[a], nodes[c]);
  }
  b += Object.values(nodes).map(drawNode).join('');
  b += sequence(520, 74, 'Top view', [4, 2, 1, 3, 6], 'brand', C.brand);
  b += sequence(520, 146, 'Bottom view', [4, 8, 5, 3, 6], 'good', C.green);
  b += sequence(520, 218, 'Left view', [1, 2, 4, 8], 'special', C.violet);
  b += sequence(520, 290, 'Right view', [1, 3, 6, 8], 'active', C.amber);
  b += note(32, 410, 'hd = horizontal distance: the root is 0, a left child is parent − 1, a right child is parent + 1.');
  add('tree-views', W, H, 'A tree placed on horizontal distance columns with its top, bottom, left and right views', b);
}

{
  const W = 800;
  const H = 420;
  let b = heading(32, 32, 'Lowest common ancestor (LCA) of 6 and 4 is 5');
  b += tree([3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], {
    x: 60,
    y: 86,
    width: 680,
    gap: 76,
    r: 22,
    tones: { 1: 'good', 3: 'active', 10: 'active', 4: 'brand' },
    edgeTones: { 3: 'brand', 4: 'brand', 10: 'brand' },
  }).svg;
  b += legend(32, 368, [
    ['active', 'the two nodes'],
    ['good', 'their LCA'],
    ['brand', 'paths up to the LCA'],
  ]);
  b += note(32, 396, 'The LCA is the deepest node with both nodes in its subtree. A node counts as its own ancestor.');
  add('tree-lca', W, H, 'A binary tree where the lowest common ancestor of nodes 6 and 4 is node 5', b);
}

// ---------- Binary search trees ----------
const BST = [8, 3, 10, 1, 6, null, 14, null, null, 4, 7, null, null, 13];

{
  const W = 820;
  const H = 450;
  let b = heading(32, 32, 'Binary search tree: smaller keys on the left, bigger on the right');
  b += rect(96, 146, 296, 216, { fill: '#F5F8FF', stroke: '#8AB2FF', dash: '6 5', rx: 18 });
  b += text(244, 134, 'every key < 8', { size: 13, weight: 700, fill: C.brand });
  b += rect(540, 146, 176, 216, { fill: '#F0FDF7', stroke: '#6EE7B7', dash: '6 5', rx: 18 });
  b += text(628, 134, 'every key > 8', { size: 13, weight: 700, fill: C.green });
  b += tree(BST, { x: 40, y: 100, width: 720, gap: 78, r: 22, tones: { 0: 'active' } }).svg;
  b += text(32, 410, 'inorder', { size: 14, weight: 700, anchor: 'start' });
  b += cells(112, 394, [1, 3, 4, 6, 7, 8, 10, 13, 14], {
    w: 40,
    h: 32,
    indices: false,
    size: 14,
    tones: Object.fromEntries([...Array(9)].map((_, i) => [i, 'good'])),
  });
  b += text(482, 410, '← already sorted', { size: 14, weight: 700, anchor: 'start', fill: C.green });
  add('bst-property', W, H, 'A binary search tree rooted at 8 with its left and right subtrees shaded and its sorted inorder', b);
}

{
  const W = 820;
  const H = 420;
  let b = heading(32, 32, 'Search for 7 in a BST: one comparison per level');
  b += tree(BST, {
    x: 40,
    y: 100,
    width: 720,
    gap: 78,
    r: 22,
    tones: { 0: 'active', 1: 'active', 4: 'active', 10: 'good' },
    edgeTones: { 1: 'active', 4: 'active', 10: 'active' },
  }).svg;
  b += tag(262, 118, '7 < 8, go left', { size: 13, fill: C.amber, border: '#FCD34D' });
  b += tag(346, 205, '7 > 3, go right', { size: 13, fill: C.amber, border: '#FCD34D' });
  b += tag(428, 292, '7 > 6, go right', { size: 13, fill: C.amber, border: '#FCD34D' });
  b += note(32, 396, 'Each step skips a whole subtree: O(h), which is O(log n) when balanced and O(n) when skewed.');
  add('bst-search', W, H, 'The search path 8, 3, 6, 7 in a binary search tree', b);
}

{
  const W = 820;
  const H = 570;
  const cases = [
    ['Case 1: a leaf', ['No children:', 'just remove it.'], [6, 4, 7], { 1: 'bad' }, [6, null, 7], {}],
    ['Case 2: one child', ['One child: link the parent', 'straight to that child.'], [10, null, 14, null, null, 13], { 2: 'bad' }, [10, null, 13], { 2: 'good' }],
    [
      'Case 3: two children',
      ['Copy in the inorder successor', '(smallest key on the right),', 'then delete the successor.'],
      [3, 1, 6, null, null, 4, 7],
      { 0: 'bad', 5: 'active' },
      [4, 1, 6, null, null, null, 7],
      { 0: 'good' },
    ],
  ];
  let b = heading(32, 32, 'Deleting from a BST: three cases');
  cases.forEach(([title, lines, before, beforeTones, after, afterTones], k) => {
    const y0 = 76 + k * 170;
    if (k > 0) b += line(32, y0 - 20, W - 32, y0 - 20, { color: C.grid, sw: 1 });
    b += text(32, y0 + 6, title, { size: 15, weight: 700, anchor: 'start' });
    lines.forEach((row, i) => (b += text(32, y0 + 32 + i * 20, row, { size: 13, anchor: 'start', fill: C.muted })));
    b += text(400, y0 - 4, 'before', { size: 12, fill: C.faint });
    b += tree(before, { x: 310, y: y0 + 22, width: 180, gap: 46, r: 18, size: 14, tones: beforeTones }).svg;
    b += line(510, y0 + 60, 562, y0 + 60, { tone: 'plain', arrow: true });
    b += text(670, y0 - 4, 'after', { size: 12, fill: C.faint });
    b += tree(after, { x: 580, y: y0 + 22, width: 180, gap: 46, r: 18, size: 14, tones: afterTones }).svg;
  });
  add('bst-delete-cases', W, H, 'Before and after pictures for deleting a leaf, a node with one child and a node with two children', b);
}
