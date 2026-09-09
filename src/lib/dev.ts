import type { APIContext } from "astro"
import { execFile } from "child_process"
import { readFileSync, statSync } from "fs"
import { join } from "path"
import { promisify } from "util"
import { z } from "zod"
import type { Logger, LoggerFn } from "./astro-locals"
import { SiteAuthConfig, SiteUserRecord } from "./astro-locals"

const execFileAsync = promisify(execFile)

const devConfigFile = "site-auth.local.json"
const DevConfig = z.object({
  disableAuth: z.boolean().default(false),
  authConfig: SiteAuthConfig.nullish().transform(v => v ?? undefined),
  ctxlConfigId: z.string().default(""),
})
type DevConfig = z.infer<typeof DevConfig>

const siteUserCacheTtlMs = 60_000 // Cache site-users locally for 1 minute
const siteUserCache = new Map<string, { siteUser: SiteUserRecord; expiresAt: number }>()

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

const findOrCreateSiteUser = async (authProfileId: string, ctxlConfigId: string, externalId: string): Promise<SiteUserRecord | null> => {
  const args = [
    "records", "execute", `native-object:auth-profile/${authProfileId}`,
    "--action-id", "find-or-create-site-user", "--params-file", "-",
    ...(ctxlConfigId ? ["--config-id", ctxlConfigId] : []),
  ]

  const ctxl = execFileAsync("ctxl", args, { encoding: "utf-8", env: { ...process.env, FORCE_COLOR: "0" } })
  ctxl.child.stdin?.end(JSON.stringify({ externalId, environment: "test" }))

  try {
    const { stdout } = await ctxl
    const parsed = SiteUserRecord.safeParse(JSON.parse(stdout))
    if (!parsed.success) {
      console.error(`Invalid site-user: ${stdout.trim()}\n${z.prettifyError(parsed.error)}`)
      return null
    }
    return parsed.data

  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error("Cannot validate user auth: `ctxl` command was not found. Install and configure the Contextual CLI to test auth locally.")
    }
    console.error("Failed to validate site-user:", (err as { stderr?: string }).stderr?.trim() || (err as Error).message)
    return null
  }
}

export const loadDevSiteUser = async (config: DevConfig | undefined, context: APIContext): Promise<SiteUserRecord | null | undefined> => {
  if (!config?.authConfig) return undefined
  const { authProfileId } = config.authConfig

  const externalId = decodeJwtSub(context.cookies.get("stytch_session_jwt")?.value)
  if (!externalId) return undefined

  const cached = siteUserCache.get(externalId)
  if (cached && cached.expiresAt > Date.now()) return cached.siteUser

  const siteUser = await findOrCreateSiteUser(authProfileId, config.ctxlConfigId, externalId)
  if (siteUser) siteUserCache.set(externalId, { siteUser, expiresAt: Date.now() + siteUserCacheTtlMs })
  return siteUser
}
