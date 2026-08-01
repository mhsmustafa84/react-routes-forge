// Core
export { defineRoutes } from "./core/defineRoutes";
export { appendQuery, buildPath, extractParamNames, extractQueryFromPath, isDynamic } from "./core/utils";

// Types
export type {
  RoutePath,
  RouteBuilder,
  RouteParam,
  RouteParams,
  QueryParams,
  RouteLeaf,
  RouteMap,
  RouteTree,
  ExtractParams,
  PathParams,
  BuildPathOptions,
  FlatRoute,
  BreadcrumbItem,
  BreadcrumbOptions,
  MatchPathOptions,
} from "./types";
export type { StaticRoute, DynamicRoute } from "./core/defineRoutes";

// Utilities
export {
  isActivePath,
  extractParamsFromPath,
  matchPath,
  joinPaths,
  build,
  getParamNames,
  flattenRoutes,
  getBreadcrumbs,
  devWarn,
  clearPathCache,
} from "./core/utils";
