import { z } from "zod"

import configJson from "../../config.json"
import type { ResolvedSessions } from "./sessions"
import { minutesPerUnit, Sessions } from "./sessions"

export const Config = z.object({
  // Array of URL paths for pages that should not be gated by auth
  publicPaths: z.array(z.string()),
  // Session expiration configuration
  sessions: Sessions,
})
export type Config = z.infer<typeof Config>

export type ResolvedConfig = {
  raw: Config
  publicPaths: string[]
  sessions: ResolvedSessions
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
  sessions: {
    sessionMinutes: rawConfig.sessions.duration * minutesPerUnit[rawConfig.sessions.unit],
    extendWithUse: rawConfig.sessions.type === "extend-with-use" || undefined,
  },
}
