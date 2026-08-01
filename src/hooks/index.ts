/**
 * React integration hooks for route-forge.
 * These are thin wrappers — import only if you're using React Router.
 */

import { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type {
  ExtractParams,
  QueryParams,
  RouteParams,
  BuildPathOptions,
} from "../types";
import type { DynamicRoute } from "../core/defineRoutes";
import { buildPath } from "../core/utils";

// ─── useRouteParams ──────────────────────────────────────────────────────────

/**
 * A typed wrapper around React Router's `useParams`.
 *
 * Pass a route template as a type parameter, or a dynamic route value from a
 * `defineRoutes()` tree for automatic type inference:
 *
 * @example
 * ```tsx
 * // Route: '/a/:x/b/:y/c/:z'
 * const { x, y, z } = useRouteParams<'/a/:x/b/:y/c/:z'>();
 *
 * // Or pass a route from your PATHS tree — params are inferred from it:
 * const PATHS = defineRoutes({ USERS: { EDIT: '/users/edit/:id' } } as const);
 * const { id } = useRouteParams(PATHS.USERS.EDIT);
 * ```
 */
export function useRouteParams<T extends string>(): Record<
  ExtractParams<T>,
  string
>;
export function useRouteParams<T extends string>(
  route: DynamicRoute<T>,
): Record<ExtractParams<T>, string>;
export function useRouteParams<T extends string>(
  _route?: DynamicRoute<T>,
): Record<ExtractParams<T>, string> {
  return useParams() as Record<ExtractParams<T>, string>;
}

// ─── useNavigateTo ──────────────────────────────────────────────────────────

type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

/**
 * A typed `navigate` helper that accepts a resolved path (output of `.build()`)
 * or a plain static path, with optional navigation options.
 *
 * @example
 * ```tsx
 * const navigateTo = useNavigateTo();
 * navigateTo(PATHS.USERS.EDIT.build({ id: 42 }));
 * navigateTo(PATHS.HOME, { replace: true });
 * ```
 */
export function useNavigateTo() {
  const navigate = useNavigate();

  return useCallback(
    (path: string, options?: NavigateOptions) => {
      navigate(path, options);
    },
    [navigate],
  );
}

// ─── useResolvedPath ─────────────────────────────────────────────────────────

/**
 * Resolves a dynamic path template against params, mirroring `buildPath()`.
 *
 * This is a thin convenience wrapper around {@link buildPath} kept in the hooks
 * entry so splat (`*`), optional (`:param?`) and encoding behaviour stay
 * identical across React Router v6 and v7 (whose `generatePath` URL-encodes
 * values itself, which would double-encode with this library's own encoding).
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
  return buildPath(template, params, query, options);
}
