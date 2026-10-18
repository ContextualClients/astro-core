---
"@contextualio/astro-core": minor
---

feat(theme): apply the CDS dark palette, upgrade dependencies, and head the home page with the Contextual logo

- `<html>` now carries `data-theme` instead of `theme`, the attribute the CDS dark palette is keyed on.
- Upgrade astro 7.0.3 → 7.3.2, @astrojs/node 11.0.0 → 11.1.5, zod 4.1.12 → 4.6.1 and @stytch/vanilla-js ^6.0.11 → ^6.2.0, plus @astrojs/check, @changesets/cli, @types/node and picomatch.
- The default home page's heading shows the Contextual logo and links home; the unused Astro logo is removed.
- Ignore local env files and Claude Code's local settings.
