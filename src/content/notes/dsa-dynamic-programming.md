---
title: Dynamic Programming
description: How to recognise and build DP solutions: memoisation and tabulation, states and transitions, with diagrams and C++ code for climbing stairs, house robber, coin change, LIS, grid paths, LCS, edit distance, 0/1 knapsack, subset sum and matrix chain multiplication.
author: Bitwise School
---

**Dynamic programming (DP)** is recursion that never solves the same subproblem twice. You break a problem into smaller subproblems, solve each one **once**, store the answer, and build bigger answers from stored ones. It feels hard at first because the code is short and the thinking is not, but almost every DP question follows the same recipe.

## When does DP apply?

Look for two properties:

1. **Overlapping subproblems**: a plain recursion solves the same smaller problem many times.
2. **Optimal substructure**: the best answer is built from best answers to smaller problems.

![Recursion tree of fib(5) where f(3) appears twice and f(2) three times](/images/dsa/dp-fib-overlap.svg "Plain recursion recomputes f(3) and f(2) again and again. DP computes each one once.")

Words that hint at DP: "number of ways", "minimum or maximum cost", "longest or shortest", "can you reach or make", especially when a greedy choice isn't obviously safe.

## Two ways to write it

**Top-down (memoisation):** write the natural recursion, and cache each answer the first time you compute it.

```cpp
long long fibMemo(int n, vector<long long>& memo) {       // memo starts filled with -1
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];                     // solved before
    return memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
}
```

**Bottom-up (tabulation):** fill a table from the smallest subproblems up, in an order where everything you need is already filled.

```cpp
long long fibTable(int n) {
    if (n <= 1) return n;
    vector<long long> dp(n + 1);
    dp[0] = 0;
    dp[1] = 1;
    for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
    return dp[n];
}
```

Both are O(n) instead of O(2ⁿ). Memoisation is easier to derive from a recursion; tabulation avoids deep recursion and allows **space optimisation**: here each value needs only the previous two, so two variables replace the whole table.

```cpp
long long fibFast(int n) {
    if (n == 0) return 0;
    long long prev = 0, cur = 1;             // fib(0), fib(1)
    for (int i = 2; i <= n; i++) {
        long long next = prev + cur;
        prev = cur;
        cur = next;
    }
    return cur;
}
```

## The five-step recipe

1. **State**: what does `dp[i]` (or `dp[i][j]`) mean, in one sentence?
2. **Transition**: how is `dp[i]` built from smaller states? Look at the last choice made.
3. **Base cases**: the smallest states, answered directly.
4. **Order**: fill states so everything a state needs is ready.
5. **Answer**: which state holds the final answer?

Time is usually **number of states × work per state**.

## 1D DP

### Climbing stairs

You climb 1 or 2 steps at a time. The last move to step `i` came from step `i − 1` or step `i − 2`, so `ways(i) = ways(i − 1) + ways(i − 2)`.

![DP array 1 1 2 3 5 8 13 with arrows from ways(3) and ways(4) into ways(5)](/images/dsa/dp-climbing-stairs.svg "Each entry is the sum of the two before it.")

```cpp
int climbStairs(int n) {
    if (n <= 1) return 1;
    vector<int> ways(n + 1);
    ways[0] = 1;
    ways[1] = 1;
    for (int i = 2; i <= n; i++) ways[i] = ways[i - 1] + ways[i - 2];
    return ways[n];
}
```

### House robber: take it or skip it

You can't rob two neighbouring houses. For each house, either rob it (then the previous one was skipped) or skip it.

```cpp
int rob(const vector<int>& houses) {
    int take = 0, skip = 0;          // best so far if the last house was robbed / skipped
    for (int money : houses) {
        int newTake = skip + money;  // rob this one: the previous must be skipped
        skip = max(skip, take);
        take = newTake;
    }
    return max(take, skip);
}
```

### Coin change: fewest coins, and number of ways

`dp[a]` = the fewest coins that make amount `a`. The last coin used was some coin `c`:

```cpp
int coinChange(const vector<int>& coins, int amount) {
    const int INF = INT_MAX / 2;
    vector<int> dp(amount + 1, INF);
    dp[0] = 0;
    for (int a = 1; a <= amount; a++)
        for (int c : coins)
            if (c <= a) dp[a] = min(dp[a], dp[a - c] + 1);
    return dp[amount] >= INF ? -1 : dp[amount];
}
```

Counting the **number of ways** instead: put coins in the **outer** loop, so each combination is counted once (1 + 2 and 2 + 1 are the same way).

```cpp
int countWays(const vector<int>& coins, int amount) {
    vector<long long> dp(amount + 1, 0);
    dp[0] = 1;
    for (int c : coins)
        for (int a = c; a <= amount; a++)
            dp[a] += dp[a - c];
    return (int)dp[amount];
}
```

### Longest increasing subsequence (LIS)

`dp[i]` = the length of the longest increasing subsequence **ending at** `i`:

```cpp
int lengthOfLIS(const vector<int>& a) {              // O(n²)
    int n = a.size(), best = 0;
    vector<int> dp(n, 1);
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < i; j++)
            if (a[j] < a[i]) dp[i] = max(dp[i], dp[j] + 1);
        best = max(best, dp[i]);
    }
    return best;
}
```

A faster O(n log n) version keeps, for every length, the smallest possible last element, and places each number with binary search:

```cpp
int lengthOfLISFast(const vector<int>& a) {
    vector<int> tails;                  // tails[k] = smallest tail of an increasing run of length k + 1
    for (int x : a) {
        auto it = lower_bound(tails.begin(), tails.end(), x);
        if (it == tails.end()) tails.push_back(x);
        else *it = x;
    }
    return tails.size();
}
```

## 2D DP

### Grid paths

Moving only right or down, the ways to reach a cell = ways from above + ways from the left:

```cpp
int uniquePaths(int rows, int cols) {
    vector<vector<long long>> dp(rows, vector<long long>(cols, 1));   // first row and column: 1 way
    for (int r = 1; r < rows; r++)
        for (int c = 1; c < cols; c++)
            dp[r][c] = dp[r - 1][c] + dp[r][c - 1];
    return (int)dp[rows - 1][cols - 1];
}
```

### Longest common subsequence (LCS)

`dp[i][j]` = the LCS of the first `i` letters of `x` and the first `j` letters of `y`. If the last letters match, they extend the diagonal answer; otherwise drop one of them.

![LCS table for ABCBDAB and BDCABA with the path back to the answer BCBA](/images/dsa/dp-lcs-table.svg "Walk back from the bottom-right: a match moves diagonally and adds a letter; otherwise move to the bigger neighbour.")

```cpp
int longestCommonSubsequence(const string& x, const string& y) {
    int n = x.size(), m = y.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++)
            dp[i][j] = (x[i - 1] == y[j - 1]) ? dp[i - 1][j - 1] + 1
                                               : max(dp[i - 1][j], dp[i][j - 1]);
    return dp[n][m];
}
```

### Edit distance

The fewest inserts, deletes and replacements to turn `a` into `b`:

```cpp
int editDistance(const string& a, const string& b) {
    int n = a.size(), m = b.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1));
    for (int i = 0; i <= n; i++) dp[i][0] = i;       // delete everything
    for (int j = 0; j <= m; j++) dp[0][j] = j;       // insert everything
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= m; j++)
            dp[i][j] = (a[i - 1] == b[j - 1])
                ? dp[i - 1][j - 1]                                  // same letter: free
                : 1 + min({dp[i - 1][j],                            // delete
                           dp[i][j - 1],                            // insert
                           dp[i - 1][j - 1]});                      // replace
    return dp[n][m];
}
```

## Knapsack

### 0/1 knapsack

Each item is taken whole or not at all. `dp[i][c]` = the best value using the first `i` items with capacity `c`: either skip item `i`, or take it if it fits.

![Knapsack table for four items and capacity 7 with the answer 9 and the chosen cells highlighted](/images/dsa/dp-knapsack-table.svg "The answer 9 comes from items 2 and 3 (weights 3 + 4 = 7).")

```cpp
int knapsack(const vector<int>& weight, const vector<int>& value, int capacity) {
    int n = weight.size();
    vector<vector<int>> dp(n + 1, vector<int>(capacity + 1, 0));
    for (int i = 1; i <= n; i++) {
        for (int c = 0; c <= capacity; c++) {
            dp[i][c] = dp[i - 1][c];                                    // skip item i
            if (weight[i - 1] <= c)
                dp[i][c] = max(dp[i][c], value[i - 1] + dp[i - 1][c - weight[i - 1]]);   // take it
        }
    }
    return dp[n][capacity];
}
```

Each row only uses the previous row, so one array is enough if you loop the capacity **downwards** (each item is then used at most once):

```cpp
int knapsack1D(const vector<int>& weight, const vector<int>& value, int capacity) {
    vector<int> dp(capacity + 1, 0);
    for (int i = 0; i < (int)weight.size(); i++)
        for (int c = capacity; c >= weight[i]; c--)
            dp[c] = max(dp[c], value[i] + dp[c - weight[i]]);
    return dp[capacity];
}
```

Loop the capacity **upwards** instead and each item can be reused: that's the **unbounded knapsack** (rod cutting, coin change).

### Subset sum and equal partition

Can some subset reach sum `s`? The same knapsack loop with `true`/`false` values:

```cpp
bool canPartition(const vector<int>& nums) {
    int total = accumulate(nums.begin(), nums.end(), 0);
    if (total % 2) return false;
    int target = total / 2;
    vector<bool> can(target + 1, false);
    can[0] = true;
    for (int x : nums)
        for (int s = target; s >= x; s--)
            can[s] = can[s] || can[s - x];
    return can[target];
}
```

## Interval (partition) DP

When the answer for a range `[i, j]` depends on **where you split** it, try every split point. Matrix chain multiplication: matrix `k` has size `dims[k−1] × dims[k]`; find the cheapest order of multiplication.

```cpp
long long matrixChain(const vector<int>& dims) {
    int n = (int)dims.size() - 1;                        // number of matrices
    vector<vector<long long>> dp(n + 1, vector<long long>(n + 1, 0));
    for (int len = 2; len <= n; len++) {                 // solve short chains first
        for (int i = 1; i + len - 1 <= n; i++) {
            int j = i + len - 1;
            dp[i][j] = LLONG_MAX;
            for (int k = i; k < j; k++)                  // split between k and k + 1
                dp[i][j] = min(dp[i][j], dp[i][k] + dp[k + 1][j] + (long long)dims[i - 1] * dims[k] * dims[j]);
        }
    }
    return dp[1][n];
}
```

O(n³) time. Burst balloons and palindrome partitioning use the same shape.

## DP patterns at a glance

| Pattern | State | Examples |
| --- | --- | --- |
| linear | `dp[i]` = answer for the first i items | climbing stairs, house robber, decode ways |
| unbounded choices | `dp[amount]` | coin change, rod cutting |
| subsequence | `dp[i]` = best ending at i | LIS |
| two strings | `dp[i][j]` over two prefixes | LCS, edit distance, shortest common supersequence |
| grid | `dp[r][c]` | unique paths, minimum path sum |
| knapsack | `dp[i][capacity]` | 0/1 knapsack, subset sum, target sum |
| interval | `dp[i][j]`, try every split | matrix chain, burst balloons |
| trees | answer per subtree, from its children | house robber III, tree diameter |

## Common mistakes

- **No clear state definition.** Write it in words before coding.
- **Wrong loop order**: coins inside vs outside counts permutations vs combinations; the 1D knapsack must loop capacity downwards.
- **Wrong base cases**, especially for empty prefixes (`dp[0][...]`).
- **Overflow** in counting problems: use `long long` or take the answer modulo 10⁹ + 7 if asked.
- Using a greedy rule where DP is needed; see [greedy algorithms](/notes/dsa-greedy).

## Practice

- [Climbing Stairs](https://leetcode.com/problems/climbing-stairs/), [House Robber](https://leetcode.com/problems/house-robber/), [House Robber II](https://leetcode.com/problems/house-robber-ii/)
- [Coin Change](https://leetcode.com/problems/coin-change/), [Coin Change II](https://leetcode.com/problems/coin-change-ii/), [Decode Ways](https://leetcode.com/problems/decode-ways/)
- [Longest Increasing Subsequence](https://leetcode.com/problems/longest-increasing-subsequence/), [Unique Paths](https://leetcode.com/problems/unique-paths/), [Word Break](https://leetcode.com/problems/word-break/)
- [Longest Common Subsequence](https://leetcode.com/problems/longest-common-subsequence/), [Edit Distance](https://leetcode.com/problems/edit-distance/)
- [Partition Equal Subset Sum](https://leetcode.com/problems/partition-equal-subset-sum/), [Target Sum](https://leetcode.com/problems/target-sum/)
- [Burst Balloons](https://leetcode.com/problems/burst-balloons/) (hard, interval DP)

Next: [backtracking](/notes/dsa-backtracking).
