# TRENDING ENGINE SPECIFICATION — GRAND FOOD FEST

This document details the algorithm, rolling time window, and metrics used to identify trending food stalls.

---

## 1. TRENDING CONCEPT & WINDOW

Trending identifies stalls that are experiencing significant attendee momentum **right now**, helping visitors discover stalls that are buzzing across the festival grounds.

* **Rolling Window**: Default **30 minutes** (`windowMinutes = 30`).
* **Entity Scope**: Active food vendors only (`vendorType: FOOD`, `status: ACTIVE`).
* **Truthful Metrics**: No synthetic movement labels (e.g. `↑ 7 positions` is forbidden unless backed by historical snapshots).

---

## 2. TRENDING SCORING FORMULA

For each food vendor with activity in the rolling window:
1. Count the number of valid ratings in the last 30 minutes ($N_{30}$).
2. Calculate the average score of those recent ratings ($R_{30}$).
3. Compute the **Trending Score** ($T$):
   $$T = N_{30} \cdot \left(\frac{R_{30}}{3.0}\right)$$

### Rationale:
* Multiplying volume by $\frac{R_{30}}{3.0}$ rewards high rating velocity while weighting positively reviewed stalls higher than stalls receiving mediocre feedback.
* Stalls are sorted by $T$ descending.

---

## 3. DISPLAYED CONSUMER LABELS

Trending stalls display human-readable, truthful cards:

```text
🔥 Trending now

Spice Route
+42 ratings in 30 min
Avg: 4.8★

Dessert Lab
+31 ratings in 30 min
Avg: 4.7★
```

* `velocityLabel`: `+X ratings in 30 min`
* `surgeReason`: `+X ratings in last 30 min (avg Y★)`
