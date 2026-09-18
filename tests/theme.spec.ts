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
  test(`${tag} theme variables override inline defaults without a container box`, async ({ page }) => {
    await page.goto("/sign-in")
    await page.locator("cds-sign-in").evaluate((host, tag) => {
      host.innerHTML = `<style>.fixture-root { padding: 40px 36px; border: 1px solid black; border-radius: 24px; box-shadow: 0 1px 4px black; }</style><${tag}><div><div class="fixture-root" style="--st-background: white; --st-foreground: black; --st-primary: black; --st-color-scheme: light;"><input aria-label="Fixture email" style="background:var(--st-background);color:var(--st-foreground)"></div></div></${tag}>`
    }, tag)
    const root = page.locator(`${tag} > div > div[style]`)
    for (const theme of ["light", "dark"]) {
      await page.getByLabel("Theme", { exact: true }).selectOption(theme)
      await expect(root).toHaveCSS("padding", "0px")
      await expect(root).toHaveCSS("border-width", "0px")
      await expect(root).toHaveCSS("box-shadow", "none")
      const colors = await root.evaluate(element => {
        const style = getComputedStyle(element)
        const site = getComputedStyle(document.documentElement)
        return { actual: style.getPropertyValue("--st-foreground").trim(), expected: site.getPropertyValue("--cds-color-text").trim() }
      })
      expect(colors.actual).toBe(colors.expected)
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
