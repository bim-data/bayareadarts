# Inline 9/9 Scorecard Editor & Past Round Entry

Redesign the past round entry modal (`NewRoundModal`) and the expandable round editor (`ExpandableRoundCard`) to replace grid-based hole cards with a unified 9/9 top/bottom scorecard layout featuring inline score/putt steppers and live totals.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your clarifying choices:
> 1. **Inline Stepper Controls**: Scores and putts will be adjusted directly in each hole cell using compact `+` and `-` stepper buttons with clear visual contrast.
> 2. **Dedicated Putts Row**: A dedicated `Putts` row sits directly below the `Score` row for each 9-hole section (Hole, Par, Score, Putts).
> 3. **Target Scope**: Applied to both round editing (`ExpandableRoundCard`) and manual new round score entry (`NewRoundModal`). Live in-round tracking (`ActiveGameModal` / live match play) remains untouched.

---

### 1. Overview & Core Concept

Currently, editing a past round or entering a new round hole-by-hole displays an arbitrary grid of separate cards (2x9 or 3x6) that is difficult to visually scan like a traditional golf scorecard.

This update converts both interfaces into the authentic 9/9 two-deck scorecard format (Front 9 on top, Back 9 on bottom), where golfers can immediately read holes 1–9 and 10–18 horizontally, check course par, tweak strokes and putts with inline steppers, and watch OUT, IN, and TOT column sums update in real time.

---

### 2. User Experience & Visual Design

#### A. 9/9 Top/Bottom Scorecard Layout
Each 9-hole section contains:
1. **Hole Header Row**: Hole numbers (1–9 or 10–18) plus `OUT` / `IN`.
2. **Par Row**: Hole par figures plus subtotal course par.
3. **Score Row (Strokes)**:
   - Hole cell with compact `–` and `+` buttons flanking the stroke count.
   - Dynamic score badges (circle for birdie/better, soft tint for par, square for bogey/higher) matching the standard scorecard design.
   - Subtotal gross score in the `OUT` / `IN` column updating instantly.
4. **Putts Row**:
   - Sub-row labeled `Putts` with compact `–` and `+` stepper buttons and emerald putts counter.
   - `OUT` / `IN` putts subtotal.

#### B. Unified Top-to-Bottom Total Column
- Flush against the right edge of OUT and IN with zero empty gap.
- Displays `TOT` header, full 18-hole par total, and real-time total gross score (and total putts).
- Centered in the drawer/modal window (`w-fit mx-auto`) with responsive horizontal scroll for mobile devices.

#### C. Controls & Actions
- **Round Editor (`ExpandableRoundCard`)**:
  - Header toolbar retains Date picker, Drinks counter, Delete button, Cancel button, and Save button.
  - Clicking Save persists updated hole scores, gross score, and putts to history.
- **Manual New Round (`NewRoundModal`)**:
  - Retains "⚡ Quick Par All Holes" button to prefill par across all holes with one click.
  - Drinks selector and Submit round button positioned cleanly below the scorecard.

---

### 3. Key Product Decisions & Trade-Offs

- **Dedicated Putts Row vs. Nested Sub-Badges**:
  - *Decision*: A dedicated `Putts` row directly under the `Score` row for both Front 9 and Back 9.
  - *Why*: Keeps stroke stepper buttons uncluttered, large enough for touch targets, and aligns with standard multi-row printed scorecards.
- **Intrinsic Fit Width (`w-fit mx-auto`)**:
  - *Decision*: Keep the scorecard snug to its 528px content width without stretched gaps between OUT/IN and TOT, centered in the container.
  - *Why*: Prevents empty black void gaps on wide monitors while ensuring mobile viewports scroll horizontally.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    ExpandableRoundCard / NewRoundModal      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Controls Header: Date | Drinks | Quick Par | Save/Submit│  │
│  └────────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────┬─────────┐  │
│  │ FRONT 9 (Holes 1–9)                          │   OUT   │  │
│  │ • Hole Header: 1  2  3  4  5  6  7  8  9     │   OUT   │  │
│  │ • Par Row:     4  4  3  5  4  4  3  5  4     │    36   │  │
│  │ • Score Row:  [-] 4 [+] ... [-] 5 [+]        │    39   │  │
│  │ • Putts Row:  [-] 2 [+] ... [-] 2 [+]        │    18   │  │
│  ├──────────────────────────────────────────────┼─────────┤  │
│  │ BACK 9 (Holes 10–18)                         │   IN    │  │
│  │ • Hole Header: 10 11 12 13 14 15 16 17 18    │   IN    │  │
│  │ • Par Row:     4  5  3  4  4  3  5  4  4     │    36   │  │
│  │ • Score Row:  [-] 4 [+] ... [-] 4 [+]        │    39   │  │
│  │ • Putts Row:  [-] 2 [+] ... [-] 2 [+]        │    17   │  │
│  └──────────────────────────────────────────────┴─────────┘  │
│                            │                                 │
│                            ▼                                 │
│                 ┌────────────────────┐                       │
│                 │ TOTAL (TOT) Column │  (Spanning Top-to-    │
│                 │ • TOT Header       │   Bottom Flush Right) │
│                 │ • Par 72           │                       │
│                 │ • Gross: 78        │                       │
│                 │ • Putts: 35        │                       │
│                 └────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

#### Component & State Handlers
1. **`ExpandableRoundCard.tsx`**:
   - `editScores` state (`Record<number, HoleScore>`) drives the score and putt steppers.
   - Real-time `outGross`, `inGross`, `totalGross`, `outPutts`, `inPutts`, and `totalPutts` computed dynamically as steppers are clicked.
   - `handleSaveEdit` aggregates scores and calls `onUpdatePastRound`.
2. **`NewRoundModal.tsx`**:
   - `manualHoleScores` state (`Record<number, HoleScore>`) drives the scorecard table in `manualEntryMode === 'hole_by_hole'`.
   - `handleUpdateManualHole(hNum, strokes, putts)` updates cell values.
   - `handleQuickParAllHoles` populates pars across all 18 holes.
   - Single 9-hole rounds (`front_9` or `back_9`) supported dynamically by showing only the active half.
