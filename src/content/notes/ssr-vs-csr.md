---
title: SSR vs CSR
description: Server-side vs client-side rendering: trade-offs, when to use which, and hybrid rendering.
author: Vikas Patel
---

## Server-Side Rendering (SSR) vs Client-Side Rendering (CSR)

### 1. What is Rendering?

Rendering means converting your application code into HTML that the browser can display.

There are two main approaches:

- Server-Side Rendering (SSR)
- Client-Side Rendering (CSR)

---

## 2. Server-Side Rendering (SSR)

### Definition

In SSR, the HTML page is generated on the server and sent fully rendered to the browser.

### Flow of SSR

1. Client sends request to server
1. Server processes logic (database, APIs, etc.)
1. Server generates complete HTML
1. Browser receives ready-to-display HTML

---

### Example (Node.js + EJS)

```
app.get('/', (req,res) => {
const user="Harsh";
res.render('home', { user });
});
```

```
<h1>Hello <%= user %></h1>
```

#### What happens:

- Server creates final HTML: `<h1>Hello Harsh</h1>`
- Browser directly displays it

---

### Advantages of SSR

#### 1. Faster initial load

- Browser gets ready HTML
- No waiting for JavaScript execution

#### 2. Better SEO

- Search engines can easily read content

#### 3. Works on low-end devices

- Less work for browser

---

### Disadvantages of SSR

#### 1. Higher server load

- Server renders HTML for every request

#### 2. Slower navigation

- Every page change requires a new request

#### 3. Less interactive by default

- Needs extra JavaScript for interactivity

---

## 3. Client-Side Rendering (CSR)

### Definition

In CSR, the browser receives a minimal HTML file and JavaScript renders the content dynamically.

### Flow of CSR

1. Client requests page
1. Server sends basic HTML + JS bundle
1. Browser downloads JS
1. JS executes and builds UI
1. Data is fetched via APIs

---

### Example (React Concept)

```
<div id="root"></div>
<script src="bundle.js"></script>
```

JS builds UI:

```
document.getElementById("root").innerHTML="<h1>Hello Harsh</h1>";
```

---

### Advantages of CSR

#### 1. Smooth user experience

- No full page reloads
- Fast navigation after initial load

#### 2. Highly interactive

- Ideal for dashboards, SPAs

#### 3. Reduced server load

- Server only sends APIs, not full HTML

---

### Disadvantages of CSR

#### 1. Slower initial load

- Browser must download and execute JS

#### 2. Poor SEO (without optimization)

- Content not immediately available

#### 3. Depends on JavaScript

- If JS fails, page may not render

---

## 4. SSR vs CSR Comparison

| Feature | SSR | CSR |
| --- | --- | --- |
| Rendering Location | Server | Browser |
| Initial Load | Fast | Slower |
| SEO | Good | Poor (by default) |
| Interactivity | Low initially | High |
| Server Load | High | Low |
| Navigation | Slower | Faster |
| Example | EJS, Next.js (SSR mode) | React, Angular |

---

## 5. When to Use SSR

Use SSR when:

- SEO is important (blogs, landing pages)
- Faster first load is needed
- Content is mostly static

Examples:

- Blogs
- News websites
- E-commerce product pages

---

## 6. When to Use CSR

Use CSR when:

- App is highly interactive
- Real-time updates required
- SPA (Single Page Application)

Examples:

- Admin dashboards
- Chat apps
- Social media apps

---

## 7. Hybrid Approach (Important Concept)

Modern frameworks combine both:

- Next.js
- Nuxt.js

They support:

- SSR + CSR together

This is called:

- Hybrid rendering
- or Universal rendering

---

## 8. Simple Analogy

SSR:

- Like ordering food and getting a fully cooked meal

CSR:

- Like getting raw ingredients and cooking yourself

---

## 9. Key Interview Points

- SSR improves SEO and initial load
- CSR improves user experience after load
- Trade-off: performance vs interactivity
- Modern apps use hybrid renderin
