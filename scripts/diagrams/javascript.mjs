// Diagrams for the JavaScript notes: execution context, scope, closures,
// prototypes, this, promises, the event loop, events and copying.
import { C, TONES, code, heading, line, note, path, rect, spans, tag, text } from './svg.mjs';

export const javascript = [];
// Colours for the debounce chart rows, by tone.
const INKCOLOR = { good: C.green, brand: C.brand };
const add = (name, width, height, title, body) => javascript.push({ name, width, height, title, body });

// A titled panel with an optional tone.
function panel(x, y, w, h, title, tone = 'plain') {
  const t = TONES[tone];
  const fill = tone === 'plain' ? C.panel : t.fill;
  const stroke = tone === 'plain' ? C.grid : t.stroke;
  return (
    rect(x, y, w, h, { fill, stroke, rx: 14, sw: tone === 'plain' ? 1.5 : 2 }) +
    text(x + 16, y + 22, title, { size: 14, weight: 700, anchor: 'start', fill: tone === 'plain' ? C.ink : t.text })
  );
}

// A small labelled box, used for stack frames, queue items and objects.
function box(x, y, w, h, label, tone = 'plain', o = {}) {
  const t = TONES[tone];
  return (
    rect(x, y, w, h, { fill: t.fill, stroke: t.stroke, rx: o.rx ?? 8, sw: tone === 'plain' ? 1.5 : 2, dash: o.dash ?? t.dash }) +
    text(x + w / 2, y + h / 2, label, { size: o.size ?? 13, weight: o.weight ?? 600, fill: t.text, mono: o.mono ?? true })
  );
}

// ---------- Execution context ----------
{
  const W = 880;
  const H = 470;
  let b = heading(32, 32, 'Every script and function call runs in an execution context with two phases');
  b += panel(24, 58, 260, 250, 'Your code');
  [
    'console.log(a);  // undefined',
    'var a = 10;',
    'let b = 20;',
    'function greet() {',
    '  return "hi";',
    '}',
    'greet();',
  ].forEach((l, k) => (b += code(40, 96 + k * 26, l, { size: 13 })));
  b += line(290, 183, 312, 183, { tone: 'plain', arrow: true });
  b += panel(316, 58, 262, 250, '1. Memory phase (hoisting)', 'brand');
  [
    ['a', 'undefined', 'active'],
    ['b', 'uninitialised (TDZ)', 'bad'],
    ['greet', 'the whole function', 'good'],
  ].forEach(([k, v, tone], i) => {
    const y = 96 + i * 60;
    b += box(332, y, 70, 38, k, 'plain');
    b += box(410, y, 152, 38, v, tone, { size: 12, mono: false });
  });
  b += text(332, 290, 'Memory is set up before any line runs', { size: 12, anchor: 'start', fill: C.brand });
  b += line(584, 183, 606, 183, { tone: 'plain', arrow: true });
  b += panel(610, 58, 246, 250, '2. Execution phase', 'good');
  ['log(a) prints undefined', 'a becomes 10', 'b becomes 20 (TDZ ends)', 'greet() runs:', 'a new context is pushed'].forEach(
    (l, k) => (b += text(626, 100 + k * 30, l, { size: 13, anchor: 'start', fill: C.text })),
  );
  b += text(32, 340, 'Call stack', { size: 14, weight: 700, anchor: 'start' });
  b += box(32, 356, 220, 36, 'greet() context', 'brand');
  b += box(32, 396, 220, 36, 'Global context', 'plain');
  b += text(268, 374, '← top: running now, popped when it returns', { size: 13, anchor: 'start', fill: C.brand });
  b += text(268, 414, '← created first, lives until the page or program ends', { size: 13, anchor: 'start', fill: C.muted });
  add('execution-context', W, H, 'The memory and execution phases of a JavaScript execution context and the call stack', b);
}

// ---------- Scope chain ----------
{
  const W = 780;
  const H = 400;
  let b = heading(32, 32, 'The scope chain: look in your own scope, then outward, never inward');
  b += rect(24, 56, 732, 324, { fill: '#F8FAFC', stroke: C.faint, rx: 18 });
  b += text(44, 78, 'Global scope', { size: 14, weight: 700, anchor: 'start', fill: C.muted });
  b += code(44, 104, 'const app = "Bitwise";', { size: 13 });
  b += rect(60, 124, 660, 240, { fill: C.brandSoft, stroke: C.brand, rx: 16, sw: 1.75 });
  b += text(80, 146, 'function outer() scope', { size: 14, weight: 700, anchor: 'start', fill: C.brand });
  b += code(80, 172, 'const course = "JS";', { size: 13 });
  b += rect(96, 192, 588, 156, { fill: C.greenSoft, stroke: C.green, rx: 14, sw: 1.75 });
  b += text(116, 214, 'function inner() scope', { size: 14, weight: 700, anchor: 'start', fill: C.green });
  b += code(116, 240, 'const topic = "scope";', { size: 13 });
  b += code(116, 270, 'console.log(topic, course, app);', { size: 13 });
  b += code(116, 300, '// "scope" "JS" "Bitwise"', { size: 13, fill: C.muted });
  b += path('M560 270 C640 270, 650 180, 600 172', { tone: 'brand', arrow: true, sw: 2 });
  b += tag(660, 228, 'course: 1 level up', { size: 12, fill: C.brand, border: '#8AB2FF' });
  b += path('M560 262 C720 250, 730 110, 300 104', { tone: 'active', arrow: true, sw: 2 });
  b += tag(620, 124, 'app: 2 levels up', { size: 12, fill: C.amber, border: '#FCD34D' });
  add('scope-chain', W, H, 'Nested global, outer and inner scopes with variable lookup going outward', b);
}

// ---------- Closure ----------
{
  const W = 840;
  const H = 400;
  let b = heading(32, 32, 'A closure: the inner function keeps its outer variables alive');
  b += panel(24, 56, 360, 320, 'Code');
  [
    'function makeCounter() {',
    '  let count = 0;',
    '  return function () {',
    '    count++;',
    '    return count;',
    '  };',
    '}',
    '',
    'const next = makeCounter();',
    'next();  // 1',
    'next();  // 2',
  ].forEach((l, k) => (b += code(40, 92 + k * 24, l, { size: 13 })));
  b += rect(420, 70, 390, 88, { fill: '#FFFFFF', stroke: C.faint, rx: 12, dash: '6 5' });
  b += text(440, 94, 'makeCounter() context', { size: 13, weight: 700, anchor: 'start', fill: C.muted });
  b += text(440, 120, 'finished and popped off the call stack…', { size: 13, anchor: 'start', fill: C.muted });
  b += text(440, 142, '…but its variables are still reachable', { size: 13, anchor: 'start', fill: C.muted });
  b += box(420, 200, 170, 48, 'next (function)', 'brand');
  b += line(596, 224, 648, 224, { tone: 'good', arrow: true, sw: 2.5 });
  b += text(622, 206, '[[Environment]]', { size: 11.5, mono: true, fill: C.green });
  b += rect(654, 190, 156, 70, { fill: C.greenSoft, stroke: C.green, rx: 12, sw: 2 });
  b += text(732, 212, 'saved scope', { size: 12, weight: 700, fill: C.green });
  b += text(732, 238, 'count: 2', { size: 15, weight: 700, mono: true, fill: '#065F46' });
  b += text(420, 292, 'Each call to makeCounter() makes a fresh count,', { size: 13, anchor: 'start', fill: C.text });
  b += text(420, 314, 'so two counters never share state.', { size: 13, anchor: 'start', fill: C.text });
  b += text(420, 346, 'Used for private variables, factories, memoisation', { size: 13, anchor: 'start', fill: C.brand, weight: 600 });
  b += text(420, 368, 'and every event handler that reads outer data.', { size: 13, anchor: 'start', fill: C.brand, weight: 600 });
  add('closure', W, H, 'A counter function whose returned inner function keeps the count variable alive', b);
}

// ---------- Prototype chain ----------
{
  const W = 880;
  const H = 480;
  let b = heading(32, 32, 'The prototype chain: property lookup walks up until it finds a match or reaches null');
  const obj = (x, y, w, title, rows, tone) => {
    const t = TONES[tone];
    let out = rect(x, y, w, 30 + rows.length * 22, { fill: t.fill, stroke: t.stroke, rx: 10, sw: tone === 'plain' ? 1.5 : 2 });
    out += text(x + 14, y + 18, title, { size: 13.5, weight: 700, anchor: 'start', fill: t.text, mono: true });
    rows.forEach((r, k) => (out += text(x + 14, y + 42 + k * 22, r, { size: 12.5, anchor: 'start', fill: C.text, mono: true })));
    return out;
  };
  b += text(170, 70, 'const s1 = new Student("Vikas")', { size: 12.5, mono: true, fill: C.muted });
  b += obj(60, 84, 220, 's1', ['name: "Vikas"'], 'plain');
  b += obj(60, 176, 220, 'Student.prototype', ['study()', 'constructor'], 'brand');
  b += text(650, 70, 'const str = new String("john")', { size: 12.5, mono: true, fill: C.muted });
  b += obj(540, 84, 240, 'str (String object)', ['0: "j" … 3: "n"', 'length: 4'], 'plain');
  b += obj(540, 198, 240, 'String.prototype', ['toUpperCase()', 'slice(), split() …'], 'special');
  b += obj(300, 300, 280, 'Object.prototype', ['toString()', 'hasOwnProperty()'], 'active');
  b += box(390, 420, 100, 34, 'null', 'muted');
  const arrow = (x1, y1, x2, y2) => line(x1, y1, x2, y2, { tone: 'ink', arrow: true, sw: 1.75 });
  b += arrow(170, 138, 170, 172);
  b += arrow(660, 160, 660, 194);
  b += arrow(200, 250, 330, 296);
  b += arrow(640, 286, 540, 312);
  b += arrow(440, 376, 440, 416);
  b += text(186, 156, '[[Prototype]]', { size: 11.5, mono: true, anchor: 'start', fill: C.muted });
  b += text(676, 178, '[[Prototype]]', { size: 11.5, mono: true, anchor: 'start', fill: C.muted });
  b += tag(160, 440, 's1.study(): not on s1, found on Student.prototype', { size: 12, fill: C.brand, border: '#8AB2FF' });
  b += tag(700, 440, 'str.toString(): found on Object.prototype', { size: 12, fill: C.amber, border: '#FCD34D' });
  add('prototype-chain', W, H, 'Prototype chains of a Student instance and a String object meeting at Object.prototype and ending at null', b);
}

// ---------- Autoboxing ----------
{
  const W = 880;
  const H = 280;
  let b = heading(32, 32, 'Autoboxing: how "john".toUpperCase() works on a primitive');
  const steps = [
    ['"john"', 'a primitive string', 'active'],
    ['new String("john")', 'temporary wrapper', 'special'],
    ['String.prototype', 'toUpperCase found', 'brand'],
    ['"JOHN"', 'the result', 'good'],
  ];
  steps.forEach(([label, sub, tone], k) => {
    const x = 32 + k * 212;
    b += box(x, 78, 176, 54, label, tone, { size: 13.5 });
    b += text(x + 88, 150, sub, { size: 12.5, fill: C.muted });
    if (k < steps.length - 1) b += line(x + 180, 105, x + 206, 105, { tone: 'ink', arrow: true });
  });
  b += rect(456, 172, 220, 40, { fill: '#FFFFFF', stroke: C.faint, rx: 8, dash: '5 4' });
  b += text(566, 192, 'wrapper is thrown away', { size: 12.5, fill: C.muted });
  b += path('M 334 160 C 334 192, 380 192, 452 192', { tone: 'muted', arrow: true, dash: '5 4' });
  b += spans(32, 246, [
    ['That is also why ', C.text],
    ['"john".age = 20', C.ink, 700],
    [' does nothing useful: the property lands on a wrapper that disappears at once.', C.text],
  ]);
  add('autoboxing', W, H, 'Steps of autoboxing from a primitive string to a temporary wrapper object and back', b);
}

// ---------- this binding ----------
{
  const W = 860;
  const H = 540;
  let b = heading(32, 32, 'What is `this`? Ask these questions in order');
  const qs = [
    ['Is it an arrow function?', '`this` of the surrounding code (arrows have no own this)'],
    ['Called with new?', 'the brand-new object being created'],
    ['Called with call(), apply() or bind()?', 'the object you passed in'],
    ['Called as obj.method()?', 'obj, the object before the dot'],
  ];
  qs.forEach(([q, answer], k) => {
    const y = 64 + k * 96;
    b += rect(32, y, 330, 58, { fill: C.brandSoft, stroke: C.brand, rx: 14, sw: 2 });
    b += text(197, y + 29, q, { size: 14, weight: 700, fill: '#003A91' });
    b += line(366, y + 29, 452, y + 29, { tone: 'good', arrow: true, sw: 2 });
    b += text(409, y + 17, 'yes', { size: 12, weight: 700, fill: C.green });
    b += rect(456, y + 4, 372, 50, { fill: C.greenSoft, stroke: C.green, rx: 12, sw: 1.75 });
    b += text(642, y + 29, answer, { size: 13, weight: 600, fill: '#065F46' });
    b += line(197, y + 62, 197, y + 92, { tone: 'bad', arrow: true, sw: 2 });
    b += text(208, y + 78, 'no', { size: 12, weight: 700, fill: C.red, anchor: 'start' });
  });
  b += rect(32, 448, 796, 62, { fill: C.amberSoft, stroke: C.amber, rx: 14, sw: 2 });
  b += text(430, 470, 'Default binding: a plain call like fn()', { size: 14, weight: 700, fill: '#92400E' });
  b += text(430, 492, 'undefined in strict mode (modules and classes are strict); globalThis in old sloppy scripts', { size: 12.5, fill: '#92400E' });
  add('this-binding', W, H, 'A flowchart for working out what this refers to in a JavaScript function call', b);
}

// ---------- Promise states ----------
{
  const W = 820;
  const H = 340;
  let b = heading(32, 32, 'A promise starts pending and settles exactly once');
  b += box(40, 138, 170, 60, 'pending', 'active', { size: 16 });
  b += box(420, 64, 180, 56, 'fulfilled', 'good', { size: 16 });
  b += box(420, 218, 180, 56, 'rejected', 'bad', { size: 16 });
  b += path('M 214 158 C 300 150, 330 96, 416 92', { tone: 'good', arrow: true, sw: 2.5 });
  b += tag(300, 108, 'resolve(value)', { size: 12.5, fill: C.green, border: '#6EE7B7' });
  b += path('M 214 180 C 300 190, 330 244, 416 246', { tone: 'bad', arrow: true, sw: 2.5 });
  b += tag(300, 232, 'reject(error) or throw', { size: 12.5, fill: C.red, border: '#FDA4AF' });
  b += line(604, 92, 660, 92, { tone: 'good', arrow: true });
  b += text(668, 92, '.then(value => …)', { size: 13, mono: true, anchor: 'start', fill: C.green, weight: 600 });
  b += line(604, 246, 660, 246, { tone: 'bad', arrow: true });
  b += text(668, 246, '.catch(error => …)', { size: 13, mono: true, anchor: 'start', fill: C.red, weight: 600 });
  b += path('M 610 128 C 700 150, 700 190, 610 210', { tone: 'muted', dash: '5 4' });
  b += text(708, 169, '.finally() runs either way', { size: 12.5, anchor: 'start', fill: C.muted });
  b += note(32, 312, 'Once fulfilled or rejected ("settled"), a promise never changes state again.');
  add('promise-states', W, H, 'The three promise states pending, fulfilled and rejected and the handlers for each', b);
}

// ---------- Event loop ----------
{
  const W = 880;
  const H = 480;
  let b = heading(32, 32, 'The event loop: sync code first, then all microtasks, then one task');
  b += panel(24, 58, 190, 300, 'Call stack');
  ['console.log(5)', 'main script'].forEach((f, k) => (b += box(40, 94 + k * 48, 158, 38, f, k === 0 ? 'brand' : 'plain', { size: 12.5 })));
  b += text(119, 330, 'one thing at a time', { size: 12, fill: C.muted });
  b += panel(250, 58, 300, 112, 'Web APIs (browser) / libuv (Node)');
  ['setTimeout', 'fetch', 'DOM events'].forEach((f, k) => (b += box(266 + k * 92, 96, 84, 34, f, 'plain', { size: 12, mono: false })));
  b += text(400, 152, 'wait in the background, then queue a callback', { size: 12, fill: C.muted });
  b += panel(250, 196, 604, 76, 'Microtask queue: runs completely after each task', 'good');
  ['.then(() => log(3))', 'queueMicrotask(log 4)', 'code after await'].forEach(
    (f, k) => (b += box(430 + k * 142, 212, 134, 34, f, 'good', { size: 11.5 })),
  );
  b += panel(250, 290, 604, 76, 'Task (macrotask) queue: one per loop turn', 'active');
  ['setTimeout(log 2)', 'click handler', 'message event'].forEach((f, k) => (b += box(430 + k * 142, 306, 134, 34, f, 'active', { size: 11.5 })));
  b += path('M 214 120 C 232 120, 232 229, 248 229', { tone: 'good', arrow: true, sw: 2 });
  b += path('M 214 150 C 232 150, 232 323, 248 323', { tone: 'active', arrow: true, sw: 2 });
  b += text(40, 392, 'Loop:', { size: 14, weight: 700, anchor: 'start' });
  [
    '1. Run the synchronous code until the call stack is empty.',
    '2. Run every microtask (and any microtasks they add).',
    '3. Take ONE task from the task queue, run it, then go back to step 2.',
  ].forEach((l, k) => (b += text(92, 392 + k * 24, l, { size: 13, anchor: 'start', fill: C.text })));
  add('event-loop', W, H, 'The call stack, Web APIs, microtask queue and task queue of the JavaScript event loop', b);
}

// ---------- Event propagation ----------
{
  const W = 820;
  const H = 440;
  let b = heading(32, 32, 'Event propagation: capture down, target, bubble up');
  const layers = ['window', 'document', '<html>', '<body>', '<ul id="menu">', '<li> (clicked)'];
  layers.forEach((l, k) => {
    const y = 64 + k * 56;
    const target = k === layers.length - 1;
    b += box(250, y, 320, 40, l, target ? 'active' : 'plain', { size: 14 });
  });
  b += line(200, 70, 200, 364, { tone: 'brand', arrow: true, sw: 3 });
  b += text(186, 216, '① capture phase', { size: 14, weight: 700, fill: C.brand, rotate: -90 });
  b += line(620, 364, 620, 70, { tone: 'good', arrow: true, sw: 3 });
  b += text(636, 216, '③ bubble phase', { size: 14, weight: 700, fill: C.green, rotate: 90 });
  b += text(410, 400, '② target phase', { size: 14, weight: 700, fill: C.amber });
  b += text(690, 120, "addEventListener('click', fn)", { size: 12, mono: true, anchor: 'start', fill: C.green });
  b += text(690, 140, 'listens while bubbling (default)', { size: 12, anchor: 'start', fill: C.muted });
  b += text(40, 110, "{ capture: true }", { size: 12, mono: true, anchor: 'start', fill: C.brand });
  b += text(40, 130, 'listens on the way down', { size: 12, anchor: 'start', fill: C.muted });
  add('event-propagation', W, H, 'A click event travelling down through capture, reaching the target and bubbling back up', b);
}

// ---------- Debounce vs throttle ----------
{
  const W = 860;
  const H = 330;
  const X = (t) => 180 + (t / 1500) * 640;
  let b = heading(32, 32, 'Debounce vs throttle (wait = 300 ms)');
  const rows = [
    ['events (typing)', [...Array(12).keys()].map((i) => i * 50).concat([1000, 1050, 1100]), 'plain'],
    ['debounce', [850, 1400], 'good'],
    ['throttle', [0, 300, 1000], 'brand'],
  ];
  rows.forEach(([label, times, tone], k) => {
    const y = 90 + k * 70;
    b += text(32, y, label, { size: 14, weight: 700, anchor: 'start', fill: tone === 'plain' ? C.ink : INKCOLOR[tone] });
    b += line(X(0), y, X(1500), y, { color: C.grid, sw: 2 });
    for (const t of times) {
      if (tone === 'plain') b += line(X(t), y - 12, X(t), y + 12, { color: C.muted, sw: 2 });
      else b += `<circle cx="${X(t)}" cy="${y}" r="9" fill="${INKCOLOR[tone]}"/>`;
    }
  });
  for (const t of [0, 500, 1000, 1500]) b += text(X(t), 300, `${t} ms`, { size: 12, mono: true, fill: C.faint });
  b += text(X(850), 186, 'fires 300 ms after typing stops', { size: 12, fill: C.green });
  b += text(X(300), 256, 'fires at most once every 300 ms', { size: 12, fill: C.brand });
  add('debounce-throttle', W, H, 'Timeline comparing when debounced and throttled handlers fire for a burst of events', b);
}

// ---------- Shallow vs deep copy ----------
{
  const W = 860;
  const H = 380;
  let b = heading(32, 32, 'Shallow copy shares nested objects; deep copy duplicates them');
  const objBox = (x, y, title, tone, rows) => {
    const t = TONES[tone];
    let out = rect(x, y, 200, 34 + rows.length * 26, { fill: t.fill, stroke: t.stroke, rx: 10, sw: 2 });
    out += text(x + 100, y + 19, title, { size: 13, weight: 700, fill: t.text, mono: true });
    rows.forEach((r, k) => (out += text(x + 16, y + 46 + k * 26, r, { size: 13, anchor: 'start', mono: true, fill: C.text })));
    return out;
  };
  b += objBox(40, 70, 'user', 'plain', ['name: "Asha"', 'address: ●']);
  b += objBox(330, 70, '{ ...user }', 'brand', ['name: "Asha"', 'address: ●']);
  b += objBox(620, 70, 'structuredClone(user)', 'good', ['name: "Asha"', 'address: ●']);
  b += objBox(185, 230, 'address (shared)', 'bad', ['city: "Delhi"']);
  b += objBox(620, 230, 'address (own copy)', 'good', ['city: "Delhi"']);
  b += path('M 150 142 C 150 200, 230 200, 250 226', { tone: 'bad', arrow: true, sw: 2 });
  b += path('M 440 142 C 440 200, 360 200, 330 226', { tone: 'bad', arrow: true, sw: 2 });
  b += path('M 730 142 L 730 226', { tone: 'good', arrow: true, sw: 2 });
  b += note(32, 330, 'Change copy.address.city in the shallow copy and user.address.city changes too.');
  b += note(32, 354, 'The deep copy is fully independent.');
  add('shallow-vs-deep-copy', W, H, 'Memory picture of an object, its shallow copy sharing a nested object and its deep copy', b);
}

