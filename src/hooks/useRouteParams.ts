import { useParams } from "react-router";
import type { ExtractParams } from "../types";

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
export function useRouteParams<P extends string>(route: {
  readonly paramNames: ReadonlyArray<P> | Array<P>;
}): Record<P, string>;
// Implementation
export function useRouteParams<P extends string>(_route?: {
  readonly paramNames: ReadonlyArray<P> | Array<P>;
}): Record<string, string> {
  return useParams() as Record<string, string>;
}
