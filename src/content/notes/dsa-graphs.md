---
title: "Graphs: Representation, BFS, DFS and Topological Sort"
description: Graph basics, adjacency lists and matrices, BFS and DFS with diagrams, connected components, grids as graphs, cycle detection in undirected and directed graphs, bipartite check and topological sort with Kahn's algorithm, in C++.
author: Bitwise School
---

A **graph** is a set of **nodes** (vertices) joined by **edges**. Maps, social networks, course prerequisites, web links, and even a grid of land and water are all graphs. Most graph questions come down to walking the graph with **BFS** or **DFS** and remembering what you've already visited.

## Words you need

- **Directed** edges have a direction (A follows B); **undirected** edges go both ways (A is friends with B).
- **Weighted** edges carry a cost or distance.
- **Degree**: the number of edges at a node. In directed graphs, split into **in-degree** and **out-degree**.
- **Path**, **cycle** (a path that returns to its start), **connected component** (a group of nodes that can all reach each other).
- A **DAG** is a directed acyclic graph: directed, with no cycles.
- V = number of nodes, E = number of edges.

## Storing a graph

![A five-node graph with its adjacency list and adjacency matrix](/images/dsa/graph-representation.svg "The same graph three ways. Each undirected edge appears twice in the list and twice in the matrix.")

- **Adjacency list**: for each node, the list of its neighbours. O(V + E) memory. Use this almost always.
- **Adjacency matrix**: a V × V grid where `m[u][v] = 1` if there's an edge. O(V²) memory, but checks for one edge in O(1). Fine for small, dense graphs.

```cpp
int n = 5;                                              // nodes 0 .. n-1
vector<pair<int, int>> edges = {{0, 1}, {0, 2}, {1, 2}, {1, 3}, {3, 4}};
vector<vector<int>> adj(n);
for (auto [u, v] : edges) {
    adj[u].push_back(v);
    adj[v].push_back(u);                                // leave this out for a directed graph
}
```

## Breadth-first search (BFS)

BFS explores in **rings**: first every node 1 edge away, then 2 edges away, and so on. It uses a **queue**, and in an unweighted graph it finds the **shortest path** (fewest edges) from the start to every node.

![BFS from node 0 visiting nodes in order of their distance 0, 1, 2 and 3](/images/dsa/graph-bfs.svg "Numbers show the visit order. Columns are distances from node 0; blue edges form the BFS tree.")

```cpp
vector<int> bfs(const vector<vector<int>>& adj, int start) {
    vector<int> dist(adj.size(), -1);        // -1 = not visited yet
    queue<int> q;
    dist[start] = 0;
    q.push(start);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        for (int v : adj[u]) {
            if (dist[v] == -1) {             // mark when you push, not when you pop
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
    return dist;                             // fewest edges from start to every node
}
```

Marking a node visited **when it is pushed** matters: marking only when it is popped lets the same node enter the queue many times.

## Depth-first search (DFS)

DFS goes **as deep as it can** along one path, and backs up only at a dead end. It uses recursion (or an explicit stack).

![DFS from node 0 going 0, 1, 3, then backing up to 4, 6, 5 and 2](/images/dsa/graph-dfs.svg "Same graph as above: DFS visits 0 1 3 4 6 5 2, backing up after the dead end at 3.")

DFS is the natural tool for connected components, cycle detection, topological sort and exploring every path. Here it is with a component counter:

```cpp
void dfs(const vector<vector<int>>& adj, int u, vector<bool>& visited, vector<int>& order) {
    visited[u] = true;
    order.push_back(u);
    for (int v : adj[u])
        if (!visited[v]) dfs(adj, v, visited, order);
}

int countComponents(const vector<vector<int>>& adj) {
    int n = adj.size(), components = 0;
    vector<bool> visited(n, false);
    vector<int> order;
    for (int u = 0; u < n; u++) {
        if (!visited[u]) {
            components++;
            dfs(adj, u, visited, order);     // marks the whole component
        }
    }
    return components;
}
```

Both BFS and DFS visit every node and edge once: **O(V + E)** time and O(V) extra space.

## Grids are graphs too

In a grid, each cell is a node and its up, down, left and right neighbours are its edges. Direction arrays keep the code short. Counting islands is counting connected components of land:

```cpp
int numIslands(vector<vector<char>>& grid) {
    int rows = grid.size(), cols = grid[0].size(), islands = 0;
    const int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] != '1') continue;
            islands++;
            grid[r][c] = '0';                             // sink the island as we visit it
            queue<pair<int, int>> q;
            q.push({r, c});
            while (!q.empty()) {
                auto [x, y] = q.front();
                q.pop();
                for (int k = 0; k < 4; k++) {
                    int nx = x + dr[k], ny = y + dc[k];
                    if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && grid[nx][ny] == '1') {
                        grid[nx][ny] = '0';
                        q.push({nx, ny});
                    }
                }
            }
        }
    }
    return islands;
}
```

**Multi-source BFS** starts with many cells in the queue at once (every rotten orange, every gate). All sources then spread together, one ring at a time.

## Cycle detection

**Undirected graph**: during DFS, meeting an already-visited node that isn't the one you just came from means a cycle.

```cpp
bool hasCycleUndirected(const vector<vector<int>>& adj, int u, int parent, vector<bool>& visited) {
    visited[u] = true;
    for (int v : adj[u]) {
        if (!visited[v]) {
            if (hasCycleUndirected(adj, v, u, visited)) return true;
        } else if (v != parent) {
            return true;                     // visited, and not where we came from
        }
    }
    return false;
}
```

**Directed graph**: "visited" isn't enough, because two paths may legally reach the same node. A cycle exists only if you reach a node that is **still on the current DFS path**. Track three states:

```cpp
// state: 0 = not visited, 1 = on the current path, 2 = finished
bool hasCycleDirected(const vector<vector<int>>& adj, int u, vector<int>& state) {
    state[u] = 1;
    for (int v : adj[u]) {
        if (state[v] == 1) return true;      // back to a node on the current path
        if (state[v] == 0 && hasCycleDirected(adj, v, state)) return true;
    }
    state[u] = 2;
    return false;
}
```

Call both for every unvisited node, since the graph may have several components.

## Bipartite graphs

A graph is **bipartite** if you can colour every node with one of two colours so that every edge joins different colours. Colour with BFS and look for an edge inside one colour:

```cpp
bool isBipartite(const vector<vector<int>>& adj) {
    int n = adj.size();
    vector<int> color(n, -1);
    for (int s = 0; s < n; s++) {
        if (color[s] != -1) continue;
        color[s] = 0;
        queue<int> q;
        q.push(s);
        while (!q.empty()) {
            int u = q.front();
            q.pop();
            for (int v : adj[u]) {
                if (color[v] == -1) {
                    color[v] = 1 - color[u];     // neighbours get the other colour
                    q.push(v);
                } else if (color[v] == color[u]) {
                    return false;                // an edge inside one colour
                }
            }
        }
    }
    return true;
}
```

## Topological sort

In a DAG of tasks and prerequisites, a **topological order** lists every node before all the nodes it points to. For courses: take each course only after its prerequisites.

![Course graph Maths, Programming and DBMS leading to DSA and Web Dev and then Projects](/images/dsa/graph-topo-sort.svg "In-degree = number of arrows coming in. Nodes with in-degree 0 can go first.")

**Kahn's algorithm** repeatedly takes a node with in-degree 0, outputs it, and removes its outgoing edges:

```cpp
// A topological order, or an empty vector if the graph has a cycle.
vector<int> topoSort(const vector<vector<int>>& adj) {
    int n = adj.size();
    vector<int> indegree(n, 0), order;
    for (int u = 0; u < n; u++)
        for (int v : adj[u]) indegree[v]++;
    queue<int> q;
    for (int u = 0; u < n; u++)
        if (indegree[u] == 0) q.push(u);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        order.push_back(u);
        for (int v : adj[u])
            if (--indegree[v] == 0) q.push(v);   // all its prerequisites are done
    }
    if ((int)order.size() < n) return {};       // leftover nodes sit on a cycle
    return order;
}
```

This also answers "can all courses be finished?": yes exactly when the graph has no cycle. The DFS alternative adds each node to a list when it **finishes** and reverses the list at the end.

## Common mistakes

- **No visited check**, so the walk loops forever on a cycle.
- Adding an undirected edge **only one way**.
- Recursive DFS on a 10⁶-cell grid can **overflow the stack**. Use BFS or an explicit stack for very large inputs.
- Forgetting that the graph may be **disconnected**: loop over all nodes and start a search from each unvisited one.
- Using BFS for shortest paths when edges have **different weights**; that needs [Dijkstra](/notes/dsa-shortest-paths-mst).

## Practice

- [Flood Fill](https://leetcode.com/problems/flood-fill/), [Number of Islands](https://leetcode.com/problems/number-of-islands/), [Number of Provinces](https://leetcode.com/problems/number-of-provinces/)
- [Rotting Oranges](https://leetcode.com/problems/rotting-oranges/) (multi-source BFS), [Clone Graph](https://leetcode.com/problems/clone-graph/)
- [Is Graph Bipartite?](https://leetcode.com/problems/is-graph-bipartite/), [Surrounded Regions](https://leetcode.com/problems/surrounded-regions/)
- [Course Schedule](https://leetcode.com/problems/course-schedule/), [Course Schedule II](https://leetcode.com/problems/course-schedule-ii/)
- [Word Ladder](https://leetcode.com/problems/word-ladder/) (hard)

Next: [shortest paths and minimum spanning trees](/notes/dsa-shortest-paths-mst).
