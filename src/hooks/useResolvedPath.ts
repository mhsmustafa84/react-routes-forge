"use client";

import { buildPath } from "../core/build";
import type { BuildPathOptions, QueryParams, RouteParams } from "../types";

/**
 * Resolves a dynamic path template against params, mirroring `buildPath()`.
 *
 * Accepts the same `options` bag as `build()` / `buildPath()`:
 * - (default) soft-fail: `console.warn` and return the partial path with unresolved `:param` placeholders.
 * - `{ strict: true }`: throw a `RangeError` on missing params — matching `.build()`'s strict behaviour.
 *
 * @example
 * ```tsx
 * const path = useResolvedPath('/users/:id', { id: 42 }); // → '/users/42'
 * const path = useResolvedPath('/users/:id', {}, undefined, { strict: true }); // throws RangeError
 * const path = useResolvedPath('/files/*', { "*": "a/b" }); // → '/files/a/b'
 * ```
 */
export function useResolvedPath(
  template: string,
  params: RouteParams,
  query?: QueryParams,
  options?: BuildPathOptions,
): string {
  if (typeof window === "undefined") {
    throw new Error(
      "useResolvedPath can only be used in browser environment. " +
        "Call this hook only in client components or after hydration.",
    );
  }
  return buildPath(template, params, query, options);
}
