---
title: "C++ STL for DSA: Containers, Algorithms and Lambdas"
description: The C++ STL you need for coding interviews: vector, deque, stack, queue, priority_queue, set, map and unordered_map, the key algorithms, lambdas and comparators, operation costs and common pitfalls.
author: Bitwise School
---

The Standard Template Library (STL) gives C++ ready-made data structures and algorithms. In interviews and contests you rarely write a heap or a balanced tree yourself: you pick the right STL container and know what each operation costs. This note is that toolkit.

```cpp
#include <bits/stdc++.h>   // every standard header at once (GCC); fine for practice
using namespace std;
```

In production code include only the headers you need, such as `<vector>` and `<algorithm>`.

## The containers at a glance

![Pictures of vector, deque, stack, queue, priority_queue, set/map and unordered_map with their key costs](/images/dsa/stl-containers.svg "Pick a container by the operation you need to be fast.")

## vector

A dynamic array: O(1) index access and fast `push_back`.

```cpp
vector<int> v = {3, 1, 4};
v.push_back(1);                                  // {3, 1, 4, 1}
v.pop_back();                                    // {3, 1, 4}
int last = v.back();                             // 4
vector<vector<int>> grid(3, vector<int>(4, 0));  // 3 rows × 4 columns of zeros
v.reserve(1000);                                 // allocate space up front
```

When a vector is full, `push_back` moves everything into a block twice as big. That copy is O(n), but it happens so rarely that the **average** cost per push is still O(1): **amortized O(1)**.

![A vector growing from capacity 1 to 2, 4 and 8 as items are pushed](/images/dsa/stl-vector-growth.svg "Capacity doubles only when the vector is full.")

## pair, tuple and structured bindings

```cpp
pair<int, string> p = {2, "two"};
auto [num, word] = p;                      // C++17: unpack into two variables
vector<pair<int, int>> edges = {{1, 2}, {0, 5}};
sort(edges.begin(), edges.end());          // sorts by first, then by second
```

## deque, stack and queue

- `deque`: push and pop at **both** ends in O(1). The sliding-window-maximum trick keeps a deque of indices.
- `stack`: `push`, `pop`, `top`. Last in, first out.
- `queue`: `push` at the back, `pop` and `front` at the front. First in, first out. Used in BFS.

See [stacks and queues](/notes/dsa-stack-queue) for the patterns built on them.

## priority_queue (heap)

Always gives you the **largest** item (by default) in O(1), with O(log n) push and pop.

```cpp
priority_queue<int> maxHeap;                               // largest on top
priority_queue<int, vector<int>, greater<int>> minHeap;    // smallest on top
maxHeap.push(5);
maxHeap.push(9);
maxHeap.push(2);
int top = maxHeap.top();   // 9
maxHeap.pop();             // removes 9

// Min-heap of (distance, node) pairs, as used in Dijkstra.
priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;

// Custom order with a lambda: earliest deadline on top.
auto later = [](const pair<int, string>& a, const pair<int, string>& b) { return a.first > b.first; };
priority_queue<pair<int, string>, vector<pair<int, string>>, decltype(later)> tasks(later);
```

The comparator is "reversed": it says when `a` should be **below** `b`. That's why `greater` gives a min-heap. More in [heaps](/notes/dsa-heaps).

## set, multiset and map (ordered)

Balanced binary search trees inside, so keys stay **sorted** and every operation is **O(log n)**.

```cpp
set<int> s = {5, 1, 9};
s.insert(3);                          // {1, 3, 5, 9}
bool hasFive = s.count(5);            // true
auto it = s.lower_bound(4);           // points to 5: first key >= 4
s.erase(9);

multiset<int> ms = {2, 2, 3};
ms.erase(ms.find(2));                 // removes ONE 2 (ms.erase(2) removes both)

map<string, int> freq;
for (const string& w : {"a", "b", "a"}) freq[w]++;      // a:2, b:1, kept sorted by key
for (const auto& [word, count] : freq) cout << word << ' ' << count << '\n';
```

## unordered_set and unordered_map (hash tables)

**O(1) on average** for insert, find and erase, but no order. Your default for counting and lookups. See [hashing](/notes/dsa-hashing).

```cpp
vector<int> nums = {2, 7, 11, 15};
int target = 9;
unordered_map<int, int> seen;            // value -> index
for (int i = 0; i < (int)nums.size(); i++) {
    auto it = seen.find(target - nums[i]);
    if (it != seen.end()) {
        cout << it->second << ' ' << i << '\n';   // 0 1
        break;
    }
    seen[nums[i]] = i;
}
```

## Algorithms you will use every day

```cpp
vector<int> a = {4, 2, 7, 2, 9};
sort(a.begin(), a.end());                              // 2 2 4 7 9
reverse(a.begin(), a.end());                           // 9 7 4 2 2
int biggest = *max_element(a.begin(), a.end());        // 9
long long total = accumulate(a.begin(), a.end(), 0LL); // 24 (use 0LL to sum in long long)
int twos = count(a.begin(), a.end(), 2);               // 2
sort(a.begin(), a.end());
a.erase(unique(a.begin(), a.end()), a.end());          // drop duplicates: 2 4 7 9
vector<int> ids(5);
iota(ids.begin(), ids.end(), 0);                       // 0 1 2 3 4
int g = gcd(12, 18);                                   // 6
```

`next_permutation` walks through every ordering in sorted order:

```cpp
string s = "abc";
do {
    cout << s << '\n';                  // abc acb bac bca cab cba
} while (next_permutation(s.begin(), s.end()));
```

The binary search helpers `lower_bound`, `upper_bound` and `binary_search` are covered in [binary search](/notes/dsa-binary-search).

## Lambdas

A lambda is a small unnamed function you write inline, perfect for comparators and one-off checks.

```cpp
vector<int> a = {3, 8, 12, 5};
auto square = [](int x) { return x * x; };
int limit = 10;
auto small = [limit](int x) { return x < limit; };   // captures limit by value
int evens = 0;
for_each(a.begin(), a.end(), [&](int x) { if (x % 2 == 0) evens++; });   // [&] captures by reference
int smallCount = count_if(a.begin(), a.end(), small);                    // 3
int nine = square(3);                                                    // 9
```

- `[]` captures nothing, `[x]` copies `x`, `[&x]` refers to `x`, `[&]` refers to everything used, `[=]` copies everything used.
- A lambda can't call itself by name. Use `std::function`, or pass the lambda to itself:

```cpp
function<int(int)> fib = [&](int n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); };

auto fact = [](auto&& self, int n) -> long long { return n <= 1 ? 1 : n * self(self, n - 1); };
long long f5 = fact(fact, 5);   // 120
```

## What each operation costs

| Container | Access | Insert | Erase | Search |
| --- | --- | --- | --- | --- |
| vector | O(1) by index | O(1)* at end, O(n) elsewhere | O(1) at end, O(n) elsewhere | O(n) |
| deque | O(1) by index | O(1) at both ends | O(1) at both ends | O(n) |
| stack / queue | O(1) top or front | O(1) | O(1) | not supported |
| priority_queue | O(1) top | O(log n) | O(log n) pop | not supported |
| set / map | in sorted order | O(log n) | O(log n) | O(log n) |
| unordered_set / map | no order | O(1) avg | O(1) avg | O(1) avg, O(n) worst |

\*amortized

## Pitfalls that cost marks

- **`m[key]` inserts** a default value when the key is missing. To only check, use `m.count(key)` or `m.find(key)`.
- **`size()` is unsigned.** For an empty vector, `v.size() - 1` wraps around to a huge number. Write `(int)v.size() - 1`.
- **Erasing while looping**: use `it = s.erase(it);` instead of `s.erase(it); ++it;`.
- **`endl` flushes** the output every time and is slow. Print `'\n'` and turn on fast input:

```cpp
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<int> a(n);
    for (int& x : a) cin >> x;
    cout << accumulate(a.begin(), a.end(), 0LL) << '\n';
}
```

- **`unordered_map` can be attacked**: on some contest sites, special tests make every key land in the same bucket and turn O(1) into O(n). If a solution times out mysteriously, try `map` or a custom hash.

## Practice

- [Two Sum](https://leetcode.com/problems/two-sum/) (unordered_map), [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/) (set)
- [Group Anagrams](https://leetcode.com/problems/group-anagrams/) (map of sorted key to list)
- [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/), [Kth Largest Element in a Stream](https://leetcode.com/problems/kth-largest-element-in-a-stream/) (priority_queue)
- [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/) (deque)

Next: [linked lists](/notes/dsa-linked-list).
