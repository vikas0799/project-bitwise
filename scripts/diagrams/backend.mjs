// Diagrams for the backend notes: Node.js, Express, MVC, rendering,
// MongoDB, PostgreSQL and authentication.
import { C, TONES, heading, line, note, path, rect, spans, table, tag, text } from './svg.mjs';

export const backend = [];
const add = (name, width, height, title, body) => backend.push({ name, width, height, title, body });

function box(x, y, w, h, label, tone = 'plain', o = {}) {
  const t = TONES[tone];
  let out = rect(x, y, w, h, { fill: t.fill, stroke: t.stroke, rx: o.rx ?? 10, sw: tone === 'plain' ? 1.5 : 2, dash: o.dash ?? t.dash });
  const lines = Array.isArray(label) ? label : [label];
  lines.forEach((l, k) => {
    const dy = (k - (lines.length - 1) / 2) * (o.lineGap ?? 18);
    out += text(x + w / 2, y + h / 2 + dy, l, {
      size: k === 0 ? (o.size ?? 14) : (o.subSize ?? 12),
      weight: k === 0 ? 700 : 500,
      fill: k === 0 ? t.text : C.muted,
      mono: k === 0 ? (o.mono ?? false) : false,
    });
  });
  return out;
}

const arrow = (x1, y1, x2, y2, tone = 'ink', o = {}) => line(x1, y1, x2, y2, { tone, arrow: true, sw: o.sw ?? 2, dash: o.dash });

// A simple sequence diagram: lifelines plus numbered messages.
function sequence({ W, H, title, actors, messages, top = 64, step = 44 }) {
  let b = heading(32, 32, title);
  const xs = {};
  actors.forEach(([id, label, tone], k) => {
    const x = 120 + k * ((W - 240) / (actors.length - 1));
    xs[id] = x;
    b += box(x - 80, top, 160, 40, label, tone);
    b += line(x, top + 40, x, H - 24, { color: C.line, sw: 1.5, dash: '5 6' });
  });
  messages.forEach(([from, to, label, tone = 'ink', dashed = false], k) => {
    const y = top + 78 + k * step;
    b += `<circle cx="${Math.min(xs[from], xs[to]) - 30}" cy="${y}" r="10" fill="${C.ink}"/>`;
    b += text(Math.min(xs[from], xs[to]) - 30, y, k + 1, { size: 11, weight: 700, fill: '#FFFFFF' });
    if (from === to) {
      b += path(`M ${xs[from]} ${y - 8} C ${xs[from] + 40} ${y - 8}, ${xs[from] + 40} ${y + 12}, ${xs[from] + 4} ${y + 12}`, { tone, arrow: true, sw: 2 });
      b += text(xs[from] + 48, y + 2, label, { size: 12.5, anchor: 'start', fill: C.text });
    } else {
      const dir = xs[to] > xs[from] ? 1 : -1;
      b += line(xs[from] + dir * 4, y, xs[to] - dir * 6, y, { tone, arrow: true, sw: 2, dash: dashed ? '6 5' : undefined });
      b += tag((xs[from] + xs[to]) / 2, y - 12, label, { size: 12, fill: C.text });
    }
  });
  return b;
}

// ---------- Node.js architecture ----------
{
  const W = 860;
  const H = 420;
  let b = heading(32, 32, 'How Node.js runs your JavaScript');
  b += box(40, 60, 520, 52, ['Your code: app.js', 'routes, business logic, async/await'], 'brand', { mono: true });
  b += arrow(300, 116, 300, 138);
  b += box(40, 140, 520, 52, ['Node.js APIs', 'http, fs, path, crypto, stream, events'], 'plain', { mono: true });
  b += arrow(170, 196, 170, 218);
  b += arrow(430, 196, 430, 218);
  b += box(40, 220, 250, 70, ['V8 engine', 'compiles and runs JS on ONE thread'], 'active');
  b += box(310, 220, 250, 70, ['libuv', 'event loop + thread pool'], 'good');
  b += arrow(300, 294, 300, 316);
  b += box(40, 318, 520, 52, ['Operating system', 'network sockets, files, timers'], 'muted');
  const tips = [
    'Your JS runs on a single thread.',
    'Slow work (disk, network, crypto)',
    'is handed to libuv and the OS.',
    'When it finishes, a callback is',
    'queued and the event loop runs it.',
    '',
    'So one Node process can serve',
    'thousands of connections, as long',
    'as you never block the thread with',
    'long CPU work.',
  ];
  tips.forEach((t, k) => (b += text(590, 76 + k * 24, t, { size: 13, anchor: 'start', fill: k >= 6 ? C.brand : C.text, weight: k >= 6 ? 600 : 500 })));
  add('node-architecture', W, H, 'Layers of Node.js from your code through Node APIs, V8 and libuv to the operating system', b);
}

// ---------- Express middleware pipeline ----------
{
  const W = 880;
  const H = 360;
  let b = heading(32, 32, 'Express: every request flows through a chain of middleware');
  const steps = [
    ['request', 'plain'],
    ['express.json()', 'brand'],
    ['logger', 'brand'],
    ['requireAuth', 'brand'],
    ['route handler', 'good'],
  ];
  steps.forEach(([label, tone], k) => {
    const x = 32 + k * 168;
    b += box(x, 80, 140, 50, label, tone, { mono: true, size: 13 });
    if (k < steps.length - 1) {
      b += arrow(x + 142, 105, x + 164, 105);
      if (k > 0) b += text(x + 153, 92, 'next()', { size: 11, mono: true, fill: C.brand });
    }
  });
  b += arrow(774, 134, 774, 170, 'good');
  b += box(700, 172, 148, 44, 'res.json(data)', 'good', { mono: true, size: 13 });
  b += path('M 572 134 C 572 190, 520 206, 470 206', { tone: 'bad', arrow: true, sw: 2 });
  b += box(300, 186, 168, 44, 'res.status(401)', 'bad', { mono: true, size: 13 });
  b += text(560, 250, 'no valid token: stop here', { size: 12, fill: C.red });
  b += line(32, 276, 848, 276, { color: C.grid, sw: 1 });
  b += spans(32, 300, [['Error path: ', C.ink, 700], ['any middleware can call ', C.text], ['next(err)', C.red, 700], [' (or throw in an async handler in Express 5)', C.text]]);
  b += box(32, 314, 360, 36, '(err, req, res, next) => …  error handler', 'bad', { mono: true, size: 12.5 });
  b += text(410, 332, 'defined last, with four parameters', { size: 12.5, anchor: 'start', fill: C.muted });
  add('express-middleware', W, H, 'A request passing through Express middleware to a route handler, with the auth and error paths', b);
}

// ---------- MVC ----------
{
  const W = 860;
  const H = 360;
  let b = heading(32, 32, 'MVC in an Express app: each layer has one job');
  b += box(32, 150, 120, 56, ['Client', 'browser / app'], 'plain');
  b += box(200, 150, 140, 56, ['Router', 'routes/'], 'brand', { mono: false });
  b += box(390, 150, 150, 56, ['Controller', 'controllers/'], 'brand');
  b += box(600, 70, 150, 56, ['Model', 'models/'], 'good');
  b += box(600, 230, 150, 56, ['View', 'views/ or JSON'], 'active');
  b += box(790 - 20, 70, 70, 56, 'DB', 'muted');
  b += arrow(156, 170, 196, 170);
  b += text(176, 158, 'HTTP', { size: 11, fill: C.muted });
  b += arrow(344, 178, 386, 178);
  b += arrow(544, 164, 596, 108);
  b += arrow(596, 92, 544, 150, 'good', { dash: '5 4' });
  b += arrow(754, 98, 766, 98);
  b += arrow(544, 192, 596, 250);
  b += path('M 600 272 C 300 330, 120 300, 92 212', { tone: 'active', arrow: true, sw: 2 });
  b += text(330, 322, 'response: rendered HTML or JSON', { size: 12.5, fill: C.amber, weight: 600 });
  b += text(470, 118, 'asks for data', { size: 12, fill: C.muted, rotate: -40 });
  const roles = [
    ['Router', 'maps URL + method to a controller'],
    ['Controller', 'handles the request, no SQL, no HTML'],
    ['Model', 'data rules and database access'],
    ['View', 'turns data into HTML (or send JSON)'],
  ];
  roles.forEach(([k2, v], i) => (b += spans(32, 62 + i * 22, [[`${k2}: `, C.ink, 700], [v, C.text]], { size: 12.5 })));
  add('mvc-flow', W, H, 'Request flow through router, controller, model, database and view in an MVC Express app', b);
}

// ---------- SSR vs CSR ----------
{
  const W = 880;
  const H = 360;
  let b = heading(32, 32, 'Server-side vs client-side rendering: who builds the HTML?');
  const row = (y, label, tone, steps, visibleAt) => {
    let out = text(32, y + 24, label, { size: 14, weight: 700, anchor: 'start', fill: TONES[tone].text });
    steps.forEach(([s, t], k) => {
      const x = 200 + k * 170;
      out += box(x, y, 150, 50, s, t, { size: 12.5 });
      if (k < steps.length - 1) out += arrow(x + 152, y + 25, x + 166, y + 25);
    });
    out += tag(200 + visibleAt * 170 + 75, y + 68, 'content visible here', { size: 11.5, fill: C.green, border: '#6EE7B7' });
    return out;
  };
  b += row(72, 'SSR (EJS, Next.js)', 'brand', [
    ['request page', 'plain'],
    ['server gets data', 'brand'],
    ['server sends full HTML', 'brand'],
    ['JS adds interactivity', 'plain'],
  ], 2);
  b += row(192, 'CSR (React SPA)', 'active', [
    ['request page', 'plain'],
    ['empty HTML + JS', 'active'],
    ['JS runs, fetches API', 'active'],
    ['JS renders content', 'active'],
  ], 3);
  b += note(32, 318, 'SSR: faster first view and better SEO. CSR: simpler server, app-like navigation. Modern frameworks mix both.');
  add('ssr-vs-csr', W, H, 'Timelines comparing server-side rendering and client-side rendering', b);
}

// ---------- MongoDB document model ----------
{
  const W = 880;
  const H = 400;
  let b = heading(32, 32, 'MongoDB stores documents in collections, not rows in tables');
  b += box(32, 62, 180, 44, ['database', 'bitwise'], 'plain', { mono: true });
  b += arrow(122, 110, 122, 134);
  b += box(32, 136, 180, 44, ['collection', 'students'], 'brand', { mono: true });
  b += arrow(122, 184, 122, 208);
  b += box(32, 210, 180, 44, ['documents', 'one per student'], 'good', { mono: true });
  const doc = [
    '{',
    '  _id: ObjectId("66f1…"),',
    '  name: "Asha",',
    '  skills: ["js", "node"],',
    '  address: { city: "Delhi" },',
    '  enrolments: [',
    '    { course: "dsa", progress: 40 }',
    '  ]',
    '}',
  ];
  b += rect(250, 62, 330, 36 + doc.length * 22, { fill: '#0d1117', stroke: '#0d1117', rx: 12 });
  doc.forEach((l, k) => (b += text(268, 84 + k * 22, l.replace(/^ +/, (m) => ' '.repeat(m.length)), { size: 12.5, anchor: 'start', mono: true, fill: '#E6EDF3' })));
  const notes = [
    ['Flexible shape:', 'documents in one collection can differ'],
    ['Embedded data:', 'address and enrolments live inside'],
    ['JSON-like:', 'maps naturally to JS objects'],
    ['_id:', 'unique id added automatically'],
  ];
  notes.forEach(([k2, v], i) => {
    b += text(610, 80 + i * 56, k2, { size: 13, weight: 700, anchor: 'start', fill: C.ink });
    b += text(610, 100 + i * 56, v, { size: 12.5, anchor: 'start', fill: C.text });
  });
  b += note(32, 376, 'SQL equivalent: a students table plus separate addresses and enrolments tables joined by keys.');
  add('mongodb-document-model', W, H, 'A MongoDB database, collection and example student document with embedded fields', b);
}

// ---------- PostgreSQL join ----------
{
  const W = 880;
  const H = 440;
  let b = heading(32, 32, 'Relational data: a foreign key links tables, a JOIN combines them');
  b += text(32, 72, 'students', { size: 14, weight: 700, anchor: 'start', mono: true, fill: C.brand });
  b += table(32, 84, [['id', 'name'], [1, 'Asha'], [2, 'Ravi'], [3, 'Meena']], {
    w: 90,
    h: 34,
    size: 13,
    tones: { '0,0': 'brand', '0,1': 'brand' },
  });
  b += text(420, 72, 'enrolments', { size: 14, weight: 700, anchor: 'start', mono: true, fill: C.green });
  b += table(420, 84, [['id', 'student_id', 'course'], [10, 1, 'dsa'], [11, 1, 'react'], [12, 3, 'dsa']], {
    w: 110,
    h: 34,
    size: 13,
    tones: { '0,0': 'good', '0,1': 'good', '0,2': 'good' },
  });
  b += path('M 530 134 C 470 134, 280 110, 124 118', { tone: 'active', arrow: true, sw: 2 });
  b += tag(330, 106, 'student_id references students(id)', { size: 11.5, fill: C.amber, border: '#FCD34D' });
  b += rect(32, 244, 816, 40, { fill: '#0d1117', stroke: '#0d1117', rx: 10 });
  b += text(48, 264, 'SELECT s.name, e.course FROM students s JOIN enrolments e ON e.student_id = s.id;', { size: 13, anchor: 'start', mono: true, fill: '#E6EDF3' });
  b += text(32, 310, 'result', { size: 14, weight: 700, anchor: 'start' });
  b += table(32, 322, [['name', 'course'], ['Asha', 'dsa'], ['Asha', 'react'], ['Meena', 'dsa']], {
    w: 110,
    h: 26,
    size: 12.5,
    tones: { '0,0': 'muted', '0,1': 'muted' },
  });
  b += text(290, 360, 'Ravi has no enrolments, so an inner JOIN leaves him out.', { size: 13, anchor: 'start', fill: C.text });
  b += text(290, 384, 'Use LEFT JOIN to keep every student.', { size: 13, anchor: 'start', fill: C.brand, weight: 600 });
  add('postgres-join', W, H, 'Students and enrolments tables linked by a foreign key and the result of joining them', b);
}

// ---------- Auth: sessions ----------
add(
  'auth-session-flow',
  880,
  440,
  'Login with a server-side session and a session cookie',
  sequence({
    W: 880,
    H: 440,
    title: 'Session-based login: the server remembers you',
    actors: [
      ['browser', 'Browser', 'plain'],
      ['server', 'Express server', 'brand'],
      ['store', 'Session store', 'good'],
    ],
    messages: [
      ['browser', 'server', 'POST /login (email, password)'],
      ['server', 'server', 'bcrypt.compare(password, hash)'],
      ['server', 'store', 'save { userId: 42 } as sid=abc', 'good'],
      ['server', 'browser', 'Set-Cookie: sid=abc; HttpOnly; Secure', 'brand'],
      ['browser', 'server', 'GET /dashboard (cookie sent automatically)'],
      ['server', 'store', 'look up sid=abc → userId 42', 'good'],
      ['server', 'browser', '200 OK: your dashboard', 'brand', true],
    ],
  }),
);

// ---------- Auth: JWT ----------
add(
  'auth-jwt-flow',
  880,
  420,
  'Login with a signed JSON Web Token that the server verifies on each request',
  sequence({
    W: 880,
    H: 420,
    title: 'Token-based login (JWT): the token carries who you are',
    actors: [
      ['browser', 'Client', 'plain'],
      ['server', 'API server', 'brand'],
    ],
    messages: [
      ['browser', 'server', 'POST /login (email, password)'],
      ['server', 'server', 'check password, sign JWT with secret'],
      ['server', 'browser', 'access token (short-lived) + refresh token', 'brand'],
      ['browser', 'server', 'GET /api/me  Authorization: Bearer <token>'],
      ['server', 'server', 'verify signature + expiry (no DB lookup)'],
      ['server', 'browser', '200 OK: { id: 42, name: "Asha" }', 'brand', true],
    ],
  }),
);

// ---------- JWT structure ----------
{
  const W = 880;
  const H = 300;
  let b = heading(32, 32, 'Inside a JWT: header . payload . signature');
  const parts = [
    ['eyJhbGciOiJIUzI1NiJ9', 'bad', 'Header', ['{ "alg": "HS256",', '  "typ": "JWT" }']],
    ['eyJzdWIiOiI0MiIsInJvbGUiOiJzdHVkZW50In0', 'special', 'Payload (claims)', ['{ "sub": "42",', '  "role": "student",', '  "exp": 1767225600 }']],
    ['SflKxwRJSMeKKF2QT4fwpM', 'brand', 'Signature', ['HMAC-SHA256(', '  header + "." + payload,', '  secret)']],
  ];
  let x = 32;
  parts.forEach(([enc, tone, title, decoded], k) => {
    const w = [200, 340, 236][k];
    b += rect(x, 62, w, 36, { fill: TONES[tone].fill, stroke: TONES[tone].stroke, rx: 8, sw: 2 });
    b += text(x + w / 2, 80, enc.length > 26 ? `${enc.slice(0, 26)}…` : enc, { size: 12, mono: true, fill: TONES[tone].text, weight: 600 });
    if (k < 2) b += text(x + w + 5, 80, '.', { size: 22, weight: 800, fill: C.ink });
    b += text(x + 4, 126, title, { size: 13.5, weight: 700, anchor: 'start', fill: TONES[tone].text });
    decoded.forEach((l, i) => (b += text(x + 4, 152 + i * 22, l.replace(/^ +/, (m) => ' '.repeat(m.length)), { size: 12.5, anchor: 'start', mono: true, fill: C.text })));
    x += w + 14;
  });
  b += spans(32, 244, [['The payload is only ', C.text], ['base64-encoded, not encrypted', C.red, 700], [': anyone can read it, so never put passwords or secrets in it.', C.text]]);
  b += spans(32, 270, [['The signature proves the token was issued by your server and not ', C.text], ['changed', C.ink, 700], ['.', C.text]]);
  add('jwt-structure', W, H, 'The three dot-separated parts of a JSON Web Token and what each contains', b);
}

