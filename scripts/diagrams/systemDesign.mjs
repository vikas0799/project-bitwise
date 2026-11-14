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
