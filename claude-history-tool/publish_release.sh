#!/bin/bash

set -e

# Get the version from package.json
VERSION=$(node -p "require('./package.json').version")
TAG_NAME="claude-history-tool-v$VERSION"

echo "Publishing release $TAG_NAME..."

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
if git tag -l | grep -q "$TAG_NAME"; then
    echo "Error: Tag $TAG_NAME already exists"
    exit 1
fi

# Create and push tag
echo "Creating tag $TAG_NAME..."
git tag "$TAG_NAME"

echo "Pushing tag to remote..."
git push origin "$TAG_NAME"

echo "Release $TAG_NAME published successfully!"
echo "GitHub Actions should now build and create the release."