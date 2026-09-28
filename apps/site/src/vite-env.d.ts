/// <reference types="vite/client" />

/**
 * True only in the build Vercel runs, substituted by `define` in `vite.config.ts`.
 *
 * Guards the two analytics components: their scripts live under `/_vercel/`, which
 * nothing but Vercel serves.
 */
declare const __ON_VERCEL__: boolean;

/** The compiled manifest without page bodies; typed where it is read, in `manifest.ts`. */
declare module 'virtual:docs/manifest' {
  const manifest: unknown;
  export default manifest;
}

/** Each page's compiled HTML, keyed by pathname, one chunk per page. */
declare module 'virtual:docs/bodies' {
  const bodies: Partial<Record<string, () => Promise<{ default: string }>>>;
  export default bodies;
}
