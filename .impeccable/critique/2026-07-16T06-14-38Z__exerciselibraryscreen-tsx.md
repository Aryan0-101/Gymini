---
target: ExerciseLibraryScreen
total_score: 30
p0_count: 0
p1_count: 1
timestamp: 2026-07-16T06-14-38Z
slug: exerciselibraryscreen-tsx
---
Method: ⚠️ DEGRADED: single-context (native React project; DOM detector incompatible)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Filter states are visible. |
| 2 | Match System / Real World | 4 | Standard gym terminology. |
| 3 | User Control and Freedom | 3 | Easy to clear filters. |
| 4 | Consistency and Standards | 2 | Hardcoded hex colors break theme. |
| 5 | Error Prevention | 3 | Instant search filtering. |
| 6 | Recognition Rather Than Recall | 3 | Info chips on cards. |
| 7 | Flexibility and Efficiency | 4 | Text search + categorical filters. |
| 8 | Aesthetic and Minimalist Design | 2 | Dual horizontal scroll is clunky. |
| 9 | Error Recovery | 3 | No empty state for zero results. |
| 10 | Help and Documentation | 3 | Straightforward UI. |
| **Total** | | **30/40** | **Good** |

### Anti-Patterns Verdict
**LLM**: The hardcoded `#F8F5F0` (cream) on sub-filters is a classic AI default that completely breaks the dark "Ink & Ember" brutalist brand identity.
**Deterministic**: Skipped (React Native).

### Overall Impression
Highly functional but visually fragmented. The search and primary filters follow the brand, but the sub-filters look copied from a different, lighter app.

### What's Working
- Fast, client-side SQLite filtering.
- Visual hierarchy of the exercise cards (image + chips).

### Priority Issues
- **[P1] Hardcoded Light Hex Colors**
  - **Why**: Sub-filters use `#F8F5F0` (light cream) inside a dark brutalist app. It breaks immersion.
  - **Fix**: Replace `#d6cfc7` and `#F8F5F0` with `theme.colors.borderSubtle` and `theme.colors.surfaceMuted`.
  - **Cmd**: `/impeccable polish ExerciseLibraryScreen`
- **[P2] Missing Empty State**
  - **Why**: If a search/filter combo yields zero results, the screen is just blank. Users might think it's loading or broken.
  - **Fix**: Add a dedicated "No exercises found" view in the center when `filteredExercises.length === 0`.
  - **Cmd**: `/impeccable clarify ExerciseLibraryScreen`
- **[P2] Clunky Dual Horizontal Scroll**
  - **Why**: Horizontal scroll bars stacked directly on top of each other (primary filters + sub-filters) is tedious to navigate and prone to mis-swipes.
  - **Fix**: Make sub-filters a wrapping `flex-wrap` layout below the primary filters, or use a modal/bottom-sheet.
  - **Cmd**: `/impeccable layout ExerciseLibraryScreen`

### Persona Red Flags
- **Jordan (First-Timer)**: If they search for something obscure and get a blank screen, they will assume the app crashed.

### Minor Observations
- Search input uses `backgroundColor: theme.colors.primary` but it might blend too much with the background.

### Questions
- "Could the equipment filter just be a multi-select dropdown instead of a horizontal scrolling bar?"
