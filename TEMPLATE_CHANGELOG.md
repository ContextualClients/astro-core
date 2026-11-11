# Upstream Template Changelog

**Before merging a template-sync PR, read the entry it adds here and follow any listed instructions.**

## 2026-11-17 — Build and deploy Sites as Contextual Workers

This update enables deployment of Contextual Sites on the new Contextual Worker runtime. The existing `site-http` agents are now considered a legacy deployment mechanism, but those deployments will continue to function seamlessly until this transition period is complete. _This template update is safe and will not break your existing deployments._

A new `legacy-build` action has taken on the job of `site-http` agent deployments. It runs automatically as the first step in the release process, and will create the same GitHub release artifacts as you are used to. You may continue to update your existing Site Agents using those release artifacts with no changes to your workflow.

At the same time, a new `build` action is taking the place of the old one, and will run after `legacy-build` has completed successfully. This action will build and push the images necessary to run your Site as a Worker. Until you are ready to do so, you may fully ignore these new image artifacts. However, you will be able to use the new images to boot up a test version of your site as a Site Worker side-by-side with your existing Site Agent (just with a different URL) so that you can directly compare the two. When you have determined the change is safe, transitioning from the Agent to the Worker is a simple process — though it will require just a few minutes of down time.

Before these changes can deploy your Site as a Worker, you will need to connect your tenant to the new Contextual GitHub App. This enables a token exchange workflow that securely manages the permissions for these new deployment actions. To set this up, navigate to the "Connections" tab in the Contextual v2 admin console and select "GitHub Connection" from the "New Connection" drop-down. Follow the steps to set up the connection, then set `CONTEXTUAL_ORGANIZATION` to your Contextual organization and `CONTEXTUAL_WORKER` to your Site Worker's ID, either as GitHub Actions Variables or as `NAME=value` lines in a `contextual-deploy.env` file committed at the root of this repo. The deployment actions will begin working the next time you bump your Site version in this repo.

By default, the new actions will build and push your Site Worker's images, but will not actually update the running Worker. You can manage deployments manually by bumping to the new image version in either the v2 admin console or the CLI. Alternatively, you can use the new "Deploy a Release" workflow to manually deploy a specific image version from GitHub (find the latest version — as well as all previous version options — in your repo's Releases tab). If you would prefer to always automatically update your running Workers when a new release is merged here, you can set the GitHub Actions Variable `CONTEXTUAL_DEPLOY_ON_RELEASE` to `true` and this repo will run those deploys for you. Note that that behavior is different from the legacy Site Agent deployment model, which always included the extra step of manually updating your Workers from the console or the CLI. Take care when deciding your preferred release model.

Once you've fully migrated your Site Agent over to a Site Worker, you can set the GitHub Actions Variable `CONTEXTUAL_DEPLOYMENT_TYPE` to `WORKER`, which will disable the `legacy-build` action entirely. This is not necessary, but will save some time on releases. In the future once all Site Agents have been transitioned, we will remove the `legacy-build` action in a template sync like this one.

Note: the new Publish workflow's build job now has the `id-token: write` permission, which it uses only to sign in to Contextual when Workers are named. If you have changed `publish.yaml`, keep your changes and take the template's additions when resolving the sync.

Template syncs now run through the public [`ContextualIO/template-sync-action`](https://github.com/ContextualIO/template-sync-action) from [`ContextualIO/astro-core-worker`](https://github.com/ContextualIO/astro-core-worker), so this sync changes `.github/workflows/template-sync.yaml` and removes `bin/template-sync.sh`. If you had changed `bin/template-sync.sh`, the sync conflicts on it: accept its deletion. Syncs follow the template's `stable` branch, or the branch in the GitHub Actions Variable `CONTEXTUAL_TEMPLATE_BRANCH`. With `CONTEXTUAL_ORGANIZATION` set, as a GitHub Actions Variable or in your root `contextual-deploy.env`, and your GitHub Connection in place, a sync uses a token from the Contextual GitHub App, so it can also update your workflows; otherwise it uses the `TEMPLATE_SYNC_TOKEN` secret as before, or the workflow's own token if there's no such secret.

## 2026-11-17 — Syncs follow the template's stable branch

Template syncs now merge the template's `stable` branch, which only receives released changes, instead of `main`, where the template is developed. Nothing to do: merge this sync, and later syncs come from `stable`.

## 2026-11-13 — Dependency upgrades and template sync improvements

The template's dependencies are upgraded to their latest releases: `astro` 7.4.11, `@astrojs/node` 11.1.12, `zod` 4.6.7, `@astrojs/check` 0.9.12, `@stytch/vanilla-js` ^6.3.0 and `@types/node` 24.19.2, with `yarn.lock` refreshed to match. `typescript` stays on 6.0.3, because `@astrojs/check` doesn't support TypeScript 7 yet. `@changesets/cli` stays on 2.x, because 3.x requires Yarn 4.

Template syncs also work better:

- **`package.json` merges every field**, not just `dependencies`, `devDependencies`, `scripts`, `engines` and `type`, so template changes to fields such as `resolutions` now reach your site. Your `name`, `version` and `description` are still never touched.
- **An open sync PR is updated in place** when the template moves again, instead of being closed and replaced. Once you have pushed commits to it, such as conflict resolutions, it is left alone, and the next sync after you merge it brings the rest.
- **The template's own changesets never reach your site.** A changeset written for the template names the template's package, and would otherwise fail your site's next release.
- **A sync's changeset is titled `chore(template): sync astro-core @ <commit>`**, matching the PR.
- **Sync runs never overlap**, and a manually triggered run always syncs your default branch.

If the sync PR conflicts in `package.json`, keep your own additions and take the template's new versions, then regenerate `yarn.lock` with `yarn install` rather than editing its markers.

## 2026-11-09 — Build the site as a Worker

A site can now also run as a Worker on the `managed-site-worker` managed worker. `DEPLOYMENT` chooses the build: `AGENT`, the default, is the site-agent build every site uses today and is unchanged; `WORKER` builds a standalone server that reads the visitor's sign-in from the Worker's gateway. This sync adds a root `Dockerfile` (with `docker/worker-shutdown.mjs`) that builds the Worker image, a `.dockerignore`, and `src/lib/gateway.ts`, and changes `astro.config.mjs` and `src/middleware.ts`.

Nothing to do for a site that stays a site agent. If you have changed `astro.config.mjs` or `src/middleware.ts`, keep your changes and take the template's `DEPLOYMENT` additions when resolving the sync.

## 2026-10-17 — Template syncs now merge instead of overwriting

Template syncs used to replace each shared file wholesale, so any edit you made to a template-owned file was lost unless you listed that file in `.templatesyncignore`. Syncs are now an ordinary three-way merge against the template: you receive the template's changes hunk by hunk, your own edits to the same files survive, and only genuinely overlapping edits stop to ask.

**`.templatesyncignore` works exactly as before** and is still the way to opt a path out: once you have changed a listed file, a sync will never overwrite it, and that beats everything else described here. A listed file you have *never* changed still follows the template — there is nothing of yours to protect yet. One addition to its syntax: a bare name matches at any depth, as in `.gitignore`; a leading `./` pins an entry to the repo root. Two things are worth knowing:

- **Most of your existing entries are no longer needed.** A path only needs listing if the template's version of it should never reach you. If you listed a file merely to protect your edits to it, you can drop the line and start receiving template changes to it again — dependency updates in `package.json` being the most valuable.
- **`package.json` is merged field by field**, so it no longer needs listing at all. Your `name`, `version` and `description` are never touched. `dependencies`, `devDependencies`, `scripts` and `engines` reconcile **entry by entry**: the template's upgrades and new scripts arrive, the packages and scripts you added stay, a script you have deliberately overridden stays overridden, and you are only asked to resolve an entry you and the template have both changed to different values. `"type"` reconciles the same way, as a single value rather than a list.

A new `.gitattributes` sits alongside it, describing how the sync merges particular files (your `.gitignore` takes both sides' lines, and so on). That file is the template's business; `.templatesyncignore` is yours, and wins where they disagree.

**Sync PRs can now contain conflicts.** When the template and your site have edited the same lines, the PR arrives with conflict markers committed on its branch and a warning in the description. Resolve them on that branch before merging. A clean sync looks exactly as it always did.

**Only one sync PR is open at a time.** If the template moves again before you merge one, the open PR is updated to carry both rounds. Once you have pushed commits to it — conflict resolutions included — it is left as it is instead, and the next sync after you merge it brings the rest.

`yarn.lock` is the one conflict not worth reading. Resolve `package.json` first, then regenerate the lockfile with `yarn install` rather than editing the markers.

The merge drivers are registered by `bin/template-sync.sh` when the workflow runs. If you merge the template by hand in a local checkout without registering them, git falls back to a plain text merge — you get a conflict rather than a silently wrong file.

**A sync PR now carries a changeset**, so merging one queues its changes for your next release instead of quietly moving your default branch without one. It is a `patch` bump by default, naming the template version range (or commit) it synced — edit it in the PR if the notes or the bump should differ. A site that does not use changesets (no `.changeset/` directory) simply doesn't get one, and neither does a sync that changed nothing of yours — that PR only advances `.template-sync-ref`.

**Sync PRs squash-merge like any other PR.** What the sync reads is `.template-sync-ref`, a file naming the template commit this site last took — not git history. Don't edit or delete it; if it goes missing the sync stops with an error rather than guessing, because guessing would mean silently skipping every template change you hadn't taken yet.

## 2026-09-06 — Configurable sign-in methods (Sign in with Google, optional magic links)

`config.json` accepts an optional `stytchConfig` object. Its `authMethods` list names the sign-in methods in display order: `magic-link` plus any Stytch OAuth provider name (`google`, `microsoft`, `github`, `slack`, `hubspot`, `apple`, `facebook`, `linkedin`, etc. — the full supported list is the `StytchAuthMethod` enum in `src/config/index.ts`). B2B Stytch projects support only `google`, `microsoft`, `github`, `slack` and `hubspot`; the rest are Consumer-only and are dropped with a console warning on a B2B site. When `stytchConfig` or `authMethods` is absent it defaults to `["magic-link"]`.

Examples:
- `{ "stytchConfig": { "authMethods": ["google", "magic-link"] } }` offers both Google and magic links (with Google on top).
- `{ "stytchConfig": { "authMethods": ["google"] } }` offers Google only with magic links disabled.

Each OAuth provider must already be configured on the Site's own Stytch project (Dashboard → OAuth), so for now **this is for BYO Stytch auth profiles only**. Managed Stytch auth profiles do not support OAuth providers (though that may be changed in the future).

No redirect-URL changes are needed: OAuth uses the same `<origin>/sign-in?redirect={}` login/signup registration as magic links. Requires `@contextual-io/cds-core@0.1.3`.

## 2026-09-04 — Local dev auth now runs through the Contextual CLI

`site-auth.local.json` changed shape: `nativeObjectHost`, `orgId`, and `bearerToken` have been removed; an optional `ctxlConfigId` is now supported (leave it unset to use whatever config your local `ctxl` is set to).

After syncing these changes to your local repo:

1. If you don't already have the Contextual CLI installed, install it and sign in:
  - `npm install -g @contextual-io/cli`
  - `ctxl config add <config-id> --tenant-id <org-id>` (config ID can be any string you'd like, it is for you to identify your own config)
  - `ctxl config login`.
2. In your local `site-auth.local.json` (if you have one already): delete `nativeObjectHost`, `orgId`, and `bearerToken`; add `"ctxlConfigId": "<config-id>"` (omit entirely or set to `""` to use `ctxl`'s current config).

## 2026-07-31 — first light

This repository is a clone of Contextual's [astro-core](https://github.com/ContextualClients/astro-core) repo.
