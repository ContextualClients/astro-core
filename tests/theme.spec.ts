import { expect, test } from "@playwright/test"

test("applies saved dark mode before deferred scripts load", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "dark"))
  await page.route("**/*", route => route.request().resourceType() === "script" ? route.abort() : route.continue())
  await page.goto("/sign-in")
  await expect(page.locator("html")).toHaveAttribute("theme", "dark")
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(28, 32, 38)")
})

test("supports system changes, explicit choices, persistence, and returning to system", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" })
  await page.goto("/")
  await expect(page.locator("html")).toHaveAttribute("theme", "dark")
  await page.getByLabel("Theme", { exact: true }).selectOption("light")
  await expect(page.locator("html")).toHaveAttribute("theme", "light")
  await page.reload()
  await expect(page.getByLabel("Theme", { exact: true })).toHaveValue("light")
  await page.getByLabel("Theme", { exact: true }).selectOption("system")
  await expect(page.locator("html")).toHaveAttribute("theme", "dark")
  await page.emulateMedia({ colorScheme: "light" })
  await expect(page.locator("html")).toHaveAttribute("theme", "light")
})

test("handles unavailable storage", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error("Storage blocked") }
    Storage.prototype.setItem = () => { throw new Error("Storage blocked") }
  })
  await page.emulateMedia({ colorScheme: "dark" })
  await page.goto("/")
  await expect(page.locator("html")).toHaveAttribute("theme", "dark")
  await page.getByLabel("Theme", { exact: true }).selectOption("light")
  await expect(page.locator("html")).toHaveAttribute("theme", "light")
})

test("copies the theme before Astro swaps documents and responds to storage changes", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Theme", { exact: true }).selectOption("dark")
  const theme = await page.evaluate(() => {
    const next = document.implementation.createHTMLDocument()
    const event = new Event("astro:before-swap")
    Object.defineProperty(event, "newDocument", { value: next })
    document.dispatchEvent(event)
    return next.documentElement.getAttribute("theme")
  })
  expect(theme).toBe("dark")
  await page.evaluate(() => {
    localStorage.setItem("theme", "light")
    window.dispatchEvent(new StorageEvent("storage", { key: "theme", newValue: "light" }))
  })
  await expect(page.locator("html")).toHaveAttribute("theme", "light")
  await expect(page.getByLabel("Theme", { exact: true })).toHaveValue("light")
})

for (const tag of ["stytch-b2b", "stytch-ui"]) {
  test(`${tag} follows the site colors without a container box`, async ({ page }) => {
    await page.goto("/sign-in")
    // Mirrors the Stytch 6 root: inline light theme variables plus its container styles.
    await page.locator("cds-sign-in").evaluate((host, tag) => {
      host.innerHTML = `<style>.fixture-root { color-scheme: var(--st-color-scheme); padding: 40px 36px; border: 1px solid; background-color: var(--st-background); }</style><${tag}><div><div class="fixture-root" style="--st-background: white; --st-foreground: black; --st-color-scheme: light; --st-dark-mode: 0;"><input aria-label="Fixture email" style="background-color: var(--st-background); color: var(--st-foreground)"></div></div></${tag}>`
    }, tag)
    const root = page.locator(`${tag} > div > div[style]`)
    const input = page.getByLabel("Fixture email")
    for (const theme of ["light", "dark"]) {
      await page.getByLabel("Theme", { exact: true }).selectOption(theme)
      await expect(root).toHaveCSS("padding", "0px")
      await expect(root).toHaveCSS("border-width", "0px")
      await expect(root).toHaveCSS("background-color", "rgba(0, 0, 0, 0)")
      expect(await root.evaluate(element => getComputedStyle(element).getPropertyValue("--st-dark-mode").trim())).toBe(theme === "dark" ? "1" : "0")
      const body = await page.locator("body").evaluate(element => {
        const style = getComputedStyle(element)
        return { color: style.color, background: style.backgroundColor }
      })
      await expect(input).toHaveCSS("color", body.color)
      await expect(input).toHaveCSS("background-color", body.background)
    }
  })
}

test("ignores invalid stored preferences and follows the OS", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "invalid"))
  await page.emulateMedia({ colorScheme: "dark" })
  await page.goto("/")
  await expect(page.locator("html")).toHaveAttribute("theme", "dark")
  await expect(page.getByLabel("Theme", { exact: true })).toHaveValue("system")
})
