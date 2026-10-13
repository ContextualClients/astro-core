# Contextual Astro Core

The Astro baseline used to generate Contextual Sites.

## Theme

`src/scaffold/scripts/preload/Theme.astro` sets `theme="light"` or `theme="dark"` on `<html>` from the saved choice or the OS. Its inline script runs before the body paints, so keep it inline and blocking. Its module script follows OS changes, other tabs, and Astro page swaps.

`ThemeToggle.astro` adds a Light/Dark/System selector to the base layout. Move it into your own header, or replace it with a control that dispatches:

```js
document.dispatchEvent(new CustomEvent("theme-change", { detail: "dark" })) // light, dark, or system
```

`--color-bg` and `--color-text` in `src/styles/theme.css` set the page colors for both themes.

## Sign-in

`src/styles/sign-in.css` removes the Stytch widget's box and maps its colors to `--color-bg` and `--color-text`. The page supplies the heading (`heading=""` on `cds-sign-in`) and any container. The stylesheet targets the Stytch 6 root, which sets its theme inline; recheck it when upgrading Stytch.

## Checks

Use Node 24 and `yarn install`. Run `yarn astro check`, `yarn test:browser`, and `yarn build`. Install the test browser once with `yarn playwright install chromium`.
