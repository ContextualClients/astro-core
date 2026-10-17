#!/usr/bin/env bash

set -e

sync_ref_file=".template-sync-ref"

gh auth setup-git

git config user.name ContextualDevOps
git config user.email devops@contextual.io
git config merge.ours.driver true

# Load custom `merge=<name>` attribute drivers.
for driver in bin/merge/*.ts; do
  [ -e "${driver}" ] || continue
  git config "merge.$(basename "${driver}" .ts).driver" "node ${driver} %O %A %B"
done

# Load .templatesyncignore entries.
if [ -f .templatesyncignore ]; then
  # Normalize entries: strip whitespace and trailing slashes, anchor "./" to the repo root, and
  # cover both files and dirs.
  awk '{ gsub(/^[[:space:]]+|[[:space:]]+$/, ""); sub(/\/+$/, ""); sub(/^\.\//, "/") }
       !/^#/ && NF { print $0 " merge=ours"; print $0 "/** merge=ours" }' \
    .templatesyncignore >> "$(git rev-parse --git-dir)/info/attributes"
fi

# Fetch the remote template and pin the commit this run will sync to.
git fetch --no-tags "${TEMPLATE_REMOTE}" main
template_head=$(git rev-parse FETCH_HEAD)
template_head_short=$(git rev-parse --short FETCH_HEAD)

# Without a record of the last sync there is no base to merge against.
if [ ! -f "${sync_ref_file}" ]; then
  echo "${sync_ref_file} file is missing. Cannot sync with template." >&2
  exit 1
fi

last_sync_commit=$(cat "${sync_ref_file}")
package_name=$(node -p "require('./package.json').name")

template_version () {
  git show "$1:package.json" | node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).version"
}

if git merge-base --is-ancestor "${template_head}" "${last_sync_commit}"; then
  echo "Already up to date with astro-core @ ${template_head_short}."
  exit 0
fi

# Named for the commit being synced from, so if a sync round is missed the branch name is reused.
branch="template-sync/from-${last_sync_commit:0:7}" # Slice instead of --short to guarantee consistency

# Leave a pending sync alone when it already carries this template commit.
if git fetch --no-tags origin "${branch}" 2>/dev/null \
  && [ "$(git show "FETCH_HEAD:${sync_ref_file}")" = "${template_head}" ]; then
  echo "Sync for astro-core @ ${template_head_short} is already open."
  exit 0
fi

# Land all changes on the sync branch; never on the default branch.
git switch -c "${branch}"

# Only merge changes since the last sync point.
git merge -s ours --allow-unrelated-histories --no-edit \
  -m "chore(template): base on astro-core @ $(git rev-parse --short "${last_sync_commit}")" "${last_sync_commit}"

pre_sync_tree=$(git rev-parse 'HEAD^{tree}')

# Commit conflict markers when changes cannot be reconciled.
if ! git merge --no-edit -m "chore(template): sync astro-core template" "${template_head}"; then
  conflict_note=$'\n\n> [!WARNING]\n> This sync could not be merged cleanly. Resolve conflict markers on this branch before merging.'
  draft_on_conflict=--draft # Conflicted branches land as draft PRs to ensure they're handled.
  git add -A
  git commit -m "chore(template): sync astro-core template (unresolved conflicts)"
fi

# If any changeset files from the template slip through then they will block the clone's
# release process. This should never happen anyway, but if it does: remove them.
template_changesets=$(git diff --name-only --diff-filter=A "${last_sync_commit}" "${template_head}" -- .changeset)
if [ -n "${template_changesets}" ]; then
  echo "${template_changesets}" | xargs git rm -q --ignore-unmatch --
  git commit -m "chore(template): drop changesets that reference the template"
fi

# Write a changeset file for this sync run so that a versioning PR gets cut, unless the sync changed nothing.
if [ -d .changeset ] && [ "$(git rev-parse 'HEAD^{tree}')" != "${pre_sync_tree}" ]; then
  {
    echo "---"
    echo "\"${package_name}\": patch"
    echo "---"
    echo
    if [ "$(template_version "${last_sync_commit}")" = "$(template_version "${template_head}")" ]; then
      echo "Sync the astro-core template @ ${template_head_short}."
    else
      echo "Sync the astro-core template $(template_version "${last_sync_commit}") → $(template_version "${template_head}")."
    fi
  } > ".changeset/template-sync-${template_head_short}.md"
  git add ".changeset/template-sync-${template_head_short}.md"
  git commit -m "chore(template): add a changeset for the synced changes"
fi

# Update the sync ref file so the next sync can identify this as the base.
echo "${template_head}" > "${sync_ref_file}"
git add "${sync_ref_file}"
git commit -m "chore(template): record astro-core @ ${template_head_short} as synced"

# If the last sync PR was never merged, close it. This sync carries that PRs changes as well.
if git ls-remote --exit-code --heads origin "${branch}" > /dev/null 2>&1; then
  gh pr close "${branch}" --delete-branch \
    --comment "Superseded by a sync carrying astro-core @ ${template_head_short}. Commits added to this branch (conflict resolutions, etc.) will need to be reapplied on the new PR." \
    || git push origin --delete "${branch}"
fi

# Open a PR with the sync results.
git push -u origin "${branch}"
gh pr create ${draft_on_conflict} \
  --base "${GITHUB_REF_NAME}" \
  --head "${branch}" \
  --title "chore(template): sync astro-core @ ${template_head_short}" \
  --body "Syncs \`astro-core\` @ \`${template_head_short}\`.

⚠️ **Read \`TEMPLATE_CHANGELOG.md\` in this diff before merging.**${conflict_note}"
