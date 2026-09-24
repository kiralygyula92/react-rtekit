import { useEffect, useLayoutEffect } from 'react';

/**
 * `useLayoutEffect` in the browser, `useEffect` on the server.
 *
 * A layout effect is how a popover measures itself before the first paint, so it never
 * flashes in the wrong place. On the server no effect runs at all, but React 18 still
 * warns that `useLayoutEffect` "does nothing on the server" — once per component per
 * render, and the toolbar renders its popovers closed on every request. The peer range
 * is `>=18.2`, so a Next.js app on React 18 had its server log filled with it. React 19
 * dropped the warning; this keeps 18 quiet too.
 */
export const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;
