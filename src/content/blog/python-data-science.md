> **In short:** data science in Python rests on three libraries: **NumPy** (fast arrays), **pandas** (tables) and **Matplotlib** (charts). Set them up in minutes (or use Google Colab with no install), then follow one small project end to end: load a dataset, inspect it, clean it, group and compare, visualise, and write down what you found.

"Learn data science" can feel endless: statistics, machine learning, deep learning, big data. But every one of those starts in the same place: loading a table of data, cleaning it and asking it questions. This guide teaches that core with one realistic example, a small college placement dataset, so you finish having done a real analysis, not just read about functions.

## Set up in five minutes

**Option 1: no install.** Open [Google Colab](https://colab.research.google.com), sign in with Google and create a notebook. NumPy, pandas and Matplotlib are already installed.

**Option 2: on your laptop.** Install Python 3.12 or newer from python.org, then:

```bash
python -m venv .venv
source .venv/bin/activate        # on Windows: .venv\Scripts\activate
pip install numpy pandas matplotlib jupyterlab
jupyter lab
```

A **virtual environment** (`.venv`) keeps each project's libraries separate, so one project's upgrade never breaks another. Make it a habit from day one.

This guide uses **pandas 3**, released in January 2026. If you see older tutorials, the differences that matter are noted where they come up.

## NumPy in two minutes: think in whole arrays

NumPy arrays let you do maths on a whole column of numbers at once, much faster than a Python loop:

```python
import numpy as np

marks = np.array([72, 95, 60, 88])
print(marks.mean())          # 78.75
print(marks * 1.1)           # every mark scaled up by 10%, no loop
print(marks[marks > 70])     # [72 95 88]  keep only the marks above 70
```

This style, called **vectorisation**, is the key habit in data work: operate on the whole column, not item by item. pandas is built on top of it.

## The project: what makes students get placed?

Here's a small dataset of ten students. In real life you'd load a CSV file with `pd.read_csv("placements.csv")`; to keep this self-contained, we read it from a string:

```python
import io
import pandas as pd

csv = """name,branch,cgpa,internships,placed,package_lpa
Asha,CSE,8.9,2,yes,14.0
Ravi,ECE,7.2,1,yes,6.5
Meena,CSE,9.3,3,yes,22.0
Arjun,ME,6.8,0,no,
Sara,IT,8.1,1,yes,9.0
Kabir,CSE,7.5,,yes,8.0
Nisha,ECE,8.4,2,yes,10.5
Vikram,ME,7.9,1,yes,5.5
Pooja,IT,,1,no,
Rohan,CSE,6.5,0,no,
"""

df = pd.read_csv(io.StringIO(csv))
```

A pandas **DataFrame** is a table: rows are students, columns are features. Each column is a **Series**.

## Step 1: look before you touch anything

```python
print(df.shape)          # (10, 6): 10 rows, 6 columns
print(df.head())         # first five rows
df.info()                # column types and how many values are filled in
print(df.describe())     # count, mean, min, max and quartiles of numeric columns
print(df.isna().sum())   # missing values per column
```

`isna().sum()` shows **1** missing CGPA, **1** missing internship count and **3** missing packages. The missing packages are for students who weren't placed, so they're expected. The other two are real gaps.

In pandas 3, text columns like `name` and `branch` get a dedicated string type (`str`) instead of the generic `object` you'll see in older tutorials.

## Step 2: clean the data

Every real dataset is messy. Decide deliberately what each fix means:

```python
# No internship recorded most likely means none
df["internships"] = df["internships"].fillna(0).astype(int)

# Fill a missing CGPA with the median CGPA of that student's branch
df["cgpa"] = df["cgpa"].fillna(df.groupby("branch")["cgpa"].transform("median"))

# Turn "yes"/"no" into True/False so we can average it
df["placed"] = df["placed"].eq("yes")
```

The median is used instead of the mean because a single very high or low value can pull the mean a long way. `transform("median")` gives each row the median of **its own** group, so Pooja (IT) gets the IT median.

**Changing values: always use `.loc`.** Selecting and then assigning in two steps, like `df[df["placed"]]["package_lpa"] = 0`, doesn't change `df` in pandas 3 (it changes a temporary copy; older versions only warned). The correct form picks rows and column in one go:

```python
df.loc[~df["placed"], "package_lpa"] = 0.0   # students not placed: package 0
```

## Step 3: ask questions with groupby

Which branch does best? `groupby` splits the table into groups, calculates something for each, and combines the results:

```python
placed = df[df["placed"]]   # only placed students, for package figures

summary = df.groupby("branch").agg(
    students=("name", "count"),
    placement_rate=("placed", "mean"),
)
summary["avg_package_lpa"] = placed.groupby("branch")["package_lpa"].mean()
summary = summary.sort_values("avg_package_lpa", ascending=False)
print(summary.round(2))
```

You should get:

| branch | students | placement_rate | avg_package_lpa |
| --- | --- | --- | --- |
| CSE | 4 | 0.75 | 14.67 |
| IT | 2 | 0.50 | 9.00 |
| ECE | 2 | 1.00 | 8.50 |
| ME | 2 | 0.50 | 5.50 |

The average of a True/False column is the **fraction that are True**, which is why `placement_rate` works.

Do internships help? Group by the number of internships instead:

```python
print(df.groupby("internships")["placed"].mean())
```

Students with no internships were placed 33% of the time, with one internship 75%, and with two or more, 100%.

## Step 4: visualise

A chart often shows in a second what a table hides:

```python
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(6, 4))
summary["avg_package_lpa"].plot(kind="bar", ax=ax, color="#0052CC")
ax.set_title("Average package by branch (placed students)")
ax.set_xlabel("Branch")
ax.set_ylabel("Package (LPA)")
fig.tight_layout()
fig.savefig("package_by_branch.png", dpi=150)
plt.show()
```

Always label the axes and give the chart a title that states what it shows. Charts without labels are the most common mistake in student reports.

## Step 5: write down what you found, carefully

The last step is the one most beginners skip, and the one that matters most in a job:

- CSE had the highest average package in this sample, and internships went with higher placement rates.
- **But** this is ten students. That's far too few to draw real conclusions, and **correlation isn't causation**: students who do internships may also differ in other ways (skills, effort, college support).

Being honest about what the data can and can't show is what separates an analyst from someone who makes charts.

## The pandas you'll use 90% of the time

| Task | Code |
| --- | --- |
| load a CSV | `pd.read_csv("file.csv")` |
| first rows, size, types | `df.head()`, `df.shape`, `df.info()` |
| pick columns | `df["cgpa"]`, `df[["name", "cgpa"]]` |
| filter rows | `df[df["cgpa"] > 8]` |
| select and change | `df.loc[rows, "column"] = value` |
| missing values | `df.isna().sum()`, `fillna`, `dropna` |
| new column | `df["ratio"] = df["a"] / df["b"]` |
| sort | `df.sort_values("cgpa", ascending=False)` |
| counts | `df["branch"].value_counts()` |
| group and summarise | `df.groupby("branch")["cgpa"].mean()` |
| combine tables | `pd.merge(left, right, on="id")` |

## Common mistakes

- **Loops over rows** (`for i in range(len(df))`). Use column operations instead; they're simpler and far faster.
- **Chained assignment** such as `df[mask]["col"] = x`. Use `df.loc[mask, "col"] = x`.
- **Silently dropping missing data** with `dropna()` everywhere. Understand **why** values are missing first.
- **Charts without labels or titles.**
- **Big claims from small data.**

## What to learn next

1. **Statistics basics**: mean vs median, spread, distributions, sampling and correlation.
2. **SQL**: most company data lives in databases. See our [DBMS and SQL notes](/notes/dbms-sql).
3. **Seaborn** for nicer statistical charts.
4. **scikit-learn** for your first machine learning models.
5. **Real datasets**: pick one from Kaggle or data.gov.in and publish your notebook on GitHub.

## FAQ

**Do I need to be good at maths?**
School-level maths is enough to start. You'll pick up statistics as you go, and it matters more than calculus for most data analyst roles.

**Jupyter notebook or `.py` files?**
Notebooks are ideal for exploring and explaining analysis. Move reusable code into `.py` files as a project grows.

**Data analyst, data scientist or ML engineer?**
Analysts answer business questions with data (SQL, pandas, dashboards). Data scientists add statistics and machine learning. ML engineers build and deploy models. All three start with exactly what's in this post. See [AI job profiles](/blog/ai-job-profiles) for how the AI roles differ.

Want to learn Python properly first? See our [Python for Beginners](/courses/python) course, and later [Applied AI & Machine Learning](/courses/applied-ai).
