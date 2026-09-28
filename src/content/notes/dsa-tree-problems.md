---
title: Tree Height, Diameter, Views and LCA
description: The binary tree patterns asked in interviews, with diagrams and C++ code: height and depth, balanced check, diameter, path sums and maximum path sum, left, right, top and bottom views, lowest common ancestor, building a tree from traversals and serialisation.
author: Bitwise School
---

Once you can traverse a tree, most interview questions are the same traversal with a small twist. This note walks through the patterns that come up again and again. Every solution is **O(n)**: each node is visited a constant number of times. The `TreeNode` struct is the one from [binary trees](/notes/dsa-binary-trees).

## Height and depth

![Tree with depth labels per level and a height tag on every node](/images/dsa/tree-height-depth.svg "Depth grows as you go down from the root; height grows as you go up from the leaves.")

- **Depth** is measured **top-down** from the root, so pass it down as a parameter.
- **Height** is measured **bottom-up** from the leaves, so compute it from the children's answers.

```cpp
int height(TreeNode* root) {               // in edges: a leaf is 0, an empty tree is −1
    if (!root) return -1;
    return 1 + max(height(root->left), height(root->right));
}

void printDepths(TreeNode* node, int depth) {
    if (!node) return;
    cout << node->val << " is at depth " << depth << '\n';
    printDepths(node->left, depth + 1);
    printDepths(node->right, depth + 1);
}
```

Many problems (like LeetCode's "maximum depth") count **nodes** instead of edges: return 0 for an empty tree and a leaf becomes 1. Check which one the question wants.

## Balanced or not

A tree is height-balanced if, at every node, the left and right heights differ by at most 1. Checking every node separately is O(n²). Instead, compute heights bottom-up and return **−1 as a signal** as soon as any subtree is unbalanced:

```cpp
// Height in nodes, or −1 if this subtree is not balanced.
int checkHeight(TreeNode* root) {
    if (!root) return 0;
    int lh = checkHeight(root->left);
    if (lh == -1) return -1;
    int rh = checkHeight(root->right);
    if (rh == -1) return -1;
    if (abs(lh - rh) > 1) return -1;
    return 1 + max(lh, rh);
}

bool isBalanced(TreeNode* root) { return checkHeight(root) != -1; }
```

## Diameter

The diameter is the longest path between **any** two nodes. That path bends at some node, going down its left side and down its right side, so at every node the longest path through it is `left height + right height` (heights in nodes). Keep the maximum.

![Tree with the longest path from 8 up to the root and down to 9 highlighted](/images/dsa/tree-diameter.svg "Here the longest path passes through the root, but it doesn't have to, so check every node.")

```cpp
int depth(TreeNode* root, int& best) {     // returns height in nodes; best = diameter in edges
    if (!root) return 0;
    int left = depth(root->left, best);
    int right = depth(root->right, best);
    best = max(best, left + right);        // the longest path that bends here
    return 1 + max(left, right);           // a parent can extend only one side
}

int diameterOfBinaryTree(TreeNode* root) {
    int best = 0;
    depth(root, best);
    return best;
}
```

This "return one thing to the parent, update a global answer with another" shape is the key to many hard tree problems.

## Path sums

**Root-to-leaf path with a given sum** (top-down: subtract as you go):

```cpp
bool hasPathSum(TreeNode* root, int target) {
    if (!root) return false;
    if (!root->left && !root->right) return root->val == target;   // at a leaf
    return hasPathSum(root->left, target - root->val) ||
           hasPathSum(root->right, target - root->val);
}
```

**Maximum path sum anywhere** (bottom-up, same shape as the diameter). Negative branches are dropped by taking `max(0, …)`:

```cpp
int maxGain(TreeNode* root, int& best) {   // best downward path starting at root
    if (!root) return 0;
    int left = max(0, maxGain(root->left, best));
    int right = max(0, maxGain(root->right, best));
    best = max(best, root->val + left + right);     // a path that bends at root
    return root->val + max(left, right);            // the parent may use one side
}

int maxPathSum(TreeNode* root) {
    int best = INT_MIN;                    // the answer may be negative
    maxGain(root, best);
    return best;
}
```

## Views of a tree

![Tree drawn on horizontal-distance columns with its top, bottom, left and right views listed](/images/dsa/tree-views.svg "Give the root hd 0, a left child hd − 1 and a right child hd + 1.")

**Left and right views** come straight from level order: the first node of each level is the left view, the last one is the right view.

```cpp
vector<int> rightView(TreeNode* root) {
    vector<int> view;
    if (!root) return view;
    queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        int size = q.size();
        for (int i = 0; i < size; i++) {
            TreeNode* node = q.front();
            q.pop();
            if (i == size - 1) view.push_back(node->val);   // last on this level (i == 0 for the left view)
            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
    }
    return view;
}
```

**Top and bottom views** group nodes by **horizontal distance** (hd). Walk the tree level by level: the first node you meet in each column is the top view, the last one is the bottom view. A `map` keeps the columns sorted from left to right.

```cpp
pair<vector<int>, vector<int>> topAndBottomView(TreeNode* root) {
    map<int, int> top, bottom;                        // hd -> value, sorted by hd
    queue<pair<TreeNode*, int>> q;
    if (root) q.push({root, 0});
    while (!q.empty()) {
        auto [node, hd] = q.front();
        q.pop();
        if (!top.count(hd)) top[hd] = node->val;      // first node in this column
        bottom[hd] = node->val;                       // keep overwriting: the last one wins
        if (node->left) q.push({node->left, hd - 1});
        if (node->right) q.push({node->right, hd + 1});
    }
    vector<int> topView, bottomView;
    for (auto& [hd, v] : top) topView.push_back(v);
    for (auto& [hd, v] : bottom) bottomView.push_back(v);
    return {topView, bottomView};
}
```

**Vertical order** is the same idea, keeping every node in a column instead of just one. **Boundary traversal** is the left boundary (top-down), then the leaves (left to right), then the right boundary (bottom-up).

## Lowest common ancestor (LCA)

The LCA of two nodes is the **deepest node that has both of them in its subtree**. A node counts as its own ancestor.

![Tree where nodes 6 and 4 are highlighted and their lowest common ancestor 5 is marked](/images/dsa/tree-lca.svg "6 is in 5's left subtree and 4 is in its right subtree, so 5 is where their paths meet.")

Ask both subtrees. If each side finds one of the nodes, this node is the LCA; otherwise pass up whatever was found.

```cpp
TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
    if (!root || root == p || root == q) return root;
    TreeNode* left = lowestCommonAncestor(root->left, p, q);
    TreeNode* right = lowestCommonAncestor(root->right, p, q);
    if (left && right) return root;       // p and q are on different sides
    return left ? left : right;           // both on one side, or not found
}
```

In a BST it is even simpler: see [binary search trees](/notes/dsa-bst).

## Mirror and symmetry

```cpp
bool isMirror(TreeNode* a, TreeNode* b) {
    if (!a || !b) return a == b;          // both empty, or only one empty
    return a->val == b->val && isMirror(a->left, b->right) && isMirror(a->right, b->left);
}

bool isSymmetric(TreeNode* root) { return !root || isMirror(root->left, root->right); }
```

## Build a tree from preorder and inorder

The first preorder value is the root. Its position in the inorder array splits the rest into the left and right subtrees. A hash map finds that position in O(1).

```cpp
TreeNode* build(const vector<int>& pre, int& idx, int lo, int hi, unordered_map<int, int>& pos) {
    if (lo > hi) return nullptr;
    TreeNode* root = new TreeNode(pre[idx++]);   // next preorder value is the root
    int mid = pos[root->val];                    // its place in inorder
    root->left = build(pre, idx, lo, mid - 1, pos);
    root->right = build(pre, idx, mid + 1, hi, pos);
    return root;
}

TreeNode* buildTree(const vector<int>& preorder, const vector<int>& inorder) {
    unordered_map<int, int> pos;                 // value -> index in inorder (unique values)
    for (int i = 0; i < (int)inorder.size(); i++) pos[inorder[i]] = i;
    int idx = 0;
    return build(preorder, idx, 0, (int)inorder.size() - 1, pos);
}
```

Preorder alone isn't enough to rebuild a tree, unless you also record where the empty children are. That's how **serialisation** works:

```cpp
void serialize(TreeNode* root, string& out) {
    if (!root) { out += "# "; return; }          // mark empty children
    out += to_string(root->val) + " ";
    serialize(root->left, out);
    serialize(root->right, out);
}

TreeNode* deserialize(istringstream& in) {
    string token;
    in >> token;
    if (token == "#") return nullptr;
    TreeNode* root = new TreeNode(stoi(token));
    root->left = deserialize(in);
    root->right = deserialize(in);
    return root;
}
```

## Common mistakes

- Computing the height inside another recursion again and again (O(n²)). Return it once, bottom-up.
- Assuming the diameter always passes through the root.
- Starting `best` at 0 in the maximum path sum: every value might be negative.
- In the views, walking the tree depth-first without tracking depth, so a deeper node can overwrite a shallower one in the top view.

## Practice

- [Diameter of Binary Tree](https://leetcode.com/problems/diameter-of-binary-tree/), [Balanced Binary Tree](https://leetcode.com/problems/balanced-binary-tree/)
- [Binary Tree Right Side View](https://leetcode.com/problems/binary-tree-right-side-view/), [Count Good Nodes in Binary Tree](https://leetcode.com/problems/count-good-nodes-in-binary-tree/)
- [Lowest Common Ancestor of a Binary Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/)
- [Construct Binary Tree from Preorder and Inorder Traversal](https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/)
- [Binary Tree Maximum Path Sum](https://leetcode.com/problems/binary-tree-maximum-path-sum/), [Serialize and Deserialize Binary Tree](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/) (hard)

Next: [binary search trees](/notes/dsa-bst).
