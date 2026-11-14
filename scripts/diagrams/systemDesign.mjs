// Diagrams for the System Design chapters: HTTP, routing and serialization.
import { C, TONES, badge, code, heading, line, note, path, rect, spans, tag, text } from './svg.mjs';
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
