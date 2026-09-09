import { defineMiddleware } from "astro:middleware"
import picomatch from "picomatch"
import { config } from "./config"

const stripTrailingSlash = (p: string) => p.replace(/(.)\/+$/, "$1")
const stripPrecedingSlashes = (p: string) => p.replace(/^[/\\\s]+/, "")
const isPublicPath = picomatch(["/sign-in", "/sign-out", ...config.publicPaths.map(stripTrailingSlash)])

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.isPrerendered) {
    throw new Error(`Prerendering is not currently supported. Remove the prerender export from ${context.url.pathname}.`)
  }

  // Local development authentication setup
  if (import.meta.env.DEV) {
    const { readDevConfig, loadDevSiteUser, devLogger } = await import("./lib/dev")
    context.locals.logger = devLogger()
    const devConfig = readDevConfig()
    context.locals.authConfig = devConfig?.authConfig
    if (devConfig?.disableAuth) return next()
    context.locals.siteUser = await loadDevSiteUser(devConfig, context)
  }

  // Sites with no auth-profile skip auth checks.
  if (!context.locals.authConfig) return next()

  const authorized = !!context.locals.siteUser
  const path = stripTrailingSlash(context.url.pathname)
  if (isPublicPath(path)) {
    if (authorized && path === "/sign-in") {
      const target = new URL(`${context.url.origin}/${stripPrecedingSlashes(context.url.searchParams.get("redirect") ?? "")}`)
      if (stripTrailingSlash(target.pathname) === "/sign-in") {
        return context.redirect("/")
      } else {
        return context.redirect(target.pathname + target.search)
      }
    }
    return next()
  }

  // Redirect protected routes to /sign-in when auth is missing.
  if (!authorized) {
    // `locals.siteUser` is only set to `null` when Stytch auth succeeds but the site-user
    // native-object-api request fails. This is an error state.
    const errorState = context.locals.siteUser === null
    // The <cds-sign-in> component at /sign-in will identify and communicate regarding this error.
    if (errorState) {
      await context.locals.logger?.error("Site user could not be resolved for an authenticated visitor requesting %s.", path)
      return context.redirect("/sign-in")
    }
    return context.redirect(`/sign-in?redirect=${encodeURIComponent(path + context.url.search)}`)
  }

  return next()
})
