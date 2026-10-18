# @contextualio/astro-core

## 0.1.0

### Minor Changes

- ea2f380: feat(theme): apply the CDS dark palette, upgrade dependencies, and head the home page with the Contextual logo

  - `<html>` now carries `data-theme` instead of `theme`, the attribute the CDS dark palette is keyed on.
  - Upgrade astro 7.0.3 → 7.3.2, @astrojs/node 11.0.0 → 11.1.5, zod 4.1.12 → 4.6.1 and @stytch/vanilla-js ^6.0.11 → ^6.2.0, plus @astrojs/check, @changesets/cli, @types/node and picomatch.
  - The default home page's heading shows the Contextual logo and links home; the unused Astro logo is removed.
  - Ignore local env files and Claude Code's local settings.

- d34fe10: feat(template-sync): move the template's default file ownership into .gitattributes

  - A site keeps its own copy of any page under `src/pages/`, `src/scaffold/Layout.astro`, `src/styles/theme.css` or `public/favicon.svg` once it has changed it; a site that hasn't keeps following the template.
  - `.templatesyncignore` ships empty and is each site's own list. Its former default entries are now `merge=ours` rules in `.gitattributes`.
  - Sites add their own merge rules below the new marker in `.gitattributes`, where a later line overrides the template's.
