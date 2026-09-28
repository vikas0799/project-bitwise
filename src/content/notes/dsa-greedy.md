---
title: Greedy Algorithms
description: When a greedy choice works and how to prove it with the exchange argument, with diagrams and C++ code for activity selection, merging intervals, minimum platforms, fractional knapsack, job sequencing, jump game and gas station, plus when greedy fails.
author: Bitwise School
---

A **greedy algorithm** builds the answer one step at a time and always takes the choice that looks best **right now**, never going back. When it works, it gives short, fast solutions, usually a sort plus one scan. The hard part isn't the code but knowing **whether the greedy choice is actually safe**.

## When is greedy correct?

A greedy algorithm is correct when both hold:

1. **Greedy choice property**: some optimal answer starts with the greedy choice.
2. **Optimal substructure**: after making that choice, what remains is a smaller copy of the same problem.

### The exchange argument

The standard proof: take any optimal answer that **doesn't** use the greedy choice, and show you can **swap** one of its choices for the greedy one without making it worse. So an optimal answer using the greedy choice exists, and you can repeat the argument on what's left.

### Always test for counterexamples

Before trusting a greedy idea, try small inputs by hand. For coins `{1, 3, 4}` and amount 6, "take the biggest coin first" gives 4 + 1 + 1 (3 coins), but 3 + 3 uses only 2. That problem needs [dynamic programming](/notes/dsa-dynamic-programming).

## Activity selection (interval scheduling)

**Problem:** given meetings with start and end times, attend as many as possible without overlaps.

**Greedy:** sort by **end time** and take every meeting that starts after the last chosen one ends.

![Eleven meetings on a timeline with A, D, H and K chosen](/images/dsa/greedy-activity-selection.svg "Finishing early leaves the most room for the rest: A, D, H and K.")

```cpp
// Maximum number of non-overlapping meetings, each given as (start, end).
int maxMeetings(vector<pair<int, int>> meetings) {
    sort(meetings.begin(), meetings.end(), [](const auto& a, const auto& b) {
        return a.second < b.second;              // earliest end first
    });
    int count = 0, lastEnd = INT_MIN;
    for (auto [start, end] : meetings) {
        if (start >= lastEnd) {                  // starts after the last chosen one ends
            count++;
            lastEnd = end;
        }
    }
    return count;
}
```

**Why it's right (exchange argument):** an optimal schedule's first meeting ends no earlier than the meeting that ends first overall. Swap it for that one: nothing else clashes, and the count stays the same.

Sorting by **start time** or by **length** fails: one long early meeting can block several short ones. The minimum number of meetings to **remove** so the rest don't overlap is `n − maxMeetings`.

## Merge overlapping intervals

**Greedy:** sort by start. Each interval either overlaps the last merged one (stretch its end) or starts a new one.

![Intervals 1–3, 2–6, 8–10, 9–12 and 15–18 merged into 1–6, 8–12 and 15–18](/images/dsa/greedy-merge-intervals.svg "After sorting by start, overlaps can only happen with the most recent merged interval.")

```cpp
vector<vector<int>> mergeIntervals(vector<vector<int>> intervals) {
    sort(intervals.begin(), intervals.end());                 // by start
    vector<vector<int>> merged;
    for (const auto& in : intervals) {
        if (!merged.empty() && in[0] <= merged.back()[1])
            merged.back()[1] = max(merged.back()[1], in[1]);  // overlap: stretch the end
        else
            merged.push_back(in);                             // gap: start a new interval
    }
    return merged;
}
```

## Minimum platforms: the sweep line

**Problem:** trains arrive and leave; how many platforms are needed so no train waits?

**Idea:** the answer is the **most trains present at the same moment**. Sort arrivals and departures separately and sweep through time: +1 on an arrival, −1 on a departure.

![Six train stays and a step chart of trains at the station that peaks at 3 between 11:00 and 11:20](/images/dsa/greedy-min-platforms.svg "The count peaks at 3 between 11:00 and 11:20, so 3 platforms are needed.")

```cpp
// arr[i] and dep[i]: arrival and departure time of train i (e.g. in minutes).
int minPlatforms(vector<int> arr, vector<int> dep) {
    sort(arr.begin(), arr.end());
    sort(dep.begin(), dep.end());
    int i = 0, j = 0, inStation = 0, best = 0;
    while (i < (int)arr.size()) {
        if (arr[i] <= dep[j]) {         // next event is an arrival
            inStation++;
            i++;
        } else {                        // next event is a departure
            inStation--;
            j++;
        }
        best = max(best, inStation);
    }
    return best;
}
```

With `<=`, a train arriving at the same minute another leaves still needs its own platform. The same sweep answers "maximum overlapping meetings" and "minimum meeting rooms".

## Fractional knapsack

If you may take **part** of an item, take items in order of **value per unit weight**. Cross-multiplying compares the ratios without floating-point error:

```cpp
// items as (value, weight). Best total value when fractions of items are allowed.
double fractionalKnapsack(vector<pair<int, int>> items, int capacity) {
    sort(items.begin(), items.end(), [](const auto& a, const auto& b) {
        return (long long)a.first * b.second > (long long)b.first * a.second;   // best ratio first
    });
    double total = 0;
    for (auto [value, weight] : items) {
        if (capacity == 0) break;
        int take = min(weight, capacity);
        total += (double)value * take / weight;
        capacity -= take;
    }
    return total;
}
```

In **0/1 knapsack** (whole items only) this greedy fails, so use [DP](/notes/dsa-dynamic-programming).

## Job sequencing with deadlines

Each job takes one unit of time and earns its profit only if finished by its deadline. **Greedy:** consider jobs from the highest profit down, and schedule each one in the **latest free slot** before its deadline, keeping earlier slots free for other jobs.

```cpp
// jobs as (profit, deadline); each job takes one unit of time.
int jobSequencing(vector<pair<int, int>> jobs) {
    sort(jobs.rbegin(), jobs.rend());                 // highest profit first
    int maxDeadline = 0;
    for (auto [profit, deadline] : jobs) maxDeadline = max(maxDeadline, deadline);
    vector<bool> used(maxDeadline + 1, false);        // time slots 1..maxDeadline
    int total = 0;
    for (auto [profit, deadline] : jobs) {
        for (int t = deadline; t >= 1; t--) {         // latest free slot
            if (!used[t]) {
                used[t] = true;
                total += profit;
                break;
            }
        }
    }
    return total;
}
```

## Greedy on arrays

**Jump game:** can you reach the last index? Track the farthest index reachable so far.

```cpp
bool canJump(const vector<int>& nums) {
    int reach = 0;                                    // farthest index we can get to
    for (int i = 0; i < (int)nums.size(); i++) {
        if (i > reach) return false;                  // stuck before i
        reach = max(reach, i + nums[i]);
    }
    return true;
}
```

**Jump game II:** the minimum number of jumps. Treat each jump as a "level" of indices and take the next jump only when the current range runs out:

```cpp
int minJumps(const vector<int>& nums) {
    int jumps = 0, currentEnd = 0, farthest = 0;
    for (int i = 0; i + 1 < (int)nums.size(); i++) {
        farthest = max(farthest, i + nums[i]);
        if (i == currentEnd) {                        // this jump's range is used up
            jumps++;
            currentEnd = farthest;
        }
    }
    return jumps;
}
```

**Gas station:** if the total gas is at least the total cost, a valid start exists. When the tank goes negative at station `i`, no station between the current start and `i` can work, so start again at `i + 1`:

```cpp
int canCompleteCircuit(const vector<int>& gas, const vector<int>& cost) {
    int total = 0, tank = 0, start = 0;
    for (int i = 0; i < (int)gas.size(); i++) {
        int diff = gas[i] - cost[i];
        total += diff;
        tank += diff;
        if (tank < 0) {                   // can't get past i from start
            start = i + 1;
            tank = 0;
        }
    }
    return total >= 0 ? start : -1;
}
```

## Greedy or DP?

| Problem | Greedy works? |
| --- | --- |
| activity selection, merge intervals, platforms | yes |
| fractional knapsack | yes |
| 0/1 knapsack | no, use DP |
| coin change with Indian or US coins | yes (they are designed for it) |
| coin change with any coins | no, use DP |
| shortest path, non-negative weights | yes (Dijkstra is greedy) |
| minimum spanning tree | yes (Kruskal, Prim) |

If you can't find a proof or you find a counterexample, reach for DP.

## Common mistakes

- **Sorting by the wrong key**: by start instead of end in activity selection.
- **Not proving it**: a greedy that passes the sample tests can still fail hidden ones.
- **Touching intervals**: decide whether `[1, 3]` and `[3, 5]` overlap, and use `<` or `<=` to match.

## Practice

- [Assign Cookies](https://leetcode.com/problems/assign-cookies/), [Jump Game](https://leetcode.com/problems/jump-game/), [Jump Game II](https://leetcode.com/problems/jump-game-ii/)
- [Gas Station](https://leetcode.com/problems/gas-station/), [Partition Labels](https://leetcode.com/problems/partition-labels/), [Candy](https://leetcode.com/problems/candy/) (hard)
- [Merge Intervals](https://leetcode.com/problems/merge-intervals/), [Insert Interval](https://leetcode.com/problems/insert-interval/), [Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/)

Next: [dynamic programming](/notes/dsa-dynamic-programming).
