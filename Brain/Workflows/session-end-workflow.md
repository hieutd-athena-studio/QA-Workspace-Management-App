---
title: Session End Workflow
type: workflow
---

# Session End Workflow

Run this before closing a session. The goal: the next session can pick up cold with no context loss.

## 1. Write a journal entry

Copy [[Journal-template]] to:

```text
Brain/<Project>/Journals/YYYY-MM-DD-<short-slug>.md
```

Use the slim template — bullets only, no prose. Fill in:
- **Shipped** — file paths + what changed
- **Decided** — non-trivial choices + one-line reason (inline here, no ADR needed for single-dev)
- **Next** — concrete follow-up actions
- **Traps** — gotchas for next Claude

## 2. Auto-update the file-map

Run the following to detect new/deleted files since the last commit:

```bash
git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --cached --name-only
```

For each **new** file: add a row to `Brain/<Project>/Context/file-map.md`.
For each **deleted** file: remove its row, then grep `Brain/` for references and remove them.

Skip if no files were added or deleted (modifications only = no map update needed).

## 3. Log any hard-won bugs

If a bug took **> 30 minutes** to diagnose, create a Lesson-Learned:

1. Copy [[Lesson-Learned-template]] to `Library/Lessons-Learned/<slug>.md`
2. Include the **exact error signature** so future grep hits it
3. Document **root cause** + **fix** + **detection heuristic**

## 4. Update `Architecture.md` (rarely)

Only if the **vault schema itself** changed (new top-level folder, new template). Bump `last_reviewed` in frontmatter.

## 5. Commit and push (if repo-tracked)

If the vault is committed to git (it lives inside this repo):

- `git status` — review what changed
- `git add Brain/` — stage vault updates
- Commit with a short message like `docs(vault): journal 2026-04-20`
- `git push origin main` — push all session commits (feature + vault) to remote

Push covers **all commits made this session**, not just the vault commit. Always push at session end so remote stays current.

## 6. Auto-submit to fork (if applicable)

If this repo is a **fork** and there are **uncommitted changes**, run the fork PR automation:

**On Windows (PowerShell):**
```powershell
.\.claude\fork-pr-submit.ps1
```

**On macOS/Linux (Bash):**
```bash
bash .claude/fork-pr-submit.sh
```

The script will:
1. ✓ Verify `upstream` remote exists (confirming this is a fork)
2. ✓ Check for uncommitted changes
3. ✓ Show what will be committed (ask confirmation if > 10 files)
4. ✓ Commit all changes with timestamp
5. ✓ Push to your fork origin
6. ✓ Create a pull request to upstream `main` (or `master`) branch

**The script skips if:**
- No `upstream` remote found (not a fork)
- No changes to commit
- User declines confirmation
- GitHub CLI (`gh`) is not installed

**Requires:**
- GitHub CLI installed: `gh` ([install](https://cli.github.com/))
- `gh` authenticated: `gh auth login`
