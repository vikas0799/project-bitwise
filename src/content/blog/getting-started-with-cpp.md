> **In short:** install a compiler (10 minutes), write and run your first program, learn variables, input, loops, functions, `vector` and `string`, and learn to read compiler errors. Then follow the 30-day plan at the end to be ready for DSA in C++.

C++ is one of the fastest programming languages ever made, and it's the most popular language for competitive programming and DSA interviews in India. It also teaches you how a computer really works, because you can see memory, types and performance directly. This guide takes you from nothing installed to writing real programs, and tells you exactly what to learn next.

## Why learn C++ in 2026?

- **Speed.** C++ compiles to machine code. Game engines (Unreal), browsers (Chrome), databases, trading systems and embedded devices are written in it for this reason.
- **DSA and competitive programming.** The C++ Standard Template Library (STL) gives you ready-made data structures and algorithms, and most contest solutions are written in C++.
- **It makes other languages easy.** After C++, Java, C# and Go feel familiar, and Python feels like a holiday.
- **It's alive and improving.** C++20 and C++23 are well supported by today's compilers, and the next standard, C++26, was finalised by the committee in 2026. As a beginner you don't need the newest features; C++17 or C++20 is plenty.

## Set up in 10 minutes

You need a **compiler** (turns your code into a program) and an **editor** (where you write it).

| Your computer | Compiler | How to install |
| --- | --- | --- |
| Windows | g++ (MinGW-w64 via MSYS2) or Visual Studio Community | Install MSYS2, then run `pacman -S mingw-w64-ucrt-x86_64-gcc`, or install Visual Studio with "Desktop development with C++" |
| macOS | clang++ | Run `xcode-select --install` in Terminal |
| Linux | g++ | `sudo apt install g++` (Ubuntu/Debian) |

For the editor, use **VS Code** with the C/C++ extension, or **CLion**, which is free for students through the [GitHub Student Pack](/blog/student-perks).

Can't install anything right now? Use an online compiler such as Compiler Explorer (godbolt.org) or OnlineGDB to try code in the browser.

Check that it works:

```bash
g++ --version
```

## Your first program, line by line

Save this as `hello.cpp`:

```cpp
#include <iostream>

int main() {
    std::cout << "Hello, Bitwise!\n";
    return 0;
}
```

Compile and run it:

```bash
g++ -std=c++20 -Wall -Wextra -o hello hello.cpp
./hello
```

What each line does:

- `#include <iostream>` brings in the input/output library, which is where `std::cout` lives.
- `int main()` is where every C++ program starts. It returns an `int` to the operating system.
- `std::cout << "Hello, Bitwise!\n";` prints text. `\n` ends the line. Every statement ends with a semicolon.
- `return 0;` tells the operating system the program finished successfully.

The compile flags matter: `-std=c++20` picks the language version, and `-Wall -Wextra` turns on **warnings**, which catch many beginner bugs before you even run the program. Always use them.

> You'll often see `using namespace std;` so you can write `cout` instead of `std::cout`. It's fine in practice programs and contests; avoid it in header files of bigger projects.

## Variables and types

A variable is a named box that holds a value of a fixed **type**.

```cpp
#include <iostream>
#include <string>
using namespace std;

int main() {
    int age = 20;                    // whole numbers, about ±2.1 billion
    long long population = 1'450'000'000LL;   // bigger whole numbers
    double cgpa = 8.7;               // decimals
    char grade = 'A';                // one character
    bool placed = false;             // true or false
    string name = "Asha";            // text
    const double PI = 3.14159;       // can't be changed later
    auto total = age + 5;            // the compiler works out the type (int)

    cout << name << " is " << age << " with CGPA " << cgpa << '\n';
    cout << "Population: " << population << ", total: " << total << '\n';
    cout << grade << ' ' << placed << ' ' << PI << '\n';
    return 0;
}
```

The mistake that costs the most marks in contests is **integer overflow**: an `int` holds only up to about 2.1 × 10⁹. If a sum or product can be bigger (say 10⁵ numbers, each up to 10⁹), use `long long`.

## Input and output

```cpp
#include <iostream>
#include <string>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;                   // reads two numbers separated by spaces or newlines
    cout << "Sum: " << a + b << '\n';

    string fullName;
    cin.ignore();                    // skip the newline left after the numbers
    getline(cin, fullName);          // reads a whole line, spaces included
    cout << "Hello, " << fullName << '\n';
    return 0;
}
```

`cin >> x` stops at a space; use `getline` when you need a full line of text.

## Decisions and loops

```cpp
#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;

    if (n % 2 == 0) cout << n << " is even\n";
    else cout << n << " is odd\n";

    long long evenSum = 0;
    for (int i = 1; i <= n; i++) {
        if (i % 2 == 0) evenSum += i;
    }
    cout << "Sum of even numbers up to " << n << ": " << evenSum << '\n';

    int digits = 0, x = n;
    while (x > 0) {                  // count the digits of n
        x /= 10;
        digits++;
    }
    cout << n << " has " << digits << " digits\n";
    return 0;
}
```

## Functions

Functions let you name a piece of logic and reuse it. Pay attention to **pass by value** (the function gets a copy) versus **pass by reference** (the function works on your variable).

```cpp
#include <iostream>
using namespace std;

int square(int x) { return x * x; }          // gets a copy of x

void swapValues(int& a, int& b) {            // & means "use the caller's variables"
    int temp = a;
    a = b;
    b = temp;
}

int main() {
    int p = 3, q = 7;
    cout << square(p) << '\n';               // 9
    swapValues(p, q);
    cout << p << ' ' << q << '\n';           // 7 3
    return 0;
}
```

Without the `&`, `swapValues` would swap its own copies and your `p` and `q` would stay the same. This one idea explains many "why didn't my value change?" bugs.

## vector and string: your two best friends

Plain arrays have a fixed size. A `vector` grows as you add items and knows its own size. Use it by default.

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    vector<int> marks = {72, 95, 60, 88};
    marks.push_back(79);                            // add at the end
    sort(marks.begin(), marks.end());               // 60 72 79 88 95

    int best = marks.back();
    double average = 0;
    for (int m : marks) average += m;               // range-based for loop
    average /= marks.size();
    cout << "Best: " << best << ", average: " << average << '\n';

    string word = "bitwise";
    word[0] = 'B';                                  // strings are editable
    reverse(word.begin(), word.end());
    cout << word << " has " << word.size() << " letters\n";   // esiwtiB has 7 letters
    return 0;
}
```

## Reading compiler errors (without panic)

Every C++ programmer sees errors all day. Read **only the first error**, fix it, and compile again, because one mistake often causes a cascade of later messages.

| Message (roughly) | Usual cause |
| --- | --- |
| `expected ';' before ...` | a missing semicolon on the line **above** |
| `'x' was not declared in this scope` | a typo, a missing `#include`, or using a variable outside its `{ }` |
| `no match for 'operator<<'` | printing something `cout` doesn't understand, like a whole `vector` |
| `Segmentation fault` (at run time) | reading outside an array or vector, for example `v[v.size()]` |

For run-time bugs, print the values of your variables at each step, or learn your editor's debugger. It pays off within a week.

## A 30-day plan

| Week | Learn | Practise |
| --- | --- | --- |
| 1 | Setup, variables, types, input and output, `if`, loops | 15 small programs: patterns, number puzzles, simple calculators |
| 2 | Functions, `vector`, `string`, 2D vectors | 15 array and string problems |
| 3 | References and pointers, `struct` and `class`, basic OOP | A small student-records program using a class |
| 4 | The STL: `sort`, `map`, `set`, `stack`, `queue` | Your first 20 easy problems on the [DSA sheet](/dsa-sheet) |

Spend at least half of every day writing code, not watching videos. Typing programs yourself is how the syntax sticks.

## What to learn next

1. [The C++ STL for DSA](/notes/dsa-cpp-stl): containers, algorithms and lambdas.
2. [Time and space complexity](/notes/dsa-complexity), so you can tell whether your solution is fast enough.
3. The [DSA roadmap](/blog/dsa-roadmap), then topic-by-topic practice with our [DSA notes](/notes).

## FAQ

**Should I learn C before C++?**
No. Modern C++ is easier to start with than C: `string` and `vector` save you from manual memory work on day one. You can learn C later if you move into embedded or systems work.

**C++ or Java for DSA and placements?**
Both are accepted everywhere. Choose C++ if you want to do competitive programming (the STL is fast and concise); choose Java if your target jobs or projects are Java-heavy. What matters more is sticking to one.

**Is `#include <bits/stdc++.h>` okay?**
For practice and contests on g++, yes; it includes the whole standard library at once. It is not standard C++, doesn't work with every compiler (for example, on macOS clang), and slows compilation, so include specific headers in real projects.

**Do I really need pointers?**
You need to understand them (they explain references, arrays, linked lists and trees), but in modern C++ you'll rarely manage memory by hand. Prefer `vector`, `string` and smart pointers.

Want a teacher and a batch to learn with? See our [C++ Programming Masterclass](/courses/cpp).
