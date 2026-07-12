import { buildPath, extractParamNames, isDynamic } from "./utils";
import type {
  ExtractParams,
  PathParams,
  QueryParams,
  RoutePath,
} from "../types";

// Re-export so consumers that import from 'core/defineRoutes' get the full surface
export { buildPath, extractParamNames, isDynamic } from "./utils";

type RouteInput = {
  [key: string]: string | RouteInput;
};

type DynamicRoute<T extends string> = T extends `${string}:${string}`
  ? T & {
      build(params: PathParams<T>, query?: QueryParams): RoutePath;
      paramNames: Array<ExtractParams<T>>;
    }
  : T;

type ResolvedRoutes<T extends RouteInput> = {
  [K in keyof T]: T[K] extends RouteInput
    ? ResolvedRoutes<T[K]>
    : T[K] extends string
      ? DynamicRoute<T[K]>
      : never;
};

const isRouteGroup = (value: unknown): value is RouteInput =>
  typeof value === "object" && value !== null;

function wrapDynamicPath<T extends string>(template: T): DynamicRoute<T> {
  const paramNames = extractParamNames(template);
  const wrapped = new String(template) as unknown as DynamicRoute<T> & {
    build: (params: PathParams<T>, query?: QueryParams) => RoutePath;
    paramNames: Array<ExtractParams<T>>;
  };

  wrapped.build = (params: PathParams<T>, query?: QueryParams) =>
    buildPath(template, params, query) as RoutePath;
  wrapped.paramNames = paramNames as Array<ExtractParams<T>>;

  return wrapped as unknown as DynamicRoute<T>;
}

function processRouteMap<T extends RouteInput>(routes: T): ResolvedRoutes<T> {
  const result = {} as ResolvedRoutes<T>;

  for (const key in routes) {
    if (!Object.prototype.hasOwnProperty.call(routes, key)) continue;

    const value = routes[key];

    if (typeof value === "string") {
      result[key] = (
        isDynamic(value) ? wrapDynamicPath(value) : value
      ) as ResolvedRoutes<T>[typeof key];
    } else if (isRouteGroup(value)) {
      result[key] = processRouteMap(
        value as RouteInput,
      ) as unknown as ResolvedRoutes<T>[typeof key];
    }
  }

  return result;
}

export function defineRoutes<T extends RouteInput>(
  routes: T,
): ResolvedRoutes<T> {
  return processRouteMap(routes);
}
