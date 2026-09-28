---
title: Operating Systems
description: Processes and threads, CPU scheduling, synchronization, deadlocks, memory management, virtual memory, file systems and disk scheduling, with interview questions.
author: Bitwise School
---

An operating system (OS) is the software layer between hardware and applications. It manages the CPU, memory, storage and devices, and gives programs a safe, simple way to use them.

## What an operating system does

- **Resource manager**: decides which program gets the CPU, how much memory, and access to disks and devices.
- **Abstraction**: files instead of disk blocks, processes instead of raw CPU time, sockets instead of network cards.
- **Protection and isolation**: one program cannot read or corrupt another program's memory.

### Kernel mode vs user mode

The CPU runs in two modes. **User mode** is restricted: applications cannot touch hardware directly. **Kernel mode** has full access. A program asks the kernel for help through a **system call** (for example `read`, `write`, `fork`), which switches the CPU into kernel mode and back.

### Types of operating systems

| Type | Idea | Example use |
| --- | --- | --- |
| Batch | Jobs run one after another without interaction | Old mainframes, payroll runs |
| Multiprogramming | Several programs in memory; CPU switches when one waits for I/O | Keeps the CPU busy |
| Time-sharing (multitasking) | CPU time is split into small slices so every user feels responsive | Linux, Windows, macOS |
| Real-time | Must respond within strict deadlines | Airbags, pacemakers, industrial control |
| Distributed | Many machines appear as one system | Clusters |

### Kernel designs

- **Monolithic kernel**: all OS services run in kernel space. Fast, but a bug can crash everything (Linux).
- **Microkernel**: only the essentials (scheduling, IPC, memory) run in the kernel; drivers and file systems run in user space. More stable, some overhead (Minix, QNX).
- **Hybrid kernel**: a mix of both (Windows NT, macOS XNU).

## Processes and threads

A **process** is a program in execution. It has its own address space (code, data, heap, stack), open files and a **Process Control Block (PCB)** that stores its state: process ID, program counter, registers, scheduling info, memory info and open files.

### Process states

```text
new → ready → running → terminated
         ↑       │
         │       ↓
         └── waiting (for I/O or an event)
```

- **Ready**: waiting for the CPU.
- **Running**: executing on the CPU.
- **Waiting (blocked)**: waiting for I/O or an event; goes back to ready when it completes.

A **context switch** saves the state of the running process into its PCB and loads the state of the next one. It is pure overhead, so schedulers try not to switch too often.

### Threads

A **thread** is the smallest unit of CPU execution inside a process. Threads of the same process share code, data, heap and open files, but each has its own **stack, registers and program counter**.

| Process | Thread |
| --- | --- |
| Own address space | Shares the process's address space |
| Heavy to create and switch | Light to create and switch |
| Communication needs IPC (pipes, sockets, shared memory) | Communicates through shared memory directly |
| A crash usually affects only that process | A crash can bring down the whole process |

**Multithreading models** map user threads to kernel threads: many-to-one, one-to-one (Linux, Windows) and many-to-many.

### fork, exec, zombie and orphan processes

- `fork()` creates a child process that is a copy of the parent. It returns `0` in the child and the child's PID in the parent.
- `exec()` replaces the current process image with a new program.
- **Zombie process**: the child has finished, but the parent has not yet read its exit status with `wait()`. Its entry stays in the process table.
- **Orphan process**: the parent exits before the child. The child is adopted by `init`/`systemd`.

## CPU scheduling

The scheduler picks which ready process runs next.

**Criteria**: CPU utilisation and throughput (maximise), and turnaround time, waiting time and response time (minimise).

**Formulas**

- Turnaround time = Completion time − Arrival time
- Waiting time = Turnaround time − Burst time
- Response time = Time of first run − Arrival time

| Algorithm | Preemptive? | Key point |
| --- | --- | --- |
| FCFS (first come, first served) | No | Simple; suffers the **convoy effect** when a long job blocks short ones |
| SJF (shortest job first) | No | Minimum average waiting time; long jobs can **starve** |
| SRTF (shortest remaining time first) | Yes | Preemptive SJF |
| Priority | Either | Low-priority jobs can starve; fixed with **aging** (raise priority over time) |
| Round Robin | Yes | Each process gets a time quantum; great response time; quantum too small means too many context switches |
| Multilevel queue | Yes | Separate queues (system, interactive, batch) with their own algorithms |
| Multilevel feedback queue | Yes | Processes move between queues based on behaviour; used by real OSes |

### Worked example

Three processes arrive at time 0 with bursts P1 = 24, P2 = 3, P3 = 3.

- **FCFS** (order P1, P2, P3): waiting times 0, 24, 27, so the average is **17**.
- **SJF** (order P2, P3, P1): waiting times 6, 0, 3, so the average is **3**.

The same work, but the order changes the average waiting time a lot. This is why SJF is optimal for average waiting time.

## Process synchronization

A **race condition** happens when the result depends on the order in which threads access shared data. The code that touches shared data is the **critical section**.

A correct solution must guarantee:

1. **Mutual exclusion**: only one process in the critical section at a time.
2. **Progress**: if nobody is inside, a waiting process must be allowed in.
3. **Bounded waiting**: no process waits forever.

### Tools

- **Peterson's solution**: a classic software solution for two processes using a `flag` array and a `turn` variable.
- **Hardware instructions**: atomic `test-and-set` and `compare-and-swap`.
- **Mutex (lock)**: one owner at a time; the thread that locks it must unlock it.
- **Semaphore**: an integer with atomic `wait()` (P, decrement) and `signal()` (V, increment). A **binary semaphore** has values 0 and 1; a **counting semaphore** controls access to N identical resources.
- **Monitor**: a language-level construct that bundles shared data with the procedures that access it, plus condition variables (`wait`, `signal`).

### Classic problems

- **Producer-consumer (bounded buffer)**: semaphores `empty`, `full` and a mutex.
- **Readers-writers**: many readers at once, but writers need exclusive access.
- **Dining philosophers**: shows deadlock and starvation; fixed by ordering resources or allowing at most four philosophers to sit.

## Deadlocks

A deadlock is a set of processes each waiting for a resource held by another in the set.

### Four necessary (Coffman) conditions

All four must hold at the same time:

1. **Mutual exclusion**: a resource can be held by only one process.
2. **Hold and wait**: a process holds one resource while waiting for another.
3. **No preemption**: resources cannot be forcibly taken away.
4. **Circular wait**: P1 waits for P2, P2 waits for P3, …, Pn waits for P1.

### Handling deadlocks

| Strategy | How |
| --- | --- |
| Prevention | Break one of the four conditions, e.g. request all resources at once, or number resources and always request in increasing order |
| Avoidance | Only grant a request if the system stays in a **safe state** (Banker's algorithm) |
| Detection and recovery | Let deadlocks happen, detect cycles in the wait-for graph, then kill or roll back a process |
| Ignore it | The "ostrich algorithm"; many general-purpose OSes do this and rely on restarts |

## Memory management

Programs use **logical (virtual) addresses**. The **Memory Management Unit (MMU)** translates them to **physical addresses** at run time.

### Contiguous allocation

Each process gets one continuous block. Allocation strategies are **first fit**, **best fit** and **worst fit**.

- **Internal fragmentation**: wasted space inside an allocated block.
- **External fragmentation**: enough total free memory, but not in one continuous piece. **Compaction** fixes it at a cost.

### Paging

Physical memory is split into fixed-size **frames**, logical memory into **pages** of the same size. The **page table** maps page numbers to frame numbers. Paging removes external fragmentation, but can have a little internal fragmentation in the last page.

- A **TLB (translation lookaside buffer)** is a small, fast cache of recent page table entries.
- **Effective access time** = hit ratio × (TLB time + memory time) + (1 − hit ratio) × (TLB time + 2 × memory time)
- Large address spaces use **multi-level page tables** or **inverted page tables** to keep page tables small.

### Segmentation

Memory is divided into variable-size logical **segments** (code, data, stack). It matches the programmer's view but brings back external fragmentation. Many systems combine segmentation with paging.

## Virtual memory

Virtual memory lets a process use more memory than physically exists by keeping only the needed pages in RAM.

- **Demand paging**: load a page only when it is first used.
- **Page fault**: the page is not in memory. The OS finds it on disk, loads it into a free frame (replacing another page if needed), updates the page table and restarts the instruction.
- **Thrashing**: the system spends more time swapping pages than doing work, because processes do not have enough frames for their **working set**.

### Page replacement algorithms

| Algorithm | Idea | Note |
| --- | --- | --- |
| FIFO | Replace the oldest page | Can show **Belady's anomaly**: more frames, more faults |
| Optimal | Replace the page not used for the longest time in the future | Best possible, but needs the future; used as a benchmark |
| LRU | Replace the least recently used page | Good in practice; costly to implement exactly |
| Clock (second chance) | FIFO with a reference bit | Cheap approximation of LRU |

**Belady's anomaly example**: for the reference string `1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5`, FIFO gives **9 faults with 3 frames** but **10 faults with 4 frames**.

## File systems and disks

- **File allocation**: contiguous (fast, but fragments), linked (no external fragmentation, slow random access) and indexed (an index block holds pointers; Unix inodes use this).
- An **inode** stores a file's metadata (size, owner, permissions, timestamps, block pointers), but not its name. Names live in directories.
- **Hard link** vs **soft (symbolic) link**: a hard link is another name for the same inode; a soft link is a small file containing a path.

### Disk scheduling

| Algorithm | Idea |
| --- | --- |
| FCFS | Serve requests in arrival order |
| SSTF | Serve the closest request next; can starve far requests |
| SCAN (elevator) | Move in one direction serving requests, then reverse |
| C-SCAN | Serve in one direction only, then jump back to the start; more uniform wait |
| LOOK / C-LOOK | Like SCAN / C-SCAN but only go as far as the last request |

## Interview questions

**1. Process vs thread?**
A process has its own address space; threads share their process's memory and resources but have their own stack and registers. Threads are lighter to create and switch.

**2. What is a context switch and why is it costly?**
Saving the state of one process or thread and loading another. The CPU does no useful work during it, and caches and TLB entries may become cold.

**3. Preemptive vs non-preemptive scheduling?**
Preemptive scheduling can take the CPU away from a running process (Round Robin, SRTF). Non-preemptive scheduling lets it run until it finishes or blocks (FCFS, SJF).

**4. Mutex vs semaphore?**
A mutex is a lock with an owner: only the thread that locked it unlocks it. A semaphore is a counter that any thread can signal, and a counting semaphore can allow N threads at once.

**5. What are the four conditions for deadlock?**
Mutual exclusion, hold and wait, no preemption and circular wait. Break any one to prevent deadlock.

**6. What is thrashing and how do you fix it?**
Too many page faults because processes lack enough frames. Fix it by reducing the degree of multiprogramming, using working-set or page-fault-frequency based allocation, or adding RAM.

**7. Paging vs segmentation?**
Paging uses fixed-size blocks invisible to the programmer and has no external fragmentation. Segmentation uses variable-size logical units and can have external fragmentation.

**8. What is a zombie process?**
A finished child whose exit status has not been collected by the parent with `wait()`.

**9. What is starvation and how does aging help?**
A process waits indefinitely because others keep getting priority. Aging gradually raises the priority of waiting processes.

**10. What does the TLB do?**
It caches recent virtual-to-physical page translations so most memory accesses avoid a page table lookup.

**11. User mode vs kernel mode?**
User mode is restricted; kernel mode can execute privileged instructions. System calls are the controlled way to switch.

**12. What is Belady's anomaly?**
With FIFO replacement, adding frames can increase page faults for some reference strings. Stack algorithms such as LRU and Optimal never show it.
