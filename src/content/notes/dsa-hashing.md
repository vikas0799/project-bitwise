---
title: Hashing and Hash Tables
description: How hash tables give O(1) average lookups, hash functions, collisions with chaining and linear probing, load factor, map vs unordered_map, and the hashing patterns behind Two Sum, anagrams and consecutive sequences, in C++.
author: Bitwise School
---

Hashing is the trick behind the most common optimisation in coding interviews: replace "search the whole array again" (O(n)) with "look it up in a hash table" (O(1) on average). Two Sum, duplicates, anagrams, frequency counts and prefix sums with a target all use it.

## How a hash table works

1. A **hash function** turns a key into a number.
2. That number, taken modulo the table size, picks a **bucket**.
3. The key (and its value) is stored in that bucket.

To find a key later, compute the same hash and look in just that one bucket. No scanning, so insert, find and erase are **O(1) on average**.

A good hash function is fast, always gives the same output for the same key, and **spreads keys evenly** across buckets.

## Collisions

Two different keys can land in the same bucket; this is a **collision**. It's unavoidable (there are more possible keys than buckets), so every hash table needs a plan.

### Chaining

Each bucket holds a small list. Colliding keys simply join the list.

![Hash table of 7 buckets where 15, 8 and 22 all hash to bucket 1 and form a chain](/images/dsa/hash-chaining.svg "With h(key) = key % 7, the keys 15, 8 and 22 collide in bucket 1 and form a chain.")

A tiny chained hash set, to see the idea in code:

```cpp
class HashSet {
    vector<list<int>> buckets;
    int hashOf(int key) const {
        int m = buckets.size();
        return ((key % m) + m) % m;              // also works for negative keys
    }
public:
    explicit HashSet(int size = 7) : buckets(size) {}
    void insert(int key) {
        auto& chain = buckets[hashOf(key)];
        if (find(chain.begin(), chain.end(), key) == chain.end()) chain.push_back(key);
    }
    bool contains(int key) const {
        const auto& chain = buckets[hashOf(key)];
        return find(chain.begin(), chain.end(), key) != chain.end();
    }
    void erase(int key) { buckets[hashOf(key)].remove(key); }
};
```

### Open addressing (linear probing)

Every slot holds at most one key. If the home slot is taken, try the next one, then the next, until a free slot turns up.

![Table of 7 slots where 22 hashes to slot 1, finds slots 1 and 2 taken and goes into slot 3](/images/dsa/hash-open-addressing.svg "22 hashes to slot 1, which is taken, as is slot 2, so it goes into slot 3.")

Probing keeps data in one array (fast for the CPU cache), but keys can bunch up in clusters, and deletion needs a "deleted" marker so later searches don't stop too early.

### Load factor and resizing

The **load factor** is `number of keys ÷ number of buckets`. As it grows, chains get longer and probes get slower. Real hash tables **double the number of buckets and re-insert every key** once the load factor passes a limit (about 1 for `unordered_map`). Like `vector` growth, that occasional O(n) resize is spread out: **amortized O(1)**.

If many keys collide (a bad hash function, or test data built to attack it), a hash table degrades to **O(n)** per operation.

## map or unordered_map?

| | `map` | `unordered_map` |
| --- | --- | --- |
| inside | balanced BST (red-black tree) | hash table |
| order of keys | sorted | no order |
| insert, find, erase | O(log n) | O(1) average, O(n) worst |
| key type needs | `operator<` | a hash function and `operator==` |
| choose it when | you need sorted keys, `lower_bound`, or guaranteed times | you only need fast lookups |

`set` and `unordered_set` are the same pair without values.

## The patterns

### Count frequencies

```cpp
unordered_map<int, int> countFrequency(const vector<int>& a) {
    unordered_map<int, int> freq;
    for (int x : a) freq[x]++;               // a missing key starts at 0
    return freq;
}
```

### Have I seen this before?

```cpp
bool containsDuplicate(const vector<int>& a) {
    unordered_set<int> seen;
    for (int x : a) {
        if (seen.count(x)) return true;
        seen.insert(x);
    }
    return false;
}
```

### Look up the complement (Two Sum)

For each number, the partner you need is `target − x`. Check whether you've already seen it:

```cpp
vector<int> twoSum(const vector<int>& nums, int target) {
    unordered_map<int, int> indexOf;             // value -> index
    for (int i = 0; i < (int)nums.size(); i++) {
        auto it = indexOf.find(target - nums[i]);
        if (it != indexOf.end()) return {it->second, i};
        indexOf[nums[i]] = i;
    }
    return {};
}
```

O(n) instead of the O(n²) double loop. The same "look up what you need" idea counts subarrays with sum k using prefix sums; see [arrays](/notes/dsa-arrays-patterns).

### Group by a canonical key

Anagrams become identical once their letters are sorted, so the sorted word is a perfect key:

```cpp
vector<vector<string>> groupAnagrams(const vector<string>& words) {
    unordered_map<string, vector<string>> groups;
    for (const string& w : words) {
        string key = w;
        sort(key.begin(), key.end());            // "eat", "tea", "ate" -> "aet"
        groups[key].push_back(w);
    }
    vector<vector<string>> result;
    for (auto& [key, list] : groups) result.push_back(std::move(list));
    return result;
}
```

### Longest run of consecutive numbers in O(n)

Put everything in a set. Only start counting from a number `x` whose `x − 1` is **not** in the set, so each run is counted once:

```cpp
int longestConsecutive(const vector<int>& nums) {
    unordered_set<int> s(nums.begin(), nums.end());
    int best = 0;
    for (int x : s) {
        if (s.count(x - 1)) continue;            // not the start of a run
        int length = 1;
        while (s.count(x + length)) length++;
        best = max(best, length);
    }
    return best;
}
```

## Hashing your own keys

`unordered_map` can't hash a `pair` out of the box. Either combine it into one number or string, or give it a hash function:

```cpp
struct PairHash {
    size_t operator()(const pair<int, int>& p) const {
        return hash<long long>()(((long long)p.first << 32) ^ (unsigned int)p.second);
    }
};

unordered_set<pair<int, int>, PairHash> visited;   // e.g. grid cells in a BFS
```

For grid cells, `row * cols + col` as a single `int` key is often simplest.

## Common mistakes

- Using `m[key]` just to check for a key: it **inserts** the key. Use `count` or `find`.
- Assuming `unordered_map` iterates in any particular order. It doesn't.
- Forgetting the O(n) worst case when the interviewer asks "is it really O(1)?". Say "O(1) on average".
- Hashing floating-point numbers or mutable objects as keys.

## Practice

- [Two Sum](https://leetcode.com/problems/two-sum/), [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/), [Valid Anagram](https://leetcode.com/problems/valid-anagram/)
- [Group Anagrams](https://leetcode.com/problems/group-anagrams/), [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/)
- [Longest Consecutive Sequence](https://leetcode.com/problems/longest-consecutive-sequence/), [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/)

Next: [heaps and priority queues](/notes/dsa-heaps).
