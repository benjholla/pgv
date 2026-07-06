#!/usr/bin/env bash
# scripts/deploy-demo.sh
#
# Interim deployment script for GitHub Pages demo.
#
# Due to GitHub Free tier restrictions on private repositories, some GitHub Actions
# (like deploying to GitHub Pages) might not be fully supported.
# This script manually performs the same actions as .github/workflows/deploy-demo.yml.
# It builds the demo and force-pushes the output to the "demo" branch on the origin remote.
#
# Usage: ./scripts/deploy-demo.sh

set -e

# Ensure we are running from the repository root
if [ ! -f "package.json" ] || [ ! -d ".git" ]; then
  echo "Error: Must be run from the repository root."
  exit 1
fi

echo "=============================="
echo " Installing dependencies...   "
echo "=============================="
pnpm install

echo "=============================="
echo " Building demo...             "
echo "=============================="
pnpm run build:demo

DIST_DIR="examples/vite-static/dist"
BRANCH="demo"

if [ ! -d "$DIST_DIR" ]; then
  echo "Error: Directory $DIST_DIR does not exist after build."
  exit 1
fi

echo "=============================="
echo " Deploying to branch '$BRANCH'"
echo "=============================="

# Get the remote URL for 'origin'
REMOTE_URL=$(git config --get remote.origin.url)

if [ -z "$REMOTE_URL" ]; then
  echo "Warning: Could not determine remote URL for 'origin'. Will attempt to push to 'origin' directly."
  REMOTE_URL="origin"
fi

# Go to the dist directory
cd "$DIST_DIR"

# Initialize a temporary git repository
git init -b "$BRANCH"

# Add all files and commit
git add .
git commit -m "Deploy demo to GitHub Pages (manual via deploy-demo.sh)"

# Push forcefully to the origin's demo branch
echo "Pushing to $REMOTE_URL on branch $BRANCH..."
git push -f "$REMOTE_URL" "$BRANCH"

# Clean up the .git directory in the dist folder
rm -rf .git

echo "=============================="
echo " Deployment script complete.  "
echo "=============================="
