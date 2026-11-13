import type { AstroLocals, Logger, LoggerFn } from "./astro-locals"
import { SiteAuthConfig, SiteUserRecord } from "./astro-locals"

const decodeHeader = (headers: Headers, name: string): unknown => {
  const value = headers.get(name)
  return value === null ? undefined : JSON.parse(Buffer.from(value, "base64url").toString("utf8"))
}

const consoleLogger = (): Logger => {
  const write = (level: "debug" | "info" | "warn" | "error"): LoggerFn =>
    async (format, ...args) => console[level](`[${level}] ${format}`, ...args)

  return { debug: write("debug"), info: write("info"), warn: write("warn"), error: write("error") }
}

export const readGatewayLocals = (headers: Headers): AstroLocals => ({
  authConfig: SiteAuthConfig.optional().parse(decodeHeader(headers, "x-contextual-auth-config")),
  siteUser: SiteUserRecord.nullish().parse(decodeHeader(headers, "x-contextual-site-user")),
  logger: consoleLogger(),
})
