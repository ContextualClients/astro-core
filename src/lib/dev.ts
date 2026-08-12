import type { APIContext } from "astro"
import { readFileSync, statSync } from "fs"
import { join } from "path"
import { z } from "zod"
import type { Logger, LoggerFn } from "./astro-locals"
import { SiteAuthConfig, SiteUserRecord } from "./astro-locals"

const devConfigFile = "site-auth.local.json"
const DevConfig = z.object({
  disableAuth: z.boolean().default(false),
  authConfig: SiteAuthConfig.optional(),
  nativeObjectHost: z.string().default(""),
  orgId: z.string().default(""),
  bearerToken: z.string().default(""),
})
type DevConfig = z.infer<typeof DevConfig>

export const readDevConfig = (): DevConfig | undefined => {
  const devConfigPath = join(process.cwd(), devConfigFile)
  if (!statSync(devConfigPath, { throwIfNoEntry: false })?.isFile()) return undefined

  const contents = readFileSync(devConfigPath, "utf-8").trim()
  if (!contents) return undefined

  try {
    return DevConfig.parse(JSON.parse(contents))
  } catch (err) {
    console.error(`Failed to parse ${devConfigFile}. Proceeding without auth.`, err)
    return undefined
  }
}

export const devLogger = (): Logger => {
  const write = (level: "debug" | "info" | "warn" | "error"): LoggerFn =>
    async (format, ...args) => console[level](`[${level}] ${format}`, ...args)

  return { debug: write("debug"), info: write("info"), warn: write("warn"), error: write("error") }
}

const decodeJwtSub = (token: string | undefined): string | undefined => {
  const payload = token?.split(".")[1]
  if (!payload) return undefined

  try {
    const claims: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"))
    const sub = (claims as { sub?: unknown }).sub
    return typeof sub === "string" ? sub : undefined
  } catch {
    return undefined
  }
}

export const loadDevSiteUser = async (config: DevConfig | undefined, context: APIContext): Promise<SiteUserRecord | null | undefined> => {
  if (!config) return undefined

  const { authConfig, nativeObjectHost, orgId, bearerToken } = config
  if (!authConfig) return undefined
  const { authProfileId } = authConfig
  if (!nativeObjectHost || !orgId || !bearerToken) {
    throw new Error(`Invalid ${devConfigFile}: cannot validate user auth without nativeObjectHost, orgId, and bearerToken.`)
  }

  const externalId = decodeJwtSub(context.cookies.get("stytch_session_jwt")?.value)
  if (!externalId) return undefined

  try {
    const actionEndpoint = `${nativeObjectHost.replace(/\/+$/, "")}/api/v1/auth-profile/${authProfileId}/actions/find-or-create-site-user`
    const response = await fetch(actionEndpoint, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-org-id": orgId,
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify({ externalId }),
    })
    if (!response.ok) {
      console.error(`Failed to validate site-user, got status ${response.status}`)
      return null
    }
    const siteUser = SiteUserRecord.safeParse(await response.json()).data
    if (!siteUser) console.error("find-or-create-site-user returned no site-user")
    return siteUser ?? null

  } catch (err) {
    console.error("Failed to validate site-user", err)
    return null
  }
}
