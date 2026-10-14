# Contextual Astro Core

The Astro baseline used to generate Contextual Sites.

## Theme

`src/scaffold/scripts/preload/Theme.astro` sets `theme="light"` or `theme="dark"` on `<html>` from the saved choice or the OS. Its inline script runs before the body paints, so keep it inline and blocking. Its module script follows OS changes, other tabs, and Astro page swaps.

`ThemeToggle.astro` adds a theme button to the base layout that cycles System, Light, and Dark. Move it into your own header, or replace it with a control that dispatches:

```js
document.dispatchEvent(new CustomEvent("theme-change", { detail: "dark" })) // light, dark, or system
```

`src/styles/theme.css` points `--color-bg` and `--color-text` at the CDS semantic colors and overrides those CDS colors for dark mode. Use the CDS color variables in components so they change with the theme.

## Sign-in

`src/styles/sign-in.css` removes the Stytch widget's box and maps its colors to `--color-bg` and `--color-text`. `src/scaffold/AuthPanel.astro` supplies the heading (`heading=""` on `cds-sign-in`) and a centered container with a 24rem max width. The stylesheet targets the Stytch 6 root, which sets its theme inline; recheck it when upgrading Stytch.

## Checks

Use Node 24 and `yarn install`. Run `yarn astro check` and `yarn build`.
