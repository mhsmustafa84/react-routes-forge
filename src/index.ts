// Core
export { defineRoutes } from "./core/defineRoutes";
export type { StaticRoute, DynamicRoute } from "./core/defineRoutes";

// Path building
export { buildPath, build, joinPaths } from "./core/build";
export {
  extractParamNames,
  extractParamsFromPath,
  getParamNames,
  isDynamic,
} from "./core/params";

// Matching
export { isActivePath } from "./core/match";
export { matchPath } from "./core/pattern";

// Query strings & hashes
export { appendQuery, extractQueryFromPath } from "./core/query";

// Route trees
export { flattenRoutes, getBreadcrumbs } from "./core/routes";

// Environment
export { devWarn } from "./core/environment";
export { clearPathCache } from "./core/pattern";

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
