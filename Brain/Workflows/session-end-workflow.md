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

Fill in:

- **What shipped** — concrete changes, file paths OK
- **Key decisions** — anything non-trivial
- **Unresolved / next steps** — open bugs, edge cases, half-done work
- **Follow-ups for Claude** — heuristics the next session should know

Keep it terse — think minutes of writing, not an essay.

## 2. Record any new ADRs

If the session made a **non-trivial decision** (a pattern chosen, a library rejected, a schema change, an API shape), create an ADR:

1. Copy [[ADR-template]] to `Brain/<Project>/ADR/ADR-NNN-slug.md`
2. Set `status: Accepted` (or `Proposed` if still in debate)
3. Add a row to the ADR index in `Brain/<Project>/ADR/README.md`
4. Link the ADR from the project Context Map if it affects the Don't / Do section

## 3. Log any hard-won bugs

If a bug took **> 30 minutes** to diagnose, create a Lesson-Learned:

1. Copy [[Lesson-Learned-template]] to `Library/Lessons-Learned/<slug>.md`
2. Include the **exact error signature** so future grep hits it
3. Document **root cause** + **fix** + **detection heuristic**

## 4. Update the Context Map (if needed)

If the session changed:

- A major file moved / added / deleted → update [[file-map]] (`Brain/<Project>/Context/file-map.md`)
- A vault file was **deleted** → run the Link Cleanup Rule: grep `Brain/` for references to the deleted filename and remove them before deleting (see [[Architecture]] §8)
- A rule file added or removed → update the Context Map Rules section and `CLAUDE.md` Rules table

## 5. Update `Architecture.md` (rarely)

Only if the **vault schema itself** changed (new top-level folder, new template). Bump `last_reviewed` in frontmatter.

## 6. Commit and push (if repo-tracked)

If the vault is committed to git (it lives inside this repo):

- `git status` — review what changed
- `git add Brain/` — stage vault updates
- Commit with a short message like `docs(vault): journal 2026-04-20 + ADR-005`
- `git push origin main` — push all session commits (feature + vault) to remote

Push covers **all commits made this session**, not just the vault commit. Always push at session end so remote stays current.

## 7. Auto-submit to fork (if applicable)

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
