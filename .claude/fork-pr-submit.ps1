# fork-pr-submit.ps1
# Automation: Commit + Push + Create PR for fork repos

param(
    [string]$CommitMsg = "Session work: $(Get-Date -Format 'yyyy-MM-dd')"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Fork PR Automation ===" -ForegroundColor Yellow

# Step 1: Check if this is a fork
Write-Host "Checking for upstream remote..." -ForegroundColor Yellow
$remotes = git remote -v
if ($remotes -notmatch "upstream") {
    Write-Host "Not a fork (no upstream remote found). Skipping." -ForegroundColor Red
    exit 0
}

Write-Host "Detected fork (upstream remote exists)" -ForegroundColor Green

# Step 2: Check for changes
Write-Host "Checking for changes..." -ForegroundColor Yellow
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "No changes to commit. Skipping." -ForegroundColor Yellow
    exit 0
}

$lines = $status -split "`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
$changedFiles = $lines.Count
Write-Host "Found $changedFiles changed file(s)" -ForegroundColor Green

# Step 3: Show changes
Write-Host ""
Write-Host "--- Changes ---" -ForegroundColor Yellow
git status --short
Write-Host ""

# Step 4: Confirm if large change
if ($changedFiles -gt 10) {
    Write-Host "WARNING: More than 10 files changed. Please review above." -ForegroundColor Red
    $confirm = Read-Host "Continue? (y/n)"
    if ($confirm -ne "y") {
        Write-Host "Aborted by user."
        exit 0
    }
}

# Step 5: Commit
Write-Host ""
Write-Host "Committing changes..." -ForegroundColor Yellow
git add .
git commit -m "$CommitMsg"
Write-Host "Committed" -ForegroundColor Green

# Step 6: Push
Write-Host "Pushing to fork..." -ForegroundColor Yellow
$branch = git rev-parse --abbrev-ref HEAD
git push origin $branch
Write-Host "Pushed to origin/$branch" -ForegroundColor Green

# Step 7: Create PR
Write-Host "Creating pull request..." -ForegroundColor Yellow

$upstreamBranch = "main"
git rev-parse --verify "upstream/main" 2>$null
if ($LASTEXITCODE -ne 0) {
    $upstreamBranch = "master"
}

$prTitle = "Session work: $(Get-Date -Format 'yyyy-MM-dd')"
$prBody = "Session automation: commit + push + PR`n`nChanges: $changedFiles file(s)`nCommit: $CommitMsg"

# Check if GitHub CLI is installed
$ghExists = $null -ne (Get-Command gh -ErrorAction SilentlyContinue)
if (-not $ghExists) {
    Write-Host "GitHub CLI (gh) not found. Cannot create PR automatically." -ForegroundColor Red
    Write-Host "Please create PR manually:"
    Write-Host "  Base: upstream/$upstreamBranch"
    Write-Host "  Head: origin/$branch"
    exit 1
}

# Create PR
$upstreamUrl = git config --get remote.upstream.url
$upstreamRepo = $upstreamUrl -replace '\.git$', ''

gh pr create --title "$prTitle" --body "$prBody" --base "upstream:$upstreamBranch" --head "origin:$branch" --repo "$upstreamRepo"

Write-Host "Pull request created" -ForegroundColor Green
Write-Host "=== Session automation complete ===" -ForegroundColor Green
