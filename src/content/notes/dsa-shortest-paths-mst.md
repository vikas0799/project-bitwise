---
title: Shortest Paths and Minimum Spanning Trees
description: Dijkstra with a priority queue, 0-1 BFS, Bellman-Ford and negative cycles, Floyd-Warshall, choosing the right shortest path algorithm, union-find (DSU), and Kruskal's and Prim's algorithms for minimum spanning trees, with diagrams and C++ code.
author: Bitwise School
---

When edges have **weights** (distances, costs, times), the path with the fewest edges is no longer the cheapest one, so plain BFS stops working. This note covers the algorithms for **shortest paths** and for **minimum spanning trees**, the other classic weighted-graph problem. Graphs are stored as adjacency lists of `(neighbour, weight)` pairs.

## Dijkstra's algorithm

**Problem:** shortest distance from one source to every node, with **non-negative** weights.

**Idea:** always settle the unsettled node with the **smallest known distance**; its distance can't get any smaller. Then **relax** its edges: if going through it gives a neighbour a shorter distance, update that neighbour. A min-heap finds the closest node quickly.

![Weighted graph A to E with shortest distances 0, 3, 1, 4 and 7 and the shortest path tree highlighted](/images/dsa/dijkstra.svg "The direct edge A–B costs 4, but A → C → B costs 1 + 2 = 3, so B's final distance is 3.")

```cpp
// adj[u] = list of (v, weight). Shortest distance from src to every node.
vector<long long> dijkstra(const vector<vector<pair<int, int>>>& adj, int src) {
    const long long INF = LLONG_MAX;
    vector<long long> dist(adj.size(), INF);
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<pair<long long, int>>> pq;
    dist[src] = 0;
    pq.push({0, src});
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;                 // stale entry: u is already settled
        for (auto [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {           // relax the edge u -> v
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;                                   // LLONG_MAX means unreachable
}
```

- Time **O((V + E) log V)**.
- The `if (d > dist[u]) continue;` line skips old heap entries instead of deleting them ("lazy deletion").
- To print the path, store `parent[v] = u` whenever you relax, then walk back from the target.
- **Negative edge weights break it**: a settled node could later get cheaper.

### 0-1 BFS

If every weight is 0 or 1, a **deque** replaces the heap: push 0-weight neighbours to the front and 1-weight ones to the back. O(V + E).

```cpp
vector<int> zeroOneBfs(const vector<vector<pair<int, int>>>& adj, int src) {   // weights 0 or 1
    vector<int> dist(adj.size(), INT_MAX);
    deque<int> dq;
    dist[src] = 0;
    dq.push_back(src);
    while (!dq.empty()) {
        int u = dq.front();
        dq.pop_front();
        for (auto [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                if (w == 0) dq.push_front(v);      // same distance: handle it first
                else dq.push_back(v);
            }
        }
    }
    return dist;
}
```

## Bellman-Ford: negative weights allowed

Relax **every edge**, V − 1 times. A shortest path has at most V − 1 edges, so that is enough. If a V-th round can still improve something, there is a **negative cycle** (a loop whose total weight is negative, so the "shortest" path doesn't exist).

```cpp
struct Edge { int u, v, w; };

// Fills dist with shortest distances; returns false if a negative cycle is reachable.
bool bellmanFord(int n, const vector<Edge>& edges, int src, vector<long long>& dist) {
    const long long INF = LLONG_MAX / 4;
    dist.assign(n, INF);
    dist[src] = 0;
    for (int round = 0; round < n - 1; round++) {
        bool changed = false;
        for (const Edge& e : edges) {
            if (dist[e.u] != INF && dist[e.u] + e.w < dist[e.v]) {
                dist[e.v] = dist[e.u] + e.w;
                changed = true;
            }
        }
        if (!changed) break;                       // nothing improved: finish early
    }
    for (const Edge& e : edges)                    // still improving? negative cycle
        if (dist[e.u] != INF && dist[e.u] + e.w < dist[e.v]) return false;
    return true;
}
```

Time **O(V · E)**. Limiting the rounds to k + 1 gives "cheapest flight with at most k stops".

## Floyd-Warshall: every pair at once

For small graphs (V up to about 400), compute the distance between **all pairs**. For each node `k`, check whether going through `k` shortens the path from `i` to `j`:

```cpp
// dist[i][j] starts as the edge weight (INF if no edge, 0 when i == j).
void floydWarshall(vector<vector<long long>>& dist) {
    int n = dist.size();
    const long long INF = LLONG_MAX / 4;
    for (int k = 0; k < n; k++)                    // allow k as a stop along the way
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (dist[i][k] < INF && dist[k][j] < INF)
                    dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]);
}
```

Time **O(V³)**, space O(V²). The loop over `k` **must** be the outer one.

## Which shortest path algorithm?

| Situation | Use | Time |
| --- | --- | --- |
| unweighted graph | BFS | O(V + E) |
| weights are 0 or 1 | 0-1 BFS | O(V + E) |
| non-negative weights, one source | Dijkstra | O((V + E) log V) |
| negative weights, one source | Bellman-Ford | O(V · E) |
| all pairs, small graph | Floyd-Warshall | O(V³) |
| DAG, any weights | relax edges in topological order | O(V + E) |

## Minimum spanning trees

A **spanning tree** connects all V nodes of a connected, undirected graph using exactly V − 1 edges and no cycles. A **minimum spanning tree (MST)** is the one with the smallest total weight: the cheapest way to connect every city with roads, or every computer with cables.

### Union-Find (DSU)

Kruskal's algorithm needs to ask "are these two nodes already connected?" again and again. A **disjoint set union** answers in almost O(1):

```cpp
struct DSU {
    vector<int> parent, size;
    DSU(int n) : parent(n), size(n, 1) { iota(parent.begin(), parent.end(), 0); }
    int find(int x) {                              // the representative of x's group
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];         // path compression (halving)
            x = parent[x];
        }
        return x;
    }
    bool unite(int a, int b) {                     // false if already in one group
        a = find(a);
        b = find(b);
        if (a == b) return false;
        if (size[a] < size[b]) swap(a, b);         // hang the smaller tree under the bigger
        parent[b] = a;
        size[a] += size[b];
        return true;
    }
};
```

DSU is useful on its own too: counting connected components as edges arrive, or finding the edge that creates a cycle.

### Kruskal's algorithm

Sort the edges by weight. Take each edge in order **unless it would close a cycle** (both ends already connected).

![Weighted graph A to E with the minimum spanning tree edges of weights 1, 2, 3 and 6 highlighted](/images/dsa/mst-kruskal.svg "Edges 4, 5 and 7 are skipped because their ends are already connected. Total weight 12.")

Using the `DSU` above:

```cpp
// edges as (weight, u, v). Total weight of a minimum spanning tree.
long long kruskal(int n, vector<tuple<int, int, int>> edges) {
    sort(edges.begin(), edges.end());              // cheapest first
    DSU dsu(n);
    long long total = 0;
    int used = 0;
    for (auto [w, u, v] : edges) {
        if (dsu.unite(u, v)) {                     // skip edges that close a cycle
            total += w;
            if (++used == n - 1) break;            // a spanning tree has n - 1 edges
        }
    }
    return total;
}
```

Time **O(E log E)**, dominated by the sort.

### Prim's algorithm

Grow the tree from one node. Each step, add the **cheapest edge that leaves the tree**, found with a min-heap, just like Dijkstra.

```cpp
long long prim(const vector<vector<pair<int, int>>>& adj) {   // adj[u] = (v, weight)
    int n = adj.size();
    vector<bool> inTree(n, false);
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;   // (weight, node)
    pq.push({0, 0});
    long long total = 0;
    while (!pq.empty()) {
        auto [w, u] = pq.top();
        pq.pop();
        if (inTree[u]) continue;
        inTree[u] = true;                          // the cheapest edge into the tree
        total += w;
        for (auto [v, wt] : adj[u])
            if (!inTree[v]) pq.push({wt, v});
    }
    return total;                                  // assumes the graph is connected
}
```

Time **O(E log V)**. Kruskal is usually simpler when you're given an edge list; Prim fits dense graphs and adjacency lists.

## Common mistakes

- Running Dijkstra with **negative** weights.
- Overflow when adding a weight to `INT_MAX` or `LLONG_MAX` used as infinity. Check for infinity first, or use a smaller "infinity" like `LLONG_MAX / 4`.
- Forgetting the stale-entry check in Dijkstra, which can make it much slower.
- Treating a directed graph as undirected in MST questions (MSTs are for undirected graphs).

## Practice

- [Network Delay Time](https://leetcode.com/problems/network-delay-time/) (Dijkstra)
- [Cheapest Flights Within K Stops](https://leetcode.com/problems/cheapest-flights-within-k-stops/) (Bellman-Ford with k + 1 rounds)
- [Min Cost to Connect All Points](https://leetcode.com/problems/min-cost-to-connect-all-points/) (MST)
- [Redundant Connection](https://leetcode.com/problems/redundant-connection/) (DSU)

Next: [greedy algorithms](/notes/dsa-greedy).
