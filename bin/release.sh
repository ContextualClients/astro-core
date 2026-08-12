#!/usr/bin/env bash

# this is to hack around changesets action
package_version=$(node -p "require('./package.json').version")
tag="v${package_version}"
if git show-ref --tags --verify --quiet "refs/tags/${tag}"; then
  echo "Tag ${tag} already exists"
else
  git tag -a $tag -m $tag
  echo "New tag: ${tag}"
fi
