---
"@contextualio/astro-core": minor
---

feat(deployment): build the site as a Worker with `DEPLOYMENT=WORKER`

- `DEPLOYMENT` chooses the build: `AGENT` (the default) for a site agent, unchanged, or `WORKER` for a standalone server behind the `site-worker` managed worker's gateway, which reads the visitor's auth config and site user from the gateway's headers.
- A root `Dockerfile` builds the Worker image. The site serves on the Pod's loopback and exits cleanly when the Pod stops it.
