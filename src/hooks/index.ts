/**
 * React integration hooks for route-forge.
 * These are thin wrappers — import only if you're using React Router.
 */

import { useParams, useNavigate, generatePath } from "react-router-dom";
import type {
  ExtractParams,
  QueryParams,
  RouteParams,
  BuildPathOptions,
} from "../types";
import { appendQuery, extractParamNames, buildPath } from "../core/utils";

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
 * Accepts the same `options` bag as `build()` / `buildPath()`:
 * - (default) soft-fail: `console.warn` and return the partial path with unresolved `:param` placeholders.
 * - `{ strict: true }`: throw a `RangeError` on missing params — matching `.build()`'s strict behaviour.
 *
 * When all params are present, resolution is delegated to React Router's `generatePath`,
 * which correctly handles splat (`*`) and optional (`:param?`) segments.
 *
 * @example
 * ```tsx
 * const path = useResolvedPath('/users/:id', { id: 42 }); // → '/users/42'
 * const path = useResolvedPath('/users/:id', {}, undefined, { strict: true }); // throws RangeError
 * ```
 */
export function useResolvedPath(
  template: string,
  params: RouteParams,
  query?: QueryParams,
  options?: BuildPathOptions,
): string {
  const paramNames = extractParamNames(template);
  const hasAllParams = paramNames.every(
    (name) => params[name] !== undefined && params[name] !== null,
  );

  if (!hasAllParams) {
    // Let buildPath own all missing-param behaviour (warn/throw) —
    // avoids re-implementing (and duplicating) the same check here.
    return buildPath(template, params, query, options);
  }

  // All params present — use generatePath for correct splat / optional-segment handling.
  const encode = options?.encode !== false;
  const generatedParams = Object.fromEntries(
    Object.entries(params).map(([k, v]) => [
      k,
      encode ? encodeURIComponent(String(v)) : String(v),
    ]),
  );
  const path = generatePath(template, generatedParams);

  return appendQuery(path, query, options?.hash);
}
