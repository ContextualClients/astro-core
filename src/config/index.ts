import { z } from "zod"

import configJson from "../../config.json"
import type { ResolvedSessions } from "./sessions"
import { minutesPerUnit, Sessions } from "./sessions"

// OAuth values mirror @stytch/vanilla-js `B2BOAuthProviders` / `OAuthProviders`. Availability depends on the
// site's Stytch vertical: B2B projects support google, microsoft, github, slack and hubspot; the rest are
// Consumer-only. <cds-sign-in> drops a provider its vertical can't use and logs a console warning.
export const StytchAuthMethod = z.enum([
  "magic-link",
  // B2B and Consumer
  "google", "microsoft", "github", "slack",
  // B2B only
  "hubspot",
  // Consumer only
  "amazon", "apple", "bitbucket", "coinbase", "discord", "facebook", "figma", "gitlab", "linkedin", "salesforce",
  "snapchat", "tiktok", "twitch", "twitter", "yahoo",
])
export type StytchAuthMethod = z.infer<typeof StytchAuthMethod>

export const StytchConfig = z.object({
  // Sign-in methods in display order (an OAuth provider must be configured on the site's Stytch project)
  authMethods: z.array(StytchAuthMethod).min(1).default(["magic-link"]),
})
export type StytchConfig = z.infer<typeof StytchConfig>

export const Config = z.object({
  // Array of URL paths for pages that should not be gated by auth
  publicPaths: z.array(z.string()),
  // Session expiration configuration
  sessions: Sessions,
  stytchConfig: StytchConfig.prefault({}),
})
export type Config = z.infer<typeof Config>

export type ResolvedConfig = {
  raw: Config
  publicPaths: string[]
  sessions: ResolvedSessions
  stytchConfig: StytchConfig
}

const parsed = Config.safeParse(configJson)
if (!parsed.success) {
  console.error("Invalid config at config.json:", parsed.error.message)
  throw parsed.error
}
const rawConfig = parsed.data

export const config: ResolvedConfig = {
  raw: rawConfig,
  publicPaths: rawConfig.publicPaths,
  stytchConfig: rawConfig.stytchConfig,
  sessions: {
    sessionMinutes: rawConfig.sessions.duration * minutesPerUnit[rawConfig.sessions.unit],
    extendWithUse: rawConfig.sessions.type === "extend-with-use" || undefined,
  },
}
