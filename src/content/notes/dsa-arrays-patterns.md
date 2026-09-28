---
title: "Arrays: Prefix Sums, Two Pointers and Sliding Window"
description: How arrays work in memory and the patterns that solve most array questions in O(n) (prefix sums, Kadane's algorithm, two pointers and sliding windows), with C++ code.
author: Bitwise School
---

Arrays are the most asked topic in coding rounds. The data structure is simple; the skill is spotting which **pattern** turns an O(n²) brute force into an O(n) pass. This note covers the four you need most.

## How an array works

An array stores items **next to each other in memory**. Because every item has the same size, the address of `a[i]` is just `base + i × size`, so any index is reached in **O(1)**.

![Array 7 2 9 4 1 with addresses 1000 to 1016 and index 3 highlighted](/images/dsa/array-indexing.svg "Items sit side by side, so the computer jumps straight to any index.")

| Operation | Cost | Why |
| --- | --- | --- |
| read or write `a[i]` | O(1) | address arithmetic |
| add or remove at the end (`push_back`, `pop_back`) | O(1)* | *amortized, see [C++ STL](/notes/dsa-cpp-stl) |
| insert or erase in the middle | O(n) | everything after it shifts |
| search an unsorted array | O(n) | may have to check every item |
| search a sorted array | O(log n) | [binary search](/notes/dsa-binary-search) |

In C++ use `vector<int>`; it grows as needed and knows its own size.

## Pattern 1: prefix sums

**Question type:** "sum of elements from index `l` to `r`", asked many times.

Adding the range every time is O(n) per query. Instead build `prefix[i]` = sum of the first `i` items once; then any range sum is one subtraction.

![Array 3 1 4 1 5 9 and its prefix array, with sum of indices 1 to 4 equal to prefix 5 minus prefix 1](/images/dsa/prefix-sum.svg "sum(a[1..4]) = prefix[5] − prefix[1] = 14 − 3 = 11.")

```cpp
vector<long long> buildPrefix(const vector<int>& a) {
    vector<long long> prefix(a.size() + 1, 0);
    for (size_t i = 0; i < a.size(); i++) prefix[i + 1] = prefix[i] + a[i];
    return prefix;
}

// Sum of a[l..r], both ends included.
long long rangeSum(const vector<long long>& prefix, int l, int r) {
    return prefix[r + 1] - prefix[l];
}
```

Building is O(n), each query O(1). Using an array of size `n + 1` with `prefix[0] = 0` removes the special case for `l = 0`.

### Counting subarrays with sum k

A subarray `a[l..r]` sums to `k` when `prefix[r + 1] − prefix[l] = k`. So while scanning, count how many earlier prefix sums equal `current − k`. This works even with negative numbers:

```cpp
int countSubarraysWithSum(const vector<int>& a, int k) {
    unordered_map<long long, int> seen{{0, 1}};   // prefix sum -> times seen
    long long prefix = 0;
    int count = 0;
    for (int x : a) {
        prefix += x;
        auto it = seen.find(prefix - k);
        if (it != seen.end()) count += it->second;
        seen[prefix]++;
    }
    return count;
}
```

## Pattern 2: Kadane's algorithm (maximum subarray sum)

At each position, the best subarray ending here either **extends** the best one ending at the previous position or **starts fresh** here.

```cpp
long long maxSubarraySum(const vector<int>& a) {
    long long best = a[0], current = 0;
    for (int x : a) {
        current = max((long long)x, current + x);   // extend or restart
        best = max(best, current);
    }
    return best;
}
```

O(n) time, O(1) space, and it handles arrays where every number is negative.

## Pattern 3: two pointers

### From both ends of a sorted array

**Question type:** sorted array, find a pair (or triplet) with a target sum.

Put `L` at the start and `R` at the end. If the sum is too big, the only way to shrink it is to move `R` left; if it is too small, move `L` right. Every step discards one element for good.

![Three steps of two pointers on 2 4 5 7 9 12 finding the pair 4 and 9](/images/dsa/two-pointers.svg "Each comparison moves one pointer, so the search takes at most n steps: O(n).")

```cpp
// Indices of two items that sum to target, or {-1, -1}.
pair<int, int> pairWithSum(const vector<int>& a, int target) {
    int l = 0, r = (int)a.size() - 1;
    while (l < r) {
        int sum = a[l] + a[r];
        if (sum == target) return {l, r};
        if (sum < target) l++;       // need a bigger sum
        else r--;                    // need a smaller sum
    }
    return {-1, -1};
}
```

For **3Sum**, sort, fix the first number with a loop, and run this two-pointer search on the rest: O(n²) instead of O(n³).

### Same direction: read and write pointers

**Question type:** rearrange or filter an array **in place**.

```cpp
void moveZeroes(vector<int>& a) {
    int write = 0;                                   // next slot for a non-zero
    for (int read = 0; read < (int)a.size(); read++)
        if (a[read] != 0) swap(a[write++], a[read]);
}
```

The same shape removes duplicates from a sorted array, partitions around a value, and merges two sorted arrays.

## Pattern 4: sliding window

### Fixed size

**Question type:** "subarray (or substring) of size `k`".

Don't re-add `k` items for every position. Slide the window one step: add the item that enters, subtract the item that leaves.

![Window of size 3 sliding across 2 1 5 1 3 2 with sums 8, 7, 9, 6](/images/dsa/sliding-window.svg "The window moves right one step at a time; the best sum is 9.")

```cpp
long long maxWindowSum(const vector<int>& a, int k) {   // assumes 1 <= k <= a.size()
    long long window = 0;
    for (int i = 0; i < k; i++) window += a[i];
    long long best = window;
    for (int i = k; i < (int)a.size(); i++) {
        window += a[i] - a[i - k];      // add the new item, drop the old one
        best = max(best, window);
    }
    return best;
}
```

### Variable size

**Question type:** "longest (or shortest) subarray or substring such that …".

Grow the window with `right`. When the window breaks the rule, shrink it from `left` until it is valid again. Both pointers only move forward, so the total work is O(n).

```cpp
// Length of the longest substring with no repeated character.
int longestUniqueSubstring(const string& s) {
    vector<int> last(256, -1);                 // last index of each character
    int best = 0, left = 0;
    for (int right = 0; right < (int)s.size(); right++) {
        unsigned char c = s[right];
        if (last[c] >= left) left = last[c] + 1;   // jump past the repeat
        last[c] = right;
        best = max(best, right - left + 1);
    }
    return best;
}
```

A variable window works when adding items only makes the condition "more broken" (for example sums of **positive** numbers). With negative numbers use prefix sums and a hash map instead.

## Which pattern? A cheat sheet

| The question says | Try |
| --- | --- |
| many range-sum queries | prefix sums |
| count subarrays with sum k (negatives allowed) | prefix sums + hash map |
| maximum subarray sum | Kadane |
| sorted array, find a pair or triplet | two pointers from both ends |
| modify the array in place | read/write pointers |
| subarray or substring of size k | fixed sliding window |
| longest or shortest subarray with a condition | variable sliding window |

## Common mistakes

- **Off-by-one errors**: decide whether ranges include both ends, and stick to it.
- **Integer overflow**: sums of many `int`s can pass 2³¹ − 1. Use `long long`.
- **Two pointers on an unsorted array**: the "move L or R" logic only works when the array is sorted.
- **Forgetting the empty case**: an empty array or `k > n`.

## Practice

- [Two Sum II](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/), [3Sum](https://leetcode.com/problems/3sum/), [Container With Most Water](https://leetcode.com/problems/container-with-most-water/)
- [Move Zeroes](https://leetcode.com/problems/move-zeroes/), [Remove Duplicates from Sorted Array](https://leetcode.com/problems/remove-duplicates-from-sorted-array/)
- [Maximum Subarray](https://leetcode.com/problems/maximum-subarray/), [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/)
- [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters/), [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/)

Next: [binary search](/notes/dsa-binary-search).
