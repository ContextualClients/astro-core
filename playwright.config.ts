import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://127.0.0.1:4324" },
  webServer: {
    command: "astro dev --host 127.0.0.1 --port 4324",
    url: "http://127.0.0.1:4324",
    reuseExistingServer: false,
    env: { ASTRO_DEV_BACKGROUND: "1" },
  },
})
