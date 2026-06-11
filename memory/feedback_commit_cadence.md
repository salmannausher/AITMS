---
name: feedback_commit_cadence
description: Commit after each part of a multi-part task, not one big commit at the end
metadata:
  type: feedback
---

When a task is broken into numbered parts (Part 1, Part 2, etc.), commit to the feature branch after each part is complete before moving to the next.

**Why:** User wants incremental commits so progress is visible and each part is independently reviewable in git history.

**How to apply:**
- Complete Part 1 → `git commit` with a message scoped to that part → continue to Part 2
- Never batch all parts into a single commit at the end
- Commit message should reference the part: e.g. "feat(task-3.3): Part 1 — types"
