import { z } from "zod"

export const Sessions = z.object({
  // `static` expires a fixed time after sign-in; `extend-with-use` pushes expiry out on every visit.
  type: z.enum(["static", "extend-with-use"]),
  duration: z.number().positive(),
  unit: z.enum(["minutes", "hours", "days"]),
})
export type Sessions = z.infer<typeof Sessions>

export const minutesPerUnit = { minutes: 1, hours: 60, days: 60 * 24 } as const

export type ResolvedSessions = {
  sessionMinutes: number // Stytch accepts sessions durations from 5 to 527040 minutes (366 days)
  extendWithUse?: true // Either true or undefined
}
