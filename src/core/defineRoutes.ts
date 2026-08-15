import { devWarn, isProduction } from "./environment";
import { buildPath } from "./build";
import { extractParamNames, isDynamic } from "./params";
import { isActivePath } from "./match";
import { flattenRoutes } from "./routes";
import type {
  BuildPathOptions,
  ExtractParams,
  PathParams,
  QueryParams,
  RoutePath,
  RouteTree,
} from "../types";

// Re-export so consumers that import from 'core/defineRoutes' get the full surface
export { buildPath } from "./build";
export { extractParamNames, isDynamic } from "./params";

/**
 * A dynamic route is a template string with a `:param` or trailing `/*` splat,
 * augmented with a `.build()` helper and a `.paramNames` array.
 *
 * Exported so consumers (e.g. the hooks entry) can type against it.
 */
export type StaticRoute<T extends string> = T & {
  build(query?: QueryParams, options?: BuildPathOptions): RoutePath;
};

export type DynamicRoute<T extends string> = T extends
  | `${string}:${string}`
  | `${string}/*`
  ? T & {
      build(
        params: PathParams<T>,
        query?: QueryParams,
        options?: BuildPathOptions,
      ): RoutePath;
      paramNames: Array<ExtractParams<T>>;
    }
  : StaticRoute<T>;

type ResolvedRoutes<T extends RouteTree> = {
  [K in keyof T]: T[K] extends RouteTree
    ? ResolvedRoutes<T[K]>
    : T[K] extends string
      ? DynamicRoute<T[K]>
      : never;
};

const isRouteGroup = (value: unknown): value is RouteTree =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype;

/**
 * Validate a single route template and warn (dev-only) about common mistakes:
 * missing leading `/` and non-trailing `*` splats.
 */
function validateTemplate(template: string, key: string): void {
  if (!template.startsWith("/")) {
    devWarn(
      `[route-forge] Route "${key}" does not start with "/": "${template}".`,
    );
  }

  if (template.includes("*") && !template.endsWith("/*")) {
    devWarn(
      `[route-forge] Route "${key}" uses "*" outside a trailing "/*" splat; only a trailing splat is supported: "${template}".`,
    );
  }
}

/**
 * Warn (dev-only) when two routes resolve to the same path template or shadow each other.
 */
function detectDuplicatePaths(routes: Record<string, unknown>): void {
  const seen = new Map<string, string>();
  const warned = new Set<string>();
  const flat = flattenRoutes(routes);

  for (const route of flat) {
    const existing = seen.get(route.path);
    if (existing === undefined) {
      seen.set(route.path, route.key);
    } else if (!warned.has(route.path)) {
      warned.add(route.path);
      devWarn(
        `[route-forge] Duplicate route path "${route.path}" for "${existing}" and "${route.key}". ` +
          `Only one of them will be reachable.`,
      );
    }
  }

  // Shadowing check: warn when a static path matches a dynamic path defined before it
  for (let i = 0; i < flat.length; i++) {
    const r1 = flat[i]!;
    if (!isDynamic(r1.path)) continue;

    for (let j = i + 1; j < flat.length; j++) {
      const r2 = flat[j]!;
      if (isDynamic(r2.path)) continue;

      if (isActivePath(r2.path, r1.path, { exact: true })) {
        const pairKey = `${r1.key}->${r2.key}`;
        if (!warned.has(pairKey)) {
          warned.add(pairKey);
          devWarn(
            `[route-forge] Route "${r2.key}" ("${r2.path}") is shadowed by dynamic route "${r1.key}" ("${r1.path}"). Place static routes before dynamic parameters in route trees.`,
          );
        }
      }
    }
  }
}

/**
 * Attach `.build()` (and, for dynamic templates, `.paramNames`) to
 * `String.prototype` exactly once, so route values can stay **genuine
 * primitive strings** instead of `new String(template)` objects.
 *
 * Route values used to be wrapped in `new String(template)` so `.build()`
 * could be attached as an own property. That silently broke direct use with
 * React Router's `<Link to={...}>` (and anything else that branches on
 * `typeof to === "string"`, e.g. React Router's internal `resolveTo()`):
 * `typeof` on a `String` object is `"object"`, not `"string"`, so React
 * Router treated the route value as a `Partial<Path>` and spread it
 * (`{ ...routeValue }`) instead of parsing it as a path — producing a
 * `pathname`-less destination and a broken/no-op navigation. `.build()`
 * happened to "fix" it only because it returns a plain string.
 *
 * Putting `.build()`/`.paramNames` on the prototype instead means every
 * primitive string route value can still call `.build()` / read
 * `.paramNames` (resolved lazily from `this`, the template text itself),
 * while `typeof route === "string"` stays true — so route values now work
 * directly anywhere a plain path string is expected, `<Link to={route}>`
 * included, with no `.build()` call required.
 */
function installBuildProtocol(): void {
  if (Object.prototype.hasOwnProperty.call(String.prototype, "build")) {
    return;
  }

  Object.defineProperty(String.prototype, "build", {
    value: function build(
      this: string,
      paramsOrQuery?: PathParams<string> | QueryParams,
      query?: QueryParams,
      options?: BuildPathOptions,
    ): RoutePath {
      const template = this.valueOf();

      // Dynamic templates take (params, query?, options?); static templates
      // take (query?, options?) — disambiguated from the template itself,
      // since that's all the prototype method has to go on.
      return (
        isDynamic(template)
          ? buildPath(
              template,
              (paramsOrQuery ?? {}) as PathParams<string>,
              query,
              options,
            )
          : buildPath(
              template,
              {},
              paramsOrQuery as QueryParams,
              query as unknown as BuildPathOptions,
            )
      ) as RoutePath;
    },
    writable: false,
    enumerable: false,
    configurable: true,
  });

  Object.defineProperty(String.prototype, "paramNames", {
    get(this: string): string[] {
      return extractParamNames(this.valueOf());
    },
    enumerable: false,
    configurable: true,
  });
}

installBuildProtocol();

function wrapStaticPath<T extends string>(template: T): StaticRoute<T> {
  // A genuine primitive string — `.build()` comes from String.prototype
  // (see installBuildProtocol above), so `typeof` stays "string".
  return template as StaticRoute<T>;
}

function wrapDynamicPath<T extends string>(template: T): DynamicRoute<T> {
  // Same here: primitive string, `.build()` and `.paramNames` are resolved
  // lazily from String.prototype based on the template text itself.
  return template as unknown as DynamicRoute<T>;
}

function processRouteMap<T extends RouteTree>(routes: T): ResolvedRoutes<T> {
  const result = {} as ResolvedRoutes<T>;

  for (const key in routes) {
    if (!Object.prototype.hasOwnProperty.call(routes, key)) continue;

    const value = routes[key];

    if (typeof value === "string") {
      validateTemplate(value, key);
      result[key] = (
        isDynamic(value) ? wrapDynamicPath(value) : wrapStaticPath(value)
      ) as ResolvedRoutes<T>[typeof key];
    } else if (isRouteGroup(value)) {
      result[key] = processRouteMap(
        value as RouteTree,
      ) as unknown as ResolvedRoutes<T>[typeof key];
    }
  }

  return result;
}

export function defineRoutes<T extends RouteTree>(
  routes: T,
): ResolvedRoutes<T> {
  const result = processRouteMap(routes);
  // detectDuplicatePaths only ever produces console.warn output (suppressed
  // in production by devWarn), so skip the O(n^2) walk entirely in
  // production rather than computing it and discarding the result.
  if (!isProduction()) {
    detectDuplicatePaths(result as unknown as Record<string, unknown>);
  }
  return result;
}
