# Contextual Astro Core

The Astro baseline used to generate Contextual Sites.

## Theme

`src/styles/theme.css` owns the site's light and dark palettes. Light mode uses the CDS defaults; `:root[theme="dark"]` overrides the semantic CDS colors. Components should use `--cds-color-bg`, `--cds-color-text`, `--cds-color-text-gray`, and the other CDS variables so they change together. The existing `--color-bg` and `--color-text` names remain aliases.

`ThemeToggle.astro` provides a labeled Light/Dark/System selector in the base layout. Move it into your own header as needed. The selection persists under the `theme` localStorage key. System is the default and follows OS changes; explicit choices override the OS. Storage failures do not prevent rendering or changing the theme for the current page. Changes in another tab also update the page.

The inline script in `src/scaffold/scripts/preload/Theme.astro` resolves the initial theme in the document head, before the body paints. Keep it inline and blocking. Its runtime script also applies the resolved theme to the incoming document before an Astro client-router swap. You can select a theme from your own control by dispatching:

```js
document.dispatchEvent(new CustomEvent("theme-change", { detail: "dark" }))
```

Accepted values are `light`, `dark`, and `system`. The root's `theme` attribute contains the resolved light/dark value; `data-theme-preference` contains the user's choice.

## Sign-in appearance

`src/styles/sign-in.css` maps Stytch's theme variables to CDS colors, fonts, input borders, radii, and focus colors. It loads with the page styles, before Stytch mounts, so the widget uses the selected palette on its first render. Switching themes updates CSS variables without remounting the widget or clearing the form.

Both `stytch-b2b` and `stytch-ui` inside `cds-sign-in` use the same styling. The widget has no outer padding, border, radius, shadow, or fixed width. The sign-in page owns its heading and passes `heading=""` to avoid a duplicate widget heading. Wrap it in whatever container your site needs:

```astro
<section class="account-panel">
  <h1>Sign in</h1>
  <cds-sign-in heading="" public-token={authConfig?.publicToken} />
</section>

<style>
  .account-panel {
    max-width: 26rem;
    margin-inline: auto;
    padding: 2rem;
    background: var(--cds-color-bg-shade);
    --site-sign-in-background: var(--cds-color-bg-shade);
  }
</style>
```

Keep your existing organization, session, and auth-method attributes on the component. `--site-sign-in-background` optionally matches a custom container surface. `--site-action-bg` and `--site-action-text` set the primary button colors for each theme.

The scoped selector targets the Stytch 6 root beneath its mount wrapper. `!important` on mapped variables overrides Stytch's inline theme defaults. Recheck this selector and both widget types when upgrading Stytch; the outer wrapper is an SDK integration detail.

## Checks

Use Node 24 and `yarn install`. Run `yarn check`, `yarn test:browser`, and `yarn build`. Install the browser once with `yarn playwright install chromium`. Browser tests cover the theme lifecycle and Stytch's CSS contract without requiring authentication credentials. Live Stytch verification uses a configured public test project and a registered localhost origin.
