# Upstream Template Changelog

**Before merging a template-sync PR, read the entry it adds here and follow any listed instructions.**

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
