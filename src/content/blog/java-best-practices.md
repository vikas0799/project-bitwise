> **In short:** clear names and small methods, immutable data (records), no `null` surprises (`Optional` and empty collections), the right collection behind an interface, `StringBuilder` in loops, specific exceptions with try-with-resources, streams where they read better, and modern Java features (switch expressions, pattern matching, sealed types, virtual threads). Each habit below comes with a before-and-after example.

Code that works is only half the job. In an internship or first job, your pull requests are reviewed by seniors, and "it runs" isn't enough. It has to be easy to read, hard to break and safe to change. These are the habits reviewers look for most often in Java code. Every "after" example below compiles on **Java 21** and newer (the current long-term-support release is Java 25).

## 1. Names and small methods

Code is read far more often than it's written. A good name removes the need for a comment.

```java
// Before
int d; // days since last login
List<int[]> l1 = new ArrayList<>();
void proc(List<Student> s) { /* 80 lines doing five things */ }
```

```java
// After
int daysSinceLastLogin;
List<int[]> occupiedSeats = new ArrayList<>();
void sendReminders(List<Student> inactiveStudents) { /* one job, short */ }
```

- Classes are nouns (`InvoiceGenerator`), methods are verbs (`calculateTotal`), booleans read like questions (`isEligible`, `hasPaid`).
- If a method needs a comment to explain **what** it does, split it into smaller methods whose names say it. Keep comments for **why**.

## 2. Make data immutable, use records

Objects that can't change can't be changed by mistake, are safe to share between threads, and are easy to reason about. For plain data, use a **record** (Java 16+): it gives you the constructor, getters, `equals`, `hashCode` and `toString` for free.

```java
// Before: 40 lines of fields, getters, setters, equals and hashCode
public class Student {
    private String name;
    private int marks;
    // ... getters, setters, equals, hashCode, toString
}
```

```java
// After
record Student(String name, int marks) {
    Student {
        Objects.requireNonNull(name, "name");
        if (marks < 0 || marks > 100) throw new IllegalArgumentException("marks must be 0-100");
    }
}
```

The compact constructor validates the data **once**, so an invalid `Student` can never exist. For fields in regular classes, make them `final` unless they really need to change.

## 3. Don't let `null` surprise anyone

`NullPointerException` is the most common Java crash. Two rules prevent most of them.

**Return an empty collection, never `null`:**

```java
// Before: every caller must remember to check for null
List<String> tagsFor(String course) {
    if (course.isBlank()) return null;
    return List.of("dsa", "placements");
}
```

```java
// After: callers can always loop over the result
static List<String> tagsFor(String course) {
    if (course.isBlank()) return List.of();
    return List.of("dsa", "placements");
}
```

**Use `Optional` for a single value that might be missing:**

```java
static Optional<Student> findTopper(List<Student> students) {
    return students.stream().max(Comparator.comparingInt(Student::marks));
}

String name = findTopper(students).map(Student::name).orElse("nobody");
```

Use `Optional` for **return values**, not for fields or method parameters.

## 4. Compare objects correctly

```java
// Before: compares references, often false even when the text is equal
if (status == "PAID") { ... }
```

```java
// After: compares content; putting the literal first also avoids a NullPointerException
if ("PAID".equals(status)) { ... }
```

If you write a class that goes into a `HashSet` or is used as a `HashMap` key, override **both** `equals` and `hashCode` (or use a record, which does it for you).

## 5. Choose the right collection, behind an interface

Declare variables with the interface type, so you can change the implementation later without touching the rest of the code:

```java
// Before
ArrayList<Integer> marks = new ArrayList<>();
```

```java
// After
List<Integer> marks = new ArrayList<>();
Map<String, Integer> counts = new HashMap<>();
```

| You need | Use |
| --- | --- |
| an ordered list with fast index access | `ArrayList` |
| a fixed list that must not change | `List.of(...)` |
| unique items, fast lookup | `HashSet` |
| unique items in sorted order | `TreeSet` |
| key → value, fast lookup | `HashMap` |
| key → value, sorted by key | `TreeMap` |
| a queue or stack | `ArrayDeque` (not `Stack`, which is legacy) |

Two collection habits that remove whole classes of bugs:

```java
// Removing while looping with for-each throws ConcurrentModificationException. Instead:
marks.removeIf(m -> m < 40);

// Counting without if/else:
for (String word : "to be or not to be".split(" ")) counts.merge(word, 1, Integer::sum);
```

## 6. Build strings with `StringBuilder` in loops

Strings are immutable, so `s = s + x` inside a loop creates a new string every time: O(n²) work for n pieces.

```java
// Before
String result = "";
for (int i = 1; i <= n; i++) result += i + ", ";
```

```java
// After
static String joinNumbers(int n) {
    StringBuilder sb = new StringBuilder();
    for (int i = 1; i <= n; i++) {
        if (i > 1) sb.append(", ");
        sb.append(i);
    }
    return sb.toString();
}
```

Outside loops, simple `+` is fine and easier to read. For multi-line text, use a **text block**:

```java
var message = """
    Hello,
    Bitwise""";
```

## 7. Handle exceptions properly

```java
// Before: the error disappears and the program continues in a broken state
try {
    age = Integer.parseInt(input);
} catch (Exception e) {
}
```

```java
// After: catch the specific exception, add context, keep the original cause
static int parseAge(String input) {
    try {
        return Integer.parseInt(input.trim());
    } catch (NumberFormatException e) {
        throw new IllegalArgumentException("Age must be a number, got: " + input, e);
    }
}
```

- Never leave a `catch` block empty. At least log it with context.
- Catch the **most specific** exception you can handle; let the rest travel up.
- Close files, connections and streams with **try-with-resources**, so they're closed even when an exception is thrown:

```java
static int countLines(BufferedReader reader) throws IOException {
    int lines = 0;
    try (reader) {
        while (reader.readLine() != null) lines++;
    }
    return lines;
}
```

## 8. Use streams where they make code clearer

Streams shine for "filter, transform, collect" pipelines:

```java
List<String> toppers = students.stream()
    .filter(s -> s.marks() >= 85)
    .map(Student::name)
    .sorted()
    .toList();

double average = students.stream().mapToInt(Student::marks).average().orElse(0);
```

But don't force everything into a stream. A plain loop is often clearer when there's complex branching, early exits or checked exceptions. Readability is the goal, not cleverness.

## 9. Use modern Java

Many college syllabi still teach Java 8. Companies run Java 17, 21 or 25, and reviewers expect the newer, shorter forms.

**Switch expressions** return a value and never fall through by accident:

```java
static String grade(int marks) {
    return switch (marks / 10) {
        case 10, 9 -> "A";
        case 8 -> "B";
        case 7 -> "C";
        default -> "Needs work";
    };
}
```

**Pattern matching for `instanceof`** removes the cast:

```java
static String describe(Object value) {
    if (value instanceof String s && !s.isEmpty()) return "text of length " + s.length();
    if (value instanceof Integer n) return "number " + n;
    return "something else";
}
```

**Sealed types plus records plus switch** let the compiler check you've handled every case:

```java
sealed interface Shape permits Circle, Rectangle {}
record Circle(double radius) implements Shape {}
record Rectangle(double width, double height) implements Shape {}

static double area(Shape shape) {
    return switch (shape) {
        case Circle c -> Math.PI * c.radius() * c.radius();
        case Rectangle r -> r.width() * r.height();
    };
}
```

Add a new shape later and every switch that forgot it stops compiling, which is exactly what you want.

**`var`** for local variables when the type is obvious from the right-hand side: `var students = new ArrayList<Student>();`.

## 10. Concurrency: prefer executors, try virtual threads

Don't create and manage raw `Thread` objects by hand. Use an `ExecutorService`. Since Java 21, **virtual threads** make it cheap to run thousands of blocking tasks (such as network calls) at once:

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    var futures = new ArrayList<Future<Integer>>();
    for (int i = 1; i <= 100; i++) {
        int n = i;
        futures.add(executor.submit(() -> n * n));
    }
    int sum = 0;
    for (var f : futures) sum += f.get();
}
```

Shared mutable state is still dangerous. Prefer immutable data and thread-safe collections such as `ConcurrentHashMap`.

## A checklist before you open a pull request

- [ ] Names explain themselves; no method does five things
- [ ] No `null` returned for collections; `Optional` for maybe-missing values
- [ ] Data classes are records or have `final` fields
- [ ] No empty `catch` blocks; resources use try-with-resources
- [ ] Strings compared with `equals`; `equals` and `hashCode` overridden together
- [ ] No string concatenation inside big loops
- [ ] Unit tests (JUnit 5) for the logic you changed
- [ ] Formatter and a linter (such as SonarLint in your IDE) show no new warnings

## FAQ

**Which Java version should I learn?**
Learn with the latest LTS (Java 25), and know that Java 17 and 21 are what many companies run in production. Everything in this post works on Java 21 and newer.

**Are design patterns a best practice?**
Know the common ones (factory, builder, strategy, observer) so you recognise them, but use them only when they simplify the code. Patterns used for their own sake make code harder to read. They're covered in our [System Design](/courses/system-design) course's low-level design module.

**Is Java still worth learning in 2026?**
Yes. It powers a huge share of backend systems in banks, e-commerce and enterprises, and frameworks like Spring Boot now include AI features through Spring AI.

Learning Java from scratch? Start with our [Java Full Course](/courses/java), then go further with [Java Backend with Spring Boot & Spring AI](/courses/spring-boot-ai).
