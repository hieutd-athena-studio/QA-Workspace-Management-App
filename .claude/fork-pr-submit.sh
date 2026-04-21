#!/bin/bash
# fork-pr-submit.sh
# Automation: Commit + Push + Create PR for fork repos
# Usage: bash .claude/fork-pr-submit.sh [optional-commit-message]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

COMMIT_MSG="${1:-Session work: $(date +%Y-%m-%d)}"

echo -e "${YELLOW}=== Fork PR Automation ===${NC}"

# Step 1: Check if this is a fork
if ! git remote -v | grep -q upstream; then
  echo -e "${RED}✗ Not a fork (no upstream remote found). Skipping.${NC}"
  exit 0
fi

echo -e "${GREEN}✓ Detected fork (upstream remote exists)${NC}"

# Step 2: Check for changes
if git diff --quiet && git diff --cached --quiet; then
  echo -e "${YELLOW}✓ No changes to commit. Skipping.${NC}"
  exit 0
fi

CHANGED_FILES=$(git status --short | wc -l)
echo -e "${GREEN}✓ Found $CHANGED_FILES changed file(s)${NC}"

# Step 3: Show changes
echo ""
echo -e "${YELLOW}--- Changes ---${NC}"
git status --short
echo ""

# Step 4: Confirm if large change
if [ "$CHANGED_FILES" -gt 10 ]; then
  echo -e "${RED}⚠ More than 10 files changed. Please review above before confirming.${NC}"
  echo -e "${YELLOW}Continue? (y/n)${NC}"
  read -r CONFIRM
  if [ "$CONFIRM" != "y" ]; then
    echo "Aborted by user."
    exit 0
  fi
fi

# Step 5: Commit
echo ""
echo -e "${YELLOW}Committing changes...${NC}"
git add .
git commit -m "$COMMIT_MSG"
echo -e "${GREEN}✓ Committed${NC}"

# Step 6: Push
echo -e "${YELLOW}Pushing to fork...${NC}"
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push origin "$BRANCH"
echo -e "${GREEN}✓ Pushed to origin/$BRANCH${NC}"

# Step 7: Create PR
echo -e "${YELLOW}Creating pull request...${NC}"

# Get current branch and upstream main
UPSTREAM_BRANCH="main"
if ! git rev-parse --verify upstream/main &>/dev/null; then
  UPSTREAM_BRANCH="master"
fi

PR_TITLE="Session work: $(date +%Y-%m-%d)"
PR_BODY="Session automation: commit + push + PR

Changes: $CHANGED_FILES file(s) modified
Commit: $COMMIT_MSG

Merge into upstream \`$UPSTREAM_BRANCH\` to sync this work back."

# Use GitHub CLI to create PR
if command -v gh &> /dev/null; then
  gh pr create \
    --title "$PR_TITLE" \
    --body "$PR_BODY" \
    --base "upstream:$UPSTREAM_BRANCH" \
    --head "origin:$BRANCH" \
    --repo "$(git config --get remote.upstream.url | sed 's/.git$//')"
  echo -e "${GREEN}✓ Pull request created${NC}"
else
  echo -e "${RED}✗ GitHub CLI (gh) not found. Cannot create PR automatically.${NC}"
  echo "Please create PR manually:"
  echo "  Base: upstream/$UPSTREAM_BRANCH"
  echo "  Head: origin/$BRANCH"
  exit 1
fi

echo -e "${GREEN}=== Session automation complete ===${NC}"
