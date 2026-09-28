> **In short:** in about an hour you'll build an expense tracker with plain HTML, CSS and JavaScript: add expenses, see the total, delete items, and keep everything saved in the browser. Then you'll put it online for free and share the link.

Tutorials that only show snippets never feel like "real" apps. This one ends with a working, deployed project you can put on your resume, and every step explains **why**, not just what to type. You only need a browser, a text editor and basic HTML.

## What we're building

A small expense tracker:

- a form to add an expense (what, how much, which category)
- a list of expenses with a **Delete** button on each
- a running **total**
- data that stays after you refresh the page (saved with `localStorage`)

The three files have three jobs: **HTML** is the structure, **CSS** is the look, and **JavaScript** is the behaviour.

## Setup

1. Create a folder called `expense-tracker` with three empty files: `index.html`, `style.css` and `app.js`.
2. Open the folder in **VS Code**.
3. Install the **Live Server** extension, then right-click `index.html` → *Open with Live Server*. The page reloads every time you save. (Alternative: run `npx serve` in the folder.)

## Step 1: the structure (index.html)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Expense Tracker</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <main class="app">
    <h1>Expense Tracker</h1>
    <p class="total">Total: ₹<span id="total">0</span></p>

    <form id="expense-form">
      <input id="title" placeholder="What did you spend on?" required />
      <input id="amount" type="number" min="1" step="1" placeholder="Amount (₹)" required />
      <select id="category">
        <option>Food</option>
        <option>Travel</option>
        <option>Books</option>
        <option>Other</option>
      </select>
      <button type="submit">Add</button>
    </form>

    <ul id="list"></ul>
  </main>
  <script src="app.js"></script>
</body>
</html>
```

Things worth noticing:

- The `<meta name="viewport">` line makes the page behave properly on phones. Never skip it.
- Every input has an `id`, so JavaScript can find it.
- `required`, `type="number"` and `min="1"` give you free validation: the browser won't submit an empty name or a zero amount.
- The `<script>` tag is at the **end** of `<body>`, so the HTML exists before the script tries to use it.

## Step 2: the look (style.css)

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #f4f6fb;
  color: #0a1633;
}

.app {
  max-width: 480px;
  margin: 40px auto;
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(10, 22, 51, 0.08);
}

.total {
  font-size: 1.25rem;
  font-weight: 700;
}

form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

#title {
  grid-column: 1 / -1; /* the first input spans both columns */
}

input,
select,
button {
  padding: 10px;
  font: inherit;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
}

button {
  background: #0052cc;
  color: white;
  border: none;
  cursor: pointer;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #e2e8f0;
}

li small {
  color: #64748b;
}

li button {
  margin-left: 8px;
  padding: 4px 10px;
  background: #fee2e2;
  color: #b91c1c;
}

@media (max-width: 400px) {
  form {
    grid-template-columns: 1fr;
  }
}
```

The layout uses **CSS Grid** for the form (two columns, with the first input spanning both) and **Flexbox** for each list row (name on the left, amount and button on the right). The `@media` rule stacks the form into one column on small phones. `box-sizing: border-box` makes widths include padding, which avoids most "why is this overflowing?" surprises.

## Step 3: state and rendering (app.js)

This is the most important idea in front-end development, and the same one React is built on:

> Keep your data in **one variable** (the state). Whenever it changes, **redraw the screen from it**.

Start `app.js` by grabbing the elements and loading any saved expenses:

```js
const form = document.querySelector('#expense-form');
const list = document.querySelector('#list');
const totalEl = document.querySelector('#total');

// State: the one place where the data lives
let expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
```

`localStorage` only stores text, so we save the array as JSON and parse it back when the page loads. The `|| '[]'` handles the very first visit, when nothing is saved yet.

A tiny helper saves the state whenever it changes:

```js
function save() {
  localStorage.setItem('expenses', JSON.stringify(expenses));
}
```

Now the render function, which rebuilds the list and total from `expenses`:

```js
// Render: rebuild the list and total from the state
function render() {
  list.innerHTML = '';
  for (const expense of expenses) {
    const li = document.createElement('li');

    const label = document.createElement('span');
    label.textContent = `${expense.title} `;
    const tag = document.createElement('small');
    tag.textContent = expense.category;
    label.appendChild(tag);

    const right = document.createElement('span');
    right.textContent = `₹${expense.amount}`;
    const remove = document.createElement('button');
    remove.textContent = 'Delete';
    remove.dataset.id = expense.id;
    right.appendChild(remove);

    li.append(label, right);
    list.appendChild(li);
  }
  totalEl.textContent = expenses.reduce((sum, e) => sum + e.amount, 0);
}
```

Why build elements with `textContent` instead of pasting a string into `innerHTML`? Because the text comes from the user. If someone types `<img src=x onerror=alert(1)>` as an expense name, `innerHTML` would run it as code (a **cross-site scripting**, or XSS, bug). `textContent` always treats it as plain text.

## Step 4: adding an expense

```js
form.addEventListener('submit', (event) => {
  event.preventDefault(); // stop the browser from reloading the page
  const title = document.querySelector('#title').value.trim();
  const amount = Number(document.querySelector('#amount').value);
  const category = document.querySelector('#category').value;
  if (!title || amount <= 0) return;

  expenses.push({ id: crypto.randomUUID(), title, amount, category });
  save();
  render();
  form.reset();
});
```

- `event.preventDefault()` stops the browser's default behaviour for forms, which is to reload the page.
- `Number(...)` converts the input's text into a number, so `20 + 45` gives `65`, not `"2045"`.
- `crypto.randomUUID()` gives every expense a unique id. (Using `Date.now()` looks fine, but two expenses added in the same millisecond would share an id, and deleting one would delete both.)
- The order is always the same: **change the state → save → render**.

## Step 5: deleting an expense

```js
// One listener handles every Delete button, even ones added later
list.addEventListener('click', (event) => {
  if (event.target.tagName !== 'BUTTON') return;
  const id = event.target.dataset.id;
  expenses = expenses.filter((e) => e.id !== id);
  save();
  render();
});

render();
```

Instead of attaching a listener to every Delete button, we attach **one** listener to the list and check what was clicked. This is called **event delegation**. It keeps working for buttons created later, and it's how real apps handle long lists.

Save everything, add a few expenses, refresh the page, and they're still there. You've built a working app.

## Step 6: put it online for free

Pick one:

- **GitHub Pages**: create a repository, upload the three files, then go to *Settings → Pages*, choose *Deploy from a branch* and the `main` branch. Your site appears at `https://<username>.github.io/<repo>/`.
- **Netlify Drop**: open Netlify's drop page and drag the folder onto it. You get a live link in seconds.
- **Vercel**: import the GitHub repository; every push redeploys automatically.

Put the link in your resume and your GitHub profile README. A live link is worth more than any certificate.

## What you just learned

| Concept | Where you used it |
| --- | --- |
| Semantic HTML and forms | the form and list |
| CSS Grid, Flexbox, media queries | the layout and phone view |
| DOM selection and creation | `querySelector`, `createElement`, `textContent` |
| Events and delegation | submit and delete |
| State → render | the `expenses` array and `render()` |
| Persistence | `localStorage` with JSON |
| Security basics | `textContent` instead of `innerHTML` |

## Make it yours: five upgrades

1. **Edit** an expense: add an *Edit* button that fills the form with its values.
2. **Filter by month** with an `<input type="month">` and store a date on each expense.
3. **Category totals** as a simple bar chart (plain `<div>` widths, or Chart.js).
4. **Dark mode** with a toggle and CSS variables.
5. **Export to CSV** so the data can be opened in Excel or Google Sheets.

Each upgrade teaches something new, and together they turn a tutorial project into **your** project.

## Common mistakes

- **Script runs before the HTML exists**: put `<script>` at the end of `<body>` (or add `defer`), otherwise `querySelector` returns `null`.
- **Forgetting `preventDefault()`**: the page reloads and your data disappears.
- **Adding strings instead of numbers**: always convert input values with `Number()`.
- **Using `innerHTML` with user input**: an easy XSS hole.
- **Not checking the browser console**: press F12. Most bugs are explained right there in red.

## FAQ

**Do I need a framework like React for this?**
No. Building it in plain JavaScript first teaches you what frameworks do for you. Then read [React fundamentals](/blog/react-fundamentals) and rebuild this app in React; it's a great second project.

**Is localStorage a real database?**
No. It lives in one browser on one device, holds a few megabytes, and the user can clear it. For accounts and syncing you need a backend and a database, which you'll learn in a full-stack course.

**Where do I find more project ideas?**
See our [project ideas](/projects), sorted from beginner to advanced.

Want to go from this to full-stack apps with real databases and AI features? Take a look at [Full Stack Web Development with AI](/courses/full-stack-ai).
