import { useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import type {
  ExtractParams,
  QueryParams,
  RouteParams,
  BuildPathOptions,
} from "../types";
import { buildPath, isActivePath, extractQueryFromPath, appendQuery } from "../core/utils";

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
// Overload 1: no-arg generic — caller provides the template literal as T
export function useRouteParams<T extends string = string>(): Record<
  ExtractParams<T>,
  string
>;
// Overload 2: pass a route from defineRoutes() — P is inferred from paramNames array element type
export function useRouteParams<P extends string>(
  route: { readonly paramNames: ReadonlyArray<P> | Array<P> },
): Record<P, string>;
// Implementation
export function useRouteParams<P extends string>(
  _route?: { readonly paramNames: ReadonlyArray<P> | Array<P> },
): Record<string, string> {
  return useParams() as Record<string, string>;
}

// ─── useNavigateTo ──────────────────────────────────────────────────────────

export type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

/**
 * A typed `navigate` helper that accepts a resolved path (output of `.build()`)
 * or a route value straight from `defineRoutes()` (e.g. a `String` object or a
 * primitive string), with optional navigation options.
 *
 * `String` objects (used by route values so they can carry `.build()`) are
 * coerced to primitives, since React Router's `navigate()` ignores them.
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
      navigate(String(path), options);
    },
    [navigate],
  );
}

// ─── useResolvedPath ─────────────────────────────────────────────────────────

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
  return buildPath(template, params, query, options);
}

// ─── useActivePath ───────────────────────────────────────────────────────────

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
  options: { exact?: boolean; caseSensitive?: boolean } = {
    exact: true,
    caseSensitive: false,
  },
): boolean {
  const location = useLocation();
  return isActivePath(location.pathname, template, options);
}

// ─── useTypedSearchParams ────────────────────────────────────────────────────

/**
 * A typed wrapper around React Router's `useSearchParams`.
 * Returns parsed query params object and a setter that updates query params.
 *
 * Implemented on top of `useLocation` + `useNavigate` (both exported by the
 * `react-router` core in v6 and v7) rather than `useSearchParams`, because in
 * React Router v6 `useSearchParams` only exists in the DOM wrapper package
 * (`react-router-dom`), while v7 moved it into `react-router`. Reimplementing
 * it lets the whole hooks entry work identically against both packages.
 *
 * @example
 * ```tsx
 * const [query, setQuery] = useTypedSearchParams({ coerceBooleans: true, coerceNumbers: true });
 * setQuery({ tab: 'details', page: 2 });
 * ```
 */
export function useTypedSearchParams(options?: {
  coerceBooleans?: boolean;
  coerceNumbers?: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = extractQueryFromPath(location.search, options);

  const setTypedQuery = useCallback(
    (
      newQuery: QueryParams,
      navigateOptions?: { replace?: boolean; state?: unknown },
    ) => {
      const updatedPath = appendQuery("", newQuery);
      const updatedSearchParams = new URLSearchParams(
        updatedPath.startsWith("?") ? updatedPath.slice(1) : updatedPath,
      );
      navigate(`?${updatedSearchParams.toString()}`, navigateOptions);
    },
    [navigate],
  );

  return [queryParams, setTypedQuery] as const;
}

