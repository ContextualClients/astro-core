---
"@contextualio/astro-core": minor
---

feat(deployment): build Worker images on release and deploy releases from GitHub Actions

- A release builds and pushes the images for the site's Workers before it tags the version, signing in to the Contextual organization through its GitHub Connection.
- The new **Deploy a release** workflow deploys a release to its Workers, reusing the images built for it. Set `CONTEXTUAL_DEPLOY_ON_RELEASE` to `true` to deploy every release automatically.
- The site build and its release tarball move to a `legacy-build` job, which `CONTEXTUAL_DEPLOYMENT_TYPE=WORKER` skips for a site that runs only as Workers.
- Building, pushing and deploying run through the public `ContextualIO/deploy-workers-action`, and template syncs through the public `ContextualIO/template-sync-action`, which replaces `bin/template-sync.sh`.
- Template syncs come from `ContextualIO/astro-core-worker`'s `stable` branch, or the branch in `CONTEXTUAL_TEMPLATE_BRANCH`, and use a token from the organization's GitHub App when `CONTEXTUAL_ORGANIZATION` is set, so they can update workflows; otherwise the `TEMPLATE_SYNC_TOKEN` secret, or the workflow's own token.
