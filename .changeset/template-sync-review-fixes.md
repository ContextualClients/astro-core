---
"@contextualio/astro-core": patch
---

fix(template-sync): merge every package.json field and keep pending syncs intact

- `package.json` merges every field three ways except the site's `name`, `version` and `description`, so template changes to fields such as `resolutions` reach sites.
- A sync waiting to be merged is updated in place instead of closed and replaced, and is left alone once someone has pushed commits to it.
- A sync branch whose PR was never opened no longer stops later syncs.
- Every template changeset the merge brings in is dropped, including ones edited upstream.
- The sync's own changeset reads `chore(template): sync astro-core @ <commit>`.
