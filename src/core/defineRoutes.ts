import {
  buildPath,
  devWarn,
  extractParamNames,
  flattenRoutes,
  isActivePath,
  isDynamic,
} from "./utils";
import type {
  BuildPathOptions,
  ExtractParams,
  PathParams,
  QueryParams,
  RoutePath,
  RouteTree,
} from "../types";

// Re-export so consumers that import from 'core/defineRoutes' get the full surface
export { buildPath, extractParamNames, isDynamic } from "./utils";

/**
 * A dynamic route is a template string with a `:param` or trailing `/*` splat,
 * augmented with a `.build()` helper and a `.paramNames` array.
 *
 * Exported so consumers (e.g. the hooks entry) can type against it.
 */
export type StaticRoute<T extends string> = T & {
  build(query?: QueryParams, options?: BuildPathOptions): RoutePath;
};

export type DynamicRoute<T extends string> =
  T extends `${string}:${string}` | `${string}/*`
    ? T & {
        build(params: PathParams<T>, query?: QueryParams, options?: BuildPathOptions): RoutePath;
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

function wrapStaticPath<T extends string>(template: T): StaticRoute<T> {
  const wrapped = new String(template) as unknown as StaticRoute<T> & {
    build: (query?: QueryParams, options?: BuildPathOptions) => RoutePath;
  };
  wrapped.build = (query?: QueryParams, options?: BuildPathOptions) =>
    buildPath(template, {}, query, options) as RoutePath;

  return wrapped as unknown as StaticRoute<T>;
}

function wrapDynamicPath<T extends string>(template: T): DynamicRoute<T> {
  const paramNames = extractParamNames(template);
  const wrapped = new String(template) as unknown as DynamicRoute<T> & {
    build: (params: PathParams<T>, query?: QueryParams, options?: BuildPathOptions) => RoutePath;
    paramNames: Array<ExtractParams<T>>;
  };

  wrapped.build = (params: PathParams<T>, query?: QueryParams, options?: BuildPathOptions) =>
    buildPath(template, params, query, options) as RoutePath;
  wrapped.paramNames = paramNames as Array<ExtractParams<T>>;

  return wrapped as unknown as DynamicRoute<T>;
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
  detectDuplicatePaths(result as unknown as Record<string, unknown>);
  return result;
}
