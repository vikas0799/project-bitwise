---
title: Recursion and the Call Stack
description: How recursion works, the base case and the leap of faith, what happens on the call stack, recursion trees, fast power, common patterns and mistakes, with C++ code.
author: Bitwise School
---

**Recursion** is when a function solves a problem by calling itself on a smaller version of the same problem. Trees, graphs, backtracking, divide and conquer and dynamic programming all build on it, so it is worth getting completely comfortable here first.

## The two parts of every recursive function

1. **Base case**: the smallest input, answered directly without another call.
2. **Recursive case**: shrink the problem, call the function on the smaller input, and combine the result.

```cpp
long long fact(int n) {
    if (n <= 1) return 1;          // base case
    return n * fact(n - 1);        // recursive case: n! = n × (n − 1)!
}
```

### The leap of faith

When you write `fact(n - 1)`, don't trace it in your head. **Assume it already returns the right answer** for `n − 1` and only ask: *how do I use it to answer for `n`?* If the base case is right and every call moves closer to it, the function is correct. This is induction, the same idea you used in maths.

A three-step recipe:

1. Say in one sentence what the function returns. "`fact(n)` returns n!".
2. Write the base case.
3. Write the answer for `n` using the answer for a smaller input.

## What happens on the call stack

Every call gets its own **stack frame** holding its parameters and local variables. A call waits until the call it made returns.

![Stack of frames main, fact(3), fact(2), fact(1) with values returning downward](/images/dsa/recursion-call-stack.svg "fact(3) waits for fact(2), which waits for fact(1). Then the answers flow back: 1, 2, 6.")

- Frames are **pushed** as calls go deeper and **popped** as they return.
- The maximum number of frames alive at once is the **recursion depth**. It sets the space complexity: `fact(n)` uses **O(n)** stack space.
- With no base case (or one you never reach) the frames keep piling up until the program crashes with a **stack overflow**.

## Recursion trees

When a function makes more than one call, draw the calls as a tree. The total work is the sum over all nodes.

```cpp
int fib(int n) {
    if (n <= 1) return n;              // fib(0) = 0, fib(1) = 1
    return fib(n - 1) + fib(n - 2);
}
```

![Recursion tree of fib(4) with fib(1) and fib(0) as base cases](/images/dsa/recursion-fib-tree.svg "fib(4) makes 9 calls. The tree roughly doubles at each level, so the time is about O(2ⁿ).")

The tree also shows the waste: `fib(2)` is computed twice. Storing answers you've already computed (**memoisation**) turns this into O(n). That is the idea behind [dynamic programming](/notes/dsa-dynamic-programming).

## Patterns you will use again and again

### Process one element, recurse on the rest

```cpp
int sumFrom(const vector<int>& a, int i) {
    if (i == (int)a.size()) return 0;          // empty suffix
    return a[i] + sumFrom(a, i + 1);
}
```

### Shrink from both ends

```cpp
bool isPalindrome(const string& s, int l, int r) {
    if (l >= r) return true;                   // 0 or 1 characters left
    if (s[l] != s[r]) return false;
    return isPalindrome(s, l + 1, r - 1);
}
```

### Divide in half: fast power in O(log n)

Computing `xⁿ` by multiplying `n` times is O(n). Halving the exponent does it in **O(log n)**:

```cpp
long long power(long long x, int n) {          // n >= 0
    if (n == 0) return 1;
    long long half = power(x, n / 2);
    return (n % 2 == 0) ? half * half : half * half * x;
}
```

The key is calling `power(x, n / 2)` **once** and reusing `half`. Writing `power(x, n/2) * power(x, n/2)` makes two calls per level and brings you back to O(n).

### Make choices: include or exclude

Many problems ask for "all subsets", "all permutations" or "all ways". At each step you choose (take this item or skip it) and recurse. That is [backtracking](/notes/dsa-backtracking).

## Complexity of a recursive function

- **Time** = number of calls × work done in each call (not counting the recursive calls).
  - `fact(n)`: n calls × O(1) = **O(n)**
  - `fib(n)`: about 2ⁿ calls × O(1) = **O(2ⁿ)**
  - `power(x, n)`: log n calls × O(1) = **O(log n)**
- **Space** = maximum depth × memory per frame. `fact` and `fib` are both **O(n)** deep.

## Recursion or a loop?

Anything recursive can be written with a loop and your own stack, and simple recursion like `fact` is often cleaner as a loop. Prefer recursion when the problem is naturally recursive: trees, graphs, divide and conquer, and backtracking. There the recursive code is shorter and much easier to get right.

## Common mistakes

- **No base case, or a base case you never reach** (for example `n` goes negative): stack overflow.
- **Not shrinking the input**: calling `f(n)` from `f(n)` loops forever.
- **Passing big objects by value**: `void f(vector<int> v)` copies the vector on every call. Pass by reference.
- **Recomputing the same subproblem**: if the recursion tree repeats nodes, memoise.
- **Forgetting to return**: in C++, `f(n - 1);` without `return` compiles but throws the answer away.

## Practice

- [Subsets](https://leetcode.com/problems/subsets/)
- [Permutations](https://leetcode.com/problems/permutations/)
- [Generate Parentheses](https://leetcode.com/problems/generate-parentheses/)
- [Climbing Stairs](https://leetcode.com/problems/climbing-stairs/) (then memoise it)

Next: [arrays, two pointers and sliding window](/notes/dsa-arrays-patterns).
