/**
 * React integration hooks for route-forge.
 * These are thin wrappers — import only if you're using React Router.
 */

import { useParams, useNavigate, generatePath } from "react-router-dom";
import type { ExtractParams, QueryParams, RouteParams } from "../types";
import { appendQuery } from "../core/utils";

// ─── useRouteParams ──────────────────────────────────────────────────────────

/**
 * A typed wrapper around React Router's `useParams`.
 *
 * @example
 * ```tsx
 * // Route: '/a/:x/b/:y/c/:z'
 * const { x, y, z } = useRouteParams<'/a/:x/b/:y/c/:z'>();
 * ```
 */
export function useRouteParams<T extends string>(): Record<
  ExtractParams<T>,
  string
> {
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

  return (path: string, options?: NavigateOptions) => {
    navigate(path, options);
  };
}

// ─── useResolvedPath ─────────────────────────────────────────────────────────

/**
 * Resolves a dynamic path template against params using React Router's
 * `generatePath`, with proper typing.
 *
 * Useful when you need the resolved path string without navigating.
 *
 * @example
 * ```tsx
 * const path = useResolvedPath('/users/:id', { id: 42 }); // → '/users/42'
 * ```
 */
export function useResolvedPath(
  template: string,
  params: RouteParams,
  query?: QueryParams,
): string {
  const path = generatePath(
    template,
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  );

  return appendQuery(path, query);
}
