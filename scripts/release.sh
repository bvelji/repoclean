#!/usr/bin/env bash
set -euo pipefail

TYPE=${1:-patch}  # patch | minor | major

# ── Validate ──────────────────────────────────────────────
if [[ ! "$TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo "Usage: npm run release -- patch|minor|major" >&2
  exit 1
fi

# ── Start from a clean, up-to-date main ───────────────────
git checkout main
git pull origin main

# ── Bump version (package.json + lock only, no git tag) ───
npm version "$TYPE" --no-git-tag-version
VERSION=$(node -p "require('./package.json').version")
BRANCH="release/v$VERSION"

echo "→ Preparing release v$VERSION"

# ── Create release branch and PR ──────────────────────────
git checkout -b "$BRANCH"
git add package.json package-lock.json
git commit -m "chore: release v$VERSION"
git push origin "$BRANCH"

gh pr create \
  --title "chore: release v$VERSION" \
  --body "" \
  --base main

# ── Enable auto-merge (merges once CI passes) ─────────────
gh pr merge "$BRANCH" --merge --auto --delete-branch

# ── Wait for merge ────────────────────────────────────────
echo -n "→ Waiting for CI and merge"
while gh pr view "$BRANCH" --json state -q .state 2>/dev/null | grep -q "OPEN"; do
  echo -n "."
  sleep 5
done
echo " done"

# ── Tag the merged commit ─────────────────────────────────
git checkout main
git pull origin main

git tag "v$VERSION"
git push origin "v$VERSION"

echo "✓ Released v$VERSION — https://github.com/bvelji/repoclean/actions"
