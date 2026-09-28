// Diagrams for the graph notes: representation, BFS, DFS, topological sort,
// shortest paths and minimum spanning trees.
import { C, TONES, badge, cells, connect, drawNode, heading, line, note, rect, spans, table, tag, text } from './svg.mjs';

export const graphs = [];
const add = (name, width, height, title, body) => graphs.push({ name, width, height, title, body });

const byId = (list) => Object.fromEntries(list.map((node) => [node.id, node]));

// ---------- Representation ----------
{
  const W = 880;
  const H = 380;
  const nodes = byId([
    { id: 0, x: 90, y: 170 },
    { id: 1, x: 220, y: 100 },
    { id: 2, x: 200, y: 270 },
    { id: 3, x: 340, y: 170 },
    { id: 4, x: 340, y: 310 },
  ]);
  const edges = [
    [0, 1],
    [0, 2],
    [1, 2],
    [1, 3],
    [3, 4],
  ];
  let b = heading(32, 32, 'One graph, three ways to see it');
  b += text(215, 64, 'drawing', { size: 13, weight: 700, fill: C.muted });
  for (const [a, c] of edges) b += connect({ ...nodes[a], r: 24 }, { ...nodes[c], r: 24 });
  for (const node of Object.values(nodes)) b += drawNode({ ...node, r: 24, label: node.id, tone: 'brand' });

  b += text(500, 64, 'adjacency list', { size: 13, weight: 700, fill: C.muted });
  const list = { 0: [1, 2], 1: [0, 2, 3], 2: [0, 1], 3: [1, 4], 4: [3] };
  Object.entries(list).forEach(([id, neighbours], k) => {
    const y = 86 + k * 50;
    b += rect(420, y, 36, 34, { fill: TONES.brand.fill, stroke: C.brand, rx: 6 });
    b += text(438, y + 17, id, { size: 15, weight: 700, mono: true, fill: TONES.brand.text });
    b += line(458, y + 17, 476, y + 17, { tone: 'ink', arrow: true, sw: 1.75 });
    b += cells(480, y, neighbours, { w: 36, h: 34, indices: false, size: 15 });
  });

  const mx = 668;
  b += text(mx + 80, 64, 'adjacency matrix', { size: 13, weight: 700, fill: C.muted });
  const matrix = [...Array(5)].map((_, r) => [...Array(5)].map((__, c) => (list[r].includes(c) ? 1 : 0)));
  const tones = {};
  matrix.forEach((row, r) => row.forEach((v, c) => v && (tones[`${r},${c}`] = 'brand')));
  for (let k = 0; k < 5; k++) {
    b += text(mx + k * 32 + 16, 84, k, { size: 12, mono: true, fill: C.faint });
    b += text(mx - 12, 100 + k * 32 + 16, k, { size: 12, mono: true, fill: C.faint });
  }
  b += table(mx, 100, matrix, { w: 32, h: 32, tones, size: 14 });
  b += note(32, 352, 'List: O(V + E) space, best for sparse graphs.   Matrix: O(V²) space, but checks an edge in O(1).');
  add('graph-representation', W, H, 'A five-node undirected graph with its adjacency list and adjacency matrix', b);
}

// ---------- BFS and DFS on the same graph ----------
const G = byId([
  { id: 0, x: 90, y: 200 },
  { id: 1, x: 230, y: 120 },
  { id: 2, x: 230, y: 290 },
  { id: 3, x: 380, y: 70 },
  { id: 4, x: 380, y: 190 },
  { id: 5, x: 380, y: 310 },
  { id: 6, x: 530, y: 250 },
]);
const G_EDGES = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 5],
  [4, 6],
  [5, 6],
];

function traversal({ name, title, heading: head, tree, order, tones, directed, notes, extra = '' }) {
  const W = 820;
  const H = 440;
  const inTree = (a, c) => tree.some(([p, q]) => (p === a && q === c) || (p === c && q === a));
  let b = heading(32, 32, head) + extra;
  for (const [a, c] of G_EDGES) {
    if (inTree(a, c)) continue;
    b += connect({ ...G[a], r: 24 }, { ...G[c], r: 24 }, { tone: 'muted', dash: '6 6' });
  }
  for (const [a, c] of tree) b += connect({ ...G[a], r: 24 }, { ...G[c], r: 24 }, { tone: 'brand', sw: 3, directed });
  for (const node of Object.values(G)) b += drawNode({ ...node, r: 24, label: node.id, tone: tones[node.id] });
  order.forEach((id, k) => (b += badge(G[id].x + 21, G[id].y - 21, k + 1, { tone: 'ink', r: 10, size: 11 })));
  notes.forEach((row, k) => (b += text(600, 110 + k * 26, row, { size: 13.5, anchor: 'start', fill: C.text })));
  b += text(32, 402, 'visit order', { size: 14, weight: 700, anchor: 'start' });
  b += cells(130, 386, order, { w: 38, h: 32, indices: false, size: 15, tones: Object.fromEntries(order.map((_, i) => [i, 'brand'])) });
  b += line(430, 402, 470, 402, { tone: 'brand', sw: 3 }) + text(478, 402, 'edge used', { size: 13, anchor: 'start', fill: C.text });
  b += line(580, 402, 620, 402, { tone: 'muted', dash: '6 6' }) + text(628, 402, 'edge not used', { size: 13, anchor: 'start', fill: C.text });
  add(name, W, H, title, b);
}

{
  let extra = '';
  [0, 1, 2, 3].forEach((d) => {
    const x = [90, 230, 380, 530][d];
    extra += line(x, 54, x, 350, { color: C.grid, sw: 1.5, dash: '4 6' });
    extra += text(x, 364, `distance ${d}`, { size: 12, fill: C.muted });
  });
  traversal({
    name: 'graph-bfs',
    title: 'Breadth-first search from node 0 visiting nodes in order of distance',
    heading: 'BFS from 0: visit everything 1 step away, then 2, then 3',
    tree: [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
      [2, 5],
      [4, 6],
    ],
    order: [0, 1, 2, 3, 4, 5, 6],
    tones: { 0: 'active', 1: 'brand', 2: 'brand', 3: 'special', 4: 'special', 5: 'special', 6: 'good' },
    directed: true,
    notes: ['Uses a queue: first in,', 'first out.', '', 'Finds the fewest-edges', 'path from the start to', 'every node.'],
    extra,
  });
}

traversal({
  name: 'graph-dfs',
  title: 'Depth-first search from node 0 going deep before backtracking',
  heading: 'DFS from 0: go as deep as possible, then back up',
  tree: [
    [0, 1],
    [1, 3],
    [1, 4],
    [4, 6],
    [6, 5],
    [5, 2],
  ],
  order: [0, 1, 3, 4, 6, 5, 2],
  tones: { 0: 'active', 1: 'brand', 2: 'brand', 3: 'brand', 4: 'brand', 5: 'brand', 6: 'brand' },
  directed: true,
  notes: ['Uses recursion (or a stack).', '', '3 is a dead end, so DFS', 'backs up to 1 and tries 4.', '', 'Used for cycles, components', 'and topological sort.'],
});

// ---------- Topological sort ----------
{
  const W = 820;
  const H = 420;
  const P = (id, x, y, tone) => ({ id, x, y, w: 132, h: 42, label: id, tone, size: 14 });
  const nodes = byId([
    P('Maths', 120, 100, 'good'),
    P('Programming', 120, 200, 'good'),
    P('DBMS', 120, 300, 'good'),
    P('DSA', 410, 140, 'brand'),
    P('Web Dev', 410, 260, 'brand'),
    P('Projects', 680, 200, 'special'),
  ]);
  const indegree = { Maths: 0, Programming: 0, DBMS: 0, DSA: 2, 'Web Dev': 2, Projects: 2 };
  let b = heading(32, 32, 'Topological sort: an order where every arrow points forward');
  for (const [a, c] of [
    ['Maths', 'DSA'],
    ['Programming', 'DSA'],
    ['Programming', 'Web Dev'],
    ['DBMS', 'Web Dev'],
    ['DSA', 'Projects'],
    ['Web Dev', 'Projects'],
  ]) {
    b += connect(nodes[a], nodes[c], { directed: true, tone: 'ink' });
  }
  for (const node of Object.values(nodes)) {
    b += drawNode(node);
    b += tag(node.x + 52, node.y - 30, `in ${indegree[node.id]}`, { size: 11.5, fill: indegree[node.id] ? C.muted : C.green, border: C.line });
  }
  b += spans(32, 364, [
    ['One valid order: ', C.text],
    ['Maths → Programming → DBMS → DSA → Web Dev → Projects', C.ink, 700],
  ]);
  b += note(32, 394, "Kahn's algorithm: take nodes with in-degree 0, remove their arrows, repeat.");
  add('graph-topo-sort', W, H, 'A course prerequisite graph and one valid topological order', b);
}

// ---------- Dijkstra ----------
{
  const W = 820;
  const H = 420;
  const nodes = byId([
    { id: 'A', x: 90, y: 200 },
    { id: 'B', x: 290, y: 100 },
    { id: 'C', x: 290, y: 300 },
    { id: 'D', x: 500, y: 200 },
    { id: 'E', x: 700, y: 200 },
  ]);
  const dist = { A: 0, B: 3, C: 1, D: 4, E: 7 };
  const edges = [
    ['A', 'B', 4, false],
    ['A', 'C', 1, true],
    ['C', 'B', 2, true],
    ['B', 'D', 1, true],
    ['C', 'D', 5, false],
    ['D', 'E', 3, true],
  ];
  let b = heading(32, 32, 'Dijkstra from A: always settle the closest unsettled node');
  for (const [a, c, w, used] of edges) {
    b += connect({ ...nodes[a], r: 26 }, { ...nodes[c], r: 26 }, {
      tone: used ? 'brand' : 'muted',
      sw: used ? 3 : 2,
      dash: used ? undefined : '6 6',
      label: w,
      labelTone: used ? 'brand' : 'plain',
    });
  }
  for (const node of Object.values(nodes)) {
    b += drawNode({ ...node, r: 26, label: node.id, tone: node.id === 'A' ? 'active' : 'brand' });
    b += tag(node.x, node.id === 'C' ? node.y + 44 : node.y - 44, `dist ${dist[node.id]}`, { size: 12.5, fill: C.green, border: '#6EE7B7' });
  }
  b += spans(32, 368, [
    ['Settled in order: ', C.text],
    ['A (0) → C (1) → B (3) → D (4) → E (7)', C.ink, 700],
  ]);
  b += note(32, 396, 'B is 4 by the direct edge, but 1 + 2 = 3 through C, so the path through C wins.');
  add('dijkstra', W, H, 'Weighted graph with the shortest distances from A and the shortest path tree highlighted', b);
}

// ---------- Kruskal ----------
{
  const W = 840;
  const H = 420;
  const nodes = byId([
    { id: 'A', x: 90, y: 110 },
    { id: 'B', x: 290, y: 80 },
    { id: 'C', x: 230, y: 260 },
    { id: 'D', x: 440, y: 220 },
    { id: 'E', x: 380, y: 340 },
  ]);
  const sorted = [
    ['A', 'B', 1, true],
    ['C', 'D', 2, true],
    ['A', 'C', 3, true],
    ['B', 'C', 4, false],
    ['B', 'D', 5, false],
    ['C', 'E', 6, true],
    ['D', 'E', 7, false],
  ];
  let b = heading(32, 32, "Kruskal's MST: take the cheapest edge that doesn't close a cycle");
  for (const [a, c, w, used] of sorted) {
    b += connect({ ...nodes[a], r: 24 }, { ...nodes[c], r: 24 }, {
      tone: used ? 'good' : 'muted',
      sw: used ? 3.5 : 2,
      dash: used ? undefined : '6 6',
      label: w,
      labelTone: used ? 'good' : 'plain',
    });
  }
  for (const node of Object.values(nodes)) b += drawNode({ ...node, r: 24, label: node.id, tone: 'good' });
  b += text(560, 78, 'edges from cheapest', { size: 14, weight: 700, anchor: 'start' });
  sorted.forEach(([a, c, w, used], k) => {
    const y = 108 + k * 30;
    b += text(560, y, `${w}   ${a}–${c}`, { size: 15, mono: true, anchor: 'start', weight: 600, fill: C.ink });
    b += text(660, y, used ? '✓ take' : '✗ makes a cycle', { size: 14, anchor: 'start', weight: 700, fill: used ? C.green : C.red });
  });
  b += spans(560, 330, [
    ['total = 1 + 2 + 3 + 6 = ', C.text],
    ['12', C.green, 700],
  ]);
  b += note(32, 404, 'A Union-Find (DSU) tells in almost O(1) whether two nodes are already connected.');
  add('mst-kruskal', W, H, 'A weighted graph with its minimum spanning tree of weight 12 highlighted', b);
}
