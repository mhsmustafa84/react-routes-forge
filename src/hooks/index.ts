/**
 * React integration hooks for route-forge.
 * These are thin wrappers — import only if you're using React Router.
 */

import { useParams, useNavigate, generatePath } from "react-router-dom";
import type { QueryParams, RouteParam, RouteParams } from "../types";

// ─── useRouteParams ──────────────────────────────────────────────────────────

/**
 * A typed wrapper around React Router's `useParams`.
 *
 * Pass the route's path template as a const generic to get a properly typed
 * params object back — no casting needed.
 *
 * @example
 * ```tsx
 * // Route is defined as '/users/edit/:id'
 * const { id } = useRouteParams<'/users/edit/:id'>();
 * ```
 */
export function useRouteParams<
  T extends string,
  // Extracts ':id' → 'id', ':postId' → 'postId', etc.
  K extends string = T extends `${string}:${infer P}/${infer R}`
    ? P | (R extends `${string}:${infer Q}` ? Q : never)
    : T extends `${string}:${infer P}`
      ? P
      : never,
>(): Record<K, string> {
  return useParams() as Record<K, string>;
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

  if (query) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => {
            if (v !== undefined && v !== null) {
              searchParams.append(key, String(v));
            }
          });
        } else {
          searchParams.append(key, String(value));
        }
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      return path + (path.includes("?") ? "&" : "?") + queryString;
    }
  }

  return path;
}
