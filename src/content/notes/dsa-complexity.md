---
title: Time and Space Complexity (Big-O)
description: How to measure an algorithm with Big-O, the common complexity classes, rules for finding the complexity of loops and recursion, the master theorem and how input size tells you which approach will pass.
author: Bitwise School
---

Two programs can give the same answer and still be very different: one finishes in a millisecond, the other takes an hour. **Complexity analysis** tells you how the running time (and memory) of an algorithm grows as the input grows, without running it. Interviewers ask for it after almost every coding question, so learn to state it quickly and correctly.

> All code in the DSA notes is C++17. Snippets assume `#include <bits/stdc++.h>` and `using namespace std;`, as in competitive programming.

## Big-O in one minute

We count the number of basic steps as a function of the input size `n`, then keep only the part that matters for large `n`.

- **Drop constants**: `3n + 5` steps is **O(n)**. A faster computer changes the constant, not the growth.
- **Keep the biggest term**: `n² + 100n` is **O(n²)**. For large `n` the square dominates.
- **Big-O is an upper bound**. Big-Ω (omega) is a lower bound and Big-Θ (theta) is a tight bound. In interviews "complexity" usually means the worst case in Big-O.

![Line chart comparing O(1), O(log n), O(n), O(n log n), O(n²) and O(2ⁿ)](/images/dsa/complexity-growth.svg "O(n²) and O(2ⁿ) shoot up long before n reaches 16, while O(log n) stays almost flat.")

## The complexities you will meet

| Complexity | Name | Typical example |
| --- | --- | --- |
| O(1) | constant | array access `a[i]`, push/pop on a stack |
| O(log n) | logarithmic | binary search, one heap operation |
| O(n) | linear | one pass over an array |
| O(n log n) | linearithmic | merge sort, `sort()`, n heap operations |
| O(n²) | quadratic | two nested loops over the array |
| O(n³) | cubic | three nested loops, Floyd-Warshall |
| O(2ⁿ) | exponential | all subsets, naive Fibonacci |
| O(n!) | factorial | all permutations |

## Finding the complexity of code

### Loops add up or multiply

Statements one after another **add**; loops inside loops **multiply**.

```cpp
int total = 0;
for (int i = 0; i < n; i++) total += a[i];   // O(n)
for (int i = 0; i < n; i++)                  // O(n) × ...
    for (int j = 0; j < n; j++)              // ... O(n)
        total += a[i] * a[j];                // = O(n²)
// O(n) + O(n²) = O(n²)
```

A loop that starts `j` at `i + 1` still does about `n² / 2` steps, which is O(n²):

![Grid of all pairs i, j with the pairs j greater than i marked](/images/dsa/complexity-nested-loops.svg "Checking every pair once is n(n − 1)/2 steps: half the grid, still O(n²).")

### Halving gives log n

If each step cuts the remaining work in half, you need about `log₂ n` steps.

```cpp
int steps = 0;
for (int x = n; x > 1; x /= 2) steps++;   // O(log n)
```

### Square root loops

```cpp
bool isPrime(int n) {
    if (n < 2) return false;
    for (long long d = 2; d * d <= n; d++)   // runs about √n times
        if (n % d == 0) return false;
    return true;                             // O(√n)
}
```

### Watch the hidden costs

Some one-line calls are loops in disguise:

- `v.erase(v.begin())` and `v.insert(v.begin(), x)` shift every element: **O(n)**.
- `s = s + c` inside a loop copies the whole string each time: **O(n²)** overall. Use `s += c` or `s.push_back(c)`.
- Passing a `vector` **by value** copies it: O(n) per call. Pass `const vector<int>&` instead.
- `map` and `set` operations are **O(log n)**; `unordered_map` is **O(1) on average**.

## Complexity of recursion

Write a **recurrence**: the cost of a call in terms of smaller calls.

- Binary search: `T(n) = T(n/2) + O(1)` → **O(log n)**
- Merge sort: `T(n) = 2T(n/2) + O(n)` → **O(n log n)**
- Naive Fibonacci: `T(n) = T(n−1) + T(n−2) + O(1)` → about **O(2ⁿ)** (see [Recursion](/notes/dsa-recursion))

### Master theorem (divide and conquer)

For `T(n) = a·T(n/b) + O(n^d)` with `a ≥ 1`, `b > 1`:

| Case | Result | Example |
| --- | --- | --- |
| d > log_b(a) | O(n^d) | T(n) = 2T(n/2) + n² → O(n²) |
| d = log_b(a) | O(n^d · log n) | merge sort: a = 2, b = 2, d = 1 → O(n log n) |
| d < log_b(a) | O(n^(log_b a)) | T(n) = 4T(n/2) + n → O(n²) |

## Space complexity

Space complexity counts the **extra** memory the algorithm needs, not the input itself.

- A few variables: **O(1)**.
- An extra array of size `n` (prefix sums, visited array): **O(n)**.
- A 2D DP table `n × m`: **O(n·m)**.
- **Recursion uses stack space**: a recursion that goes `n` levels deep uses **O(n)** memory even if it creates no arrays. Very deep recursion (around 10⁵ to 10⁶ levels) can overflow the stack.

## Read the constraints first

A typical judge runs about **10⁸ simple operations per second**. The input limits tell you which complexity will pass, before you write any code:

| n up to | Complexity that fits in about 1 second | Typical idea |
| --- | --- | --- |
| 10–11 | O(n!) | all permutations |
| 20–25 | O(2ⁿ) | all subsets, bitmask |
| 500 | O(n³) | triple loop, Floyd-Warshall |
| 5,000 | O(n²) | double loop, 2D DP |
| 10⁵ to 10⁶ | O(n log n) | sorting, binary search, heaps |
| 10⁷ to 10⁸ | O(n) | one pass, two pointers |
| above 10⁹ | O(log n) or O(1) | maths, binary search on the answer |

## Amortized complexity

Sometimes an operation is usually cheap and occasionally expensive. `vector::push_back` is O(1) most of the time, but when the vector is full it copies everything into a block twice as big. Spread over all pushes the cost is still **O(1) per push**: we call that **amortized O(1)**. The [C++ STL note](/notes/dsa-cpp-stl) shows how the doubling works.

## Common mistakes

- Saying O(n) for two nested loops because "the inner loop is small": check what the inner loop really depends on.
- Forgetting the cost of sorting: sorting first makes the whole solution at least **O(n log n)**.
- Ignoring recursion depth when asked for space complexity.
- Mixing up best case and worst case: quick sort is O(n log n) on average but O(n²) in the worst case.

## Quick check

1. A loop `for (i = 1; i < n; i *= 3)` runs how many times? **O(log n)** (base 3, same class).
2. Sorting and then one pass over the array? **O(n log n) + O(n) = O(n log n)**.
3. Recursion `T(n) = 2T(n/2) + O(1)`? Master theorem, `d = 0 < log₂2 = 1`: **O(n)**.
4. Space of recursive DFS on a tree of height `h`? **O(h)** for the call stack.

Next: [Recursion and the call stack](/notes/dsa-recursion), then practise on the [DSA sheet](/dsa-sheet).
