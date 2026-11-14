// Diagrams for the System Design chapters: HTTP, routing and serialization.
import { C, TONES, badge, circle, code, heading, legend, line, note, path, rect, spans, tag, text } from './svg.mjs';
import { arrow, box, sequence } from './backend.mjs';

export const systemDesign = [];
const add = (name, width, height, title, body) => systemDesign.push({ name, width, height, title, body });

// ---------- 01: statelessness behind a load balancer ----------
{
  const W = 880;
  const H = 400;
  let b = heading(32, 32, 'Stateless servers: any server can answer any request');
  b += box(32, 150, 150, 64, ['Client', 'sends a token every time'], 'plain');
  b += arrow(186, 182, 256, 182);
  b += tag(221, 134, 'request + token', { size: 11.5, fill: C.text });
  b += box(260, 150, 160, 64, ['Load balancer', 'picks any server'], 'brand');
  const servers = [
    ['Server A', 'request 1', 70],
    ['Server B', 'request 3', 150],
    ['Server C', 'request 2', 230],
  ];
  servers.forEach(([label, req, y]) => {
    b += box(530, y, 170, 64, [label, 'keeps nothing about you'], 'good');
    b += arrow(424, 182, 526, y + 32, 'brand');
    b += line(704, y + 32, 742, 182, { color: C.faint, sw: 1.5, dash: '5 5' });
    b += text(470, y + 32 + (y < 150 ? -8 : y > 150 ? 8 : -12), req, { size: 11.5, fill: C.brand, weight: 600 });
  });
  b += box(746, 150, 110, 64, ['Database', 'shared data'], 'muted');
  b += line(32, 324, 848, 324, { color: C.grid, sw: 1 });
  b += spans(32, 348, [['Why it scales: ', C.ink, 700], ['no request depends on memory left behind by an earlier one,', C.text]]);
  b += spans(32, 372, [['so you can add servers, restart them or lose one, and users never notice.', C.text]]);
  add('http-stateless', W, H, 'A client sends requests with a token through a load balancer to three stateless servers that share one database', b);
}

// ---------- 01: anatomy of a request and a response ----------
{
  const W = 900;
  const H = 400;
  let b = heading(32, 32, 'Every HTTP message has the same four parts');
  const ROW = 30;
  const panel = (x, title, rows) => {
    const top = 84;
    let out = text(x, 66, title, { size: 15, weight: 700, anchor: 'start' });
    out += rect(x, top, 410, rows.length * ROW + 16, { fill: C.panel, stroke: C.line });
    rows.forEach(([value, tone, label], k) => {
      const y = top + 8 + k * ROW;
      const t = TONES[tone];
      out += rect(x + 8, y + 2, 394, ROW - 4, { fill: t.fill, stroke: t.stroke, sw: 1, rx: 6, dash: t.dash });
      if (value) out += code(x + 18, y + ROW / 2, value, { size: 13.5, fill: t.text });
      if (label) out += text(x + 394, y + ROW / 2, label, { size: 11.5, anchor: 'end', fill: C.muted, weight: 600 });
    });
    return out;
  };
  b += panel(32, 'Request (client to server)', [
    ['POST /api/orders HTTP/1.1', 'brand', 'request line'],
    ['Host: api.foodapp.in', 'plain', 'headers'],
    ['Content-Type: application/json', 'plain', ''],
    ['Authorization: Bearer eyJhbGc…', 'plain', ''],
    ['Content-Length: 29', 'plain', ''],
    ['', 'empty', 'blank line'],
    ['{"itemId": 12, "quantity": 2}', 'good', 'body'],
  ]);
  b += panel(458, 'Response (server to client)', [
    ['HTTP/1.1 201 Created', 'brand', 'status line'],
    ['Content-Type: application/json', 'plain', 'headers'],
    ['Location: /api/orders/981', 'plain', ''],
    ['Content-Length: 31', 'plain', ''],
    ['', 'empty', 'blank line'],
    ['{"id": 981, "status": "placed"}', 'good', 'body'],
  ]);
  b += line(32, 336, 868, 336, { color: C.grid, sw: 1 });
  b += spans(32, 360, [['The blank line ', C.ink, 700], ['tells the parser that the headers are over and the body starts.', C.text]]);
  b += spans(32, 384, [['Content-Length ', C.ink, 700], ['says how many bytes of body to read before the next message begins.', C.text]]);
  add('http-message-anatomy', W, H, 'An HTTP request and response, each with a start line, headers, a blank line and a JSON body', b);
}

// ---------- 01: idempotency key ----------
add(
  'idempotency-key',
  880,
  490,
  'A payment request is retried with the same idempotency key and the server returns the stored result instead of charging twice',
  sequence({
    W: 880,
    H: 490,
    title: 'Idempotency key: a retried payment is charged only once',
    actors: [
      ['client', 'Client', 'plain'],
      ['api', 'Payments API', 'brand'],
      ['store', ['Key store', 'Redis or a DB table'], 'good'],
    ],
    messages: [
      ['client', 'api', 'POST /payments with Idempotency-Key: k-81f2'],
      ['api', 'store', 'seen k-81f2 before? no', 'good'],
      ['api', 'api', 'charge the card'],
      ['api', 'store', 'save k-81f2 → 201 result', 'good'],
      ['api', 'client', '201 Created (lost on the way)', 'bad', true],
      ['client', 'api', 'retry: same body, same key'],
      ['api', 'store', 'seen k-81f2 before? yes', 'good'],
      ['api', 'client', 'stored 201, card NOT charged again', 'brand', true],
    ],
  }),
);

// ---------- 01: CORS preflight ----------
add(
  'cors-preflight',
  880,
  420,
  'The browser sends an OPTIONS preflight, the API approves the origin and method, then the browser sends the real PUT request',
  sequence({
    W: 880,
    H: 420,
    title: 'CORS preflight: the browser asks before sending a risky request',
    actors: [
      ['browser', ['Browser', 'page on app.foodapp.in'], 'plain'],
      ['server', ['API server', 'api.foodapp.in'], 'brand'],
    ],
    messages: [
      ['browser', 'browser', 'your JS calls fetch() with PUT, JSON and a token'],
      ['browser', 'server', 'OPTIONS /orders/7 (Origin, Access-Control-Request-Method: PUT)'],
      ['server', 'browser', '204 (Allow-Origin: https://app.foodapp.in, Allow-Methods: PUT)', 'brand'],
      ['browser', 'server', 'PUT /orders/7, the real request (with Origin)'],
      ['server', 'browser', '200 OK + Access-Control-Allow-Origin', 'brand'],
      ['browser', 'browser', 'origin allowed: your JS gets the response', 'good'],
    ],
  }),
);

// ---------- 01: caching with ETag ----------
add(
  'http-cache-etag',
  880,
  450,
  'A browser caches a response for 60 seconds, then revalidates it with If-None-Match and gets a 304 Not Modified',
  sequence({
    W: 880,
    H: 450,
    title: 'Caching: reuse while fresh, then ask "has it changed?"',
    actors: [
      ['browser', 'Browser', 'plain'],
      ['server', 'Server', 'brand'],
    ],
    messages: [
      ['browser', 'server', 'GET /api/menu'],
      ['server', 'browser', '200 + body (ETag: "v7", Cache-Control: max-age=60)', 'brand'],
      ['browser', 'browser', 'next 60 s: answered from cache, no request at all', 'good'],
      ['browser', 'server', 'after 60 s: GET /api/menu (If-None-Match: "v7")'],
      ['server', 'server', 'menu unchanged, ETag is still "v7"'],
      ['server', 'browser', '304 Not Modified (empty body)', 'good'],
      ['browser', 'browser', 'reuse the cached copy, bytes saved', 'good'],
    ],
  }),
);

// ---------- 02: method + path → handler ----------
{
  const W = 900;
  const H = 440;
  let b = heading(32, 32, 'The router looks up method + path and calls exactly one handler');
  b += text(147, 66, 'Incoming request', { size: 13, weight: 700, fill: C.muted });
  b += text(470, 66, 'Route table', { size: 13, weight: 700, fill: C.muted });
  b += text(775, 66, 'Handler', { size: 13, weight: 700, fill: C.muted });
  const rows = [
    ['GET /api/books', 'GET /api/books', 'listBooks()', 'good'],
    ['POST /api/books', 'POST /api/books', 'createBook()', 'good'],
    ['GET /api/books/42', 'GET /api/books/:id', 'getBook(id = "42")', 'good'],
    ['DELETE /api/books/42', 'DELETE /api/books/:id', 'deleteBook(id = "42")', 'good'],
    ['GET /api/cart', '* (nothing matched)', 'notFound() → 404', 'bad'],
  ];
  b += rect(330, 82, 280, rows.length * 58 + 8, { fill: C.panel, stroke: C.line });
  rows.forEach(([req, route, handler, tone], k) => {
    const y = 90 + k * 58;
    b += box(32, y, 230, 42, req, 'plain', { mono: true, size: 13 });
    b += arrow(266, y + 21, 334, y + 21, 'plain');
    b += rect(340, y, 260, 42, { fill: '#FFFFFF', stroke: tone === 'bad' ? C.red : C.line, rx: 8 });
    b += code(352, y + 21, route, { size: 13, fill: tone === 'bad' ? C.red : C.ink });
    b += arrow(604, y + 21, 666, y + 21, tone);
    b += box(670, y, 200, 42, handler, tone, { mono: true, size: 12.5 });
  });
  b += line(32, 400, 868, 400, { color: C.grid, sw: 1 });
  b += spans(32, 422, [['Same path, different method ', C.ink, 700], ['= a different key, so GET and POST /api/books never clash.', C.text]]);
  add('routing-table', W, H, 'Five requests matched against a route table of method and path patterns, each calling one handler, with a 404 fallback', b);
}

// ---------- 02: reading a URL ----------
{
  const W = 720;
  const H = 290;
  let b = heading(32, 32, 'Reading a URL: what each part means');
  const parts = [
    ['/api', 'muted', 'prefix', 'all API routes'],
    ['/v1', 'special', 'version', 'response shape v1'],
    ['/users', 'plain', 'static', 'collection'],
    ['/123', 'brand', 'path param', 'which user'],
    ['/posts', 'plain', 'static', 'sub-collection'],
    ['/456', 'brand', 'path param', 'which post'],
    ['?sort=new&page=2', 'active', 'query string', 'filter, sort, page'],
  ];
  const CH = 10.8;
  const widths = parts.map(([p]) => p.length * CH + 20);
  const total = widths.reduce((s, w) => s + w, 0) + (parts.length - 1) * 4;
  let x = (W - total) / 2;
  const y = 120;
  const mids = [];
  parts.forEach(([value, tone], k) => {
    const t = TONES[tone];
    b += rect(x, y, widths[k], 44, { fill: t.fill, stroke: t.stroke, sw: 1.75, rx: 8 });
    b += text(x + widths[k] / 2, y + 22, value, { size: 18, mono: true, weight: 600, fill: t.text });
    mids.push(x + widths[k] / 2);
    x += widths[k] + 4;
  });
  const pathEnd = mids[5] + widths[5] / 2;
  const left = (W - total) / 2;
  b += path(`M${left} 108 L${left} 98 L${pathEnd} 98 L${pathEnd} 108`, { color: C.brand, sw: 1.75 });
  b += text((left + pathEnd) / 2, 84, 'path: decides WHICH resource you get', { size: 13, weight: 700, fill: C.brand });
  const qx = mids[6] - widths[6] / 2;
  b += path(`M${qx} 108 L${qx} 98 L${qx + widths[6]} 98 L${qx + widths[6]} 108`, { color: C.amber, sw: 1.75 });
  b += text(qx + widths[6] / 2, 84, 'query: shapes the response', { size: 13, weight: 700, fill: C.amber });
  parts.forEach(([, tone, label, detail], k) => {
    const low = k % 2 === 1;
    const ly = low ? 232 : 194;
    b += line(mids[k], y + 48, mids[k], ly - 14, { color: C.line, sw: 1.5 });
    const color = tone === 'plain' || tone === 'muted' ? C.ink : TONES[tone].stroke;
    b += text(mids[k], ly, label, { size: 12.5, weight: 700, fill: color });
    b += text(mids[k], ly + 17, detail, { size: 11.5, fill: C.muted });
  });
  add('url-anatomy', W, H, 'The URL /api/v1/users/123/posts/456?sort=new&page=2 split into prefix, version, static parts, path parameters and a query string', b);
}

// ---------- 03: serialization round trip ----------
{
  const W = 900;
  const H = 470;
  let b = heading(32, 32, 'One request, four conversions');
  b += text(150, 70, 'Client: React app (JavaScript)', { size: 13, weight: 700, fill: C.muted });
  b += text(450, 70, 'Network: only text travels', { size: 13, weight: 700, fill: C.muted });
  b += text(750, 70, 'Server: Go API', { size: 13, weight: 700, fill: C.muted });
  b += rect(345, 84, 210, 296, { fill: C.panel, stroke: C.line, dash: '5 5' });

  // Request row
  b += box(32, 100, 236, 56, ['{ itemId: 12, qty: 2 }', 'JS object'], 'brand', { mono: true, size: 13 });
  b += box(358, 100, 184, 56, ['{"itemId":12,"qty":2}', 'JSON text'], 'active', { mono: true, size: 12 });
  b += box(632, 100, 236, 56, ['Order{ItemID: 12, Qty: 2}', 'Go struct'], 'good', { mono: true, size: 12.5 });
  b += arrow(272, 128, 354, 128, 'brand');
  b += arrow(546, 128, 628, 128, 'good');
  b += badge(313, 128, 1, { tone: 'brand' });
  b += badge(587, 128, 2, { tone: 'good' });
  b += text(313, 176, 'JSON.stringify', { size: 11.5, mono: true, fill: C.brand, weight: 600 });
  b += text(587, 176, 'json.Unmarshal', { size: 11.5, mono: true, fill: C.green, weight: 600 });

  b += arrow(750, 160, 750, 192, 'ink');
  b += box(652, 196, 196, 46, ['save order to DB', 'business logic'], 'muted', { size: 13 });
  b += arrow(750, 246, 750, 278, 'ink');

  // Response row
  b += box(632, 282, 236, 56, ['Order{ID: 981}', 'Go struct'], 'good', { mono: true, size: 13 });
  b += box(358, 282, 184, 56, ['{"id":981}', 'JSON text'], 'active', { mono: true, size: 13 });
  b += box(32, 282, 236, 56, ['{ id: 981 }', 'JS object'], 'brand', { mono: true, size: 13 });
  b += arrow(628, 310, 546, 310, 'good');
  b += arrow(354, 310, 272, 310, 'brand');
  b += badge(587, 310, 3, { tone: 'good' });
  b += badge(313, 310, 4, { tone: 'brand' });
  b += text(587, 360, 'json.Marshal', { size: 11.5, mono: true, fill: C.green, weight: 600 });
  b += text(313, 360, 'JSON.parse', { size: 11.5, mono: true, fill: C.brand, weight: 600 });

  b += line(32, 400, 868, 400, { color: C.grid, sw: 1 });
  b += spans(32, 424, [['Serialize ', C.ink, 700], ['(1, 3): native data → JSON before sending.   ', C.text], ['Deserialize ', C.ink, 700], ['(2, 4): JSON → native data after receiving.', C.text]]);
  b += note(32, 448, 'Neither side needs to know the other side\'s language. They only agree on JSON.');
  add('serialization-round-trip', W, H, 'A JavaScript object is serialized to JSON, parsed into a Go struct on the server, and the response makes the same trip back', b);
}

// ---------- 04: OAuth 2.0 authorization code flow with PKCE ----------
add(
  'oauth-pkce',
  900,
  540,
  'Sign in with Google using the OAuth authorization code flow with PKCE, from the click to the API call',
  sequence({
    W: 900,
    H: 540,
    title: 'OAuth 2.0 authorization code flow with PKCE',
    actors: [
      ['browser', 'Browser', 'plain'],
      ['app', ['Your app', 'the client'], 'brand'],
      ['auth', ['Google', 'authorization server'], 'good'],
      ['api', ['Google API', 'resource server'], 'special'],
    ],
    messages: [
      ['browser', 'app', 'click "Sign in with Google"'],
      ['app', 'app', 'make state + code_verifier, send only SHA-256(verifier)'],
      ['app', 'browser', 'redirect to Google /authorize', 'brand'],
      ['browser', 'auth', 'user logs in and approves the scopes'],
      ['auth', 'browser', 'redirect to /callback?code=…&state=…', 'good'],
      ['browser', 'app', 'GET /callback (app checks state)'],
      ['app', 'auth', 'POST /token: code + code_verifier'],
      ['auth', 'app', 'access token + ID token', 'good'],
      ['app', 'api', 'API call with Bearer access token', 'special'],
    ],
  }),
);

// ---------- 04: refresh token rotation ----------
add(
  'refresh-rotation',
  880,
  500,
  'A short-lived access token expires, the client swaps its refresh token for a new pair, and reuse of an old refresh token revokes the whole family',
  sequence({
    W: 880,
    H: 500,
    title: 'Access + refresh tokens with rotation and reuse detection',
    actors: [
      ['client', 'Client', 'plain'],
      ['api', ['Auth API', 'issues tokens'], 'brand'],
      ['store', ['Token store', 'refresh token family'], 'good'],
    ],
    messages: [
      ['client', 'api', 'API call with access token (lives 15 min)'],
      ['api', 'client', '401: access token expired', 'bad', true],
      ['client', 'api', 'POST /auth/refresh (cookie: refresh token R1)'],
      ['api', 'store', 'R1 valid and unused? yes, mark it used', 'good'],
      ['api', 'client', 'new access token + refresh token R2', 'brand'],
      ['client', 'api', 'a thief replays the old R1', 'bad'],
      ['api', 'store', 'R1 was already used: revoke the family', 'bad'],
      ['api', 'client', '401: everyone on this family logs in again', 'bad', true],
    ],
  }),
);

// ---------- 05: validation at the front door ----------
{
  const W = 900;
  const H = 400;
  let b = heading(32, 32, 'Same bad request, with and without validation');
  const row = (y, label) => text(32, y, label, { size: 13, weight: 700, anchor: 'start', fill: C.muted });
  const steps = (y, tones, first = 'Controller') =>
    [first, 'Service', 'Repository', 'Postgres'].map((name, k) => box(250 + k * 160, y, 130, 46, name, tones[k], { size: 13.5 })).join('') +
    [0, 1, 2].map((k) => arrow(384 + k * 160, y + 23, 406 + k * 160, y + 23, tones[k + 1] === 'muted' ? 'muted' : 'plain')).join('');

  // Without validation
  b += row(70, 'WITHOUT VALIDATION');
  b += box(32, 88, 180, 46, ['POST /api/books', '{ "title": null }'], 'plain', { mono: true, size: 12.5, subSize: 11.5 });
  b += arrow(216, 111, 246, 111);
  b += steps(88, ['plain', 'plain', 'plain', 'bad']);
  b += path('M 795 138 C 795 180, 600 186, 140 186 L 140 160', { tone: 'bad', arrow: true, sw: 2 });
  b += tag(470, 186, '500 Internal Server Error: "null value in column title"', { size: 12, fill: C.red, border: C.red });
  b += note(32, 214, 'The database finds the problem, after a connection, a query and maybe an email already went out.');

  b += line(32, 240, 868, 240, { color: C.grid, sw: 1 });

  // With validation
  b += row(266, 'WITH VALIDATION');
  b += box(32, 284, 180, 46, ['POST /api/books', '{ "title": null }'], 'plain', { mono: true, size: 12.5, subSize: 11.5 });
  b += arrow(216, 307, 246, 307);
  b += steps(284, ['active', 'muted', 'muted', 'muted'], ['Controller', 'validates first']);
  b += path('M 315 334 C 315 362, 200 366, 140 366 L 140 338', { tone: 'good', arrow: true, sw: 2 });
  b += tag(330, 370, '400 Bad Request: "title is required"', { size: 12, fill: C.green, border: C.green });
  b += note(560, 368, 'Rejected at the door. Nothing else runs.');
  add('validation-gate', W, H, 'A bad request reaching the database and failing with 500, compared with the same request rejected by validation with a clear 400', b);
}

// ---------- 06: inside the server ----------
{
  const W = 900;
  const H = 360;
  let b = heading(32, 32, 'Inside the server: one job per layer');
  const stops = [
    ['Port 3000', 'entry point', 'muted'],
    ['Middleware', 'every request', 'brand'],
    ['Router', 'method + path', 'brand'],
    ['Controller', 'HTTP in and out', 'active'],
    ['Service', 'business logic', 'good'],
    ['Repository', 'database queries', 'special'],
    ['Database', 'Postgres, Redis', 'plain'],
  ];
  const w = 106;
  const gap = 18;
  const x0 = (W - (stops.length * w + (stops.length - 1) * gap)) / 2;
  stops.forEach(([label, sub, tone], k) => {
    const x = x0 + k * (w + gap);
    b += box(x, 80, w, 56, [label, sub], tone, { size: 13.5, subSize: 11 });
    if (k < stops.length - 1) b += arrow(x + w + 2, 108, x + w + gap - 2, 108, 'ink');
  });
  const notes = [
    ['Middleware', 'CORS, logging, auth, rate limits. Can stop a request early.'],
    ['Controller', 'read the request, validate, call a service, choose the status code.'],
    ['Service', 'the real work. Knows nothing about HTTP: no req, no res, no status codes.'],
    ['Repository', 'builds and runs queries. One method, one kind of result.'],
  ];
  notes.forEach(([k, v], i) => (b += spans(40, 176 + i * 24, [[`${k}: `, C.ink, 700], [v, C.text]], { size: 13.5 })));
  const ctxX = x0 + (w + gap);
  const ctxW = 3 * w + 2 * gap;
  b += rect(ctxX, 284, ctxW, 44, { fill: C.amberSoft, stroke: C.amber, rx: 10 });
  b += text(ctxX + ctxW / 2, 298, 'request context: req.id, req.user, signal', { size: 12.5, weight: 700, fill: '#92400E' });
  b += text(ctxX + ctxW / 2, 316, 'shared by middleware, router and controller', { size: 11.5, fill: C.muted });
  b += text(ctxX + ctxW + 16, 298, 'Services get plain values', { size: 12.5, anchor: 'start', fill: C.text, weight: 600 });
  b += text(ctxX + ctxW + 16, 316, '(userId, signal), never req itself.', { size: 12.5, anchor: 'start', fill: C.muted });
  add('request-layers', W, H, 'A request passing through the entry point, middleware, router, controller, service and repository to the database, with the request context alongside', b);
}

// ---------- 07: REST constraints in a real deployment ----------
{
  const W = 900;
  const H = 380;
  let b = heading(32, 32, "Fielding's constraints, in a real deployment");
  b += box(32, 120, 130, 64, ['Client', 'React / mobile app'], 'plain', { size: 14 });
  b += box(200, 120, 130, 64, ['CDN', 'caches responses'], 'active', { size: 14 });
  b += box(368, 120, 140, 64, ['Load balancer', 'picks any server'], 'brand', { size: 14 });
  [70, 132, 194].forEach((y, k) => (b += box(548, y, 150, 50, [`API server ${'ABC'[k]}`, 'stateless'], 'good', { size: 13.5, subSize: 11 })));
  b += box(738, 120, 130, 64, ['Database', 'shared state'], 'muted', { size: 14 });
  b += arrow(166, 152, 196, 152);
  b += arrow(334, 152, 364, 152);
  [95, 157, 219].forEach((y) => {
    b += arrow(512, 152, 544, y, 'brand');
    b += line(702, y, 734, 152, { color: C.faint, sw: 1.5, dash: '5 5' });
  });
  const notes = [
    ['Client-server', 'the UI and the data/logic live apart and change independently.'],
    ['Layered system', 'the client only talks to the next layer; it can\'t tell a CDN from the origin.'],
    ['Cacheable', 'every response says whether it may be stored (Cache-Control, ETag).'],
    ['Stateless', 'each request carries everything, so any API server can answer it.'],
    ['Uniform interface', 'resources at URLs, HTTP methods, self-describing JSON, everywhere.'],
  ];
  notes.forEach(([k, v], i) => (b += spans(40, 268 + i * 22, [[`${k}: `, C.ink, 700], [v, C.text]], { size: 13 })));
  add('rest-constraints', W, H, 'A client, CDN, load balancer, three stateless API servers and a database, labelled with the REST constraints each layer represents', b);
}

// ---------- 08: relationship shapes ----------
function dbTable(x, y, w, name, cols, tone = 'brand') {
  const t = TONES[tone];
  let out = rect(x, y, w, 28 + cols.length * 22 + 6, { fill: '#FFFFFF', stroke: t.stroke, sw: 1.75, rx: 8 });
  out += `<path d="M${x} ${y + 8} Q${x} ${y} ${x + 8} ${y} L${x + w - 8} ${y} Q${x + w} ${y} ${x + w} ${y + 8} L${x + w} ${y + 28} L${x} ${y + 28} Z" fill="${t.fill}" stroke="${t.stroke}" stroke-width="1.75"/>`;
  out += text(x + w / 2, y + 14, name, { size: 13.5, weight: 700, fill: t.text, mono: true });
  cols.forEach(([col, key], k) => {
    out += code(x + 10, y + 42 + k * 22, col, { size: 12.5, fill: C.ink });
    if (key) out += text(x + w - 10, y + 42 + k * 22, key, { size: 10.5, weight: 700, anchor: 'end', fill: key.includes('FK') ? C.violet : C.amber });
  });
  return out;
}
{
  const W = 900;
  const H = 404;
  let b = heading(32, 32, 'Three ways tables relate');
  const col = (x, title, sub) => text(x, 70, title, { size: 14, weight: 700, anchor: 'start' }) + note(x, 90, sub, { size: 12.5 });

  // one-to-one
  b += col(32, 'One-to-one', 'each user has at most one profile');
  b += dbTable(32, 112, 190, 'users', [['id', 'PK'], ['email'], ['full_name']]);
  b += dbTable(32, 252, 190, 'user_profiles', [['user_id', 'PK + FK'], ['bio'], ['phone']], 'good');
  b += line(127, 210, 127, 250, { tone: 'ink', arrow: true });
  b += tag(160, 230, '1 : 1', { size: 12, fill: C.ink, border: C.line });

  // one-to-many
  b += col(300, 'One-to-many', 'a course has many lessons');
  b += dbTable(300, 112, 190, 'courses', [['id', 'PK'], ['title'], ['slug']]);
  b += dbTable(300, 252, 190, 'lessons', [['id', 'PK'], ['course_id', 'FK'], ['position']], 'good');
  b += line(395, 210, 395, 250, { tone: 'ink', arrow: true });
  b += tag(428, 230, '1 : many', { size: 12, fill: C.ink, border: C.line });

  // many-to-many
  b += col(568, 'Many-to-many', 'students and courses, both ways');
  b += dbTable(568, 112, 130, 'users', [['id', 'PK']]);
  b += dbTable(738, 112, 130, 'courses', [['id', 'PK']]);
  b += dbTable(618, 252, 200, 'enrollments', [['user_id', 'PK + FK'], ['course_id', 'PK + FK'], ['progress']], 'special');
  b += line(633, 168, 680, 248, { tone: 'ink', arrow: true });
  b += line(803, 168, 756, 248, { tone: 'ink', arrow: true });
  b += note(32, 382, 'Many-to-many needs a linking table. The pair (user_id, course_id) is its primary key, so each enrollment exists only once.', { size: 12.5 });
  add('db-relationships', W, H, 'One-to-one users and profiles, one-to-many courses and lessons, and many-to-many users and courses through an enrollments linking table', b);
}

// ---------- 08: sequential scan vs index ----------
{
  const W = 900;
  const H = 380;
  let b = heading(32, 32, 'Finding one row: scan everything, or use an index');
  b += text(32, 70, 'Sequential scan (no index)', { size: 14, weight: 700, anchor: 'start', fill: C.red });
  const rows = ['Course 17', 'Course 3', 'Course 42', 'Course 8', 'Course 29', '…', 'Course 9'];
  rows.forEach((r, k) => {
    const y = 90 + k * 34;
    const hit = r === 'Course 9';
    b += rect(60, y, 170, 28, { fill: hit ? C.greenSoft : '#FFFFFF', stroke: hit ? C.green : C.line, rx: 6 });
    b += code(72, y + 14, r, { size: 12.5, fill: hit ? '#065F46' : C.text });
    b += text(246, y + 14, hit ? 'found' : r === '…' ? '' : 'no', { size: 11.5, anchor: 'start', fill: hit ? C.green : C.faint, weight: 600 });
  });
  b += path('M 44 96 L 44 314', { tone: 'bad', arrow: true, sw: 2 });
  b += note(32, 340, 'Reads rows one by one until it finds a match.', { size: 12.5 });
  b += note(32, 360, '50,000 rows → up to 50,000 checks.', { size: 12.5 });

  b += line(330, 64, 330, 360, { color: C.grid, sw: 1 });

  b += text(360, 70, 'Index lookup (B-tree)', { size: 14, weight: 700, anchor: 'start', fill: C.green });
  const node = (x, y, label, tone = 'plain') => box(x, y, 120, 34, label, tone, { mono: true, size: 12.5 });
  b += node(560, 92, '< M | ≥ M', 'brand');
  b += node(420, 168, '< C | C–M', 'brand');
  b += node(700, 168, 'M–T | ≥ T', 'plain');
  b += node(344, 244, 'A … B', 'muted');
  b += box(480, 244, 180, 34, 'Course 9 → row 4182', 'good', { mono: true, size: 12.5 });
  b += arrow(600, 130, 500, 164, 'good');
  b += arrow(640, 130, 740, 164, 'muted');
  b += arrow(456, 206, 410, 240, 'muted');
  b += arrow(500, 206, 560, 240, 'good');
  b += path('M 664 261 L 775 261 L 775 298', { tone: 'good', arrow: true, sw: 2 });
  b += box(700, 302, 150, 34, 'row 4182 on disk', 'good', { size: 12.5 });
  b += note(360, 340, 'A sorted tree: a few hops, then jump straight to the row.', { size: 12.5 });
  b += note(360, 360, 'Faster reads, slightly slower writes (the index must be updated).', { size: 12.5 });
  add('index-vs-scan', W, H, 'A sequential scan checking every row compared with a B-tree index lookup that jumps to the matching row', b);
}

// ---------- 09: cache-aside ----------
add(
  'cache-aside',
  880,
  470,
  'Cache-aside: the app checks Redis, falls back to the database on a miss, stores the result with a TTL, and serves later requests from Redis',
  sequence({
    W: 880,
    H: 470,
    title: 'Cache-aside (lazy caching): fill the cache on the first miss',
    actors: [
      ['app', ['Your API', 'Express'], 'brand'],
      ['cache', ['Redis', 'in RAM'], 'active'],
      ['db', ['Postgres', 'on disk'], 'good'],
    ],
    messages: [
      ['app', 'cache', 'GET course:42'],
      ['cache', 'app', 'nil (cache miss)', 'bad', true],
      ['app', 'db', 'SELECT … WHERE id = 42   (~20 ms)', 'good'],
      ['db', 'app', 'the course row', 'good', true],
      ['app', 'cache', 'SET course:42 … EX 600'],
      ['app', 'app', 'respond to the client'],
      ['app', 'cache', 'next request: GET course:42'],
      ['cache', 'app', 'the cached JSON (cache hit, < 1 ms)', 'active', true],
    ],
  }),
);

// ---------- 09: CDN edges ----------
{
  const W = 900;
  const H = 400;
  let b = heading(32, 32, 'A CDN keeps copies near users, so most requests never reach the origin');
  b += box(32, 160, 170, 70, ['Origin server', 'one region, far away'], 'muted', { size: 14 });
  const pops = [
    ['Delhi PoP', 80],
    ['Mumbai PoP', 170],
    ['Chennai PoP', 260],
  ];
  pops.forEach(([name, y]) => {
    b += box(390, y, 170, 56, [name, 'edge servers + cache'], 'active', { size: 13.5 });
    b += line(386, y + 28, 206, 195, { color: C.faint, sw: 1.75, dash: '6 5' });
    b += box(700, y + 6, 168, 44, 'users nearby', 'plain', { size: 13 });
    b += line(696, y + 28, 564, y + 28, { tone: 'good', arrow: true, sw: 2 });
  });
  b += tag(296, 120, 'only on a miss', { size: 11.5, fill: C.muted, border: C.line });
  b += tag(630, 70, '~10 ms', { size: 11.5, fill: C.green, border: C.green });
  b += tag(296, 300, '~150–250 ms', { size: 11.5, fill: C.muted, border: C.line });
  b += line(32, 336, 868, 336, { color: C.grid, sw: 1 });
  b += spans(32, 358, [['Hit: ', C.ink, 700], ['the PoP already has the file and answers immediately. ', C.text], ['Miss: ', C.ink, 700], ['it fetches from the origin once, caches it for its TTL,', C.text]]);
  b += spans(32, 380, [['then serves every later user in that region from the copy.', C.text]]);
  add('cdn-edge', W, H, 'An origin server far away and three CDN points of presence in Delhi, Mumbai and Chennai serving nearby users from cache', b);
}

// ---------- 09: latency ladder ----------
{
  const W = 900;
  const H = 420;
  let b = heading(32, 32, 'How long things take, and the same times scaled up to human size');
  b += text(32, 66, 'If one L1 cache read took 1 second…', { size: 13, anchor: 'start', fill: C.muted });
  const rows = [
    ['L1 CPU cache', '~1 ns', '1 second', 1, 'good'],
    ['L2 CPU cache', '~4 ns', '4 seconds', 1.6, 'good'],
    ['L3 CPU cache', '~15 ns', '15 seconds', 2.2, 'good'],
    ['RAM (Redis lives here)', '~100 ns', '~2 minutes', 3, 'active'],
    ['SSD read', '~100 µs', '~1 day', 6, 'brand'],
    ['Hard disk seek', '~10 ms', '~4 months', 8, 'special'],
    ['India → US round trip', '~200 ms', '~6 years', 9.3, 'bad'],
  ];
  rows.forEach(([name, real, human, scale, tone], k) => {
    const y = 88 + k * 44;
    const t = TONES[tone];
    b += text(32, y + 15, name, { size: 13.5, weight: 600, anchor: 'start' });
    b += text(252, y + 15, real, { size: 13, anchor: 'start', mono: true, fill: C.text });
    const w = Math.max(10, scale * 46);
    b += rect(340, y + 3, w, 24, { fill: t.fill, stroke: t.stroke, rx: 6 });
    b += text(340 + w + 10, y + 15, human, { size: 13, anchor: 'start', weight: 600, fill: t.text });
  });
  b += note(32, 404, 'Bar lengths are on a log scale. Each step down is roughly 10 to 1,000 times slower than the one above.', { size: 12.5 });
  add('latency-ladder', W, H, 'Latency of CPU caches, RAM, SSD, hard disk and an India to US network round trip, with the same times scaled so an L1 read takes one second', b);
}

// ---------- 10: sync vs async signup ----------
{
  const W = 900;
  const H = 400;
  let b = heading(32, 32, 'Signup: wait for the email provider, or hand the email to a worker');
  const lane = (y, label) => text(32, y, label, { size: 13, weight: 700, anchor: 'start', fill: C.muted });
  const seg = (x, y, w, label, tone) => box(x, y, w, 40, label, tone, { size: 12.5 });

  b += lane(72, 'SYNCHRONOUS');
  b += seg(32, 86, 150, 'validate + save user', 'plain');
  b += seg(186, 86, 330, 'call the email API … waiting … (1–5 s)', 'active');
  b += seg(520, 86, 120, 'respond', 'plain');
  b += text(656, 90, 'Slow signup. If the email API', { size: 12.5, anchor: 'start', fill: C.text });
  b += text(656, 107, 'is down: a 500, or "check your', { size: 12.5, anchor: 'start', fill: C.red, weight: 600 });
  b += text(656, 124, 'email" that never arrives.', { size: 12.5, anchor: 'start', fill: C.red, weight: 600 });

  b += line(32, 160, 868, 160, { color: C.grid, sw: 1 });

  b += lane(186, 'WITH A BACKGROUND JOB');
  b += seg(32, 200, 150, 'validate + save user', 'plain');
  b += seg(186, 200, 110, 'enqueue job', 'brand');
  b += seg(300, 200, 120, '201 Created', 'good');
  b += text(440, 220, '← the user is done in ~50 ms', { size: 12.5, anchor: 'start', fill: C.green, weight: 600 });

  b += lane(282, 'WORKER (separate process)');
  b += arrow(241, 244, 241, 292, 'brand', { dash: '5 4' });
  b += seg(186, 296, 150, 'pick up the job', 'brand');
  b += seg(340, 296, 120, 'call email API', 'active');
  b += seg(464, 296, 110, 'fails: retry', 'bad');
  b += seg(578, 296, 120, 'call again', 'active');
  b += seg(702, 296, 120, 'sent, ACK', 'good');
  b += note(32, 372, 'The API never waits for the email provider, and a provider outage turns into a delayed email, not a failed signup.', { size: 12.5 });
  add('sync-vs-async', W, H, 'A synchronous signup that waits on the email API compared with one that enqueues a background job and responds immediately while a worker retries', b);
}

// ---------- 10: producer, queue, workers ----------
{
  const W = 900;
  const H = 420;
  let b = heading(32, 32, 'How a task queue works');
  b += box(32, 110, 160, 70, ['Producer', 'your API: enqueue + return'], 'brand', { size: 14 });
  b += arrow(196, 145, 262, 145, 'brand');
  b += tag(229, 128, 'JSON job', { size: 11.5, fill: C.brand, border: C.brand });
  b += rect(266, 104, 240, 82, { fill: C.amberSoft, stroke: C.amber, rx: 12 });
  b += text(386, 120, 'Queue / broker (Redis, RabbitMQ, SQS)', { size: 12, weight: 700, fill: '#92400E' });
  ['job 7', 'job 8', 'job 9', 'job 10'].forEach((j, k) => (b += box(280 + k * 55, 136, 48, 34, j, 'plain', { size: 11, mono: true })));
  [70, 140, 210].forEach((y, k) => {
    b += box(600, y, 150, 50, [`Worker ${k + 1}`, 'runs the handler'], 'good', { size: 13.5, subSize: 11 });
    b += arrow(510, 145, 596, y + 25, 'good');
  });
  b += box(780, 140, 96, 50, ['ACK', 'job removed'], 'good', { size: 13, subSize: 11 });
  b += arrow(754, 165, 776, 165, 'good');

  // retry loop
  b += path('M 675 264 C 675 320, 420 330, 400 192', { tone: 'active', arrow: true, sw: 2 });
  b += tag(400, 352, 'fail → retry later: 1 min, 2, 4, 8 … (+ jitter)', { size: 12, fill: C.amber, border: C.amber });
  // DLQ
  b += box(600, 340, 276, 50, ['Dead-letter queue', 'out of retries: inspect, fix, replay'], 'bad', { size: 13.5, subSize: 11 });
  b += arrow(675, 264, 700, 336, 'bad');
  b += note(32, 230, 'Visibility timeout: a job a', { size: 12.5 });
  b += note(32, 250, 'worker took but never ACKed', { size: 12.5 });
  b += note(32, 270, '(it crashed) becomes visible', { size: 12.5 });
  b += note(32, 290, 'again for another worker.', { size: 12.5 });
  b += note(32, 330, 'Add workers to go faster:', { size: 12.5, fill: C.ink, weight: 600 });
  b += note(32, 350, 'they share the queue.', { size: 12.5 });
  add('task-queue-flow', W, H, 'A producer enqueues JSON jobs into a broker, several workers process them and acknowledge success, failures retry with backoff and land in a dead-letter queue when retries run out', b);
}

// ---------- 11: inverted index ----------
{
  const W = 900;
  const H = 410;
  let b = heading(32, 32, 'An inverted index maps each word to the documents that contain it');
  b += text(32, 68, 'Documents', { size: 13, weight: 700, anchor: 'start', fill: C.muted });
  const docs = ['Introduction to Machine Learning', 'Node.js Backend Development', 'Learning Docker'];
  docs.forEach((d, k) => {
    const y = 82 + k * 58;
    b += rect(32, y, 250, 46, { fill: '#FFFFFF', stroke: C.line, rx: 8 });
    b += badge(52, y + 23, k + 1, { tone: 'brand' });
    b += text(72, y + 23, d, { size: 12.5, anchor: 'start' });
  });
  b += text(380, 68, 'Analysis', { size: 13, weight: 700, fill: C.muted });
  ['1. split into words', '2. lowercase', '3. drop "to", "the", "a"', '4. stem: learning → learn'].forEach((s, k) => {
    b += box(296, 82 + k * 42, 168, 34, s, k === 3 ? 'active' : 'plain', { size: 11.5 });
  });
  b += arrow(284, 151, 293, 151, 'ink');
  b += arrow(467, 151, 486, 151, 'ink');
  b += text(620, 68, 'Inverted index', { size: 13, weight: 700, fill: C.muted });
  const terms = [
    ['introduct', '1'],
    ['machin', '1'],
    ['learn', '1, 3'],
    ['node.js', '2'],
    ['backend', '2'],
    ['develop', '2'],
    ['docker', '3'],
  ];
  b += rect(490, 80, 260, terms.length * 30 + 8, { fill: C.panel, stroke: C.line, rx: 10 });
  terms.forEach(([t, ids], k) => {
    const y = 84 + k * 30;
    const hot = t === 'learn';
    b += rect(498, y, 244, 26, { fill: hot ? C.greenSoft : '#FFFFFF', stroke: hot ? C.green : C.grid, rx: 6, sw: 1 });
    b += code(508, y + 13, t, { size: 12.5, fill: hot ? '#065F46' : C.ink });
    b += text(734, y + 13, `docs ${ids}`, { size: 12, anchor: 'end', fill: hot ? C.green : C.muted, weight: 600 });
  });
  b += box(32, 336, 250, 44, ['search: "learning"', 'analysed the same way → learn'], 'brand', { size: 13, subSize: 11 });
  b += path('M 286 358 L 476 358 L 476 167 L 494 167', { tone: 'good', arrow: true, sw: 2 });
  b += box(770, 140, 110, 54, ['docs 1, 3', 'no table scan'], 'good', { size: 13, subSize: 11 });
  b += arrow(746, 167, 766, 167, 'good');
  b += note(496, 340, 'Lookup cost depends on how many documents match,', { size: 12 });
  b += note(496, 358, 'not on how many documents exist.', { size: 12 });
  add('inverted-index', W, H, 'Three course titles analysed into terms and stored in an inverted index, where a search for learning jumps straight to documents 1 and 3', b);
}

// ---------- 12: deadlock ----------
{
  const W = 880;
  const H = 360;
  let b = heading(32, 32, 'A deadlock: each transaction waits for a lock the other holds');
  b += box(60, 90, 200, 60, ['Transaction A', 'transfer: wallet 1 → 2'], 'brand', { size: 14 });
  b += box(620, 90, 200, 60, ['Transaction B', 'transfer: wallet 2 → 1'], 'special', { size: 14 });
  b += box(60, 230, 200, 56, ['row: wallet 1', 'locked by A'], 'brand', { size: 13.5 });
  b += box(620, 230, 200, 56, ['row: wallet 2', 'locked by B'], 'special', { size: 13.5 });
  b += line(160, 154, 160, 226, { tone: 'brand', sw: 2.5 });
  b += tag(160, 190, 'holds', { size: 11.5, fill: C.brand, border: C.brand });
  b += line(720, 154, 720, 226, { tone: 'special', sw: 2.5 });
  b += tag(720, 190, 'holds', { size: 11.5, fill: C.violet, border: C.violet });
  b += line(264, 140, 616, 248, { tone: 'bad', arrow: true, dash: '6 5' });
  b += line(616, 140, 264, 248, { tone: 'bad', arrow: true, dash: '6 5' });
  b += tag(440, 168, 'A waits for wallet 2', { size: 12, fill: C.red, border: C.red });
  b += tag(440, 222, 'B waits for wallet 1', { size: 12, fill: C.red, border: C.red });
  b += line(32, 310, 848, 310, { color: C.grid, sw: 1 });
  b += spans(32, 334, [['Postgres notices the cycle and aborts one with error ', C.text], ['40P01', C.red, 700], ['. Retry it, and always lock rows in the same order (e.g. lower id first).', C.text]], { size: 13 });
  add('deadlock', W, H, 'Two transactions each holding a lock on one wallet row and waiting for the other, forming a deadlock that Postgres breaks by aborting one', b);
}

// ---------- 12: circuit breaker ----------
{
  const W = 880;
  const H = 372;
  let b = heading(32, 32, 'Circuit breaker: stop calling a service that keeps failing');
  b += box(60, 120, 200, 72, ['CLOSED', 'calls go through normally'], 'good', { size: 15 });
  b += box(340, 120, 200, 72, ['OPEN', 'fail fast, no calls sent'], 'bad', { size: 15 });
  b += box(620, 120, 200, 72, ['HALF-OPEN', 'let one trial call through'], 'active', { size: 15 });
  b += arrow(264, 140, 336, 140, 'bad');
  b += tag(300, 106, 'N failures in a row', { size: 11.5, fill: C.red, border: C.red });
  b += arrow(544, 140, 616, 140, 'active');
  b += tag(580, 106, 'cooldown passed', { size: 11.5, fill: C.amber, border: C.amber });
  b += path('M 720 196 C 720 250, 440 250, 440 198', { tone: 'bad', arrow: true, sw: 2 });
  b += tag(580, 238, 'trial fails → open again', { size: 11.5, fill: C.red, border: C.red });
  b += path('M 700 196 C 660 340, 200 340, 160 198', { tone: 'good', arrow: true, sw: 2 });
  b += tag(430, 304, 'trial succeeds → closed', { size: 11.5, fill: C.green, border: C.green });
  b += note(32, 352, 'While open, return a fallback (cached data, a default, "feature unavailable") instead of waiting on timeouts.', { size: 12.5 });
  add('circuit-breaker', W, H, 'The closed, open and half-open states of a circuit breaker and the transitions between them', b);
}

// ---------- 13: anatomy of a remote call ----------
{
  const W = 900;
  const H = 330;
  let b = heading(32, 32, 'A remote call that looks local: stubs hide the network');
  b += text(200, 66, 'Client process', { size: 13, weight: 700, fill: C.muted });
  b += text(700, 66, 'Server process', { size: 13, weight: 700, fill: C.muted });
  b += box(40, 84, 150, 56, ['your code', 'client.GetCourse({id: 42})'], 'plain', { size: 13, subSize: 10.5 });
  b += box(210, 84, 150, 56, ['stub (generated)', 'encode → protobuf'], 'brand', { size: 13, subSize: 11 });
  b += box(540, 84, 150, 56, ['server skeleton', 'decode protobuf'], 'brand', { size: 13, subSize: 11 });
  b += box(710, 84, 150, 56, ['your handler', 'GetCourse(call)'], 'good', { size: 13, subSize: 11 });
  b += arrow(194, 112, 206, 112, 'ink');
  b += arrow(364, 112, 536, 112, 'brand');
  b += tag(450, 96, 'HTTP/2 + protobuf', { size: 11.5, fill: C.brand, border: C.brand });
  b += arrow(694, 112, 706, 112, 'ink');
  b += path('M 785 144 C 785 210, 115 210, 115 144', { tone: 'good', arrow: true, sw: 2 });
  b += tag(450, 196, 'the result (or a gRPC status code) comes back the same way', { size: 11.5, fill: C.green, border: C.green });
  b += line(32, 236, 868, 236, { color: C.grid, sw: 1 });
  b += spans(32, 260, [['The network is still there. ', C.ink, 700], ['A local call can\'t time out, get lost or arrive twice. A remote one can.', C.text]], { size: 13 });
  b += spans(32, 284, [['So every call needs a ', C.text], ['deadline', C.ink, 700], [', error handling for ', C.text], ['UNAVAILABLE', C.red, 700], [', and care with retries.', C.text]], { size: 13 });
  add('grpc-call-anatomy', W, H, 'Client code calls a generated stub that encodes protobuf and sends it over an HTTP/2 stream to a server skeleton that decodes it and runs the handler', b);
}

// ---------- 13: the four call types ----------
{
  const W = 900;
  const H = 360;
  let b = heading(32, 32, 'The four kinds of gRPC call');
  const panels = [
    ['Unary', '1 request → 1 response', 'GetCourse', [[1, 0]], [[1, 0]]],
    ['Server streaming', '1 request → many responses', 'ListLessons', [[1, 0]], [[1, 0], [1, 1], [1, 2]]],
    ['Client streaming', 'many requests → 1 response', 'UploadProgress', [[1, 0], [1, 1], [1, 2]], [[1, 2.4]]],
    ['Bidirectional', 'both sides send any time', 'Doubts (chat)', [[1, 0], [1, 1.4]], [[1, 0.7], [1, 2.1]]],
  ];
  panels.forEach(([title, sub, example, reqs, resps], k) => {
    const x = 32 + k * 214;
    b += rect(x, 60, 200, 270, { fill: C.panel, stroke: C.line, rx: 12 });
    b += text(x + 100, 82, title, { size: 14, weight: 700 });
    b += text(x + 100, 102, sub, { size: 11.5, fill: C.muted });
    b += text(x + 40, 128, 'client', { size: 11, fill: C.muted, weight: 600 });
    b += text(x + 160, 128, 'server', { size: 11, fill: C.muted, weight: 600 });
    b += line(x + 40, 138, x + 40, 296, { color: C.line, sw: 1.5, dash: '4 4' });
    b += line(x + 160, 138, x + 160, 296, { color: C.line, sw: 1.5, dash: '4 4' });
    reqs.forEach(([, t]) => (b += arrow(x + 44, 150 + t * 36, x + 154, 162 + t * 36, 'brand')));
    resps.forEach(([, t]) => (b += arrow(x + 156, 162 + t * 36, x + 46, 174 + t * 36, 'good')));
    b += text(x + 100, 314, example, { size: 12, mono: true, fill: C.ink, weight: 600 });
  });
  add('grpc-call-types', W, H, 'Unary, server streaming, client streaming and bidirectional streaming gRPC calls shown as message arrows between client and server', b);
}

// ---------- 13: load balancing ----------
{
  const W = 900;
  const H = 360;
  let b = heading(32, 32, 'Why gRPC needs a request-aware (L7) load balancer');
  const side = (x, title, tone, label, spread) => {
    let o = text(x + 200, 70, title, { size: 14, weight: 700, fill: tone === 'bad' ? C.red : C.green });
    o += box(x, 150, 110, 56, ['client', '1 HTTP/2 conn'], 'plain', { size: 13, subSize: 11 });
    o += box(x + 150, 150, 110, 56, [label, tone === 'bad' ? 'L4 (TCP)' : 'L7 (HTTP/2)'], tone === 'bad' ? 'active' : 'brand', { size: 13, subSize: 11 });
    o += arrow(x + 114, 178, x + 146, 178, 'ink');
    [90, 160, 230].forEach((y, k) => {
      const busy = spread || k === 0;
      o += box(x + 300, y, 100, 46, [`server ${'ABC'[k]}`, busy ? (spread ? '1/3 of calls' : 'ALL calls') : 'idle'], busy ? (spread ? 'good' : 'bad') : 'muted', { size: 12.5, subSize: 11 });
      if (busy) o += arrow(x + 264, 178, x + 296, y + 23, spread ? 'good' : 'bad');
    });
    return o;
  };
  b += side(32, 'Connection-level balancing', 'bad', 'balancer', false);
  b += side(480, 'Per-call balancing', 'good', 'proxy', true);
  b += line(450, 64, 450, 300, { color: C.grid, sw: 1 });
  b += note(32, 316, 'gRPC reuses one long-lived connection for many calls. A TCP balancer picks a server once per connection,', { size: 12.5 });
  b += note(32, 336, 'so every call lands on the same server. Use Envoy/a service mesh, or client-side balancing, to spread each call.', { size: 12.5 });
  add('grpc-load-balancing', W, H, 'A TCP load balancer sending every gRPC call on one connection to a single server, compared with an HTTP/2-aware proxy spreading calls across three servers', b);
}

// ---------- 14: config layers ----------
{
  const W = 900;
  const H = 380;
  let b = heading(32, 32, 'Build one config object from several sources, then validate it');
  const layers = [
    ['1. defaults', 'config/default.yaml', 'muted', 'port 3000, pool 10, flags off'],
    ['2. environment file', 'config/production.yaml', 'plain', 'pool 50, new checkout for IN'],
    ['3. environment variables', 'PORT, DATABASE_URL, LOG_LEVEL', 'brand', 'set by the platform per deploy'],
    ['4. secret manager', 'Vault, AWS SSM, GCP Secret Manager', 'special', 'JWT secret, DB password, API keys'],
  ];
  layers.forEach(([title, src, tone, example], k) => {
    const y = 70 + k * 64;
    b += box(32, y, 300, 52, [title, src], tone, { size: 13.5, subSize: 11 });
    b += text(348, y + 26, example, { size: 12.5, anchor: 'start', fill: C.text });
  });
  b += text(182, 336, 'later layers override earlier ones ↓', { size: 12, fill: C.muted, weight: 600 });
  b += path('M 610 96 C 660 96, 660 205, 690 205', { tone: 'ink', arrow: true, sw: 2 });
  b += path('M 610 300 C 660 300, 660 205, 690 205', { tone: 'ink', arrow: true, sw: 2 });
  b += box(694, 150, 82, 110, ['merge', '+ Zod'], 'active', { size: 13.5, subSize: 11.5 });
  b += arrow(780, 205, 794, 205, 'good');
  b += box(798, 150, 82, 110, ['config', 'frozen, typed'], 'good', { size: 13.5, subSize: 11 });
  b += note(694, 282, 'Invalid or missing? Exit', { size: 12 });
  b += note(694, 300, 'before serving traffic,', { size: 12 });
  b += note(694, 318, 'with a clear list.', { size: 12 });
  add('config-layers', W, H, 'Defaults, an environment file, environment variables and a secret manager merged by priority, validated with Zod into one frozen config object', b);
}

// ---------- 15: three pillars ----------
{
  const W = 900;
  const H = 330;
  let b = heading(32, 32, 'The three pillars of observability');
  const pillars = [
    ['Logs', 'What happened?', 'brand', ['one record per event', '{"level":"warn","userId":7,', '"msg":"enrollment failed"}']],
    ['Metrics', 'What is the pattern?', 'good', ['numbers over time', '820 req/s · 1.2% errors', 'p99 latency 340 ms']],
    ['Traces', 'Where did the time go?', 'special', ['one request, end to end', 'API 240 ms → DB 220 ms', '← the slow step']],
  ];
  pillars.forEach(([name, q, tone, lines], k) => {
    const x = 32 + k * 286;
    const t = TONES[tone];
    b += rect(x, 66, 266, 200, { fill: t.fill, stroke: t.stroke, rx: 14, sw: 2 });
    b += text(x + 133, 96, name, { size: 18, weight: 800, fill: t.text });
    b += text(x + 133, 122, q, { size: 13.5, weight: 600, fill: C.ink });
    b += text(x + 133, 158, lines[0], { size: 12.5, fill: C.muted });
    b += rect(x + 16, 176, 234, 66, { fill: '#FFFFFF', stroke: t.stroke, rx: 8, sw: 1 });
    b += code(x + 26, 198, lines[1], { size: 11.5, fill: C.ink });
    b += code(x + 26, 220, lines[2], { size: 11.5, fill: C.ink });
  });
  b += note(32, 296, 'Tie them together with one id: the same trace id in every log line and span lets you jump from an alert to the logs to the exact slow step.', { size: 12.5 });
  add('observability-pillars', W, H, 'Logs answer what happened, metrics show patterns over time, and traces show where a single request spent its time', b);
}

// ---------- 15: trace waterfall ----------
{
  const W = 900;
  const H = 330;
  let b = heading(32, 32, 'A trace: one request, broken into timed spans');
  const total = 240;
  const x0 = 300;
  const scale = 540 / total;
  b += line(x0, 64, x0 + 540, 64, { color: C.line, sw: 1 });
  [0, 60, 120, 180, 240].forEach((ms) => {
    b += line(x0 + ms * scale, 60, x0 + ms * scale, 280, { color: C.grid, sw: 1 });
    b += text(x0 + ms * scale, 52, `${ms} ms`, { size: 11, fill: C.muted });
  });
  const spansList = [
    ['POST /api/courses/42/enroll', 0, 240, 'brand', 0],
    ['auth middleware', 2, 3, 'plain', 1],
    ['enroll (service)', 6, 230, 'good', 1],
    ['SELECT … FOR UPDATE', 8, 212, 'bad', 2],
    ['INSERT enrollments', 221, 6, 'plain', 2],
    ['enqueue welcome email', 228, 6, 'plain', 2],
  ];
  spansList.forEach(([name, start, dur, tone, depth], k) => {
    const y = 76 + k * 34;
    const t = TONES[tone];
    b += text(40 + depth * 18, y + 13, name, { size: 12.5, anchor: 'start', mono: true, fill: C.ink, weight: tone === 'bad' ? 700 : 500 });
    b += rect(x0 + start * scale, y + 2, Math.max(4, dur * scale), 22, { fill: t.fill, stroke: t.stroke, rx: 4 });
    b += text(x0 + (start + dur) * scale + 6, y + 13, `${dur} ms`, { size: 11, anchor: 'start', fill: tone === 'bad' ? C.red : C.muted, weight: 600 });
  });
  b += note(40, 300, 'The database lock wait takes 212 of the 240 ms. Without a trace you would only know "enroll is slow".', { size: 12.5 });
  add('trace-waterfall', W, H, 'A trace waterfall for an enroll request showing nested spans, where a database query takes most of the time', b);
}

// ---------- 15: observability stack ----------
{
  const W = 900;
  const H = 360;
  let b = heading(32, 32, 'A typical open-source observability stack');
  b += box(32, 140, 150, 70, ['Your services', 'pino · prom-client · OTel'], 'plain', { size: 13.5, subSize: 10.5 });
  b += box(232, 140, 150, 70, ['OTel Collector', 'receive, filter, route'], 'active', { size: 13.5, subSize: 11 });
  b += arrow(186, 175, 228, 175, 'ink');
  const sinks = [
    ['Loki / Elasticsearch', 'logs', 'brand', 70],
    ['Prometheus', 'metrics', 'good', 150],
    ['Tempo / Jaeger', 'traces', 'special', 230],
  ];
  sinks.forEach(([name, kind, tone, y]) => {
    b += box(440, y, 180, 50, [name, kind], tone, { size: 13.5, subSize: 11 });
    b += arrow(386, 175, 436, y + 25, 'ink');
    b += arrow(624, y + 25, 676, 175, 'ink');
  });
  b += box(680, 140, 100, 70, ['Grafana', 'dashboards'], 'brand', { size: 13.5, subSize: 11 });
  b += box(656, 250, 220, 50, ['Alertmanager', '→ Slack / PagerDuty'], 'bad', { size: 13, subSize: 11 });
  b += arrow(730, 214, 730, 246, 'bad');
  b += note(32, 330, 'Managed alternatives bundle all of this: Datadog, New Relic, Grafana Cloud, Honeycomb; Sentry for errors.', { size: 12.5 });
  add('observability-stack', W, H, 'Services send logs, metrics and traces through an OpenTelemetry collector to Loki, Prometheus and Tempo, viewed in Grafana with alerts sent through Alertmanager', b);
}

// ---------- 16: shutdown timeline ----------
{
  const W = 900;
  const H = 380;
  let b = heading(32, 32, 'Graceful shutdown: what happens after SIGTERM');
  const x0 = 60;
  const x1 = 860;
  b += line(x0, 300, x1, 300, { color: C.ink, sw: 2, arrow: true, tone: 'ink' });
  b += text(x0, 318, '0 s', { size: 11.5, fill: C.muted });
  b += text(800, 318, '30 s (grace period)', { size: 11.5, fill: C.red, weight: 700 });
  b += line(800, 80, 800, 300, { color: C.red, sw: 2, dash: '6 5' });
  b += box(740, 64, 120, 46, ['SIGKILL', 'no cleanup'], 'bad', { size: 13.5, subSize: 11 });
  b += box(40, 130, 110, 56, ['SIGTERM', 'or Ctrl+C (SIGINT)'], 'active', { size: 13.5, subSize: 10.5 });
  const steps = [
    ['1. stop new traffic', 'readiness 503, close port', 'brand', 166],
    ['2. drain', 'finish in-flight requests', 'brand', 318],
    ['3. stop workers', 'finish the current job', 'good', 470],
    ['4. close DB, then Redis', 'reverse order of opening', 'good', 622],
  ];
  steps.forEach(([t, s, tone, x], k) => {
    const y = 130 + (k % 2) * 76;
    b += box(x, y, 146, 56, [t, s], tone, { size: 12.5, subSize: 10.5 });
    b += line(x + 73, y + 60, x + 73, 296, { color: C.line, sw: 1.5, dash: '3 4' });
  });
  b += text(735, 286, 'exit(0)', { size: 12.5, weight: 700, fill: C.green, mono: true });
  b += note(32, 350, 'Finish well inside the grace period. If cleanup hangs, exit yourself before the platform sends SIGKILL.', { size: 12.5 });
  add('shutdown-timeline', W, H, 'After SIGTERM the app stops taking new traffic, drains in-flight requests, stops workers and closes the database and Redis before exiting, well before the SIGKILL deadline', b);
}

// ---------- 17: injection boundaries ----------
{
  const W = 900;
  const H = 360;
  let b = heading(32, 32, 'Injection: user data crossing into another language and running as code');
  b += box(32, 150, 150, 64, ['User input', 'forms, URLs, headers'], 'active', { size: 14, subSize: 11 });
  b += box(310, 140, 180, 84, ['Your backend', 'speaks several languages'], 'brand', { size: 14.5, subSize: 11 });
  b += arrow(186, 182, 306, 182, 'ink');
  const targets = [
    ['Database', 'SQL', 'SQL injection', 70],
    ['Operating system', 'shell commands', 'command injection', 160],
    ['Browser', 'HTML + JavaScript', 'XSS', 250],
  ];
  targets.forEach(([name, lang, attack, y]) => {
    b += box(640, y, 230, 54, [name, lang], 'plain', { size: 13.5, subSize: 11 });
    b += arrow(494, 182, 636, y + 27, 'bad');
    b += tag(566, 182 + (y + 27 - 182) * (72 / 142), attack, { size: 11.5, fill: C.red, border: C.red });
  });
  b += line(32, 318, 868, 318, { color: C.grid, sw: 1 });
  b += spans(32, 340, [['The fix is always the same idea: ', C.ink, 700], ['keep data and code separate (parameters, argument arrays, escaping and sanitising).', C.text]], { size: 13 });
  add('injection-boundaries', W, H, 'User input flows through the backend into SQL, shell commands and HTML, where it can become SQL injection, command injection or XSS', b);
}

// ---------- 17: defence in depth ----------
{
  const W = 900;
  const H = 390;
  let b = heading(32, 32, 'Defence in depth: an attacker has to get through every layer');
  const layers = [
    ['Network: HTTPS everywhere, firewall, WAF, rate limits', 'muted', 0],
    ['Edge: security headers, CORS, request size limits', 'plain', 1],
    ['Identity: authentication, MFA, sessions with safe cookies', 'brand', 2],
    ['Authorization: roles AND ownership checks in every query', 'special', 3],
    ['Input: validation, parameterized queries, sanitised HTML', 'active', 4],
  ];
  layers.forEach(([label, tone, k]) => {
    const inset = k * 34;
    const t = TONES[tone];
    b += rect(60 + inset, 60 + inset * 0.78, 780 - inset * 2, 300 - inset * 1.56, { fill: t.fill, stroke: t.stroke, rx: 16, sw: 1.75 });
    b += text(80 + inset, 80 + inset * 0.78, label, { size: 12.5, anchor: 'start', weight: 600, fill: t.text === C.faint ? C.muted : t.text });
  });
  b += box(330, 236, 240, 48, ['your data and business logic'], 'good', { size: 13.5 });
  b += note(32, 376, 'No single layer is perfect. Logging, monitoring and patched dependencies wrap around all of them.', { size: 12.5 });
  add('defence-in-depth', W, H, 'Nested security layers from the network edge through identity, authorization and input handling, surrounding the data and business logic', b);
}

// ---------- 18: utilization vs wait time ----------
{
  const W = 900;
  const H = 400;
  let b = heading(32, 32, 'Why servers slow down sharply as they get busy');
  const x0 = 90;
  const y0 = 330;
  const pw = 520;
  const ph = 250;
  const S = 10;   // service time in ms
  const maxMs = 400;
  const px = (rho) => x0 + rho * pw;
  const py = (ms) => y0 - (Math.min(ms, maxMs) / maxMs) * ph;
  b += line(x0, y0, x0 + pw + 10, y0, { color: C.ink, sw: 1.5 });
  b += line(x0, y0, x0, y0 - ph - 10, { color: C.ink, sw: 1.5 });
  [0, 0.2, 0.4, 0.6, 0.8, 1].forEach((r) => (b += text(px(r), y0 + 16, `${Math.round(r * 100)}%`, { size: 11.5, fill: C.muted })));
  [0, 100, 200, 300, 400].forEach((ms) => {
    b += text(x0 - 10, py(ms), `${ms}`, { size: 11.5, anchor: 'end', fill: C.muted });
    if (ms) b += line(x0, py(ms), x0 + pw, py(ms), { color: C.grid, sw: 1 });
  });
  b += text(x0 + pw / 2, y0 + 38, 'utilization (how busy the server is)', { size: 12.5, fill: C.text, weight: 600 });
  b += text(40, y0 - ph / 2, 'time per request (ms)', { size: 12.5, fill: C.text, weight: 600, rotate: -90 });
  b += rect(px(0.6), y0 - ph, px(0.8) - px(0.6), ph, { fill: C.greenSoft, stroke: 'none', rx: 0 });
  b += text((px(0.6) + px(0.8)) / 2, y0 - ph + 14, 'target zone', { size: 11.5, fill: C.green, weight: 700 });
  let d = '';
  for (let r = 0; r <= 0.975; r += 0.005) d += `${d ? 'L' : 'M'} ${px(r).toFixed(1)} ${py(S / (1 - r)).toFixed(1)} `;
  b += path(d, { color: C.red, sw: 3 });
  [[0.5, '20 ms'], [0.8, '50 ms'], [0.9, '100 ms'], [0.95, '200 ms']].forEach(([r, label]) => {
    b += `<circle cx="${px(r)}" cy="${py(S / (1 - r))}" r="5" fill="${C.red}"/>`;
    b += text(px(r) - 8, py(S / (1 - r)) - 14, label, { size: 11.5, anchor: 'end', fill: C.red, weight: 700 });
  });
  const notes = [
    'A request that takes 10 ms of work:',
    '',
    '50% busy  → about 20 ms',
    '80% busy  → about 50 ms',
    '90% busy  → about 100 ms',
    '95% busy  → about 200 ms',
    '',
    'The work never got slower.',
    'The time is spent waiting',
    'in the queue.',
  ];
  notes.forEach((n, k) => (b += text(650, 96 + k * 22, n, { size: 13, anchor: 'start', fill: k >= 7 ? C.red : C.text, weight: k >= 7 || k === 0 ? 700 : 500, mono: k >= 2 && k <= 5 })));
  add('utilization-curve', W, H, 'Average time per request rising slowly up to about 70 percent utilization and then sharply as utilization approaches 100 percent', b);
}

// ---------- 18: scale up vs scale out ----------
{
  const W = 900;
  const H = 360;
  let b = heading(32, 32, 'Scaling up vs scaling out');
  b += text(210, 70, 'Vertical: a bigger machine', { size: 14, weight: 700 });
  b += box(60, 150, 90, 70, ['server', '2 CPU · 4 GB'], 'plain', { size: 13, subSize: 10.5 });
  b += arrow(154, 185, 196, 185, 'ink');
  b += box(200, 100, 170, 170, ['server', '32 CPU · 128 GB'], 'brand', { size: 15, subSize: 11.5 });
  b += note(60, 300, 'Simple: no code changes.', { size: 12.5 });
  b += note(60, 320, 'But there is a biggest machine, and one box can still fail.', { size: 12.5 });
  b += line(450, 64, 450, 330, { color: C.grid, sw: 1 });
  b += text(680, 70, 'Horizontal: more machines', { size: 14, weight: 700 });
  b += box(480, 150, 110, 70, ['load', 'balancer'], 'active', { size: 13.5, subSize: 13.5 });
  [96, 160, 224].forEach((y, k) => {
    b += box(640, y, 120, 50, [`server ${k + 1}`, 'stateless'], 'good', { size: 13, subSize: 10.5 });
    b += arrow(594, 185, 636, y + 25, 'good');
    b += line(764, y + 25, 800, 185, { color: C.faint, sw: 1.5, dash: '5 5' });
  });
  b += box(804, 160, 70, 50, ['DB'], 'muted', { size: 13 });
  b += note(480, 300, 'No ceiling, survives a server failing.', { size: 12.5 });
  b += note(480, 320, 'Needs stateless servers and shared data.', { size: 12.5 });
  add('scale-up-vs-out', W, H, 'Vertical scaling replaces a small server with a bigger one, while horizontal scaling puts several stateless servers behind a load balancer', b);
}

// ---------- 19: stateful vs stateless servers ----------
{
  const W = 900;
  const H = 380;
  let b = heading(32, 32, 'Where the session lives decides whether you can scale out');
  const panel = (x0, title, stateless) => {
    let o = text(x0 + 205, 70, title, { size: 14, weight: 700, fill: stateless ? C.green : C.red });
    o += box(x0, 160, 100, 56, ['load', 'balancer'], 'active', { size: 13, subSize: 13 });
    o += box(x0 + 170, 96, 140, 56, ['server A', stateless ? 'keeps nothing' : 'session: user 42'], stateless ? 'good' : 'brand', { size: 13, subSize: 11 });
    o += box(x0 + 170, 222, 140, 56, ['server B', stateless ? 'keeps nothing' : 'no session'], stateless ? 'good' : 'bad', { size: 13, subSize: 11 });
    o += arrow(x0 + 104, 180, x0 + 166, 128, 'good');
    o += arrow(x0 + 104, 196, x0 + 166, 248, stateless ? 'good' : 'bad');
    o += tag(x0 + 128, 136, '1 log in', { size: 11, fill: C.green });
    o += tag(x0 + 128, 240, '2 GET /me', { size: 11, fill: stateless ? C.green : C.red });
    if (stateless) {
      o += box(x0 + 330, 160, 80, 56, ['Redis', 'sessions'], 'special', { size: 13, subSize: 11 });
      o += line(x0 + 314, 124, x0 + 330, 176, { color: C.violet, sw: 1.5, dash: '5 5' });
      o += line(x0 + 314, 250, x0 + 330, 200, { color: C.violet, sw: 1.5, dash: '5 5' });
      o += text(x0 + 240, 306, 'B finds the session in Redis: 200', { size: 12.5, fill: C.green, weight: 700 });
    } else {
      o += text(x0 + 240, 306, 'B has never seen you: 401', { size: 12.5, fill: C.red, weight: 700 });
    }
    return o;
  };
  b += panel(20, 'Stateful: session in server memory', false);
  b += line(450, 60, 450, 330, { color: C.grid, sw: 1 });
  b += panel(470, 'Stateless: session in a shared store', true);
  b += note(32, 356, 'Tested with two Express servers: MemoryStore gave 401 on server B, connect-redis gave 200.', { size: 12.5 });
  add('stateful-vs-stateless', W, H, 'With sessions in server memory, a second request routed to another server fails; with sessions in Redis, any server can answer', b);
}

// ---------- 19: read replicas ----------
{
  const W = 900;
  const H = 390;
  let b = heading(32, 32, 'Read replicas: one primary for writes, copies for reads');
  b += box(40, 160, 150, 80, ['app servers', 'read/write router'], 'plain', { size: 14, subSize: 11.5 });
  b += box(340, 64, 190, 64, ['primary', 'all writes'], 'brand', { size: 15, subSize: 12 });
  b += box(620, 166, 190, 56, ['replica 1', 'read-only copy'], 'good', { size: 14, subSize: 11.5 });
  b += box(620, 266, 190, 56, ['replica 2', 'read-only copy'], 'good', { size: 14, subSize: 11.5 });
  b += arrow(194, 180, 336, 104, 'brand');
  b += tag(262, 128, 'INSERT · UPDATE · DELETE', { size: 11, fill: C.brand });
  b += arrow(194, 214, 616, 194, 'good');
  b += arrow(194, 226, 616, 294, 'good');
  b += tag(400, 232, 'SELECT (most traffic)', { size: 11, fill: C.green });
  b += path('M 534 96 L 715 96 L 715 160', { tone: 'active', dash: '6 5', arrow: true });
  b += path('M 534 108 L 850 108 L 850 294 L 816 294', { tone: 'active', dash: '6 5', arrow: true });
  b += tag(640, 80, 'replication stream (async)', { size: 11, fill: C.amber });
  b += line(32, 340, 868, 340, { color: C.grid, sw: 1 });
  b += spans(32, 364, [['Replication lag: ', C.ink, 700], ['a replica is always slightly behind. Send a user’s reads to the primary right after they write.', C.text]], { size: 12.5 });
  add('read-replicas', W, H, 'App servers send writes to the primary and reads to replicas, which receive changes from the primary through asynchronous replication', b);
}

// ---------- 19: consistent hashing ring ----------
{
  const W = 900;
  const H = 430;
  let b = heading(32, 32, 'Consistent hashing: adding a shard moves only its neighbour’s keys');
  const cx = 230;
  const cy = 236;
  const r = 140;
  const pt = (deg, rad = r) => [cx + rad * Math.sin((deg * Math.PI) / 180), cy - rad * Math.cos((deg * Math.PI) / 180)];
  b += circle(cx, cy, r, { stroke: C.line, sw: 10, fill: 'none' });
  const [ax, ay] = pt(110);
  const [bx, by] = pt(155);
  b += path(`M ${ax.toFixed(1)} ${ay.toFixed(1)} A ${r} ${r} 0 0 1 ${bx.toFixed(1)} ${by.toFixed(1)}`, { color: C.violet, sw: 10 });
  const shards = [[20, 's0', 'brand'], [110, 's1', 'brand'], [200, 's2', 'brand'], [290, 's3', 'brand'], [155, 's4 (new)', 'special']];
  shards.forEach(([deg, label, tone]) => {
    const [x, y] = pt(deg);
    b += circle(x, y, 11, { fill: tone === 'special' ? C.violet : C.brand, stroke: '#FFFFFF', sw: 2 });
    const [lx, ly] = pt(deg, r + 34);
    b += text(lx, ly, label, { size: 13, weight: 700, fill: tone === 'special' ? C.violet : C.brand });
  });
  [[50, 's1'], [80, 's1'], [128, 'moves'], [142, 'moves'], [172, 's2'], [186, 's2'], [240, 's3'], [268, 's3'], [320, 's0'], [350, 's0']].forEach(([deg, owner]) => {
    const [x, y] = pt(deg);
    b += circle(x, y, 5, { fill: owner === 'moves' ? C.violet : C.ink, stroke: '#FFFFFF', sw: 1.5 });
  });
  b += text(cx, cy - 10, 'hash(key) lands on the ring;', { size: 12, fill: C.muted });
  b += text(cx, cy + 10, 'walk clockwise to a shard', { size: 12, fill: C.muted });
  const lines = [
    ['Going from 4 to 5 shards, 100,000 keys:', C.ink, 700],
    ['', C.text, 500],
    ['hash(key) % shards', C.ink, 700],
    ['79.7% of keys move to a different shard', C.red, 600],
    ['', C.text, 500],
    ['consistent hashing (100 virtual nodes each)', C.ink, 700],
    ['19.8% of keys move, all of them to the new shard', C.green, 600],
    ['', C.text, 500],
    ['Only the keys in the purple arc change owner.', C.text, 500],
    ['Virtual nodes spread each shard around the', C.text, 500],
    ['ring so the load stays even.', C.text, 500],
  ];
  lines.forEach(([t, fill, weight], k) => (b += text(470, 104 + k * 24, t, { size: 13.5, anchor: 'start', fill, weight })));
  add('consistent-hash-ring', W, H, 'A hash ring with four shards and a new fifth shard; only the keys in the arc before the new shard move to it', b);
}

// ---------- 20: where the time goes in one request ----------
{
  const W = 900;
  const H = 336;
  let b = heading(32, 32, 'One API request: a little computing, a lot of waiting');
  const x0 = 150;
  const scale = 2.5;   // px per ms
  const steps = [
    ['cpu', 2, 'parse'], ['io', 50, 'DB query'], ['cpu', 2, ''], ['io', 50, 'DB query'], ['cpu', 2, ''],
    ['io', 50, 'Redis + DB'], ['cpu', 2, ''], ['io', 50, 'email API'], ['cpu', 2, 'respond'],
  ];
  b += text(x0 - 14, 92, 'request 1', { size: 13, anchor: 'end', weight: 700 });
  let x = x0;
  steps.forEach(([kind, ms, label]) => {
    const w = ms * scale;
    b += rect(x, 76, w, 32, { fill: kind === 'cpu' ? C.brand : C.amberSoft, stroke: kind === 'cpu' ? C.brand : C.amber, rx: 3, sw: 1 });
    if (kind === 'io') b += text(x + w / 2, 92, label, { size: 11.5, fill: '#92400E', weight: 600 });
    x += w;
  });
  b += text(x0, 130, 'CPU busy ~10 ms', { size: 12.5, anchor: 'start', fill: C.brand, weight: 700 });
  b += text(x, 130, 'waiting ~200 ms', { size: 12.5, anchor: 'end', fill: C.amber, weight: 700 });
  b += line(32, 160, 868, 160, { color: C.grid, sw: 1 });
  b += text(32, 190, 'With concurrency, the CPU serves other requests while request 1 waits:', { size: 13, anchor: 'start', fill: C.ink, weight: 600 });
  [['request 1', 0, C.brand], ['request 2', 11, C.green], ['request 3', 23, C.violet]].forEach(([label, offset, color], row) => {
    const y = 210 + row * 30;
    b += text(x0 - 14, y + 11, label, { size: 12.5, anchor: 'end', weight: 600 });
    let cx = x0 + offset * scale;
    steps.forEach(([kind, ms]) => {
      const w = ms * scale;
      if (cx + w <= 870) b += rect(cx, y, w, 22, { fill: kind === 'cpu' ? color : C.amberSoft, stroke: kind === 'cpu' ? color : '#F5D9A8', rx: 3, sw: 1 });
      cx += w;
    });
  });
  b += rect(32, 304, 16, 16, { fill: C.brand, stroke: C.brand, rx: 4 });
  b += text(56, 312, 'running on the CPU (colour per request)', { size: 12.5, anchor: 'start' });
  b += rect(330, 304, 16, 16, { fill: C.amberSoft, stroke: C.amber, rx: 4 });
  b += text(354, 312, 'waiting for I/O: the CPU is free for others', { size: 12.5, anchor: 'start' });
  add('io-wait-timeline', W, H, 'One request spends about 10 ms computing and about 200 ms waiting for I/O; with concurrency, other requests use the CPU during the waits', b);
}

// ---------- 20: concurrency vs parallelism ----------
{
  const W = 900;
  const H = 320;
  let b = heading(32, 32, 'Concurrency vs parallelism');
  const lane = (y, label, blocks) => {
    let o = text(150, y + 15, label, { size: 13, anchor: 'end', weight: 700 });
    o += rect(162, y, 700, 30, { fill: '#F8FAFC', stroke: C.grid, rx: 4, sw: 1 });
    blocks.forEach(([start, len, task]) => {
      const tone = { A: 'brand', B: 'good', C: 'special' }[task];
      o += rect(162 + start * 7, y + 3, len * 7 - 3, 24, { fill: TONES[tone].fill, stroke: TONES[tone].stroke, rx: 3, sw: 1.2 });
      o += text(162 + start * 7 + (len * 7 - 3) / 2, y + 15, task, { size: 12, weight: 700, fill: TONES[tone].text });
    });
    return o;
  };
  b += text(32, 72, 'Concurrency: one core switches between tasks whenever one is waiting', { size: 13.5, anchor: 'start', fill: C.ink, weight: 600 });
  b += lane(88, 'core 1', [[0, 10, 'A'], [10, 8, 'B'], [18, 12, 'C'], [30, 10, 'A'], [40, 10, 'B'], [50, 12, 'C'], [62, 8, 'A'], [70, 10, 'B'], [80, 20, 'C']]);
  b += text(32, 168, 'Parallelism: several cores run tasks at the same instant', { size: 13.5, anchor: 'start', fill: C.ink, weight: 600 });
  b += lane(184, 'core 1', [[0, 40, 'A'], [40, 30, 'C'], [70, 30, 'A']]);
  b += lane(222, 'core 2', [[0, 30, 'B'], [30, 30, 'C'], [60, 40, 'B']]);
  b += note(32, 290, 'Node.js gives you concurrency on one thread out of the box; worker threads, cluster or more processes add parallelism.', { size: 12.5 });
  add('concurrency-vs-parallelism', W, H, 'Concurrency interleaves tasks A, B and C on one core; parallelism runs tasks on two cores at the same time', b);
}

// ---------- 20: inside the Node.js runtime ----------
{
  const W = 900;
  const H = 400;
  let b = heading(32, 32, 'Inside Node.js: one JavaScript thread, plenty of help');
  b += rect(32, 60, 300, 290, { fill: C.brandSoft, stroke: C.brand, rx: 12 });
  b += text(182, 84, 'Main thread', { size: 15, weight: 700, fill: '#003A91' });
  b += box(56, 104, 252, 52, ['your JavaScript', 'handlers, callbacks, after-await code'], 'plain', { size: 13, subSize: 11 });
  b += box(56, 176, 252, 52, ['microtasks', 'promise callbacks, process.nextTick'], 'plain', { size: 13, subSize: 11 });
  b += box(56, 248, 252, 76, ['event loop', 'timers → poll (I/O) → check → close'], 'brand', { size: 14, subSize: 11 });
  b += rect(400, 60, 468, 290, { fill: '#F8FAFC', stroke: C.line, rx: 12 });
  b += text(634, 84, 'libuv', { size: 15, weight: 700 });
  b += box(424, 104, 200, 96, ['OS readiness', 'epoll · kqueue · IOCP'], 'good', { size: 14, subSize: 11.5 });
  b += text(524, 218, 'sockets: HTTP, DB, Redis', { size: 11.5, fill: C.green, weight: 600 });
  b += text(524, 236, 'no extra threads needed', { size: 11.5, fill: C.muted });
  b += rect(644, 104, 200, 96, { fill: C.amberSoft, stroke: C.amber, rx: 10, sw: 2 });
  b += text(744, 130, 'thread pool', { size: 14, weight: 700, fill: '#92400E' });
  [0, 1, 2, 3].forEach((k) => (b += rect(668 + k * 40, 150, 30, 22, { fill: '#FFFFFF', stroke: C.amber, rx: 4, sw: 1.2 })));
  b += text(744, 186, '4 threads by default', { size: 11, fill: C.text });
  b += text(744, 218, 'fs, dns.lookup, crypto, zlib', { size: 11.5, fill: C.amber, weight: 600 });
  b += text(744, 236, 'resize: UV_THREADPOOL_SIZE', { size: 11.5, fill: C.muted });
  b += box(424, 266, 420, 58, ['worker_threads', 'your own CPU-heavy JavaScript on other cores'], 'special', { size: 14, subSize: 11.5 });
  b += arrow(312, 276, 420, 160, 'good');
  b += arrow(420, 150, 312, 266, 'good');
  b += note(32, 378, 'The event loop hands slow work to libuv and runs the callback when it finishes. Only your JavaScript is single-threaded.', { size: 12.5 });
  add('node-runtime', W, H, 'The Node.js main thread runs JavaScript, microtasks and the event loop, while libuv uses OS readiness APIs for sockets and a thread pool for files, DNS, crypto and compression', b);
}

// ---------- 20: a race between awaits ----------
{
  const W = 900;
  const H = 360;
  let b = heading(32, 32, 'A race condition with no threads at all');
  const rows = [
    ['withdraw(100) #1', 'brand', [['read balance → 100', 0], ['check 100 ≥ 100 ✓', 2], ['write 100 − 100 = 0', 4]]],
    ['withdraw(100) #2', 'good', [['read balance → 100', 1], ['check 100 ≥ 100 ✓', 3], ['write 100 − 100 = 0', 5]]],
  ];
  const colX = (k) => 210 + k * 108;
  rows.forEach(([label, tone, steps], r) => {
    const y = 80 + r * 92;
    b += text(32, y + 24, label, { size: 13.5, anchor: 'start', weight: 700, fill: TONES[tone].text });
    steps.forEach(([s, k]) => (b += box(colX(k), y, 150, 48, s, tone, { size: 11.5 })));
  });
  b += arrow(210, 300, 868, 300, 'ink');
  b += text(540, 320, 'time  (each "await" lets the other call run)', { size: 12, fill: C.muted });
  b += rect(210, 248, 650, 36, { fill: C.redSoft, stroke: C.red, rx: 8 });
  b += text(535, 266, 'Both checks pass before either write: 200 paid out from a balance of 100', { size: 13, fill: '#9F1239', weight: 700 });
  add('async-race', W, H, 'Two withdraw calls interleave at their await points, both read 100, both pass the check, and both pay out', b);
}

// ---------- 21: virtual machines vs containers ----------
{
  const W = 900;
  const H = 420;
  let b = heading(32, 32, 'Virtual machines vs containers');
  const stack = (x, title, layers) => {
    let o = text(x + 190, 72, title, { size: 14, weight: 700 });
    let y = 344;
    layers.forEach(([items, tone, h = 40]) => {
      y -= h + 8;
      const w = (380 - (items.length - 1) * 10) / items.length;
      items.forEach((label, k) => (o += box(x + k * (w + 10), y, w, h, label, tone, { size: 12 })));
    });
    return o;
  };
  b += stack(32, 'Virtual machines: each has its own OS', [
    [[['hardware']], 'muted'],
    [[['hypervisor']], 'active'],
    [[['guest OS + kernel'], ['guest OS + kernel'], ['guest OS + kernel']], 'bad', 44],
    [[['libraries'], ['libraries'], ['libraries']], 'plain', 34],
    [[['app A'], ['app B'], ['app C']], 'brand', 40],
  ]);
  b += line(450, 60, 450, 340, { color: C.grid, sw: 1 });
  b += stack(488, 'Containers: one shared kernel', [
    [[['hardware']], 'muted'],
    [[['host OS + one Linux kernel']], 'good'],
    [[['container runtime (containerd, runc)']], 'active', 34],
    [[['libraries'], ['libraries'], ['libraries']], 'plain', 34],
    [[['app A'], ['app B'], ['app C']], 'brand', 40],
  ]);
  b += note(32, 376, 'VM: gigabytes, boots an OS in seconds, strong isolation.', { size: 12.5 });
  b += note(488, 376, 'Container: megabytes, starts a process in milliseconds,', { size: 12.5 });
  b += note(488, 396, 'isolation from kernel features (namespaces, cgroups).', { size: 12.5 });
  add('vm-vs-container', W, H, 'Virtual machines each run a guest OS and kernel on a hypervisor, while containers share the host kernel and only package their libraries and app', b);
}

// ---------- 21: image layers and the build cache ----------
{
  const W = 900;
  const H = 400;
  let b = heading(32, 32, 'Each Dockerfile instruction is a cached layer');
  const rows = [
    ['FROM node:22-slim', 'base image layers', 'cached'],
    ['WORKDIR /app', 'tiny', 'cached'],
    ['COPY package.json package-lock.json ./', 'dependency list', 'cached'],
    ['RUN npm ci --omit=dev', 'node_modules (the slow step)', 'cached'],
    ['COPY src ./src', 'your code: you edited a file', 'rebuilt'],
    ['CMD ["node", "src/server.js"]', 'metadata', 'rebuilt'],
  ];
  rows.forEach(([instr, what, state], k) => {
    const y = 66 + k * 46;
    const tone = state === 'cached' ? 'good' : 'active';
    b += rect(32, y, 400, 38, { fill: '#0F172A', stroke: '#0F172A', rx: 6 });
    b += text(46, y + 19, instr, { size: 12.5, anchor: 'start', mono: true, fill: '#E2E8F0' });
    b += arrow(436, y + 19, 474, y + 19, 'plain');
    b += box(478, y, 250, 38, what, tone, { size: 12 });
    b += text(746, y + 19, state === 'cached' ? 'reused from cache' : 'rebuilt', { size: 12.5, anchor: 'start', weight: 700, fill: state === 'cached' ? C.green : C.amber });
  });
  b += note(32, 354, 'When a layer changes, it and every layer after it are rebuilt. Put what changes least at the top.', { size: 12.5 });
  b += note(32, 376, 'Measured: editing server.js rebuilt in 0.6 s with this order, 4.5 s when the code was copied before npm install.', { size: 12.5 });
  add('image-layers', W, H, 'Dockerfile instructions map to layers; after editing the source, the base, dependency and install layers come from cache and only the later layers rebuild', b);
}

// ---------- 21: Kubernetes cluster architecture ----------
{
  const W = 900;
  const H = 420;
  let b = heading(32, 32, 'A Kubernetes cluster: a control plane and worker nodes');
  b += box(32, 170, 110, 56, ['you', 'kubectl / CI'], 'plain', { size: 13, subSize: 11 });
  b += rect(180, 60, 270, 320, { fill: C.brandSoft, stroke: C.brand, rx: 12 });
  b += text(315, 84, 'Control plane (the brain)', { size: 14, weight: 700, fill: '#003A91' });
  b += box(200, 104, 230, 50, ['api-server', 'the only front door'], 'brand', { size: 13, subSize: 11 });
  b += box(200, 170, 230, 50, ['etcd', 'stores the desired state'], 'plain', { size: 13, subSize: 11 });
  b += box(200, 236, 230, 50, ['scheduler', 'picks a node for each pod'], 'plain', { size: 13, subSize: 11 });
  b += box(200, 302, 230, 50, ['controller manager', 'loops that fix differences'], 'plain', { size: 13, subSize: 11 });
  b += arrow(146, 198, 196, 132, 'ink');
  b += tag(160, 150, 'YAML', { size: 11 });
  [60, 226].forEach((y, k) => {
    b += rect(500, y, 368, 154, { fill: '#F8FAFC', stroke: C.line, rx: 12 });
    b += text(520, y + 22, `worker node ${k + 1}`, { size: 13.5, weight: 700, anchor: 'start' });
    b += box(520, y + 38, 150, 40, ['kubelet', 'runs pods, reports health'], 'active', { size: 12, subSize: 10 });
    b += box(520, y + 90, 150, 40, ['kube-proxy', 'Service networking'], 'active', { size: 12, subSize: 10 });
    [0, 1, 2].forEach((p) => (b += box(690 + (p % 2) * 88, y + 38 + Math.floor(p / 2) * 52, 78, 40, ['pod', k === 1 && p === 2 ? 'new' : 'api'], k === 1 && p === 2 ? 'special' : 'good', { size: 12, subSize: 10 })));
    b += line(434, 128, 500, y + 58, { color: C.brand, sw: 1.5, dash: '5 5' });
  });
  b += note(32, 404, 'You declare what you want; controllers keep comparing it to what is running and act on any difference.', { size: 12.5 });
  add('k8s-architecture', W, H, 'The control plane with api-server, etcd, scheduler and controller manager manages worker nodes that run kubelet, kube-proxy and pods', b);
}

// ---------- 21: how traffic reaches pods ----------
{
  const W = 900;
  const H = 380;
  let b = heading(32, 32, 'From the internet to a pod');
  b += box(32, 150, 100, 56, ['users'], 'plain', { size: 14 });
  b += box(170, 140, 162, 76, ['Ingress / Gateway', 'TLS, host and path rules'], 'active', { size: 13, subSize: 10.5 });
  b += box(370, 140, 150, 76, ['Service', 'course-api', 'stable name and IP'], 'brand', { size: 13, subSize: 10.5 });
  b += arrow(136, 178, 166, 178, 'ink');
  b += arrow(336, 178, 366, 178, 'ink');
  const pods = [[70, 'good', 'ready'], [150, 'good', 'ready'], [230, 'bad', 'not ready']];
  pods.forEach(([y, tone, state]) => {
    b += box(600, y, 140, 56, ['pod', `app: course-api · ${state}`], tone, { size: 13, subSize: 10 });
    b += arrow(524, 178, 596, y + 28, tone === 'bad' ? 'muted' : 'good', { dash: tone === 'bad' ? '5 5' : undefined });
  });
  b += text(445, 236, 'selects pods labelled', { size: 11.5, fill: C.brand, weight: 600 });
  b += text(445, 252, 'app: course-api', { size: 11.5, fill: C.brand, weight: 600 });
  b += rect(760, 62, 120, 236, { fill: '#F8FAFC', stroke: C.line, rx: 10, dash: '5 4' });
  b += text(820, 84, 'Deployment', { size: 12.5, weight: 700 });
  b += text(820, 104, 'keeps 3 replicas', { size: 11, fill: C.muted });
  b += text(820, 180, 'replaces pods', { size: 11, fill: C.muted });
  b += text(820, 198, 'that die', { size: 11, fill: C.muted });
  b += line(744, 98, 760, 98, { color: C.faint, sw: 1.5 });
  b += note(32, 350, 'Pods come and go with new IPs. The Service tracks the ready pods by label, so callers never need a pod’s address.', { size: 12.5 });
  add('k8s-traffic', W, H, 'Traffic flows from users through an Ingress or Gateway to a Service, which forwards to ready pods that match its label selector; a pod failing readiness gets no traffic', b);
}

// ---------- 21: CI/CD pipeline ----------
{
  const W = 900;
  const H = 300;
  let b = heading(32, 32, 'A CI/CD pipeline: every merge takes the same path');
  const steps = [
    ['push', 'git commit', 'plain'],
    ['test', 'lint, unit, integration', 'brand'],
    ['build', 'image: git-<sha>', 'brand'],
    ['scan', 'known vulnerabilities', 'active'],
    ['push', 'to the registry', 'brand'],
    ['deploy', 'rolling update', 'good'],
  ];
  steps.forEach(([title, sub, tone], k) => {
    const x = 32 + k * 142;
    b += box(x, 80, 122, 64, [title, sub], tone, { size: 14, subSize: 10.5 });
    if (k < steps.length - 1) b += arrow(x + 124, 112, x + 140, 112, 'ink');
  });
  b += rect(32, 172, 548, 36, { fill: C.brandSoft, stroke: C.brand, rx: 8 });
  b += text(306, 190, 'CI: is this change safe? Runs on every pull request.', { size: 12.5, fill: '#003A91', weight: 600 });
  b += rect(600, 172, 268, 36, { fill: C.greenSoft, stroke: C.green, rx: 8 });
  b += text(734, 190, 'CD: ship it, automatically.', { size: 12.5, fill: '#065F46', weight: 600 });
  b += note(32, 246, 'Any failing step stops the pipeline. The image that passed the tests is the exact image that runs in production.', { size: 12.5 });
  b += note(32, 268, 'Tagging by commit SHA means you always know which code is running, and rolling back is redeploying an older tag.', { size: 12.5 });
  add('ci-cd-pipeline', W, H, 'A pipeline goes from push to test, build, scan, push to registry and deploy; CI covers the checks and CD covers shipping', b);
}

// ---------- 22: the testing pyramid ----------
{
  const W = 900;
  const H = 370;
  let b = heading(32, 32, 'The testing pyramid');
  const cx = 260;
  const layers = [
    { top: 70, bottom: 150, label: 'End-to-end', sub: 'a few critical journeys', tone: 'bad' },
    { top: 150, bottom: 240, label: 'Integration', sub: 'real DB, HTTP, contracts', tone: 'active' },
    { top: 240, bottom: 340, label: 'Unit', sub: 'many, fast, isolated', tone: 'good' },
  ];
  const half = (y) => ((y - 70) / 270) * 230;
  layers.forEach(({ top, bottom, label, sub, tone }) => {
    const t = TONES[tone];
    const d = `M ${cx - half(top)} ${top} L ${cx + half(top)} ${top} L ${cx + half(bottom)} ${bottom} L ${cx - half(bottom)} ${bottom} Z`;
    b += path(d, { color: t.stroke, sw: 2, fill: t.fill });
    b += text(cx, (top + bottom) / 2 + (top === 70 ? 14 : -6), label, { size: 14, weight: 700, fill: t.text });
    if (top !== 70) b += text(cx, (top + bottom) / 2 + 14, sub, { size: 11.5, fill: t.text });
  });
  b += arrow(530, 330, 530, 84, 'ink');
  b += text(546, 96, 'slower, costlier, more realistic', { size: 12.5, anchor: 'start', weight: 600 });
  b += text(546, 116, 'harder to tell what broke', { size: 12, anchor: 'start', fill: C.muted });
  b += text(546, 304, 'faster, cheaper, more precise', { size: 12.5, anchor: 'start', weight: 600 });
  b += text(546, 324, 'one failure points at one function', { size: 12, anchor: 'start', fill: C.muted });
  b += text(546, 196, 'Measured in this chapter:', { size: 12.5, anchor: 'start', weight: 700 });
  b += text(546, 218, '21 unit tests: ~0.2 s', { size: 12.5, anchor: 'start', fill: C.green, weight: 600 });
  b += text(546, 238, '3 Postgres integration tests: ~3 s', { size: 12.5, anchor: 'start', fill: C.amber, weight: 600 });
  add('testing-pyramid', W, H, 'A pyramid with many fast unit tests at the base, fewer integration tests in the middle and a few end-to-end tests at the top', b);
}

// ---------- 22: consumer-driven contract testing ----------
{
  const W = 900;
  const H = 312;
  let b = heading(32, 32, 'Contract testing: each side tested alone, against the same contract');
  b += text(170, 74, 'Consumer’s CI', { size: 13.5, weight: 700, fill: '#003A91' });
  b += box(40, 92, 260, 56, ['web-app tests', 'run against a Pact mock provider'], 'brand', { size: 13, subSize: 11 });
  b += arrow(304, 120, 362, 120, 'brand');
  b += box(366, 88, 168, 64, ['contract file', 'request → expected response'], 'special', { size: 13, subSize: 10.5 });
  b += arrow(538, 120, 596, 120, 'special');
  b += text(730, 74, 'Provider’s CI', { size: 13.5, weight: 700, fill: '#065F46' });
  b += box(600, 92, 260, 56, ['course-api verification', 'replays the contract on the real API'], 'good', { size: 13, subSize: 11 });
  b += text(450, 176, 'shared through a Pact Broker or the repository', { size: 11.5, fill: C.muted });
  b += rect(40, 206, 400, 82, { fill: C.greenSoft, stroke: C.green, rx: 10 });
  b += text(240, 230, 'Provider unchanged', { size: 13, weight: 700, fill: '#065F46' });
  b += text(240, 254, '✔ verification passes', { size: 12.5, fill: '#065F46' });
  b += rect(460, 206, 400, 82, { fill: C.redSoft, stroke: C.red, rx: 10 });
  b += text(660, 230, 'Provider renames title → name', { size: 13, weight: 700, fill: '#9F1239' });
  b += text(660, 254, '✖ "Actual map is missing the following keys: title"', { size: 12, fill: '#9F1239' });
  b += text(660, 274, 'caught before deploy, without running both services', { size: 11.5, fill: '#9F1239' });
  add('contract-testing', W, H, 'The consumer test writes a contract file, the provider replays it against the real API; renaming a field the consumer uses makes provider verification fail', b);
}

// ---------- 22: red, green, refactor ----------
{
  const W = 900;
  const H = 300;
  let b = heading(32, 32, 'Test-driven development: red, green, refactor');
  const steps = [
    [140, 'Red', 'write a test for the next small behaviour; watch it fail', 'bad'],
    [450, 'Green', 'write the simplest code that makes it pass', 'good'],
    [760, 'Refactor', 'clean up while all tests stay green', 'brand'],
  ];
  steps.forEach(([x, title, sub, tone]) => {
    const t = TONES[tone];
    b += circle(x, 140, 56, { fill: t.fill, stroke: t.stroke, sw: 2.5 });
    b += text(x, 140, title, { size: 17, weight: 700, fill: t.text });
    b += text(x, 222, sub.split('; ')[0], { size: 12, fill: C.text });
    if (sub.includes('; ')) b += text(x, 240, sub.split('; ')[1], { size: 12, fill: C.text });
  });
  b += arrow(200, 140, 390, 140, 'good');
  b += arrow(510, 140, 700, 140, 'brand');
  b += path('M 760 84 C 760 50, 140 50, 140 80', { tone: 'bad', arrow: true, dash: '6 5' });
  b += tag(450, 59, 'repeat in small steps', { size: 12, fill: C.red });
  b += note(32, 280, 'Writing the test first forces you to decide the behaviour and the interface before the implementation.', { size: 12.5 });
  add('tdd-cycle', W, H, 'The TDD loop: write a failing test, make it pass with the simplest code, refactor with tests green, and repeat', b);
}

// ---------- 23: queue vs log ----------
{
  const W = 900;
  const H = 360;
  let b = heading(32, 32, 'A queue hands out work once. A log keeps history for everyone.');
  b += text(210, 72, 'Queue (RabbitMQ, SQS)', { size: 14, weight: 700 });
  b += box(32, 100, 80, 44, 'producer', 'plain', { size: 12 });
  ['job 4', 'job 3', 'job 2'].forEach((j, k) => (b += box(140 + k * 62, 100, 56, 44, j, 'active', { size: 11.5 })));
  b += arrow(116, 122, 136, 122, 'ink');
  b += arrow(330, 122, 360, 100, 'ink');
  b += arrow(330, 122, 360, 146, 'ink');
  b += box(364, 76, 66, 40, 'worker', 'good', { size: 11.5 });
  b += box(364, 128, 66, 40, 'worker', 'good', { size: 11.5 });
  b += text(210, 200, 'each job goes to one worker', { size: 12.5, fill: C.text });
  b += text(210, 220, 'and is deleted once acknowledged', { size: 12.5, fill: C.text });
  b += line(450, 60, 450, 330, { color: C.grid, sw: 1 });
  b += text(680, 72, 'Log (Kafka)', { size: 14, weight: 700 });
  for (let k = 0; k < 8; k++) {
    b += rect(476 + k * 48, 100, 44, 40, { fill: k < 7 ? C.brandSoft : '#FFFFFF', stroke: C.brand, rx: 4, dash: k < 7 ? undefined : '4 3' });
    b += text(498 + k * 48, 120, k < 7 ? k : 'next', { size: 12, fill: '#003A91', weight: 600, mono: k < 7 });
  }
  const readers = [['search indexer', 0, 'active', 196], ['orders service', 2, 'good', 248], ['analytics', 5, 'special', 196]];
  readers.forEach(([name, at, tone, y]) => {
    const cx = 498 + at * 48;
    b += line(cx, y, cx, 146, { tone, sw: 1.8, arrow: true });
    b += box(cx - 56, y, 112, 34, [name, `at offset ${at}`], tone, { size: 11.5, subSize: 10 });
  });
  b += text(680, 316, 'append at the end; reading removes nothing;', { size: 12, fill: C.text });
  b += text(680, 334, 'each group keeps its own position', { size: 12, fill: C.text });
  add('queue-vs-log', W, H, 'In a queue each job goes to one worker and is deleted; in a log events stay at their offsets and each consumer group reads at its own position', b);
}

// ---------- 23: topics, partitions and keys ----------
{
  const W = 900;
  const H = 360;
  let b = heading(32, 32, 'A topic is split into partitions; the key picks the partition');
  b += text(110, 78, 'producer', { size: 13, weight: 700 });
  const msgs = [['order-41', 2], ['order-42', 0], ['order-43', 4]];
  msgs.forEach(([key, p], k) => (b += box(40, 96 + k * 50, 140, 38, [`key ${key}`], k === 1 ? 'brand' : 'plain', { size: 12 })));
  b += box(220, 140, 130, 56, ['hash(key) %', '6 partitions'], 'active', { size: 12.5, subSize: 12 });
  msgs.forEach((_, k) => (b += line(184, 115 + k * 50, 216, 168, { color: C.faint, sw: 1.5 })));
  const parts = [0, 1, 2, 3, 4, 5];
  parts.forEach((p) => {
    const y = 66 + p * 44;
    const used = [0, 2, 4].includes(p);
    b += text(398, y + 17, `P${p}`, { size: 12.5, weight: 700, anchor: 'end', fill: used ? C.ink : C.faint });
    for (let o = 0; o < 4; o++) {
      const filled = used;
      b += rect(408 + o * 58, y, 54, 34, { fill: filled ? (p === 0 ? C.brandSoft : '#F1F5F9') : '#FFFFFF', stroke: filled ? (p === 0 ? C.brand : C.line) : C.grid, rx: 4 });
      if (filled) b += text(435 + o * 58, y + 17, o, { size: 11.5, mono: true, fill: p === 0 ? '#003A91' : C.muted });
    }
  });
  b += arrow(354, 168, 404, 83, 'brand');
  b += text(730, 74, 'order-42, in partition 0:', { size: 12.5, anchor: 'start', weight: 700, fill: '#003A91' });
  ['0  OrderPlaced', '1  PaymentCaptured', '2  OrderShipped', '3  OrderDelivered'].forEach((t, k) => (b += text(730, 98 + k * 20, t, { size: 12, anchor: 'start', mono: true })));
  b += text(730, 196, 'Same key → same partition', { size: 12.5, anchor: 'start', weight: 700 });
  b += text(730, 216, '→ strict order for that key.', { size: 12.5, anchor: 'start' });
  b += text(730, 248, 'No order between', { size: 12.5, anchor: 'start', weight: 700 });
  b += text(730, 268, 'different partitions.', { size: 12.5, anchor: 'start' });
  b += note(32, 344, 'Measured: three orders landed on partitions 2, 0 and 4, and each order’s four events kept their order.', { size: 12.5 });
  add('kafka-partitions', W, H, 'Records are routed to one of six partitions by hashing their key; all events for order-42 go to partition 0 in order', b);
}

// ---------- 23: consumer groups ----------
{
  const W = 900;
  const H = 380;
  let b = heading(32, 32, 'Consumer groups: share work inside a group, every group gets everything');
  b += rect(330, 60, 200, 290, { fill: '#F8FAFC', stroke: C.line, rx: 10 });
  b += text(430, 82, 'topic: orders', { size: 13, weight: 700 });
  [0, 1, 2, 3, 4, 5].forEach((p) => (b += box(352, 96 + p * 40, 156, 32, `partition ${p}`, 'brand', { size: 12 })));
  b += text(150, 72, 'group "fulfilment"', { size: 13, weight: 700, fill: '#065F46' });
  const owners = [[[1, 4], 96], [[0, 3], 186], [[2, 5], 276]];
  owners.forEach(([ps, y], k) => {
    b += box(60, y, 180, 56, [`consumer ${k + 1}`, `partitions ${ps.join(' and ')}`], 'good', { size: 13, subSize: 11 });
    ps.forEach((p) => (b += line(244, y + 28, 348, 112 + p * 40, { tone: 'good', sw: 1.5 })));
  });
  b += text(720, 72, 'group "analytics"', { size: 13, weight: 700, fill: '#5B21B6' });
  b += box(620, 176, 200, 56, ['one consumer', 'all 6 partitions'], 'special', { size: 13, subSize: 11 });
  [0, 1, 2, 3, 4, 5].forEach((p) => (b += line(512, 112 + p * 40, 616, 204, { tone: 'special', sw: 1.2, dash: '4 4' })));
  b += text(720, 266, 'Measured: each fulfilment', { size: 12, fill: C.text });
  b += text(720, 284, 'consumer got 4 of 12 events;', { size: 12, fill: C.text });
  b += text(720, 302, 'analytics got all 12.', { size: 12, fill: C.text });
  b += note(32, 370, 'One partition goes to one consumer per group, so a group can use at most as many consumers as there are partitions.', { size: 12.5 });
  add('consumer-groups', W, H, 'Three consumers in the fulfilment group each own two partitions, while the single analytics consumer reads all six partitions', b);
}

// ---------- 23: replication and acks ----------
{
  const W = 900;
  const H = 360;
  let b = heading(32, 32, 'Replication: one leader, followers in sync, acks=all');
  b += box(32, 140, 120, 56, ['producer', 'acks=all'], 'plain', { size: 13, subSize: 11 });
  const brokers = [['broker 1', 'leader', 'brand', 70], ['broker 2', 'follower, in sync', 'good', 160], ['broker 3', 'follower, in sync', 'good', 250]];
  brokers.forEach(([name, role, tone, y]) => b += box(260, y, 190, 58, [name, `partition 0: ${role}`], tone, { size: 13, subSize: 11 }));
  b += arrow(156, 160, 256, 100, 'ink');
  b += tag(206, 120, 'write', { size: 11 });
  b += path('M 355 132 L 355 156', { tone: 'good', arrow: true });
  b += path('M 452 99 C 500 99, 500 279, 454 279', { tone: 'good', arrow: true });
  b += text(522, 190, 'copy', { size: 11.5, fill: C.green, anchor: 'start' });
  b += text(560, 82, 'min.insync.replicas = 2', { size: 13, anchor: 'start', weight: 700 });
  const rows = [
    ['3 brokers up', 'write OK', C.green],
    ['broker 3 down', 'new leaders elected, write OK', C.green],
    ['brokers 2 and 3 down', 'write refused: NotEnoughReplicas', C.red],
    ['both restarted', 'replicas catch up, write OK', C.green],
  ];
  rows.forEach(([state, result, color], k) => {
    b += text(560, 116 + k * 44, state, { size: 12.5, anchor: 'start', weight: 600 });
    b += text(560, 134 + k * 44, result, { size: 12, anchor: 'start', fill: color });
  });
  b += note(32, 346, 'The write succeeds only when at least 2 copies have it, so losing one broker never loses an acknowledged write.', { size: 12.5 });
  add('kafka-replication', W, H, 'A partition leader on broker 1 replicates to followers on brokers 2 and 3; with min.insync.replicas of 2, writes succeed with one broker down and are refused with two down', b);
}

// ---------- 23: the outbox pattern ----------
{
  const W = 900;
  const H = 380;
  let b = heading(32, 32, 'The dual-write problem and the outbox fix');
  b += text(210, 70, 'Dual write: two separate systems', { size: 13.5, weight: 700, fill: C.red });
  b += box(40, 96, 120, 50, 'order service', 'plain', { size: 12.5 });
  b += box(260, 84, 140, 40, '1. INSERT order', 'good', { size: 12 });
  b += box(260, 140, 140, 40, '2. publish event', 'bad', { size: 12 });
  b += arrow(164, 114, 256, 104, 'good');
  b += arrow(164, 128, 256, 160, 'bad');
  b += text(210, 210, 'crash between 1 and 2: the order exists,', { size: 12, fill: C.red });
  b += text(210, 228, 'but no event is ever sent', { size: 12, fill: C.red });
  b += line(450, 56, 450, 340, { color: C.grid, sw: 1 });
  b += text(680, 70, 'Outbox: one local transaction', { size: 13.5, weight: 700, fill: C.green });
  b += rect(476, 88, 230, 110, { fill: C.greenSoft, stroke: C.green, rx: 10 });
  b += text(591, 108, 'BEGIN … COMMIT', { size: 12, weight: 700, fill: '#065F46', mono: true });
  b += box(492, 120, 198, 30, 'INSERT INTO orders', 'plain', { size: 11.5, mono: true });
  b += box(492, 158, 198, 30, 'INSERT INTO outbox', 'plain', { size: 11.5, mono: true });
  b += box(740, 136, 120, 50, ['relay', 'or Debezium'], 'active', { size: 12.5, subSize: 11 });
  b += arrow(710, 168, 736, 164, 'active');
  b += box(740, 236, 120, 44, 'Kafka', 'brand', { size: 13 });
  b += arrow(800, 190, 800, 232, 'brand');
  b += text(591, 228, 'both rows commit, or neither', { size: 12, fill: '#065F46' });
  b += text(591, 246, 'relay retries until published', { size: 12, fill: '#065F46' });
  b += text(591, 264, '(at least once: keep consumers idempotent)', { size: 11.5, fill: C.muted });
  b += note(32, 330, 'Measured: an invalid order rolled back with no outbox row; the relay published the two valid orders, then found nothing left.', { size: 12.5 });
  add('outbox-pattern', W, H, 'Writing to the database and Kafka separately can leave them out of sync; the outbox pattern writes the order and the event in one transaction and a relay publishes it', b);
}
