---
name: feedback_branch_scope
description: One branch per task — do not create separate branches for small doc updates, session notes, or workflow tweaks
metadata:
  type: feedback
---

Only create a new branch when starting a numbered task (e.g. feat/task-3.3-...). Do not open separate branches for CLAUDE.md updates, session notes, git workflow changes, or other housekeeping — those belong as commits on the current task branch or batched at the end of a task.

**Why:** User called out that branches like `feat/enforce-branch-workflow` and `feat/session-notes-june10` are noise — they clutter the PR history with trivial changes.

**How to apply:**
- CLAUDE.md updates → commit on the current task branch before raising the PR
- Session-end notes → last commit on the current task branch
- Workflow/doc tweaks with no active task → hold until the next task branch is created and add there
