> **In short:** pick one language, give DSA 1 to 2 focused hours a day for 16 weeks, learn topics in the order below, solve 150 to 250 well-chosen problems while naming the **pattern** each one uses, revise on a schedule, and start mock interviews by week 12.

Most students don't fail DSA because it's too hard. They fail because they study it randomly: a video here, 40 problems of one topic there, no revision, and then panic two weeks before placements. This roadmap fixes the order, the amount and the method, and links each step to our free notes and [DSA sheet](/dsa-sheet).

## Three decisions before you start

1. **One language.** C++, Java or Python are all accepted in interviews. C++ is the most common for contests; Java suits you if your projects are in Java; Python is fine but can be slower in timed judges. Choose one and don't switch. (New to C++? Start with [Getting started with C++](/blog/getting-started-with-cpp).)
2. **A fixed daily slot.** 60 to 120 minutes, at the same time every day, beats a 10-hour Sunday. Consistency is the whole game.
3. **One place to practise.** LeetCode for interview-style problems, plus Codeforces or CodeChef later if you enjoy contests. Track everything on one list, such as our [DSA sheet](/dsa-sheet), which saves your progress.

## The 16-week roadmap

| Weeks | Topics | Read |
| --- | --- | --- |
| 1–2 | Complexity, recursion, the STL or collections of your language | [Complexity](/notes/dsa-complexity), [Recursion](/notes/dsa-recursion), [C++ STL](/notes/dsa-cpp-stl) |
| 3–4 | Arrays, hashing, prefix sums, two pointers, sliding window | [Array patterns](/notes/dsa-arrays-patterns), [Hashing](/notes/dsa-hashing) |
| 5 | Binary search (including on the answer), sorting | [Binary search](/notes/dsa-binary-search), [Sorting](/notes/dsa-sorting) |
| 6 | Linked lists, stacks, queues, monotonic stack | [Linked lists](/notes/dsa-linked-list), [Stacks and queues](/notes/dsa-stack-queue) |
| 7 | Backtracking: subsets, permutations, combinations | [Backtracking](/notes/dsa-backtracking) |
| 8–9 | Binary trees and binary search trees | [Binary trees](/notes/dsa-binary-trees), [Tree problems](/notes/dsa-tree-problems), [BST](/notes/dsa-bst) |
| 10 | Heaps and priority queues, greedy | [Heaps](/notes/dsa-heaps), [Greedy](/notes/dsa-greedy) |
| 11–12 | Graphs: BFS, DFS, topological sort, shortest paths, union-find | [Graphs](/notes/dsa-graphs), [Shortest paths and MST](/notes/dsa-shortest-paths-mst) |
| 13–15 | Dynamic programming: 1D, 2D, knapsack, strings, intervals | [Dynamic programming](/notes/dsa-dynamic-programming) |
| 16 | Tries, bit manipulation, mixed revision and mock interviews | [DSA sheet](/dsa-sheet) |

Why this order? Each topic uses the one before it. Trees need recursion, graphs need queues and recursion, and DP needs recursion plus the habit of spotting repeated work. Skipping ahead is why DP feels impossible to so many people.

## How many problems are enough?

Around **150 to 250 problems, chosen well**, is enough for most product-company interviews. 500 random problems solved without reflection is worth less than 200 where you can explain the idea behind each one.

A healthy mix is about **30% easy, 60% medium and 10% hard**. Easy problems build speed and confidence; medium problems are what interviews actually ask; a few hard ones teach you to stay calm when stuck.

Our [DSA sheet](/dsa-sheet) has 153 problems grouped by topic, in roughly this order, with notes linked to each topic.

## How to practise one problem: the 45-minute routine

1. **Understand it (5 minutes).** Restate the problem in your own words. Work through the examples by hand. Ask: what are the input limits?
2. **Brute force first (5 minutes).** Say the simplest correct idea out loud, with its complexity, even if it's slow.
3. **Find the better idea (15 minutes).** Look at the limits: n up to 10⁵ usually means O(n log n) or better (see the table in [complexity](/notes/dsa-complexity)). Ask which pattern fits.
4. **Code it (15 minutes).** Clean variable names, no copy-paste.
5. **Test it (5 minutes).** Empty input, one element, duplicates, negative numbers, the largest values.

Stuck for 30 to 40 minutes with no progress? Read a **hint**, not the full solution, and try again. If you still read the solution, close it and **write the code yourself from memory**, then mark the problem to solve again after 3 days.

## Learn patterns, not problems

Interviewers reuse ideas, not questions. For every problem you solve, write one line: *"This is the X pattern because Y."* Soon you'll recognise a new problem within minutes.

![Two pointers closing in on a pair that sums to 13 in a sorted array](/images/dsa/two-pointers.svg "Two pointers: a sorted array plus a pair or triplet target is the signal.")

| Signal in the problem | Pattern to try |
| --- | --- |
| sorted array, find a pair or triplet | two pointers |
| longest or shortest subarray or substring with a condition | sliding window |
| many range-sum queries, or count subarrays with sum k | prefix sums + hash map |
| "minimum value that works" with a yes/no check | binary search on the answer |
| next greater or smaller element | monotonic stack |
| k largest, k closest, merge k lists | heap |
| all subsets, permutations or arrangements | backtracking |
| shortest path with no weights, or grid spreading | BFS |
| dependencies or prerequisites | topological sort |
| count ways, or min/max cost with overlapping subproblems | dynamic programming |

## A revision system that actually works

You will forget solutions; that's normal. Plan for it:

- Keep a simple log (a Notion page or spreadsheet): problem, pattern, the key idea in one line, and the date.
- **Re-solve** each problem you struggled with after 3 days, then after 2 weeks.
- Every Sunday, spend one session re-solving five old problems without looking at your code.
- Star the problems that taught you something new. Before an interview, revise the starred list only.

## Mock interviews: start by week 12

Solving alone and solving while someone watches are different skills. From week 12, do one mock interview a week with a friend, a senior or a mock platform:

- Think out loud from the first minute. Silence reads as being stuck.
- State the brute force, then improve it. Interviewers reward the journey, not just the final answer.
- Write clean code, walk through a test case, and state the time and space complexity without being asked.

## Mistakes that waste months

- **Watching instead of solving.** A two-hour video feels productive; 30 minutes of struggling with a problem is what builds skill.
- **Collecting sheets.** Finish one list properly instead of starting five.
- **Only easy problems.** Comfortable, but interviews are mostly medium.
- **Reading solutions too early.** The struggle is the learning. Use hints first.
- **Ignoring complexity.** An O(n²) answer for n = 10⁵ will time out, and the interviewer will ask.
- **No revision.** Without it, week-3 topics are gone by week 12.

## How to know you're ready

- You can solve most medium problems from the core topics in 30 to 40 minutes.
- You can name the pattern within the first few minutes for most new problems.
- You can explain your approach, code it cleanly and state its complexity while talking.
- You've done at least five mock interviews and felt calmer in the last one than the first.

## FAQ

**Can I do this alongside college?**
Yes. The plan assumes 1 to 2 hours a day. If you have more time, go deeper on each topic, not faster through the list.

**When should I start?**
By the start of your third year for placements, or earlier if you want internships. Starting in your second year gives you room to also build projects.

**Competitive programming or LeetCode?**
LeetCode-style practice is closer to interviews. Contests (Codeforces, CodeChef) make you faster and are great if you enjoy them, but they're optional for most jobs.

**Do I need to learn every data structure?**
No. Master the ones in the roadmap. Segment trees, Fenwick trees and advanced graph algorithms matter for competitive programming and a few companies, not for most interviews.

Want a teacher, a batch and weekly doubt sessions? Our [Data Structures & Algorithms course](/courses/dsa) follows this path.
