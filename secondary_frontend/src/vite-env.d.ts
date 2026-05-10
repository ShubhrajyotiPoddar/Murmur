/// <reference types="vite/client" />

/**
 * Augment Vite's ImportMetaEnv with the project-specific
 * environment variables declared in .env so TypeScript knows
 * about them throughout the codebase.
 *
 * Rules:
 *  - All custom vars must be prefixed with VITE_ to be exposed
 *    to client-side code by Vite.
 *  - Declare them as `readonly string` (never optional) so
 *    accidental typos produce a compile error, not a silent undefined.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
