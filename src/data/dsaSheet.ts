// Bitwise DSA sheet: our own topic-wise selection of free LeetCode problems.
// Titles, links and difficulty were verified against LeetCode on 2026-09-28.

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface DsaProblem {
  slug: string;
  title: string;
  difficulty: Difficulty;
}

export interface DsaTopic {
  id: string;
  name: string;
  tip: string;
  problems: DsaProblem[];
}

export const dsaTopics: DsaTopic[] = [
  {
    "id": "arrays-hashing",
    "name": "Arrays & Hashing",
    "tip": "Hash maps turn O(n²) searches into O(n). Learn to count, group and look up in one pass.",
    "problems": [
      {
        "slug": "two-sum",
        "title": "Two Sum",
        "difficulty": "Easy"
      },
      {
        "slug": "contains-duplicate",
        "title": "Contains Duplicate",
        "difficulty": "Easy"
      },
      {
        "slug": "valid-anagram",
        "title": "Valid Anagram",
        "difficulty": "Easy"
      },
      {
        "slug": "majority-element",
        "title": "Majority Element",
        "difficulty": "Easy"
      },
      {
        "slug": "group-anagrams",
        "title": "Group Anagrams",
        "difficulty": "Medium"
      },
      {
        "slug": "top-k-frequent-elements",
        "title": "Top K Frequent Elements",
        "difficulty": "Medium"
      },
      {
        "slug": "product-of-array-except-self",
        "title": "Product of Array Except Self",
        "difficulty": "Medium"
      },
      {
        "slug": "longest-consecutive-sequence",
        "title": "Longest Consecutive Sequence",
        "difficulty": "Medium"
      },
      {
        "slug": "sort-colors",
        "title": "Sort Colors",
        "difficulty": "Medium"
      },
      {
        "slug": "next-permutation",
        "title": "Next Permutation",
        "difficulty": "Medium"
      }
    ]
  },
  {
    "id": "two-pointers",
    "name": "Two Pointers",
    "tip": "Works on sorted arrays and strings: move pointers from both ends or at two speeds.",
    "problems": [
      {
        "slug": "valid-palindrome",
        "title": "Valid Palindrome",
        "difficulty": "Easy"
      },
      {
        "slug": "move-zeroes",
        "title": "Move Zeroes",
        "difficulty": "Easy"
      },
      {
        "slug": "remove-duplicates-from-sorted-array",
        "title": "Remove Duplicates from Sorted Array",
        "difficulty": "Easy"
      },
      {
        "slug": "two-sum-ii-input-array-is-sorted",
        "title": "Two Sum II - Input Array Is Sorted",
        "difficulty": "Medium"
      },
      {
        "slug": "3sum",
        "title": "3Sum",
        "difficulty": "Medium"
      },
      {
        "slug": "container-with-most-water",
        "title": "Container With Most Water",
        "difficulty": "Medium"
      },
      {
        "slug": "trapping-rain-water",
        "title": "Trapping Rain Water",
        "difficulty": "Hard"
      }
    ]
  },
  {
    "id": "sliding-window",
    "name": "Sliding Window",
    "tip": "For subarray and substring problems: grow the window, shrink it when a rule breaks.",
    "problems": [
      {
        "slug": "best-time-to-buy-and-sell-stock",
        "title": "Best Time to Buy and Sell Stock",
        "difficulty": "Easy"
      },
      {
        "slug": "maximum-average-subarray-i",
        "title": "Maximum Average Subarray I",
        "difficulty": "Easy"
      },
      {
        "slug": "longest-substring-without-repeating-characters",
        "title": "Longest Substring Without Repeating Characters",
        "difficulty": "Medium"
      },
      {
        "slug": "longest-repeating-character-replacement",
        "title": "Longest Repeating Character Replacement",
        "difficulty": "Medium"
      },
      {
        "slug": "permutation-in-string",
        "title": "Permutation in String",
        "difficulty": "Medium"
      },
      {
        "slug": "minimum-window-substring",
        "title": "Minimum Window Substring",
        "difficulty": "Hard"
      },
      {
        "slug": "sliding-window-maximum",
        "title": "Sliding Window Maximum",
        "difficulty": "Hard"
      }
    ]
  },
  {
    "id": "prefix-sum-kadane",
    "name": "Prefix Sum & Kadane",
    "tip": "Precompute running sums; Kadane's algorithm finds the best subarray in one pass.",
    "problems": [
      {
        "slug": "range-sum-query-immutable",
        "title": "Range Sum Query - Immutable",
        "difficulty": "Easy"
      },
      {
        "slug": "maximum-subarray",
        "title": "Maximum Subarray",
        "difficulty": "Medium"
      },
      {
        "slug": "maximum-product-subarray",
        "title": "Maximum Product Subarray",
        "difficulty": "Medium"
      },
      {
        "slug": "subarray-sum-equals-k",
        "title": "Subarray Sum Equals K",
        "difficulty": "Medium"
      },
      {
        "slug": "continuous-subarray-sum",
        "title": "Continuous Subarray Sum",
        "difficulty": "Medium"
      }
    ]
  },
  {
    "id": "binary-search",
    "name": "Binary Search",
    "tip": "Not just for sorted arrays: binary search on the answer when a condition is monotonic.",
    "problems": [
      {
        "slug": "binary-search",
        "title": "Binary Search",
        "difficulty": "Easy"
      },
      {
        "slug": "search-insert-position",
        "title": "Search Insert Position",
        "difficulty": "Easy"
      },
      {
        "slug": "find-first-and-last-position-of-element-in-sorted-array",
        "title": "Find First and Last Position of Element in Sorted Array",
        "difficulty": "Medium"
      },
      {
        "slug": "search-a-2d-matrix",
        "title": "Search a 2D Matrix",
        "difficulty": "Medium"
      },
      {
        "slug": "find-minimum-in-rotated-sorted-array",
        "title": "Find Minimum in Rotated Sorted Array",
        "difficulty": "Medium"
      },
      {
        "slug": "search-in-rotated-sorted-array",
        "title": "Search in Rotated Sorted Array",
        "difficulty": "Medium"
      },
      {
        "slug": "koko-eating-bananas",
        "title": "Koko Eating Bananas",
        "difficulty": "Medium"
      },
      {
        "slug": "capacity-to-ship-packages-within-d-days",
        "title": "Capacity To Ship Packages Within D Days",
        "difficulty": "Medium"
      },
      {
        "slug": "median-of-two-sorted-arrays",
        "title": "Median of Two Sorted Arrays",
        "difficulty": "Hard"
      }
    ]
  },
  {
    "id": "strings",
    "name": "Strings",
    "tip": "Palindromes, parsing and pattern matching come up in almost every round.",
    "problems": [
      {
        "slug": "longest-common-prefix",
        "title": "Longest Common Prefix",
        "difficulty": "Easy"
      },
      {
        "slug": "find-the-index-of-the-first-occurrence-in-a-string",
        "title": "Find the Index of the First Occurrence in a String",
        "difficulty": "Easy"
      },
      {
        "slug": "reverse-words-in-a-string",
        "title": "Reverse Words in a String",
        "difficulty": "Medium"
      },
      {
        "slug": "string-to-integer-atoi",
        "title": "String to Integer (atoi)",
        "difficulty": "Medium"
      },
      {
        "slug": "longest-palindromic-substring",
        "title": "Longest Palindromic Substring",
        "difficulty": "Medium"
      },
      {
        "slug": "palindromic-substrings",
        "title": "Palindromic Substrings",
        "difficulty": "Medium"
      }
    ]
  },
  {
    "id": "matrix-intervals",
    "name": "Matrix & Intervals",
    "tip": "Traverse grids carefully and sort intervals by start before merging.",
    "problems": [
      {
        "slug": "spiral-matrix",
        "title": "Spiral Matrix",
        "difficulty": "Medium"
      },
      {
        "slug": "rotate-image",
        "title": "Rotate Image",
        "difficulty": "Medium"
      },
      {
        "slug": "set-matrix-zeroes",
        "title": "Set Matrix Zeroes",
        "difficulty": "Medium"
      },
      {
        "slug": "merge-intervals",
        "title": "Merge Intervals",
        "difficulty": "Medium"
      },
      {
        "slug": "insert-interval",
        "title": "Insert Interval",
        "difficulty": "Medium"
      },
      {
        "slug": "non-overlapping-intervals",
        "title": "Non-overlapping Intervals",
        "difficulty": "Medium"
      }
    ]
  },
  {
    "id": "linked-list",
    "name": "Linked List",
    "tip": "Draw the pointers. Fast/slow pointers and dummy nodes solve most problems.",
    "problems": [
      {
        "slug": "reverse-linked-list",
        "title": "Reverse Linked List",
        "difficulty": "Easy"
      },
      {
        "slug": "merge-two-sorted-lists",
        "title": "Merge Two Sorted Lists",
        "difficulty": "Easy"
      },
      {
        "slug": "linked-list-cycle",
        "title": "Linked List Cycle",
        "difficulty": "Easy"
      },
      {
        "slug": "middle-of-the-linked-list",
        "title": "Middle of the Linked List",
        "difficulty": "Easy"
      },
      {
        "slug": "intersection-of-two-linked-lists",
        "title": "Intersection of Two Linked Lists",
        "difficulty": "Easy"
      },
      {
        "slug": "remove-nth-node-from-end-of-list",
        "title": "Remove Nth Node From End of List",
        "difficulty": "Medium"
      },
      {
        "slug": "reorder-list",
        "title": "Reorder List",
        "difficulty": "Medium"
      },
      {
        "slug": "add-two-numbers",
        "title": "Add Two Numbers",
        "difficulty": "Medium"
      },
      {
        "slug": "copy-list-with-random-pointer",
        "title": "Copy List with Random Pointer",
        "difficulty": "Medium"
      },
      {
        "slug": "lru-cache",
        "title": "LRU Cache",
        "difficulty": "Medium"
      },
      {
        "slug": "merge-k-sorted-lists",
        "title": "Merge k Sorted Lists",
        "difficulty": "Hard"
      },
      {
        "slug": "reverse-nodes-in-k-group",
        "title": "Reverse Nodes in k-Group",
        "difficulty": "Hard"
      }
    ]
  },
  {
    "id": "stack-queue",
    "name": "Stack & Queue",
    "tip": "Monotonic stacks answer 'next greater/smaller' questions in O(n).",
    "problems": [
      {
        "slug": "valid-parentheses",
        "title": "Valid Parentheses",
        "difficulty": "Easy"
      },
      {
        "slug": "implement-queue-using-stacks",
        "title": "Implement Queue using Stacks",
        "difficulty": "Easy"
      },
      {
        "slug": "next-greater-element-i",
        "title": "Next Greater Element I",
        "difficulty": "Easy"
      },
      {
        "slug": "min-stack",
        "title": "Min Stack",
        "difficulty": "Medium"
      },
      {
        "slug": "evaluate-reverse-polish-notation",
        "title": "Evaluate Reverse Polish Notation",
        "difficulty": "Medium"
      },
      {
        "slug": "daily-temperatures",
        "title": "Daily Temperatures",
        "difficulty": "Medium"
      },
      {
        "slug": "largest-rectangle-in-histogram",
        "title": "Largest Rectangle in Histogram",
        "difficulty": "Hard"
      }
    ]
  },
  {
    "id": "recursion-backtracking",
    "name": "Recursion & Backtracking",
    "tip": "Choose, explore, un-choose. Build every subset, permutation or path.",
    "problems": [
      {
        "slug": "subsets",
        "title": "Subsets",
        "difficulty": "Medium"
      },
      {
        "slug": "subsets-ii",
        "title": "Subsets II",
        "difficulty": "Medium"
      },
      {
        "slug": "permutations",
        "title": "Permutations",
        "difficulty": "Medium"
      },
      {
        "slug": "combination-sum",
        "title": "Combination Sum",
        "difficulty": "Medium"
      },
      {
        "slug": "combination-sum-ii",
        "title": "Combination Sum II",
        "difficulty": "Medium"
      },
      {
        "slug": "generate-parentheses",
        "title": "Generate Parentheses",
        "difficulty": "Medium"
      },
      {
        "slug": "letter-combinations-of-a-phone-number",
        "title": "Letter Combinations of a Phone Number",
        "difficulty": "Medium"
      },
      {
        "slug": "word-search",
        "title": "Word Search",
        "difficulty": "Medium"
      },
      {
        "slug": "palindrome-partitioning",
        "title": "Palindrome Partitioning",
        "difficulty": "Medium"
      },
      {
        "slug": "n-queens",
        "title": "N-Queens",
        "difficulty": "Hard"
      },
      {
        "slug": "sudoku-solver",
        "title": "Sudoku Solver",
        "difficulty": "Hard"
      }
    ]
  },
  {
    "id": "binary-trees",
    "name": "Binary Trees",
    "tip": "Most tree problems are a DFS that returns something useful from each subtree.",
    "problems": [
      {
        "slug": "maximum-depth-of-binary-tree",
        "title": "Maximum Depth of Binary Tree",
        "difficulty": "Easy"
      },
      {
        "slug": "invert-binary-tree",
        "title": "Invert Binary Tree",
        "difficulty": "Easy"
      },
      {
        "slug": "same-tree",
        "title": "Same Tree",
        "difficulty": "Easy"
      },
      {
        "slug": "symmetric-tree",
        "title": "Symmetric Tree",
        "difficulty": "Easy"
      },
      {
        "slug": "subtree-of-another-tree",
        "title": "Subtree of Another Tree",
        "difficulty": "Easy"
      },
      {
        "slug": "diameter-of-binary-tree",
        "title": "Diameter of Binary Tree",
        "difficulty": "Easy"
      },
      {
        "slug": "balanced-binary-tree",
        "title": "Balanced Binary Tree",
        "difficulty": "Easy"
      },
      {
        "slug": "binary-tree-level-order-traversal",
        "title": "Binary Tree Level Order Traversal",
        "difficulty": "Medium"
      },
      {
        "slug": "binary-tree-right-side-view",
        "title": "Binary Tree Right Side View",
        "difficulty": "Medium"
      },
      {
        "slug": "count-good-nodes-in-binary-tree",
        "title": "Count Good Nodes in Binary Tree",
        "difficulty": "Medium"
      },
      {
        "slug": "lowest-common-ancestor-of-a-binary-tree",
        "title": "Lowest Common Ancestor of a Binary Tree",
        "difficulty": "Medium"
      },
      {
        "slug": "construct-binary-tree-from-preorder-and-inorder-traversal",
        "title": "Construct Binary Tree from Preorder and Inorder Traversal",
        "difficulty": "Medium"
      },
      {
        "slug": "binary-tree-maximum-path-sum",
        "title": "Binary Tree Maximum Path Sum",
        "difficulty": "Hard"
      },
      {
        "slug": "serialize-and-deserialize-binary-tree",
        "title": "Serialize and Deserialize Binary Tree",
        "difficulty": "Hard"
      }
    ]
  },
  {
    "id": "binary-search-trees",
    "name": "Binary Search Trees",
    "tip": "Inorder traversal of a BST is sorted; use the ordering to prune.",
    "problems": [
      {
        "slug": "convert-sorted-array-to-binary-search-tree",
        "title": "Convert Sorted Array to Binary Search Tree",
        "difficulty": "Easy"
      },
      {
        "slug": "insert-into-a-binary-search-tree",
        "title": "Insert into a Binary Search Tree",
        "difficulty": "Medium"
      },
      {
        "slug": "validate-binary-search-tree",
        "title": "Validate Binary Search Tree",
        "difficulty": "Medium"
      },
      {
        "slug": "kth-smallest-element-in-a-bst",
        "title": "Kth Smallest Element in a BST",
        "difficulty": "Medium"
      },
      {
        "slug": "lowest-common-ancestor-of-a-binary-search-tree",
        "title": "Lowest Common Ancestor of a Binary Search Tree",
        "difficulty": "Medium"
      },
      {
        "slug": "delete-node-in-a-bst",
        "title": "Delete Node in a BST",
        "difficulty": "Medium"
      }
    ]
  },
  {
    "id": "heaps",
    "name": "Heaps",
    "tip": "Use a heap whenever you need the k smallest/largest or a running median.",
    "problems": [
      {
        "slug": "last-stone-weight",
        "title": "Last Stone Weight",
        "difficulty": "Easy"
      },
      {
        "slug": "kth-largest-element-in-a-stream",
        "title": "Kth Largest Element in a Stream",
        "difficulty": "Easy"
      },
      {
        "slug": "kth-largest-element-in-an-array",
        "title": "Kth Largest Element in an Array",
        "difficulty": "Medium"
      },
      {
        "slug": "k-closest-points-to-origin",
        "title": "K Closest Points to Origin",
        "difficulty": "Medium"
      },
      {
        "slug": "task-scheduler",
        "title": "Task Scheduler",
        "difficulty": "Medium"
      },
      {
        "slug": "find-median-from-data-stream",
        "title": "Find Median from Data Stream",
        "difficulty": "Hard"
      }
    ]
  },
  {
    "id": "graphs",
    "name": "Graphs",
    "tip": "BFS for shortest paths in unweighted graphs, DFS for connectivity, topological sort for dependencies.",
    "problems": [
      {
        "slug": "flood-fill",
        "title": "Flood Fill",
        "difficulty": "Easy"
      },
      {
        "slug": "number-of-islands",
        "title": "Number of Islands",
        "difficulty": "Medium"
      },
      {
        "slug": "number-of-provinces",
        "title": "Number of Provinces",
        "difficulty": "Medium"
      },
      {
        "slug": "clone-graph",
        "title": "Clone Graph",
        "difficulty": "Medium"
      },
      {
        "slug": "rotting-oranges",
        "title": "Rotting Oranges",
        "difficulty": "Medium"
      },
      {
        "slug": "surrounded-regions",
        "title": "Surrounded Regions",
        "difficulty": "Medium"
      },
      {
        "slug": "pacific-atlantic-water-flow",
        "title": "Pacific Atlantic Water Flow",
        "difficulty": "Medium"
      },
      {
        "slug": "is-graph-bipartite",
        "title": "Is Graph Bipartite?",
        "difficulty": "Medium"
      },
      {
        "slug": "course-schedule",
        "title": "Course Schedule",
        "difficulty": "Medium"
      },
      {
        "slug": "course-schedule-ii",
        "title": "Course Schedule II",
        "difficulty": "Medium"
      },
      {
        "slug": "redundant-connection",
        "title": "Redundant Connection",
        "difficulty": "Medium"
      },
      {
        "slug": "network-delay-time",
        "title": "Network Delay Time",
        "difficulty": "Medium"
      },
      {
        "slug": "cheapest-flights-within-k-stops",
        "title": "Cheapest Flights Within K Stops",
        "difficulty": "Medium"
      },
      {
        "slug": "min-cost-to-connect-all-points",
        "title": "Min Cost to Connect All Points",
        "difficulty": "Medium"
      },
      {
        "slug": "word-ladder",
        "title": "Word Ladder",
        "difficulty": "Hard"
      }
    ]
  },
  {
    "id": "greedy",
    "name": "Greedy",
    "tip": "Make the locally best choice, but prove (or test) that it leads to the global best.",
    "problems": [
      {
        "slug": "assign-cookies",
        "title": "Assign Cookies",
        "difficulty": "Easy"
      },
      {
        "slug": "jump-game",
        "title": "Jump Game",
        "difficulty": "Medium"
      },
      {
        "slug": "jump-game-ii",
        "title": "Jump Game II",
        "difficulty": "Medium"
      },
      {
        "slug": "gas-station",
        "title": "Gas Station",
        "difficulty": "Medium"
      },
      {
        "slug": "partition-labels",
        "title": "Partition Labels",
        "difficulty": "Medium"
      },
      {
        "slug": "candy",
        "title": "Candy",
        "difficulty": "Hard"
      }
    ]
  },
  {
    "id": "dynamic-programming",
    "name": "Dynamic Programming",
    "tip": "Define the state, write the recurrence, then memoize or build a table.",
    "problems": [
      {
        "slug": "climbing-stairs",
        "title": "Climbing Stairs",
        "difficulty": "Easy"
      },
      {
        "slug": "min-cost-climbing-stairs",
        "title": "Min Cost Climbing Stairs",
        "difficulty": "Easy"
      },
      {
        "slug": "house-robber",
        "title": "House Robber",
        "difficulty": "Medium"
      },
      {
        "slug": "house-robber-ii",
        "title": "House Robber II",
        "difficulty": "Medium"
      },
      {
        "slug": "coin-change",
        "title": "Coin Change",
        "difficulty": "Medium"
      },
      {
        "slug": "coin-change-ii",
        "title": "Coin Change II",
        "difficulty": "Medium"
      },
      {
        "slug": "unique-paths",
        "title": "Unique Paths",
        "difficulty": "Medium"
      },
      {
        "slug": "decode-ways",
        "title": "Decode Ways",
        "difficulty": "Medium"
      },
      {
        "slug": "word-break",
        "title": "Word Break",
        "difficulty": "Medium"
      },
      {
        "slug": "longest-increasing-subsequence",
        "title": "Longest Increasing Subsequence",
        "difficulty": "Medium"
      },
      {
        "slug": "longest-common-subsequence",
        "title": "Longest Common Subsequence",
        "difficulty": "Medium"
      },
      {
        "slug": "partition-equal-subset-sum",
        "title": "Partition Equal Subset Sum",
        "difficulty": "Medium"
      },
      {
        "slug": "target-sum",
        "title": "Target Sum",
        "difficulty": "Medium"
      },
      {
        "slug": "edit-distance",
        "title": "Edit Distance",
        "difficulty": "Medium"
      },
      {
        "slug": "best-time-to-buy-and-sell-stock-with-cooldown",
        "title": "Best Time to Buy and Sell Stock with Cooldown",
        "difficulty": "Medium"
      },
      {
        "slug": "burst-balloons",
        "title": "Burst Balloons",
        "difficulty": "Hard"
      },
      {
        "slug": "regular-expression-matching",
        "title": "Regular Expression Matching",
        "difficulty": "Hard"
      }
    ]
  },
  {
    "id": "tries",
    "name": "Tries",
    "tip": "Prefix trees for autocomplete and word search problems.",
    "problems": [
      {
        "slug": "implement-trie-prefix-tree",
        "title": "Implement Trie (Prefix Tree)",
        "difficulty": "Medium"
      },
      {
        "slug": "design-add-and-search-words-data-structure",
        "title": "Design Add and Search Words Data Structure",
        "difficulty": "Medium"
      },
      {
        "slug": "word-search-ii",
        "title": "Word Search II",
        "difficulty": "Hard"
      }
    ]
  },
  {
    "id": "bit-manipulation",
    "name": "Bit Manipulation",
    "tip": "XOR tricks and bit counting; small but frequent in interviews.",
    "problems": [
      {
        "slug": "single-number",
        "title": "Single Number",
        "difficulty": "Easy"
      },
      {
        "slug": "number-of-1-bits",
        "title": "Number of 1 Bits",
        "difficulty": "Easy"
      },
      {
        "slug": "counting-bits",
        "title": "Counting Bits",
        "difficulty": "Easy"
      },
      {
        "slug": "missing-number",
        "title": "Missing Number",
        "difficulty": "Easy"
      },
      {
        "slug": "reverse-bits",
        "title": "Reverse Bits",
        "difficulty": "Easy"
      },
      {
        "slug": "sum-of-two-integers",
        "title": "Sum of Two Integers",
        "difficulty": "Medium"
      }
    ]
  }
];

export const problemUrl = (slug: string) => `https://leetcode.com/problems/${slug}/`;

export const totalProblems = dsaTopics.reduce((sum, topic) => sum + topic.problems.length, 0);
