import { z } from "zod"

export const SiteAuthConfig = z.object({
  authProfileId: z.string().min(1),
  organizationSlug: z.string(),
  projectId: z.string().min(1),
  publicToken: z.string().min(1),
})
export type SiteAuthConfig = z.infer<typeof SiteAuthConfig>

export const SiteUserRole = z.enum([
  "admin",
  "member",
])
export type SiteUserRole = z.infer<typeof SiteUserRole>

export const SiteUserRecord = z.object({
  id: z.string(),
  externalId: z.string().min(1),
  authProfileId: z.string(),
  email: z.email(),
  name: z.string().min(1).optional(),
  role: SiteUserRole,
})
export type SiteUserRecord = z.infer<typeof SiteUserRecord>

export type LoggerFn = (format: string, ...args: unknown[]) => Promise<void>

const loggerFn = z.custom<LoggerFn>(value => typeof value === "function", {
  message: "log level must be a function",
})

export const Logger = z.object({
  debug: loggerFn,
  info: loggerFn,
  warn: loggerFn,
  error: loggerFn,
})
export type Logger = z.infer<typeof Logger>

export const AstroLocals = z.object({
  authConfig: SiteAuthConfig.optional(),
  siteUser: SiteUserRecord.nullish(),
  logger: Logger,
})
export type AstroLocals = z.infer<typeof AstroLocals>
