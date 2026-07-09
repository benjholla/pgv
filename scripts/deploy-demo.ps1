<#
.SYNOPSIS
Interim deployment script for GitHub Pages demo.

.DESCRIPTION
Due to GitHub Free tier restrictions on private repositories, some GitHub Actions
(like deploying to GitHub Pages) might not be fully supported.
This script manually performs the same actions as .github/workflows/deploy-demo.yml.
It builds the demo and force-pushes the output to the "demo" branch on the origin remote.

.EXAMPLE
.\scripts\deploy-demo.ps1
#>

$ErrorActionPreference = "Stop"

# Ensure we are running from the repository root
if (-not (Test-Path "package.json") -or -not (Test-Path ".git")) {
    Write-Error "Must be run from the repository root."
    exit 1
}

Write-Host "=============================="
Write-Host " Installing dependencies...   "
Write-Host "=============================="
pnpm install

Write-Host "=============================="
Write-Host " Building demo...             "
Write-Host "=============================="
pnpm run build:demo

$DIST_DIR = "examples/vite-static/dist"
$BRANCH = "demo"

if (-not (Test-Path $DIST_DIR)) {
    Write-Error "Directory $DIST_DIR does not exist after build."
    exit 1
}

Write-Host "=============================="
Write-Host " Deploying to branch '$BRANCH'"
Write-Host "=============================="

# Get the remote URL for 'origin'
$REMOTE_URL = git config --get remote.origin.url

if (-not $REMOTE_URL) {
    Write-Host "Warning: Could not determine remote URL for 'origin'. Will attempt to push to 'origin' directly."
    $REMOTE_URL = "origin"
}

# Go to the dist directory
Push-Location $DIST_DIR

try {
    # Initialize a temporary git repository
    git init -b "$BRANCH"

    # Add all files and commit
    git add .
    git commit -m "Deploy demo to GitHub Pages (manual via deploy-demo.ps1)"

    # Push forcefully to the origin's demo branch
    Write-Host "Pushing to $REMOTE_URL on branch $BRANCH..."
    git push -f "$REMOTE_URL" "$BRANCH"
}
finally {
    # Clean up the .git directory in the dist folder
    if (Test-Path ".git") {
        Remove-Item -Recurse -Force .git
    }

    Pop-Location
}

Write-Host "=============================="
Write-Host " Deployment script complete.  "
Write-Host "=============================="
