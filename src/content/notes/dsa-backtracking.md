---
title: Backtracking
description: The choose, explore, un-choose template for generating subsets, permutations and combinations, handling duplicates, pruning, N-Queens and word search, with decision-tree diagrams and C++ code.
author: Bitwise School
---

**Backtracking** builds a solution one choice at a time. After exploring everything that follows from a choice, it **undoes** that choice and tries the next one. It is recursion over a **decision tree**, and it's how you generate every subset, permutation or arrangement, or search for one that satisfies the rules (Sudoku, N-Queens, word search).

## The template

```text
backtrack(state):
    if state is a complete answer:
        record it
        return
    for each choice available now:
        if the choice breaks a rule: skip it          (pruning)
        make the choice                               (choose)
        backtrack(state)                              (explore)
        undo the choice                               (un-choose)
```

The **undo** step is what makes it backtracking. It lets one shared `current` vector serve every branch, instead of copying the state at every call.

## Subsets: take it or skip it

For each item there are two choices, take it or skip it, so n items give 2ⁿ subsets. Each level of the decision tree decides one item:

![Decision tree for 1, 2, 3 where each level takes or skips one item, ending in eight subsets](/images/dsa/backtracking-subsets.svg "Green edges take the item, grey edges skip it; the eight leaves are all the subsets.")

```cpp
void subsetsFrom(const vector<int>& nums, int i, vector<int>& current, vector<vector<int>>& all) {
    if (i == (int)nums.size()) {             // every item decided
        all.push_back(current);
        return;
    }
    current.push_back(nums[i]);              // choose: take nums[i]
    subsetsFrom(nums, i + 1, current, all);  // explore
    current.pop_back();                      // un-choose
    subsetsFrom(nums, i + 1, current, all);  // skip nums[i]
}
```

### When the input has duplicates

With `[1, 2, 2]`, the plan above produces `[1, 2]` twice. Sort first, and at each level **skip a value equal to the one just tried** at that same level:

```cpp
// Call after sort(nums.begin(), nums.end()).
void subsetsNoDup(const vector<int>& nums, int start, vector<int>& current, vector<vector<int>>& all) {
    all.push_back(current);                              // every node is a subset
    for (int i = start; i < (int)nums.size(); i++) {
        if (i > start && nums[i] == nums[i - 1]) continue;   // same value at this level
        current.push_back(nums[i]);
        subsetsNoDup(nums, i + 1, current, all);
        current.pop_back();
    }
}
```

## Permutations

Fix which item goes in position `start` by swapping each candidate there, recurse on the rest, then swap back:

```cpp
void permute(vector<int>& nums, int start, vector<vector<int>>& all) {
    if (start == (int)nums.size()) {
        all.push_back(nums);
        return;
    }
    for (int i = start; i < (int)nums.size(); i++) {
        swap(nums[start], nums[i]);          // choose the item for this position
        permute(nums, start + 1, all);
        swap(nums[start], nums[i]);          // undo
    }
}
```

## Combination sum: choices with reuse and pruning

Find all combinations that add up to a target, where each number may be used any number of times. Passing `i` (not `i + 1`) allows reuse, and the `start` index keeps each combination in one order so there are no duplicates:

```cpp
void combinationSum(const vector<int>& candidates, int start, int remaining,
                    vector<int>& current, vector<vector<int>>& all) {
    if (remaining == 0) {
        all.push_back(current);
        return;
    }
    for (int i = start; i < (int)candidates.size(); i++) {
        if (candidates[i] > remaining) continue;              // prune: too big
        current.push_back(candidates[i]);
        combinationSum(candidates, i, remaining - candidates[i], current, all);   // i: reuse allowed
        current.pop_back();
    }
}
```

**Pruning** (cutting a branch as soon as it can't lead to an answer) is what makes backtracking fast enough in practice. Sorting the candidates first lets you `break` instead of `continue`, because every later number is bigger too.

## N-Queens

Place n queens on an n × n board so that no two attack each other (same row, column or diagonal). Put **one queen per row**, and for each row try every column that isn't attacked.

![A 4 by 4 board showing one queen's attacked squares and one valid four-queen answer](/images/dsa/n-queens.svg "Left: the squares one queen attacks. Right: a valid answer with queens in columns 1, 3, 0 and 2.")

Checking "attacked" in O(1) uses three boolean arrays. Along a `\` diagonal `row − col` is constant, and along a `/` diagonal `row + col` is constant:

```cpp
class NQueens {
    int n;
    vector<bool> col, diag, anti;             // attacked column, \ diagonal, / diagonal
    vector<string> board;
    vector<vector<string>> solutions;

    void place(int row) {
        if (row == n) {
            solutions.push_back(board);
            return;
        }
        for (int c = 0; c < n; c++) {
            if (col[c] || diag[row - c + n - 1] || anti[row + c]) continue;   // attacked
            col[c] = diag[row - c + n - 1] = anti[row + c] = true;
            board[row][c] = 'Q';
            place(row + 1);
            board[row][c] = '.';                                              // undo
            col[c] = diag[row - c + n - 1] = anti[row + c] = false;
        }
    }

public:
    vector<vector<string>> solve(int size) {
        n = size;
        col.assign(n, false);
        diag.assign(2 * n - 1, false);
        anti.assign(2 * n - 1, false);
        board.assign(n, string(n, '.'));
        solutions.clear();
        place(0);
        return solutions;
    }
};
```

For n = 4 there are exactly 2 solutions; for n = 8 there are 92.

## Word search: backtracking on a grid

Does a word appear in a letter grid, moving up, down, left or right without reusing a cell? Mark a cell while it's on the current path, and **unmark it on the way back** so other paths can use it:

```cpp
bool existFrom(vector<vector<char>>& board, const string& word, int r, int c, int k) {
    if (k == (int)word.size()) return true;                  // matched every letter
    if (r < 0 || c < 0 || r >= (int)board.size() || c >= (int)board[0].size()) return false;
    if (board[r][c] != word[k]) return false;
    char saved = board[r][c];
    board[r][c] = '#';                                       // in use on this path
    bool found = existFrom(board, word, r + 1, c, k + 1) || existFrom(board, word, r - 1, c, k + 1) ||
                 existFrom(board, word, r, c + 1, k + 1) || existFrom(board, word, r, c - 1, k + 1);
    board[r][c] = saved;                                     // undo
    return found;
}

bool exist(vector<vector<char>>& board, const string& word) {
    for (int r = 0; r < (int)board.size(); r++)
        for (int c = 0; c < (int)board[0].size(); c++)
            if (existFrom(board, word, r, c, 0)) return true;
    return false;
}
```

Rat in a maze, Sudoku and palindrome partitioning follow the same shape: make a move, recurse, undo the move.

## How slow is backtracking?

It explores a decision tree, so the time is exponential. That's expected, since the output itself is often exponential:

| Problem | Answers | Time |
| --- | --- | --- |
| all subsets | 2ⁿ | O(n · 2ⁿ) |
| all permutations | n! | O(n · n!) |
| N-Queens | few, but many partial boards | about O(n!) with pruning |

That's why these problems come with small limits (n ≤ 10 to 20). If a problem only asks for a **count** or a **best** value and the subproblems repeat, it's probably [dynamic programming](/notes/dsa-dynamic-programming) instead.

## Common mistakes

- **Forgetting to undo** a choice, so it leaks into other branches.
- **Storing a reference** to `current` instead of a copy when recording an answer (in C++, `push_back(current)` copies, which is what you want).
- **Duplicate answers**: sort and skip equal values at the same level, or use the `start` index.
- **No pruning**: always ask whether a partial answer can still succeed.

## Practice

- [Subsets](https://leetcode.com/problems/subsets/), [Subsets II](https://leetcode.com/problems/subsets-ii/), [Permutations](https://leetcode.com/problems/permutations/)
- [Combination Sum](https://leetcode.com/problems/combination-sum/), [Combination Sum II](https://leetcode.com/problems/combination-sum-ii/), [Generate Parentheses](https://leetcode.com/problems/generate-parentheses/)
- [Letter Combinations of a Phone Number](https://leetcode.com/problems/letter-combinations-of-a-phone-number/), [Palindrome Partitioning](https://leetcode.com/problems/palindrome-partitioning/)
- [Word Search](https://leetcode.com/problems/word-search/), [N-Queens](https://leetcode.com/problems/n-queens/), [Sudoku Solver](https://leetcode.com/problems/sudoku-solver/) (hard)

That's the full DSA notes track. Practise topic by topic on the [DSA sheet](/dsa-sheet), and start again from [complexity](/notes/dsa-complexity) whenever you want a quick revision.
