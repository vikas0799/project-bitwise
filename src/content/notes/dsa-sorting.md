---
title: Sorting Algorithms Explained
description: Bubble, selection, insertion, merge, quick and counting sort with diagrams, C++ code, a complexity and stability table, and how to use std::sort with custom comparators.
author: Bitwise School
---

Sorting is rarely the whole question, but it is part of the answer surprisingly often: sort first, and a hard problem can become two pointers, binary search or a greedy scan. In interviews you are expected to know how the main algorithms work, their complexity, and how to sort anything in C++ with a comparator.

Two words to know first:

- **Stable**: equal items keep their original order. This matters when you sort records by one field after another.
- **In-place**: needs only O(1) extra memory (apart from the recursion stack).

## The O(n²) sorts

These are slow for big inputs but short to write, and interviewers like to ask about them.

### Bubble sort

Swap neighbours that are in the wrong order. After each pass the largest remaining item has "bubbled" to the end.

```cpp
void bubbleSort(vector<int>& a) {
    int n = a.size();
    for (int pass = 0; pass < n - 1; pass++) {
        bool swapped = false;
        for (int j = 0; j + 1 < n - pass; j++)
            if (a[j] > a[j + 1]) { swap(a[j], a[j + 1]); swapped = true; }
        if (!swapped) break;           // no swaps: already sorted, so O(n) best case
    }
}
```

### Selection sort

Find the smallest remaining item and put it in the next position. It always does O(n²) comparisons but only O(n) swaps.

```cpp
void selectionSort(vector<int>& a) {
    int n = a.size();
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++)
            if (a[j] < a[minIdx]) minIdx = j;
        swap(a[i], a[minIdx]);
    }
}
```

### Insertion sort

Keep the left part sorted. Take the next item and slide it left into its place, like sorting playing cards in your hand.

![Six rows of insertion sort on 5 2 4 6 1 3 with the sorted part growing](/images/dsa/insertion-sort-steps.svg "Green is the sorted part; amber is the item just inserted.")

```cpp
void insertionSort(vector<int>& a) {
    for (int i = 1; i < (int)a.size(); i++) {
        int key = a[i], j = i - 1;
        while (j >= 0 && a[j] > key) {   // shift bigger items one step right
            a[j + 1] = a[j];
            j--;
        }
        a[j + 1] = key;
    }
}
```

Insertion sort is **O(n) on nearly sorted data**, which is why real libraries use it for small pieces.

## Merge sort: divide and conquer

Split the array in half, sort each half recursively, then **merge** the two sorted halves by repeatedly taking the smaller front item.

![Merge sort splitting 38 27 43 3 9 82 10 5 down to single items and merging back up](/images/dsa/merge-sort-tree.svg "log n levels of splitting; merging each level touches all n items.")

```cpp
// Merge the sorted ranges a[lo..mid] and a[mid+1..hi].
void merge(vector<int>& a, int lo, int mid, int hi) {
    vector<int> tmp;
    tmp.reserve(hi - lo + 1);
    int i = lo, j = mid + 1;
    while (i <= mid && j <= hi) tmp.push_back(a[i] <= a[j] ? a[i++] : a[j++]);   // <= keeps it stable
    while (i <= mid) tmp.push_back(a[i++]);
    while (j <= hi) tmp.push_back(a[j++]);
    copy(tmp.begin(), tmp.end(), a.begin() + lo);
}

void mergeSort(vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;              // 0 or 1 item is already sorted
    int mid = lo + (hi - lo) / 2;
    mergeSort(a, lo, mid);
    mergeSort(a, mid + 1, hi);
    merge(a, lo, mid, hi);
}
```

Time is **O(n log n)** in every case (recurrence `T(n) = 2T(n/2) + O(n)`), it is stable, and it needs **O(n)** extra memory. The merge step is also the key to problems like counting inversions and merging k sorted lists.

## Quick sort: partition around a pivot

Pick a **pivot**, move smaller items to its left and the rest to its right. The pivot is now in its final position; sort the two sides recursively.

![Array 7 2 1 6 8 5 3 4 before and after partitioning around the pivot 4](/images/dsa/quick-sort-partition.svg "After one partition, 4 is in its final place with smaller items on its left.")

```cpp
int partition(vector<int>& a, int lo, int hi) {
    int pivot = a[hi];                  // last item as the pivot
    int i = lo - 1;                     // end of the "smaller than pivot" part
    for (int j = lo; j < hi; j++)
        if (a[j] < pivot) swap(a[++i], a[j]);
    swap(a[i + 1], a[hi]);              // put the pivot between the two parts
    return i + 1;
}

void quickSort(vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;
    int p = partition(a, lo, hi);
    quickSort(a, lo, p - 1);
    quickSort(a, p + 1, hi);
}
```

Average time **O(n log n)** and in-place, which makes it fast in practice. But if the pivot is always the smallest or largest item (for example, an already sorted array with the last item as pivot), every partition peels off just one item and the time becomes **O(n²)**. Picking a **random pivot** avoids that in practice.

The partition step on its own gives **quickselect**: the k-th smallest item in O(n) on average, without sorting everything.

## Counting sort: when values are small

If values are integers in a small range `[0, k]`, count how many times each value appears and write them back in order. No comparisons at all.

```cpp
// Sorts values in the range [0, maxValue].
void countingSort(vector<int>& a, int maxValue) {
    vector<int> count(maxValue + 1, 0);
    for (int x : a) count[x]++;
    int k = 0;
    for (int v = 0; v <= maxValue; v++)
        while (count[v]-- > 0) a[k++] = v;
}
```

Time **O(n + k)**. Great for marks out of 100 or ages; useless if values go up to 10⁹.

## Comparison table

| Algorithm | Best | Average | Worst | Extra space | Stable |
| --- | --- | --- | --- | --- | --- |
| Bubble | O(n) | O(n²) | O(n²) | O(1) | yes |
| Selection | O(n²) | O(n²) | O(n²) | O(1) | no |
| Insertion | O(n) | O(n²) | O(n²) | O(1) | yes |
| Merge | O(n log n) | O(n log n) | O(n log n) | O(n) | yes |
| Quick | O(n log n) | O(n log n) | O(n²) | O(log n) stack | no |
| Heap | O(n log n) | O(n log n) | O(n log n) | O(1) | no |
| Counting | O(n + k) | O(n + k) | O(n + k) | O(k) | yes* |

\*when written in its stable form. Heap sort is covered in [heaps](/notes/dsa-heaps). No comparison-based sort can beat O(n log n) in the worst case.

## Sorting in C++

`std::sort` uses introsort (quick sort that switches to heap sort if it goes badly), so it is **O(n log n) guaranteed** but **not stable**. Use `std::stable_sort` when order among equal items matters.

```cpp
vector<int> v = {5, 1, 4};
sort(v.begin(), v.end());                    // 1 4 5
sort(v.begin(), v.end(), greater<int>());    // 5 4 1

// Higher marks first; equal marks in alphabetical order of name.
vector<pair<string, int>> students = {{"Asha", 82}, {"Ravi", 91}, {"Meena", 82}};
sort(students.begin(), students.end(), [](const auto& a, const auto& b) {
    if (a.second != b.second) return a.second > b.second;
    return a.first < b.first;
});
// Ravi 91, Asha 82, Meena 82
```

A comparator must return `true` only when `a` should come **strictly before** `b`. Writing `<=` or `>=` breaks this rule and can crash `sort` or give wrong results.

## Common mistakes

- Calling quick sort "O(n log n)" without mentioning its O(n²) worst case.
- Using `<=` in a comparator.
- Sorting a copy by mistake: `void f(vector<int> v) { sort(...); }` sorts the local copy.
- Forgetting that sorting changes the original indices. If you need them, sort pairs of `(value, index)`.

## Practice

- [Sort Colors](https://leetcode.com/problems/sort-colors/) (three-way partition)
- [Merge Intervals](https://leetcode.com/problems/merge-intervals/) (sort first, then scan)
- [Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/) (quickselect or a heap)
- [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/)

Next: [the C++ STL for DSA](/notes/dsa-cpp-stl).
