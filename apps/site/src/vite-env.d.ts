/// <reference types="vite/client" />

/**
 * True only in the build Vercel runs, substituted by `define` in `vite.config.ts`.
 *
 * Guards the two analytics components: their scripts live under `/_vercel/`, which
 * nothing but Vercel serves.
 */
declare const __ON_VERCEL__: boolean;
