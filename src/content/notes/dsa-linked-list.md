---
title: Linked Lists
description: Singly, doubly and circular linked lists with diagrams: insert, delete, the dummy node trick, reversing a list, fast and slow pointers, cycle detection, merging and removing the nth node from the end, in C++.
author: Bitwise School
---

A linked list is a chain of **nodes**. Each node holds a value and a pointer to the next node. Unlike an array, the nodes can live anywhere in memory; only the pointers hold the list together. Linked list questions are really **pointer questions**: the logic is easy, but one wrong assignment loses half the list.

![A linked list 10, 20, 30 with head pointing at the first node and the last node pointing at NULL](/images/dsa/linked-list-basic.svg "Each node stores data and the address of the next node; the last one points to NULL.")

```cpp
struct ListNode {
    int val;
    ListNode* next;
    ListNode(int v) : val(v), next(nullptr) {}
};
```

## Linked list or array?

| Operation | vector | singly linked list |
| --- | --- | --- |
| get the i-th item | O(1) | O(n): walk from the head |
| insert or delete at the front | O(n) | O(1) |
| insert or delete after a node you already have | O(n) | O(1) |
| add at the end | O(1)* | O(1) with a tail pointer |
| search for a value | O(n) | O(n) |

Linked lists win when you insert and delete in the middle a lot and already hold a pointer to the spot. That's why they appear inside LRU caches, hash table chains and adjacency lists.

## Walking the list

```cpp
int length(ListNode* head) {
    int count = 0;
    for (ListNode* cur = head; cur != nullptr; cur = cur->next) count++;
    return count;
}
```

Never move `head` itself while walking. Use a separate pointer such as `cur`, or you lose the start of the list.

## Inserting

At the front, the new node becomes the head:

```cpp
ListNode* insertAtHead(ListNode* head, int val) {
    ListNode* node = new ListNode(val);
    node->next = head;
    return node;                         // the caller stores this as the new head
}
```

After a given node, **order matters**:

![Inserting 25 after 20: first the new node points to 30, then 20 points to the new node](/images/dsa/linked-list-insert.svg "Step ① must come before step ②.")

```cpp
void insertAfter(ListNode* cur, int val) {
    ListNode* node = new ListNode(val);
    node->next = cur->next;              // ① new node points at the rest of the list
    cur->next = node;                    // ② then cur points at the new node
}
```

## Deleting, and the dummy node trick

Deleting the head is a special case, because nothing points *to* the head. A **dummy node** placed before the head removes that special case: every real node now has a node before it.

```cpp
ListNode* removeValue(ListNode* head, int target) {
    ListNode dummy(0);
    dummy.next = head;
    ListNode* prev = &dummy;
    while (prev->next != nullptr) {
        if (prev->next->val == target) {
            ListNode* gone = prev->next;
            prev->next = gone->next;     // unlink it
            delete gone;                 // free its memory
        } else {
            prev = prev->next;
        }
    }
    return dummy.next;                   // the real head, which may have changed
}
```

Use a dummy node whenever the head might change: deleting, merging, partitioning.

## Reversing a list

The most asked linked list question. Walk the list once and turn every `next` pointer around, keeping three pointers:

- `prev`: the part already reversed
- `curr`: the node being fixed
- `next`: the rest of the list, saved before we overwrite `curr->next`

![Reversing 1 2 3 4: start, midway with prev, curr and next, and the reversed list](/images/dsa/linked-list-reverse.svg "At every step, save next, point curr back at prev, then move both forward.")

```cpp
ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr;
    ListNode* curr = head;
    while (curr != nullptr) {
        ListNode* next = curr->next;     // remember the rest
        curr->next = prev;               // turn the pointer around
        prev = curr;                     // step forward
        curr = next;
    }
    return prev;                         // prev is the new head
}
```

The same thing recursively (O(n) stack space instead of O(1)):

```cpp
ListNode* reverseRecursive(ListNode* head) {
    if (head == nullptr || head->next == nullptr) return head;
    ListNode* newHead = reverseRecursive(head->next);   // reverse the rest
    head->next->next = head;                            // the next node points back
    head->next = nullptr;
    return newHead;
}
```

## Fast and slow pointers

Move one pointer one step at a time and another two steps. This solves a whole family of problems in O(n) time and **O(1)** extra space.

### Middle of the list

When `fast` reaches the end, `slow` is halfway.

```cpp
ListNode* middleNode(ListNode* head) {
    ListNode* slow = head;
    ListNode* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
    }
    return slow;                         // for an even length, the second middle
}
```

### Detecting a cycle (Floyd's algorithm)

If the list has a cycle, `fast` laps `slow` inside it and the two must meet. If not, `fast` simply reaches `NULL`.

![A list 1 to 6 where 6 links back to 3, with slow and fast meeting at 5](/images/dsa/linked-list-cycle.svg "The table shows each step: after 4 steps both pointers are at node 5.")

```cpp
bool hasCycle(ListNode* head) {
    ListNode* slow = head;
    ListNode* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}
```

To find **where the cycle starts**, move one pointer back to the head after they meet. Now step both one node at a time; they meet exactly at the start of the cycle (node 3 in the picture):

```cpp
ListNode* cycleStart(ListNode* head) {
    ListNode* slow = head;
    ListNode* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) {                    // they met inside the cycle
            ListNode* p = head;
            while (p != slow) {
                p = p->next;
                slow = slow->next;
            }
            return p;                          // the first node of the cycle
        }
    }
    return nullptr;                            // no cycle
}
```

## Two more classics

### Merge two sorted lists

```cpp
ListNode* mergeTwoLists(ListNode* a, ListNode* b) {
    ListNode dummy(0);
    ListNode* tail = &dummy;
    while (a != nullptr && b != nullptr) {
        if (a->val <= b->val) { tail->next = a; a = a->next; }
        else { tail->next = b; b = b->next; }
        tail = tail->next;
    }
    tail->next = (a != nullptr) ? a : b;       // attach whatever is left
    return dummy.next;
}
```

### Remove the n-th node from the end, in one pass

Move `fast` n + 1 steps ahead, then move both together. When `fast` falls off the end, `slow` is just before the node to delete.

```cpp
ListNode* removeNthFromEnd(ListNode* head, int n) {   // 1 <= n <= length
    ListNode dummy(0);
    dummy.next = head;
    ListNode* fast = &dummy;
    ListNode* slow = &dummy;
    for (int i = 0; i <= n; i++) fast = fast->next;   // a gap of n + 1 nodes
    while (fast != nullptr) {
        fast = fast->next;
        slow = slow->next;
    }
    ListNode* gone = slow->next;
    slow->next = gone->next;
    delete gone;
    return dummy.next;
}
```

## Doubly and circular lists

- A **doubly linked list** also keeps a `prev` pointer, so you can walk backwards and delete a node in O(1) when you only have a pointer to it. It costs one extra pointer per node. C++ gives you one as `std::list`.
- A **circular list** links the last node back to the first. It's handy for round-robin scheduling. Loop until you're back at the start, not until `NULL`.
- An **LRU cache** combines a hash map (key → node) with a doubly linked list (most recent at the front): every operation becomes O(1).

```cpp
struct DNode {
    int val;
    DNode* prev;
    DNode* next;
    DNode(int v) : val(v), prev(nullptr), next(nullptr) {}
};
```

## Common mistakes

- **Dereferencing `NULL`**: check `fast != nullptr && fast->next != nullptr` in that order before `fast->next->next`.
- **Losing the list** by changing a pointer before saving what it pointed to.
- **Forgetting the head can change**: return the new head, or use a dummy node.
- **Edge cases**: an empty list, a single node, two nodes. Test these before submitting.
- **Memory leaks**: in C++, `delete` nodes you remove (LeetCode won't complain, but interviewers notice).

## Practice

- [Reverse Linked List](https://leetcode.com/problems/reverse-linked-list/), [Merge Two Sorted Lists](https://leetcode.com/problems/merge-two-sorted-lists/)
- [Linked List Cycle](https://leetcode.com/problems/linked-list-cycle/), [Middle of the Linked List](https://leetcode.com/problems/middle-of-the-linked-list/)
- [Remove Nth Node From End of List](https://leetcode.com/problems/remove-nth-node-from-end-of-list/), [Reorder List](https://leetcode.com/problems/reorder-list/)
- [Intersection of Two Linked Lists](https://leetcode.com/problems/intersection-of-two-linked-lists/), [Add Two Numbers](https://leetcode.com/problems/add-two-numbers/)
- [LRU Cache](https://leetcode.com/problems/lru-cache/), [Reverse Nodes in k-Group](https://leetcode.com/problems/reverse-nodes-in-k-group/) (hard)

Next: [stacks and queues](/notes/dsa-stack-queue).
