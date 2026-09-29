---
title: "DOM, Events and Browser APIs"
description: Selecting and changing the DOM, DOM vs BOM vs virtual DOM, event propagation with capture, target and bubble phases, stopPropagation vs preventDefault, target vs currentTarget, event delegation, debouncing and throttling with diagrams, storage, fetch, rendering 100,000 items and Web Workers.
author: Vikas Patel
---

In the browser, JavaScript's job is to make pages interactive: read what the user does, change the page, talk to servers. This note covers the **DOM**, **events** (the most asked browser topic in interviews), **debounce and throttle**, and the browser APIs you'll use every day.

## DOM, BOM and virtual DOM

| | What it is | Examples |
| --- | --- | --- |
| **DOM** (Document Object Model) | the page as a tree of objects that JavaScript can read and change | `document`, `querySelector`, `element.textContent` |
| **BOM** (Browser Object Model) | everything about the browser **around** the page | `window`, `location`, `history`, `navigator`, `screen`, `localStorage` |
| **Virtual DOM** | a lightweight JavaScript copy of the UI kept by libraries like React | React compares the old and new copy and updates only what changed |

The real DOM isn't slow to **read**. What's expensive is making the browser **recalculate layout and repaint** many times. The virtual DOM helps by batching changes; it isn't magic, and careful plain JavaScript can be just as fast.

## Working with the DOM

```js
// Select
const title = document.getElementById("title");
const firstCard = document.querySelector(".card");          // first match (CSS selector)
const cards = document.querySelectorAll(".card");            // static NodeList of all matches

// Navigate
firstCard.parentElement;
firstCard.children;                                           // element children only
firstCard.nextElementSibling;
firstCard.closest("section");                                 // nearest ancestor matching a selector

// Read and change
title.textContent = "Hello";                  // safe: treated as text
title.classList.add("active");                // add, remove, toggle, contains
title.dataset.courseId;                       // reads data-course-id="…"
title.setAttribute("aria-expanded", "true");

// Create, insert, remove
const li = document.createElement("li");
li.textContent = "New lesson";
document.querySelector("ul").append(li);
li.remove();
```

**Security:** never put user input into `innerHTML`. It parses HTML, so `<img src=x onerror=alert(1)>` would run code (XSS). Use `textContent` for text.

## Events

```js
const button = document.querySelector("#save");
function onSave(event) {
  console.log("clicked", event.type);
}
button.addEventListener("click", onSave);
button.removeEventListener("click", onSave);   // needs the same function reference
```

### Event propagation: capture, target, bubble

A click doesn't fire only on the element you clicked. The event travels through the tree in **three phases**:

![A click travelling from window down to the clicked li in the capture phase, then bubbling back up](/images/js/event-propagation.svg "Listeners run while bubbling by default. Pass { capture: true } to run on the way down.")

1. **Capture phase:** from `window` down to the parent of the target.
2. **Target phase:** at the element that was actually clicked.
3. **Bubble phase:** from the target back up to `window`.

```js
el.addEventListener("click", handler);                     // bubble phase (default)
el.addEventListener("click", handler, { capture: true });  // capture phase (or pass true)
```

### Classic output question

```html
<div id="grandparent">
  <div id="parent">
    <button id="child">Click</button>
  </div>
</div>
```

```js
const grandparent = document.getElementById("grandparent");
const parent = document.getElementById("parent"); // declare it: the global `parent` is window.parent, not the div
const child = document.getElementById("child");

grandparent.addEventListener("click", () => console.log("GP capture"), true);
parent.addEventListener("click", () => console.log("P capture"), true);
child.addEventListener("click", () => console.log("C capture"), true);
child.addEventListener("click", () => console.log("C bubble"));
parent.addEventListener("click", () => console.log("P bubble"));
grandparent.addEventListener("click", () => console.log("GP bubble"));
```

Clicking the button prints:

```text
GP capture
P capture
C capture
C bubble
P bubble
GP bubble
```

On the target itself, current browsers run **capture listeners before bubble listeners**, whatever order you added them in. (Older browsers used registration order, which is why you'll still see that rule in older notes.)

### stopPropagation, stopImmediatePropagation, preventDefault

| Method | What it stops |
| --- | --- |
| `e.stopPropagation()` | travel to **other elements**; other listeners on the **same** element still run |
| `e.stopImmediatePropagation()` | travel **and** the remaining listeners on the same element |
| `e.preventDefault()` | the browser's **default action** (following a link, submitting a form, ticking a checkbox); propagation continues |
| `return false` | nothing in `addEventListener` (it only works in jQuery and inline `onclick`) |

```js
btn.addEventListener("click", (e) => {
  e.stopPropagation();
  console.log("A");                                   // runs
});
btn.addEventListener("click", () => console.log("B")); // also runs
parent.addEventListener("click", () => console.log("C")); // doesn't run
// Output: A B. With stopImmediatePropagation(): A only.
```

### target vs currentTarget

```js
list.addEventListener("click", function (e) {
  e.target;         // the element actually clicked (the deepest one, maybe a <span> inside an <li>)
  e.currentTarget;  // the element this listener is attached to: list
  this;             // also list, in a normal function (not in an arrow function)
});
```

### Events that don't bubble

`focus`/`blur` (use `focusin`/`focusout`), `mouseenter`/`mouseleave` (use `mouseover`/`mouseout`), `load`, `error` and `scroll` on elements. Listen in the capture phase if you need to catch them on an ancestor.

### Useful listener options

```js
el.addEventListener("click", fn, { once: true });              // removes itself after one call
window.addEventListener("scroll", fn, { passive: true });      // promises not to preventDefault: smoother scrolling

const controller = new AbortController();
el.addEventListener("click", fn, { signal: controller.signal });
other.addEventListener("keydown", fn2, { signal: controller.signal });
controller.abort();                                             // removes both at once

el.dispatchEvent(new CustomEvent("course:saved", { detail: { id: 1 }, bubbles: true }));
```

## Event delegation

Instead of one listener on every child, put **one listener on a common parent** and use bubbling plus `event.target` to find out what was clicked.

```js
// Bad: 1,000 listeners, and new items added later get none
document.querySelectorAll(".item").forEach((el) => el.addEventListener("click", handleClick));

// Good: one listener that also works for items added later
list.addEventListener("click", (e) => {
  const item = e.target.closest(".item");
  if (!item || !list.contains(item)) return;
  handleClick(item);
});
```

Always use `closest()`: if the item contains a `<span>` or an icon, `e.target` is that inner element, not the item.

A to-do list with several actions, all handled by one listener:

```html
<ul id="todoList">
  <li data-id="1">
    Buy milk
    <button data-action="toggle">Done</button>
    <button data-action="delete">Delete</button>
  </li>
</ul>
```

```js
document.getElementById("todoList").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const id = btn.closest("li").dataset.id;
  if (btn.dataset.action === "toggle") toggleTodo(id);
  if (btn.dataset.action === "delete") deleteTodo(id);
});
```

**Benefits:** less memory, works for dynamic elements, one listener to clean up. **Limits:** non-bubbling events need capture, and a child calling `stopPropagation()` breaks it.

## Debounce and throttle

Some events fire dozens of times a second (`input`, `scroll`, `resize`, `mousemove`). Running an API call or heavy work on every one wastes resources. Two fixes:

![A burst of typing events; debounce fires once after typing stops, throttle fires at a steady rate](/images/js/debounce-throttle.svg "Debounce waits for a pause. Throttle limits the rate.")

| | Debounce | Throttle |
| --- | --- | --- |
| rule | run once after the events **stop** for `wait` ms | run at most once every `wait` ms |
| timer on each event | **reset** | **not** reset |
| during non-stop events | 0 calls until they stop | steady calls |
| best for | search box, auto-save, validation, resize end | scroll, mousemove, drag, infinite scroll |
| analogy | a lift door that restarts its timer whenever someone walks in | a fixed fire rate, however hard you press |

### Debounce

```js
function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);                            // every call resets the timer
    timer = setTimeout(() => fn.apply(this, args), delay); // arrow keeps the caller's this
  };
}

const search = debounce((e) => console.log("API call for:", e.target.value), 500);
input.addEventListener("input", search);
```

Interviewers often ask for `cancel` (for example when a React component unmounts) and a **leading** option (fire on the first call, then wait for quiet). Both are in [machine coding](/notes/javascript-machine-coding).

### Throttle

```js
function throttle(fn, limit = 300) {
  let last = 0;
  let timer = null;
  let lastArgs;
  let lastThis;
  const run = () => {
    last = Date.now();
    timer = null;
    fn.apply(lastThis, lastArgs);
  };
  return function (...args) {
    lastArgs = args;                        // the trailing call uses the latest arguments
    lastThis = this;
    const remaining = limit - (Date.now() - last);
    if (remaining <= 0) {                   // window passed: run now (leading edge)
      clearTimeout(timer);
      run();
    } else if (!timer) {                    // inside the window: schedule one trailing call
      timer = setTimeout(run, remaining);
    }
  };
}

window.addEventListener("scroll", throttle(() => console.log(window.scrollY), 200));
```

The trailing call matters for scroll: you never want to lose the **final** position. For animations, throttling to the screen's frame rate with `requestAnimationFrame` is even better than a fixed number.

## Browser APIs you'll use

```js
// Storage: strings only, so JSON.stringify objects
localStorage.setItem("theme", "dark");              // survives restarts, per origin
sessionStorage.setItem("step", "2");                // cleared when the tab closes
const prefs = JSON.parse(localStorage.getItem("prefs") ?? "{}");

// Location and history
location.href;                                       // full URL
new URLSearchParams(location.search).get("q");       // read ?q=...
history.pushState({}, "", "/courses");               // change the URL without reloading (how SPA routers work)

// Fetch
const res = await fetch("/api/courses", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "JavaScript" }),
});
if (!res.ok) throw new Error(`HTTP ${res.status}`);

// Timers
const id = setInterval(tick, 1000);
clearInterval(id);

// Others: navigator.clipboard.writeText(), navigator.geolocation, Notification, WebSocket, IntersectionObserver
```

| | `localStorage` | `sessionStorage` | cookies |
| --- | --- | --- | --- |
| lifetime | until cleared | until the tab closes | until expiry |
| size | ~5 MB | ~5 MB | ~4 KB |
| sent to the server | no | no | **with every request** |
| readable by JavaScript | yes | yes | not if `HttpOnly` |

Never store auth tokens in `localStorage`: any XSS bug can read them. See [authentication](/notes/authentication).

## Performance scenarios

### Rendering 100,000 items

Creating 100,000 DOM nodes freezes the page. Options, best first:

1. **Don't render them all.** Paginate or load more on scroll (`IntersectionObserver`).
2. **Virtualise the list:** render only the ~30 rows visible in the viewport and swap their contents as the user scrolls (react-window, TanStack Virtual).
3. If you must build many nodes, build them in a `DocumentFragment` and insert once, so the browser lays out once instead of 100,000 times.
4. Use **delegation**: one listener, not 100,000.
5. Split the work into chunks with `requestAnimationFrame` or `setTimeout` so the page stays responsive.

### Avoiding layout thrashing

Reading layout (`offsetHeight`, `getBoundingClientRect`) right after writing styles forces the browser to recalculate layout immediately. In a loop, that means one layout per item. **Batch all reads, then all writes.**

### Web Workers: real parallelism

JavaScript on the page is single-threaded, but a **Web Worker** runs a script on a **separate thread** with its own event loop. Use it for heavy computation (parsing big files, image processing) so the UI stays smooth.

```js
// main.js
const worker = new Worker("worker.js");
worker.postMessage({ numbers: [5, 3, 8] });
worker.onmessage = (e) => console.log("sum:", e.data);

// worker.js
self.onmessage = (e) => {
  const sum = e.data.numbers.reduce((a, b) => a + b, 0);
  self.postMessage(sum);
};
```

Workers **can't touch the DOM**. They talk to the page only by messages (data is copied, or transferred for big buffers). Node.js has the same idea in `worker_threads`.

## Interview questions

1. DOM vs BOM vs virtual DOM.
2. Explain capturing, target and bubbling phases. Predict the output of the nested listeners above.
3. `stopPropagation` vs `stopImmediatePropagation` vs `preventDefault`.
4. `event.target` vs `event.currentTarget`.
5. What is event delegation and why is it useful? What are its limits?
6. Debounce vs throttle. Implement both. Where would you use each?
7. `localStorage` vs `sessionStorage` vs cookies.
8. How would you render 100,000 rows? What are Web Workers?
9. Why is `innerHTML` with user input dangerous?

## Further reading

- [MDN: Introduction to events](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Events) and [Event bubbling](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling)
- [javascript.info: Browser: Document, Events, Interfaces](https://javascript.info/ui)
- [web.dev: Rendering performance](https://web.dev/articles/rendering-performance)

Next: [Shallow vs deep copy](/notes/shallow-vs-deep-copy).
