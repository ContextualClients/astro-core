# Upstream Template Changelog

**Before merging a template-sync PR, read the entry it adds here and follow any listed instructions.**

## 2026-10-13 — CDS light and dark palettes

`--color-bg` and `--color-text` now use the CDS semantic colors, so the light background changes from white to the CDS background. In dark mode, `src/styles/theme.css` overrides the CDS background, text, and primary brand colors.

When merging this sync, reconcile your own palette overrides in `theme.css`.

## 2026-10-13 — Light/Dark/System theme and unboxed sign-in

The base layout now includes a theme button that cycles System, Light, and Dark, and the head script sets `<html theme>` to the resolved `light` or `dark` value before first paint. Saved `theme` choices keep working; `system`, missing, or invalid values follow the OS. The Stytch widget follows `--color-bg` and `--color-text` and no longer draws its own box; `/sign-in` wraps it in `AuthPanel`, a centered panel with a 24rem max width.

When merging this sync:

- Keep the inline theme script in the head. Move or remove the default `ThemeToggle` if your site has its own control; custom controls can dispatch `theme-change`.
- Replace any CSS that matches `[theme="system"]` with the resolved `light` or `dark` value.
- Remove page-specific Stytch overrides that `src/styles/sign-in.css` now covers, and restyle or replace `AuthPanel` for your own sign-in layout.

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
