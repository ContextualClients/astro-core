---
"@contextualio/astro-core": minor
---

feat(template-sync): move the template's default file ownership into .gitattributes

- A site keeps its own copy of any page under `src/pages/`, `src/scaffold/Layout.astro`, `src/styles/theme.css` or `public/favicon.svg` once it has changed it; a site that hasn't keeps following the template.
- `.templatesyncignore` ships empty and is each site's own list. Its former default entries are now `merge=ours` rules in `.gitattributes`.
- Sites add their own merge rules below the new marker in `.gitattributes`, where a later line overrides the template's.
