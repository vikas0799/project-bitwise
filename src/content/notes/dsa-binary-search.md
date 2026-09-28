---
title: Binary Search and Binary Search on the Answer
description: Classic binary search, lower and upper bound, first and last occurrence, searching a rotated array, the C++ STL helpers and binary search on the answer for optimisation problems, with diagrams and C++ code.
author: Bitwise School
---

Binary search finds an item in a **sorted** array by checking the middle and throwing away the half that can't contain it. Each step halves the search space, so an array of a million items needs only about 20 steps: **O(log n)**. The same idea also solves many problems that don't look like searching at all.

## The classic version

![Four rows showing lo, mid and hi narrowing down to 42 in a sorted array of ten numbers](/images/dsa/binary-search-steps.svg "Searching for 42: after each comparison half of the remaining range (grey) is ruled out.")

```cpp
int binarySearch(const vector<int>& a, int target) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;          // avoids overflow of lo + hi
        if (a[mid] == target) return mid;
        if (a[mid] < target) lo = mid + 1;     // target can only be on the right
        else hi = mid - 1;                     // target can only be on the left
    }
    return -1;                                 // not found
}
```

Two details matter:

- `mid = lo + (hi - lo) / 2` instead of `(lo + hi) / 2`, because `lo + hi` can overflow an `int` for large arrays.
- The loop runs **while `lo <= hi`**: the range `[lo, hi]` is still non-empty. Moving to `mid + 1` or `mid − 1` guarantees the range shrinks every time, so the loop always ends.

## Lower bound and upper bound

Most real questions aren't "is x present?" but "where does x start?", "where would x go?" or "how many x are there?". Two functions answer all of them:

- **lower bound**: the first index with `a[i] >= x`
- **upper bound**: the first index with `a[i] > x`

```cpp
// First index i with a[i] >= x, or a.size() if there is none.
int lowerBound(const vector<int>& a, int x) {
    int lo = 0, hi = (int)a.size();            // the answer lies in [lo, hi]
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] >= x) hi = mid;             // mid might be the answer; keep it
        else lo = mid + 1;                     // mid is too small; skip it
    }
    return lo;
}
```

Change `a[mid] >= x` to `a[mid] > x` and you get the upper bound. With both:

| Question | Answer |
| --- | --- |
| first occurrence of x | `lowerBound(x)`, if that index holds x |
| last occurrence of x | `upperBound(x) − 1`, if that index holds x |
| how many times x appears | `upperBound(x) − lowerBound(x)` |
| where to insert x to keep the array sorted | `lowerBound(x)` |

### The same thing with the STL

```cpp
vector<int> a = {1, 3, 3, 3, 7, 9};
int first = lower_bound(a.begin(), a.end(), 3) - a.begin();   // 1
int after = upper_bound(a.begin(), a.end(), 3) - a.begin();   // 4
int count = after - first;                                    // 3
bool hasSeven = binary_search(a.begin(), a.end(), 7);         // true
```

`set` and `map` have their own `s.lower_bound(x)`; use that one, not the free function, which is O(n) on them.

## Searching a rotated sorted array

An array like `[4, 5, 6, 7, 0, 1, 2]` is sorted but rotated. At any `mid`, **at least one half is still sorted**. Check whether the target lies inside that sorted half; if not, it must be in the other half.

```cpp
int searchRotated(const vector<int>& a, int target) {     // distinct values
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == target) return mid;
        if (a[lo] <= a[mid]) {                             // left half is sorted
            if (a[lo] <= target && target < a[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {                                           // right half is sorted
            if (a[mid] < target && target <= a[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}
```

## Binary search on the answer

This is where binary search becomes a problem-solving tool. Many questions ask for the **smallest (or largest) value that works**:

- the minimum eating speed to finish all bananas in `h` hours
- the least ship capacity to deliver all packages in `d` days
- the largest minimum distance when placing cows in stalls

The trick: if you can **check** a candidate answer `x` quickly, and the check is **monotonic** (once `x` works, every bigger `x` works too), binary search over the possible answers.

![Candidate answers 1 to 10 with checks failing for 1 to 4 and passing from 5](/images/dsa/binary-search-answer.svg "The checks look like ✗ ✗ ✗ ✗ ✓ ✓ ✓ …. Binary search finds the first ✓.")

Example: Koko eats bananas at `speed` bananas an hour, one pile at a time. Find the minimum speed to finish within `h` hours.

```cpp
int minEatingSpeed(const vector<int>& piles, int h) {
    auto hoursNeeded = [&](long long speed) {
        long long hours = 0;
        for (int p : piles) hours += (p + speed - 1) / speed;   // ceil(p / speed)
        return hours;
    };
    long long lo = 1, hi = *max_element(piles.begin(), piles.end());
    while (lo < hi) {                          // smallest speed that works
        long long mid = lo + (hi - lo) / 2;
        if (hoursNeeded(mid) <= h) hi = mid;   // fast enough: try slower
        else lo = mid + 1;                     // too slow: go faster
    }
    return (int)lo;
}
```

The recipe for any "binary search on the answer" problem:

1. Find the range of possible answers `[lo, hi]`.
2. Write `bool ok(x)` that checks a candidate, usually a greedy O(n) pass.
3. Confirm `ok` is monotonic.
4. Binary search for the first `x` where `ok(x)` is true (or the last one, for "maximise" problems).

Total time: **O(n · log(range))**.

## Common mistakes

- **Searching an unsorted array.** Sort first, or the logic is meaningless.
- **Infinite loops.** With `while (lo < hi)` and `lo = mid`, pick `mid = lo + (hi − lo + 1) / 2` (round up), or the range can stop shrinking.
- **Mixing templates.** `[lo, hi]` with `lo <= hi` and `[lo, hi)` with `lo < hi` both work, but only if every update matches the one you picked.
- **Overflow** in `lo + hi` or inside the check function. Use `long long`.

## Practice

- [Binary Search](https://leetcode.com/problems/binary-search/), [Search Insert Position](https://leetcode.com/problems/search-insert-position/)
- [Find First and Last Position of Element in Sorted Array](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/)
- [Search in Rotated Sorted Array](https://leetcode.com/problems/search-in-rotated-sorted-array/), [Find Minimum in Rotated Sorted Array](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/)
- [Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/), [Capacity To Ship Packages Within D Days](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/)
- [Median of Two Sorted Arrays](https://leetcode.com/problems/median-of-two-sorted-arrays/) (hard)

Next: [sorting algorithms](/notes/dsa-sorting).
