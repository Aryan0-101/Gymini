---
target: ActiveSessionScreen
total_score: 34
p0_count: 0
p1_count: 1
timestamp: 2026-07-16T06-31-07Z
slug: activesessionscreen-tsx
---
Method: ⚠️ DEGRADED: single-context (native React project; DOM detector incompatible)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Excellent tracking of active, completed, and upcoming sets. |
| 2 | Match System / Real World | 4 | Terminology matches gym reality perfectly. |
| 3 | User Control and Freedom | 3 | Add/remove sets on the fly is great. |
| 4 | Consistency and Standards | 4 | Brutalist "Ink & Ember" is heavily enforced. |
| 5 | Error Prevention | 3 | Set progression logic is strict. |
| 6 | Recognition Rather Than Recall | 4 | Great use of thumbnails for "Up Next". |
| 7 | Flexibility and Efficiency | 3 | Inline keyboard inputs are fast. |
| 8 | Aesthetic and Minimalist Design | 4 | Fantastic typography and contrast hierarchy. |
| 9 | Error Recovery | 2 | No way to undo a completed set! |
| 10 | Help and Documentation | 3 | Form thumbnails provide immediate help. |
| **Total** | | **34/40** | **Good** |

### Anti-Patterns Verdict
**LLM**: A highly focused, brutalist workout tracker. Excellent use of typography to denote past/present/future states.
**Deterministic**: Skipped (React Native).

### Overall Impression
The Active Session screen is visually striking and mechanically sound, except for one critical error recovery issue that will frustrate real users mid-workout.

### What's Working
- **Visual Hierarchy**: The way completed sets turn gray and dashed, while the active set gets a thick ember border and scale transform, is exceptional design.
- **Up Next Footer**: A horizontal scroll of upcoming thumbnails keeps the user oriented.

### Priority Issues
- **[P1] No Undo for Completed Sets**
  - **Why**: Gym-goers have shaky hands. If they accidentally hit the giant "Complete" FAB, the active set instantly collapses into a completed row, and there's no way to click it to undo and edit the reps/weight.
  - **Fix**: Wrap `completedSetRow` in a `Pressable`. If tapped, remove it from `completedSets` and set `activeSetIdx` back to that index.
  - **Cmd**: `/impeccable layout ActiveSessionScreen`
- **[P2] Keyboard Blocks the FABs**
  - **Why**: When typing in weight or reps, the keyboard rises. Because the FABs are absolutely positioned to the bottom, the keyboard covers the "Complete" button, forcing the user to manually dismiss the keyboard every set.
  - **Fix**: Wrap the screen in a `KeyboardAvoidingView` or listen to keyboard events to bump the FAB container up above the keyboard.
  - **Cmd**: `/impeccable layout ActiveSessionScreen`
- **[P3] Timer Readability**
  - **Why**: The circular timer SVG at the top is clever, but `(sessionTimer % 60) * (283 / 60)` math can be jagged without a smooth animation wrapper, though acceptable.

### Persona Red Flags
- **Alex (Power User)**: Will get extremely frustrated having to constantly dismiss the iOS/Android keyboard just to tap "Complete Set".

### Minor Observations
- The `KeyboardType="numeric"` is perfect for fast input.
- The use of `IBM Plex Mono` for the numbers adds to the "lab/data" brutalist feel perfectly.
