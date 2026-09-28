---
title: Heaps and Priority Queues
description: Binary heaps stored in arrays, sift up and sift down with diagrams, a max-heap class, building a heap in O(n), heap sort, priority_queue in C++ and the heap patterns for top k, running median and merging k sorted lists.
author: Bitwise School
---

A **heap** answers one question very fast: *what is the largest (or smallest) item right now?* It gives you that item in **O(1)** and lets you add or remove items in **O(log n)**. Whenever a problem says "k largest", "k closest", "next task with the highest priority" or "merge k sorted lists", think heap.

## What a heap is

A binary heap is a binary tree with two rules:

1. **Shape**: it's a **complete** tree. Every level is full except possibly the last, which fills from the left.
2. **Order**: in a **max-heap** every parent is ≥ its children, so the maximum sits at the root. A **min-heap** is the mirror image.

A heap is **not sorted**: siblings can be in any order. It only guarantees the root.

## Stored in an array

Because the tree is complete, it fits in an array with no gaps and **no pointers**. Number the nodes level by level:

![Max-heap 50 30 40 10 20 35 25 drawn as a tree with indices and as an array](/images/dsa/heap-tree-array.svg "Node i has children 2i + 1 and 2i + 2, and its parent is (i − 1) / 2.")

- children of `i`: `2i + 1` and `2i + 2`
- parent of `i`: `(i − 1) / 2`

## Insert: add at the end, sift up

Put the new item in the next free spot (the end of the array) to keep the shape. Then, while it is bigger than its parent, swap it upward.

![Inserting 45 into a max-heap: add it under 10, then swap past 10 and 30](/images/dsa/heap-insert.svg "45 swaps with 10, then with 30, and stops below 50.")

## Remove the max: move the last item to the root, sift down

Take the root (the answer). Move the last item into the root to keep the shape, then, while it is smaller than its larger child, swap it downward. Both operations walk one root-to-leaf path, so they are **O(log n)**.

```cpp
class MaxHeap {
    vector<int> h;
    void siftUp(int i) {
        while (i > 0) {
            int parent = (i - 1) / 2;
            if (h[parent] >= h[i]) break;          // order is fine: stop
            swap(h[parent], h[i]);
            i = parent;
        }
    }
    void siftDown(int i) {
        int n = h.size();
        while (true) {
            int largest = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < n && h[l] > h[largest]) largest = l;
            if (r < n && h[r] > h[largest]) largest = r;
            if (largest == i) break;               // bigger than both children: stop
            swap(h[i], h[largest]);
            i = largest;
        }
    }
public:
    void push(int x) { h.push_back(x); siftUp((int)h.size() - 1); }
    int top() const { return h[0]; }               // check empty() first
    void pop() {                                   // remove the maximum
        h[0] = h.back();
        h.pop_back();
        if (!h.empty()) siftDown(0);
    }
    bool empty() const { return h.empty(); }
    int size() const { return (int)h.size(); }
};
```

## Build a heap in O(n), and heap sort

Pushing `n` items one by one costs O(n log n). Faster: put everything in the array, then sift down every non-leaf node from the last one back to the root. Most nodes are near the bottom and hardly move, so the total is **O(n)**.

**Heap sort** builds a max-heap, then repeatedly swaps the root (the current maximum) to the end of the array and shrinks the heap by one:

```cpp
// Restore the max-heap below index i, looking only at a[0..n-1].
void siftDown(vector<int>& a, int n, int i) {
    while (true) {
        int largest = i, l = 2 * i + 1, r = 2 * i + 2;
        if (l < n && a[l] > a[largest]) largest = l;
        if (r < n && a[r] > a[largest]) largest = r;
        if (largest == i) return;
        swap(a[i], a[largest]);
        i = largest;
    }
}

void heapSort(vector<int>& a) {
    int n = a.size();
    for (int i = n / 2 - 1; i >= 0; i--) siftDown(a, n, i);   // build the heap: O(n)
    for (int end = n - 1; end > 0; end--) {
        swap(a[0], a[end]);            // the current max goes to its final place
        siftDown(a, end, 0);           // fix the heap in a[0..end-1]
    }
}
```

O(n log n) in every case and O(1) extra space, but not stable.

## priority_queue in C++

You'll almost never write the class above in an interview; use `std::priority_queue`:

| Operation | Cost |
| --- | --- |
| `pq.push(x)` | O(log n) |
| `pq.top()` | O(1) |
| `pq.pop()` | O(log n) |
| `pq.size()`, `pq.empty()` | O(1) |

It is a **max-heap** by default. For a min-heap write `priority_queue<int, vector<int>, greater<int>>`. The [C++ STL note](/notes/dsa-cpp-stl) shows custom comparators.

## Heap patterns

### Top k: keep a heap of size k

For the k-th largest item, keep a **min-heap of the k largest items seen so far**. Its top is the smallest of them, which is exactly the k-th largest.

```cpp
int kthLargest(const vector<int>& nums, int k) {
    priority_queue<int, vector<int>, greater<int>> minHeap;   // the k largest so far
    for (int x : nums) {
        minHeap.push(x);
        if ((int)minHeap.size() > k) minHeap.pop();           // drop the smallest
    }
    return minHeap.top();
}
```

O(n log k) time and O(k) space, much better than sorting when k is small. The same pattern gives the k closest points (a max-heap of size k on distance) and the k most frequent items.

### Running median: two heaps

Keep the smaller half in a **max-heap** and the larger half in a **min-heap**, with sizes equal or the lower half one bigger. The median is on top.

```cpp
class MedianFinder {
    priority_queue<int> low;                                  // max-heap: smaller half
    priority_queue<int, vector<int>, greater<int>> high;      // min-heap: larger half
public:
    void add(int x) {
        low.push(x);
        high.push(low.top());                // pass the largest of the low half up
        low.pop();
        if (high.size() > low.size()) {      // keep low equal or one bigger
            low.push(high.top());
            high.pop();
        }
    }
    double median() const {                  // call after at least one add
        if (low.size() > high.size()) return low.top();
        return (low.top() + (double)high.top()) / 2.0;
    }
};
```

### Merge k sorted lists

Put the first item of each list in a min-heap. Repeatedly take the smallest, output it, and push the next item from the same list.

```cpp
vector<int> mergeKSorted(const vector<vector<int>>& lists) {
    using Item = tuple<int, int, int>;                     // value, which list, index in it
    priority_queue<Item, vector<Item>, greater<Item>> pq;
    for (int i = 0; i < (int)lists.size(); i++)
        if (!lists[i].empty()) pq.push({lists[i][0], i, 0});
    vector<int> merged;
    while (!pq.empty()) {
        auto [value, i, j] = pq.top();
        pq.pop();
        merged.push_back(value);
        if (j + 1 < (int)lists[i].size()) pq.push({lists[i][j + 1], i, j + 1});
    }
    return merged;
}
```

With N items in total across k lists this is **O(N log k)**. The same heap drives [Dijkstra's algorithm](/notes/dsa-shortest-paths-mst).

## Common mistakes

- Expecting a heap to be sorted, or to find an arbitrary item quickly (that's O(n)).
- Pushing all n items into a max-heap and popping k times for "k largest". It works, but uses O(n) memory; the size-k min-heap is the expected answer.
- Integer overflow when averaging two ints for the median; convert to `double` first.
- Forgetting that `priority_queue`'s comparator is reversed (`greater` gives a **min**-heap).

## Practice

- [Last Stone Weight](https://leetcode.com/problems/last-stone-weight/), [Kth Largest Element in a Stream](https://leetcode.com/problems/kth-largest-element-in-a-stream/)
- [Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/), [K Closest Points to Origin](https://leetcode.com/problems/k-closest-points-to-origin/)
- [Task Scheduler](https://leetcode.com/problems/task-scheduler/), [Merge k Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/)
- [Find Median from Data Stream](https://leetcode.com/problems/find-median-from-data-stream/) (hard)

Next: [binary trees and traversals](/notes/dsa-binary-trees).
