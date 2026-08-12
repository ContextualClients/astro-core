/// <reference types="astro/client" />

import type { AstroLocals } from "./lib/astro-locals"

declare global {
  namespace App {
    interface Locals extends AstroLocals {}
  }
}
