"use client";

import { useLocation } from "react-router";
import { isActivePath } from "../core/match";

/**
 * A hook that checks whether the current location matches a route template or path.
 * Thin wrapper around `isActivePath(useLocation().pathname, template, options)`.
 *
 * @example
 * ```tsx
 * const isActive = useActivePath(PATHS.USERS.ROOT, { exact: false });
 * ```
 */
export function useActivePath(
  template: string,
  options: { exact?: boolean; caseSensitive?: boolean } = {},
): boolean {

  // Forwarded as-is — isActivePath defaults `exact`/`caseSensitive`
  // individually, so a partial options object here still behaves correctly.
  const location = useLocation();
  return isActivePath(location.pathname, template, options);
}
