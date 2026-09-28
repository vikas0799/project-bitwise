---
title: Stacks and Queues (plus Monotonic Stack)
description: Stacks (LIFO) and queues (FIFO) with diagrams, balanced parentheses, a circular queue, deque and sliding window maximum, the monotonic stack for next greater element, a queue from two stacks and a min stack, in C++.
author: Bitwise School
---

Stacks and queues are lists with a rule about **which end** you may use. That restriction is exactly what makes them useful: the order items come out tells you something about the problem.

## Stack: last in, first out

A stack is like a pile of plates. You **push** onto the top and **pop** from the top, so the last item added is the first one removed (LIFO).

![Three stacks: start with 10 and 20, after push(30), and after pop() returns 30](/images/dsa/stack-push-pop.svg "Only the top is reachable: push adds there, pop removes from there.")

All three operations are **O(1)**. A `vector` makes a perfect stack:

```cpp
class Stack {
    vector<int> data;
public:
    void push(int x) { data.push_back(x); }
    void pop() { data.pop_back(); }            // check empty() before calling
    int top() const { return data.back(); }
    bool empty() const { return data.empty(); }
    int size() const { return (int)data.size(); }
};
```

In practice use `std::stack<int>`. Stacks show up in the function call stack, undo/redo, the browser back button, expression evaluation and iterative DFS.

### Balanced parentheses

Every closing bracket must match the **most recent** unmatched opening bracket, which is exactly what the top of a stack holds.

```cpp
bool isValid(const string& s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') {
            st.push(c);
        } else {
            if (st.empty()) return false;          // a closer with nothing to close
            char open = st.top();
            st.pop();
            if ((c == ')' && open != '(') || (c == ']' && open != '[') || (c == '}' && open != '{')) return false;
        }
    }
    return st.empty();                             // every opener must be closed
}
```

## Queue: first in, first out

A queue is a line at a ticket counter: join at the **back**, leave from the **front** (FIFO).

![A queue before and after push(40) and pop(), with front and back marked](/images/dsa/queue-push-pop.svg "New items join at the back; the oldest item leaves from the front.")

`std::queue<int>` gives `push`, `pop`, `front` and `back`, all O(1). Queues drive [BFS](/notes/dsa-graphs), task scheduling and anything processed "in arrival order".

### Circular queue

A queue in a fixed-size array would waste space as the front moves right. A **circular queue** wraps the indices around with `% capacity`, so freed slots at the start get reused.

![Circular queue of capacity 8 holding items in slots 6, 7, 0 and 1](/images/dsa/circular-queue.svg "The items run from slot 6 through 7 into 0 and 1: the indices wrap around.")

```cpp
class CircularQueue {
    vector<int> buf;
    int cap, front = 0, count = 0;
public:
    explicit CircularQueue(int capacity) : buf(capacity), cap(capacity) {}
    bool push(int x) {
        if (count == cap) return false;            // full
        buf[(front + count) % cap] = x;            // the slot after the rear, wrapping
        count++;
        return true;
    }
    bool pop() {
        if (count == 0) return false;              // empty
        front = (front + 1) % cap;
        count--;
        return true;
    }
    int peek() const { return buf[front]; }
    bool empty() const { return count == 0; }
};
```

Keeping a `count` avoids the classic confusion between "full" and "empty", which both look like `front == rear` otherwise.

## Deque: both ends

`std::deque` supports push and pop at **both** ends in O(1). Its star use is the **sliding window maximum**: keep indices in the deque with their values in decreasing order, so the front is always the maximum of the window.

```cpp
vector<int> maxSlidingWindow(const vector<int>& a, int k) {
    deque<int> dq;                                  // indices; values decrease front to back
    vector<int> result;
    for (int i = 0; i < (int)a.size(); i++) {
        if (!dq.empty() && dq.front() <= i - k) dq.pop_front();      // fell out of the window
        while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();   // can never be the max now
        dq.push_back(i);
        if (i >= k - 1) result.push_back(a[dq.front()]);
    }
    return result;
}
```

Each index is pushed and popped at most once: **O(n)** in total.

## Monotonic stack: next greater element

**Question type:** for every item, find the first item to its right (or left) that is bigger (or smaller).

The brute force checks every later item: O(n²). Instead, keep a stack of indices that are **still waiting** for their answer. Their values are always in decreasing order from bottom to top. When a new item arrives, it is the answer for every waiting item smaller than it; pop them all.

![Bars 2 7 3 5 4 6 8 with arrows from each bar to its next greater bar](/images/dsa/monotonic-stack.svg "Each bar points to the first taller bar on its right; 8 has none, so its answer is −1.")

```cpp
vector<int> nextGreater(const vector<int>& a) {
    int n = a.size();
    vector<int> answer(n, -1);
    stack<int> waiting;                      // indices still looking for a bigger item
    for (int i = 0; i < n; i++) {
        while (!waiting.empty() && a[waiting.top()] < a[i]) {
            answer[waiting.top()] = a[i];    // a[i] is the first bigger item to its right
            waiting.pop();
        }
        waiting.push(i);
    }
    return answer;
}
```

Every index is pushed once and popped at most once, so this is **O(n)**. The same stack solves daily temperatures (store the distance instead of the value), stock span and the largest rectangle in a histogram.

## Two design questions interviewers love

### Queue using two stacks

Push onto `in`. To pop, take from `out`; only when `out` is empty, pour everything from `in` into `out`, which reverses the order. Each item moves at most once, so every operation is **amortized O(1)**.

```cpp
class MyQueue {
    stack<int> in, out;
    void shift() {
        if (out.empty())
            while (!in.empty()) { out.push(in.top()); in.pop(); }
    }
public:
    void push(int x) { in.push(x); }
    int pop() { shift(); int x = out.top(); out.pop(); return x; }
    int peek() { shift(); return out.top(); }
    bool empty() const { return in.empty() && out.empty(); }
};
```

### Min stack: getMin() in O(1)

Store, next to each value, the minimum of the stack at the moment it was pushed.

```cpp
class MinStack {
    stack<pair<int, int>> st;                  // (value, minimum so far)
public:
    void push(int x) { st.push({x, st.empty() ? x : min(x, st.top().second)}); }
    void pop() { st.pop(); }
    int top() const { return st.top().first; }
    int getMin() const { return st.top().second; }
};
```

## Summary

| Structure | Order | Main operations | C++ |
| --- | --- | --- | --- |
| Stack | LIFO | push, pop, top: O(1) | `stack<T>` |
| Queue | FIFO | push, pop, front: O(1) | `queue<T>` |
| Deque | both ends | push/pop front and back: O(1) | `deque<T>` |
| Priority queue | by priority | push, pop: O(log n) | `priority_queue<T>` ([heaps](/notes/dsa-heaps)) |

## Common mistakes

- Calling `top()`, `front()` or `pop()` on an **empty** container: undefined behaviour in C++. Check `empty()` first.
- Storing **values** in a monotonic stack when you need **distances or indices** later. Storing indices gives you both.
- Forgetting `while` (not `if`) when popping the monotonic stack: one new item can answer many waiting ones.

## Practice

- [Valid Parentheses](https://leetcode.com/problems/valid-parentheses/), [Min Stack](https://leetcode.com/problems/min-stack/)
- [Implement Queue using Stacks](https://leetcode.com/problems/implement-queue-using-stacks/), [Evaluate Reverse Polish Notation](https://leetcode.com/problems/evaluate-reverse-polish-notation/)
- [Next Greater Element I](https://leetcode.com/problems/next-greater-element-i/), [Daily Temperatures](https://leetcode.com/problems/daily-temperatures/)
- [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/), [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/) (hard)

Next: [hashing and hash tables](/notes/dsa-hashing).
