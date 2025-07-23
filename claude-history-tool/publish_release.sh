#!/bin/bash

set -e

# Get the version from package.json
VERSION=$(node -p "require('./package.json').version")

echo "Publishing release v$VERSION..."

# Check if we're on main branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    echo "Error: Must be on main branch to publish release (currently on $BRANCH)"
    exit 1
fi

# Check if working directory is clean
if ! git diff-index --quiet HEAD --; then
    echo "Error: Working directory is not clean. Please commit all changes first."
    exit 1
fi

# Check if tag already exists
if git tag -l | grep -q "v$VERSION"; then
    echo "Error: Tag v$VERSION already exists"
    exit 1
fi

# Create and push tag
echo "Creating tag v$VERSION..."
git tag "v$VERSION"

echo "Pushing tag to remote..."
git push origin "v$VERSION"

echo "Release v$VERSION published successfully!"
echo "GitHub Actions should now build and create the release."