---
title: Binary Search Trees
description: The BST property, search, insert and delete with diagrams, validating a BST, kth smallest, LCA in a BST, building a balanced BST from a sorted array, floor and range sum, and why balanced trees such as AVL and red-black trees matter, in C++.
author: Bitwise School
---

A **binary search tree (BST)** is a binary tree with one extra rule that makes searching fast:

> For every node, **all** keys in its left subtree are smaller and **all** keys in its right subtree are bigger.

![BST rooted at 8 with its left subtree shaded as keys below 8 and its right subtree as keys above 8](/images/dsa/bst-property.svg "The rule holds for every subtree, and an inorder traversal lists the keys in sorted order.")

Two consequences power every BST question:

1. At any node you know which side a key must be on, so a search discards a whole subtree per step: **O(h)** time, where h is the height.
2. An **inorder traversal gives the keys in sorted order**.

The `TreeNode` struct is the one from [binary trees](/notes/dsa-binary-trees).

## Search

![Search path for 7 going left at 8, right at 3 and right at 6](/images/dsa/bst-search.svg "One comparison per level: 7 is found after visiting 8, 3 and 6.")

```cpp
TreeNode* searchBST(TreeNode* root, int key) {
    while (root && root->val != key)
        root = (key < root->val) ? root->left : root->right;
    return root;                            // nullptr if the key is absent
}
```

## Insert

Search for the key; where the search falls off the tree is exactly where the new node belongs.

```cpp
TreeNode* insertBST(TreeNode* root, int key) {
    if (!root) return new TreeNode(key);
    if (key < root->val) root->left = insertBST(root->left, key);
    else if (key > root->val) root->right = insertBST(root->right, key);
    return root;                            // duplicates are ignored
}
```

## Delete: three cases

![Deleting a leaf, a node with one child and a node with two children](/images/dsa/bst-delete-cases.svg "With two children, copy in the inorder successor, then delete the successor from the right subtree.")

1. **Leaf**: just remove it.
2. **One child**: link the parent directly to that child.
3. **Two children**: replace the node's key with its **inorder successor** (the smallest key in its right subtree), then delete that successor, which has at most one child.

```cpp
TreeNode* deleteBST(TreeNode* root, int key) {
    if (!root) return nullptr;
    if (key < root->val) {
        root->left = deleteBST(root->left, key);
    } else if (key > root->val) {
        root->right = deleteBST(root->right, key);
    } else {
        if (!root->left) {                           // no children, or only a right child
            TreeNode* child = root->right;
            delete root;
            return child;
        }
        if (!root->right) {                          // only a left child
            TreeNode* child = root->left;
            delete root;
            return child;
        }
        TreeNode* succ = root->right;                // two children
        while (succ->left) succ = succ->left;        // smallest key on the right
        root->val = succ->val;
        root->right = deleteBST(root->right, succ->val);
    }
    return root;
}
```

## Validate a BST

The classic wrong answer only compares each node with its two children. That misses cases like a 6 hidden deep in the right subtree of 8. Instead, pass down the **range of allowed values**:

```cpp
bool validate(TreeNode* node, long long low, long long high) {
    if (!node) return true;
    if (node->val <= low || node->val >= high) return false;
    return validate(node->left, low, node->val) && validate(node->right, node->val, high);
}

bool isValidBST(TreeNode* root) { return validate(root, LLONG_MIN, LLONG_MAX); }
```

(`long long` bounds let the tree legally contain `INT_MIN` and `INT_MAX`.) Another way: do an inorder traversal and check that the values are strictly increasing.

## Queries that use the ordering

### k-th smallest

Inorder visits keys in sorted order, so stop at the k-th visit:

```cpp
int kthSmallest(TreeNode* root, int k) {
    stack<TreeNode*> st;
    TreeNode* cur = root;
    while (cur || !st.empty()) {
        while (cur) { st.push(cur); cur = cur->left; }
        cur = st.top();
        st.pop();
        if (--k == 0) return cur->val;       // the k-th key in sorted order
        cur = cur->right;
    }
    return -1;                               // fewer than k keys
}
```

### Lowest common ancestor in a BST

If both keys are smaller than the node, go left; if both are bigger, go right. Otherwise they split here, and this node is the LCA. O(h), no recursion needed.

```cpp
TreeNode* lcaBST(TreeNode* root, int a, int b) {
    while (root) {
        if (a < root->val && b < root->val) root = root->left;
        else if (a > root->val && b > root->val) root = root->right;
        else return root;
    }
    return nullptr;
}
```

### Floor: the largest key ≤ x

```cpp
int floorBST(TreeNode* root, int x) {        // -1 if no key is <= x
    int answer = -1;
    while (root) {
        if (root->val == x) return x;
        if (root->val < x) { answer = root->val; root = root->right; }   // candidate; try bigger
        else root = root->left;
    }
    return answer;
}
```

The ceiling is the mirror image.

### Range sum: skip whole subtrees

```cpp
int rangeSumBST(TreeNode* root, int low, int high) {
    if (!root) return 0;
    if (root->val < low) return rangeSumBST(root->right, low, high);    // left side is all too small
    if (root->val > high) return rangeSumBST(root->left, low, high);    // right side is all too big
    return root->val + rangeSumBST(root->left, low, high) + rangeSumBST(root->right, low, high);
}
```

### Build a balanced BST from a sorted array

Make the middle item the root; the halves become the subtrees.

```cpp
TreeNode* sortedArrayToBST(const vector<int>& a, int lo, int hi) {
    if (lo > hi) return nullptr;
    int mid = lo + (hi - lo) / 2;
    TreeNode* root = new TreeNode(a[mid]);
    root->left = sortedArrayToBST(a, lo, mid - 1);
    root->right = sortedArrayToBST(a, mid + 1, hi);
    return root;
}
```

For **two sum in a BST**, take the inorder list (already sorted) and run [two pointers](/notes/dsa-arrays-patterns), or walk two BST iterators from both ends.

## Why balance matters

Every operation above is O(h). A BST built from random keys has h ≈ O(log n), but inserting keys **in sorted order** builds a skewed tree with h = n, and everything degrades to O(n).

**Self-balancing BSTs** fix this by restructuring the tree with **rotations** after inserts and deletes:

- **AVL trees** keep the heights of every node's two subtrees within 1 of each other.
- **Red-black trees** use node colours to keep the height at most about 2 log n. C++ `set` and `map` are red-black trees, which is why their operations are guaranteed **O(log n)**.

You're rarely asked to code these in full, but you should explain why they exist and what a rotation does: it moves one node up and its parent down while keeping the inorder order unchanged.

| Operation | BST (average) | BST (worst, skewed) | Balanced BST |
| --- | --- | --- | --- |
| search, insert, delete | O(log n) | O(n) | O(log n) |
| min, max, floor, ceil | O(log n) | O(n) | O(log n) |
| list all keys in order | O(n) | O(n) | O(n) |

## Common mistakes

- Validating with only parent and child comparisons.
- Forgetting to reassign `root->left = …` in recursive insert and delete, so the change never reaches the tree.
- Assuming a BST is balanced when stating complexity.
- Ignoring duplicate keys; decide whether they go left, right or are rejected.

## Practice

- [Insert into a Binary Search Tree](https://leetcode.com/problems/insert-into-a-binary-search-tree/), [Delete Node in a BST](https://leetcode.com/problems/delete-node-in-a-bst/)
- [Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree/), [Kth Smallest Element in a BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/)
- [Lowest Common Ancestor of a Binary Search Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/)
- [Convert Sorted Array to Binary Search Tree](https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree/)

Next: [graphs, BFS and DFS](/notes/dsa-graphs).
