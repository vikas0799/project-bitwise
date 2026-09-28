---
title: Binary Trees and Traversals
description: Tree terminology, types of binary trees, preorder, inorder, postorder and level order traversal with diagrams, recursive and iterative code, Morris traversal in O(1) space, and how to think about tree problems in C++.
author: Bitwise School
---

A tree stores data in a hierarchy: a folder structure, an HTML page, a company org chart, a family tree. A **binary tree** is a tree where every node has **at most two children**, called left and right. Almost every tree question is solved by walking the tree in the right order while carrying the right information, so traversals are the foundation.

## Words you need

![Tree with root A, children B and C, leaves D, G and F, and the subtree of C marked](/images/dsa/tree-terminology.svg "Levels count from 0 at the root. This tree has height 3.")

- **Root**: the top node, with no parent. **Leaf**: a node with no children.
- **Parent, child, siblings**: B is the parent of D and E; D and E are siblings.
- **Subtree**: a node together with everything below it.
- **Depth** of a node: edges from the root down to it. **Height** of a node: edges on the longest path down to a leaf. The height of the tree is the height of the root.

```cpp
struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int v) : val(v), left(nullptr), right(nullptr) {}
};
```

## Kinds of binary trees

![Full, complete, perfect and skewed binary trees](/images/dsa/tree-types.svg "A heap is a complete tree; a sorted insert order makes a skewed tree.")

- **Full**: every node has 0 or 2 children.
- **Complete**: all levels full except possibly the last, which fills from the left. Heaps use this shape, which is why they fit in an array.
- **Perfect**: every level completely full. A perfect tree of height h has 2^(h+1) − 1 nodes.
- **Balanced**: for every node, the heights of the two subtrees differ by at most 1, so the height stays O(log n).
- **Skewed**: every node has one child. It is really a linked list, with height O(n).

## The four traversals

![A six-node tree with its preorder, inorder, postorder and level order sequences](/images/dsa/tree-traversals.svg "Same tree, four orders. The name says where the root goes: pre (before), in (between), post (after) its subtrees.")

### Depth-first: preorder, inorder, postorder

The three orders differ only in **where you handle the node** compared with its subtrees:

```cpp
void preorder(TreeNode* root, vector<int>& out) {     // root, left, right
    if (!root) return;
    out.push_back(root->val);
    preorder(root->left, out);
    preorder(root->right, out);
}

void inorder(TreeNode* root, vector<int>& out) {      // left, root, right
    if (!root) return;
    inorder(root->left, out);
    out.push_back(root->val);
    inorder(root->right, out);
}

void postorder(TreeNode* root, vector<int>& out) {    // left, right, root
    if (!root) return;
    postorder(root->left, out);
    postorder(root->right, out);
    out.push_back(root->val);
}
```

| Traversal | Order | Use it to |
| --- | --- | --- |
| Preorder | root, left, right | copy or serialise a tree; pass information **down** |
| Inorder | left, root, right | get a [BST](/notes/dsa-bst) in **sorted** order |
| Postorder | left, right, root | compute answers that need the children first (height, size, delete a tree) |
| Level order | level by level | anything about levels, views or the minimum depth |

### Iterative versions (use your own stack)

Recursion uses the call stack; you can do the same with an explicit `stack`. Interviewers ask for this, and it avoids stack overflow on very deep trees.

```cpp
vector<int> preorderIterative(TreeNode* root) {
    vector<int> out;
    if (!root) return out;
    stack<TreeNode*> st;
    st.push(root);
    while (!st.empty()) {
        TreeNode* node = st.top();
        st.pop();
        out.push_back(node->val);
        if (node->right) st.push(node->right);   // push right first
        if (node->left) st.push(node->left);     // so left comes out first
    }
    return out;
}

vector<int> inorderIterative(TreeNode* root) {
    vector<int> out;
    stack<TreeNode*> st;
    TreeNode* cur = root;
    while (cur || !st.empty()) {
        while (cur) {                            // go as far left as possible
            st.push(cur);
            cur = cur->left;
        }
        cur = st.top();
        st.pop();
        out.push_back(cur->val);                 // visit
        cur = cur->right;                        // then the right subtree
    }
    return out;
}
```

For postorder, a neat trick: produce root, right, left with the preorder code (push left first instead), then reverse the result.

### Breadth-first: level order

Use a **queue**. Taking the queue size at the start of each round tells you exactly how many nodes are on the current level.

![Tree split into levels 0, 1 and 2 with the queue after each level](/images/dsa/tree-level-order.svg "The queue holds exactly one level at a time: [1], then [2, 3], then [4, 5, 6].")

```cpp
vector<vector<int>> levelOrder(TreeNode* root) {
    vector<vector<int>> levels;
    if (!root) return levels;
    queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        int size = q.size();                     // nodes on this level
        vector<int> level;
        for (int i = 0; i < size; i++) {
            TreeNode* node = q.front();
            q.pop();
            level.push_back(node->val);
            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
        levels.push_back(level);
    }
    return levels;
}
```

The right side view, zigzag order, level averages and minimum depth are all small changes to this loop.

### Morris traversal: inorder with O(1) extra space

Recursion and stacks need O(h) memory. Morris traversal needs none: before going left, it makes the rightmost node of the left subtree point back to the current node (a temporary "thread"), and removes that thread on the second visit.

```cpp
vector<int> morrisInorder(TreeNode* root) {
    vector<int> out;
    TreeNode* cur = root;
    while (cur) {
        if (!cur->left) {
            out.push_back(cur->val);
            cur = cur->right;
        } else {
            TreeNode* pred = cur->left;          // rightmost node of the left subtree
            while (pred->right && pred->right != cur) pred = pred->right;
            if (!pred->right) {
                pred->right = cur;               // first visit: add the thread, go left
                cur = cur->left;
            } else {
                pred->right = nullptr;           // second visit: remove it, visit, go right
                out.push_back(cur->val);
                cur = cur->right;
            }
        }
    }
    return out;
}
```

The tree is restored by the time the loop ends. Every edge is walked a constant number of times, so it is still O(n).

## Cost of a traversal

Every node is visited once: **O(n) time**. Extra space is **O(h)** for DFS (the stack), which is O(log n) for a balanced tree and O(n) for a skewed one, and **O(w)** for BFS, where w is the widest level (up to n/2).

## How to think about tree problems

Almost every tree problem fits one of two shapes:

- **Top-down**: pass information **down** as parameters (the depth so far, the path sum so far, the allowed range in a BST). Usually preorder.
- **Bottom-up**: ask each child for its answer, then combine (height, size, balanced or not, diameter). Usually postorder.

Two classic warm-ups:

```cpp
int maxDepth(TreeNode* root) {                  // bottom-up
    if (!root) return 0;
    return 1 + max(maxDepth(root->left), maxDepth(root->right));
}

TreeNode* invertTree(TreeNode* root) {          // swap children everywhere
    if (!root) return nullptr;
    swap(root->left, root->right);
    invertTree(root->left);
    invertTree(root->right);
    return root;
}
```

More patterns (height, diameter, views, lowest common ancestor) are in [tree problems](/notes/dsa-tree-problems).

## Common mistakes

- Forgetting the `nullptr` check at the start of a recursive function.
- Mixing up depth (from the root) and height (from the leaves).
- Using `if` instead of a size-based loop in level order, so levels get mixed.
- Assuming a binary tree is a BST: an ordinary binary tree has no ordering.

## Practice

- [Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree/), [Invert Binary Tree](https://leetcode.com/problems/invert-binary-tree/)
- [Same Tree](https://leetcode.com/problems/same-tree/), [Symmetric Tree](https://leetcode.com/problems/symmetric-tree/), [Subtree of Another Tree](https://leetcode.com/problems/subtree-of-another-tree/)
- [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal/), [Binary Tree Right Side View](https://leetcode.com/problems/binary-tree-right-side-view/)

Next: [height, diameter, views and LCA](/notes/dsa-tree-problems).
