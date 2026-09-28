> **In short:** React lets you build a UI out of **components**: functions that take **props** and return what the screen should look like. You keep changing data in **state**, and React updates the page for you. Learn components, JSX, props, state, events, lists, conditional rendering, lifting state up and effects, in that order, and you can build real apps.

React is the most used front-end library in the world, and most front-end and full-stack job descriptions in India mention it. This guide teaches the core ideas with small examples, then puts them together in one app: the expense tracker from [Build your first web app](/blog/first-web-app), rebuilt in React. If you're still new to JavaScript itself, do that post first.

## How to start a React project in 2026

The official React docs recommend starting real apps with a **framework**, such as **Next.js** or **React Router** (which builds on Vite). For learning the basics, a plain **Vite** project is the simplest start:

```bash
npm create vite@latest expense-tracker -- --template react
cd expense-tracker
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). Your code lives in `src/`, and `src/App.jsx` is the component you'll edit.

You'll still find old tutorials using **Create React App** (`npx create-react-app`). It's no longer recommended, so skip those setup steps.

## Components: UI as functions

A component is a JavaScript function whose name starts with a capital letter and which returns **JSX**, markup that looks like HTML:

```jsx
function Welcome() {
  return <h1>Welcome to Bitwise School</h1>;
}

export default function App() {
  return (
    <main>
      <Welcome />
      <Welcome />
    </main>
  );
}
```

JSX rules that trip up beginners:

- Return **one** parent element (wrap siblings in a `<div>` or an empty `<>...</>` fragment).
- Close every tag: `<img />`, `<input />`.
- Use `className` instead of `class`, and camelCase for attributes like `onClick`.
- Put any JavaScript expression inside `{ }`: `<p>{2 + 2}</p>` shows 4.

## Props: passing data in

Props make a component reusable, like arguments to a function:

```jsx
function CourseCard({ title, weeks }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <p>{weeks} weeks</p>
    </div>
  );
}

export default function App() {
  return (
    <>
      <CourseCard title="DSA" weeks={16} />
      <CourseCard title="React" weeks={8} />
    </>
  );
}
```

Props are **read-only**: a component never changes its own props.

## State: data that changes

When something changes over time (a counter, a form field, a list), keep it in **state** with the `useState` hook. Calling the setter tells React to re-render the component with the new value.

```jsx
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
```

Two rules of hooks: call them only at the **top level** of a component (not inside `if` or loops), and only from components or other hooks.

## Events and forms

In React, an input usually shows a value from state and updates that state on every keystroke. This is called a **controlled input**, and it makes validation and resetting easy:

```jsx
import { useState } from 'react';

export default function NameForm() {
  const [name, setName] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); alert(`Hello, ${name}`); }}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button type="submit">Say hello</button>
      <p>You typed: {name}</p>
    </form>
  );
}
```

## Lists, keys and conditional rendering

Render lists with `map`, and give each item a stable, unique `key` so React can tell items apart when the list changes:

```jsx
export default function TopicList({ topics }) {
  if (topics.length === 0) return <p>No topics yet.</p>;
  return (
    <ul>
      {topics.map((topic) => (
        <li key={topic.id}>{topic.name}</li>
      ))}
    </ul>
  );
}
```

Use real ids as keys. Array indexes as keys cause strange bugs when items are added, removed or reordered.

For conditions, plain JavaScript works: `if`, the ternary `a ? b : c`, or `condition && <Thing />`.

## Lifting state up

When two components need the same data, move the state to their **closest common parent** and pass it down as props, along with functions to change it. In the app below, `App` owns the list of expenses; `ExpenseForm` only knows how to call `onAdd`, and `ExpenseItem` only knows how to call `onDelete`.

## Effects: syncing with the outside world

`useEffect` runs code **after** React updates the screen, to sync with something outside React: `localStorage`, a timer, a network request, a browser API.

```jsx
useEffect(() => {
  localStorage.setItem('expenses', JSON.stringify(expenses));
}, [expenses]); // run again only when expenses change
```

Don't use effects to compute values you can calculate during render. A total, a filtered list or a formatted date should just be a variable in the component body.

## Putting it together: the expense tracker in React

Here is the complete app. Paste it into `src/App.jsx` (the CSS from the [first web app post](/blog/first-web-app) works as it is):

```jsx
import { useEffect, useState } from 'react';

function ExpenseForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');

  function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim() || Number(amount) <= 0) return;
    onAdd({ id: crypto.randomUUID(), title: title.trim(), amount: Number(amount), category });
    setTitle('');
    setAmount('');
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What did you spend on?" />
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (₹)" />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option>Food</option>
        <option>Travel</option>
        <option>Books</option>
        <option>Other</option>
      </select>
      <button type="submit">Add</button>
    </form>
  );
}

function ExpenseItem({ expense, onDelete }) {
  return (
    <li>
      <span>
        {expense.title} <small>{expense.category}</small>
      </span>
      <span>
        ₹{expense.amount} <button onClick={() => onDelete(expense.id)}>Delete</button>
      </span>
    </li>
  );
}

export default function App() {
  const [expenses, setExpenses] = useState(() => JSON.parse(localStorage.getItem('expenses') || '[]'));
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  const visible = filter === 'All' ? expenses : expenses.filter((e) => e.category === filter);
  const total = visible.reduce((sum, e) => sum + e.amount, 0);

  return (
    <main className="app">
      <h1>Expense Tracker</h1>
      <p className="total">Total: ₹{total}</p>
      <ExpenseForm onAdd={(expense) => setExpenses((prev) => [...prev, expense])} />
      <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by category">
        <option>All</option>
        <option>Food</option>
        <option>Travel</option>
        <option>Books</option>
        <option>Other</option>
      </select>
      {visible.length === 0 ? (
        <p>No expenses yet. Add your first one above.</p>
      ) : (
        <ul>
          {visible.map((expense) => (
            <ExpenseItem
              key={expense.id}
              expense={expense}
              onDelete={(id) => setExpenses((prev) => prev.filter((e) => e.id !== id))}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
```

Compare it with the plain JavaScript version:

- There's **no manual DOM code** (`createElement`, `innerHTML`). You describe what the screen should look like for the current state, and React works out the changes.
- State updates use the **updater form**, `setExpenses((prev) => [...prev, expense])`, and always create a **new array** instead of changing the old one.
- `total` and `visible` are plain variables computed on each render, not extra state.
- Loading from `localStorage` uses a function in `useState(() => ...)`, so it runs only once, on the first render.
- The new filter came almost for free: one more piece of state, and one more derived variable.

## Common mistakes

- **Mutating state**: `expenses.push(item)` then `setExpenses(expenses)` won't re-render reliably. Create a new array or object.
- **Missing or index keys** in lists.
- **Using `useEffect` for everything**, like computing totals or copying props into state.
- **Calling a function instead of passing it**: `onClick={handleClick()}` runs immediately; write `onClick={handleClick}` or `onClick={() => handleClick(id)}`.
- **Hooks inside conditions or loops**: they must run in the same order on every render.

## What to learn next

1. **TypeScript with React**: typed props catch many bugs.
2. **Routing**: pages and URLs with React Router, or Next.js.
3. **Data fetching**: TanStack Query for loading and caching server data.
4. **Next.js**: server components, server actions and deployment.
5. **Build three projects** of your own. Our [project ideas](/projects) are a good starting list.

## FAQ

**Should I learn JavaScript fully before React?**
You need the basics solid: functions, arrays and `map`/`filter`, objects, destructuring, modules and `async`/`await`. Our [JavaScript revision notes](/notes/javascript-revision) cover them. You don't need to master everything first.

**React or Next.js?**
Learn React's core ideas first (this post), then Next.js, which is React plus routing, server rendering and a backend layer. Most new production apps use a framework like Next.js.

**Do I need Redux?**
Not at the start. `useState`, lifting state up and Context handle most apps. Reach for Zustand or Redux Toolkit when state is shared across many distant components.

Want structured practice with a mentor? See our [React.js Bootcamp](/courses/react) or the complete [Full Stack Web Development with AI](/courses/full-stack-ai) course.
