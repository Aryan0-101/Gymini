---
target: WorkoutDetailScreen
total_score: 29
p0_count: 0
p1_count: 2
timestamp: 2026-07-16T06-21-30Z
slug: workoutdetailscreen-tsx
---
Method: ⚠️ DEGRADED: single-context (native React project; DOM detector incompatible)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Sets/Rest values clearly visible. |
| 2 | Match System / Real World | 4 | Gym terminology fits perfectly. |
| 3 | User Control and Freedom | 3 | Missing ability to remove/reorder exercises. |
| 4 | Consistency and Standards | 3 | UI follows Ink & Ember. |
| 5 | Error Prevention | 3 | Min constraints (Sets ≥ 1) enforced. |
| 6 | Recognition Rather Than Recall | 3 | Thumbnails aid recognition. |
| 7 | Flexibility and Efficiency | 2 | Fixed order, no drag-and-drop. |
| 8 | Aesthetic and Minimalist Design | 3 | Utilitarian layout, slightly boxy controls. |
| 9 | Error Recovery | 2 | No explicit "Save" indicator for edits. |
| 10 | Help and Documentation | 3 | Straightforward UI. |
| **Total** | | **29/40** | **Fair** |

### Anti-Patterns Verdict
**LLM**: The layout is solid and brand-aligned, but the UX interaction pattern is incomplete (edits are orphaned in state).
**Deterministic**: Skipped (React Native).

### Overall Impression
Looks great visually, but mechanically incomplete as an editor. Edits aren't saved to the DB, and you can't delete exercises.

### What's Working
- **Inline Editing**: Adjusting sets/rest inline instead of a separate modal is great.
- **Header Structure**: `displayLg` title and `bodyMd` description provide good context.

### Priority Issues
- **[P1] Silent Data Loss (No Save)**
  - **Why**: Adjustments to Sets and Rest are stored in local React state and passed to `ActiveSession`, but are never saved to the SQLite database. If a user backs out, their edits are lost without warning.
  - **Fix**: Add auto-save via `useEffect` bouncing, or an explicit "Save Changes" header button that updates `saved_plans`.
  - **Cmd**: `/impeccable harden WorkoutDetailScreen`
- **[P1] Cannot Remove Exercises**
  - **Why**: Once an exercise is in a plan, there is no UI to remove it.
  - **Fix**: Add a swipe-to-delete wrapper or a simple trash icon on the exercise card.
  - **Cmd**: `/impeccable layout WorkoutDetailScreen`
- **[P3] Small Touch Targets**
  - **Why**: The `-` and `+` adjusters are a bit tight. Sweaty thumbs at the gym need generous hit areas.
  - **Fix**: Add `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}` to `adjBtn`.
  - **Cmd**: `/impeccable layout WorkoutDetailScreen`

### Persona Red Flags
- **Alex (Power User)**: Will be incredibly frustrated that they can't reorder the exercises (e.g., supersets) or delete a movement they subbed out.

### Minor Observations
- The "Start Workout" button sits at `bottom: 24`, which is good, but `scrollContent` has `paddingBottom: 100`, which clears it perfectly. Good job.

### Questions
- "Should we allow users to swap an exercise directly from this screen instead of just deleting and re-adding?"
