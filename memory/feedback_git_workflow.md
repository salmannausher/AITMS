---
name: feedback_git_workflow
description: Never push directly to main — always use a feature branch + PR, even for small fixes or follow-up commits
metadata:
  type: feedback
---

Never push directly to `main`. Every commit — including small fixes, test files, and documentation updates — must go through a feature branch and PR.

**Why:** User explicitly enforced this after a test file was committed directly to main, bypassing CI. User is repeatedly frustrated that this rule is forgotten at the start of new sessions.

**How to apply:**
- The VERY FIRST thing to do at the start of any task is `git checkout -b feat/task-X.Y-description`
- Do this BEFORE writing a single line of code — not after
- Commit to the feature branch, push, create PR with `gh pr create`
- Only merge to main via PR — never `git push origin main` directly
- This applies to ALL commits: features, tests, docs, one-liners
- Branch naming: `feat/task-X.Y-short-description`
- If currently on the wrong branch, create the correct branch immediately before doing anything else
