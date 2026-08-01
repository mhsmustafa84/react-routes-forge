// Core
export { defineRoutes } from "./core/defineRoutes";
export { buildPath, extractParamNames, isDynamic } from "./core/utils";

// Types
export type {
  RoutePath,
  RouteBuilder,
  RouteParam,
  RouteParams,
  QueryParams,
  RouteLeaf,
  RouteMap,
  ExtractParams,
  PathParams,
  BuildPathOptions,
  FlatRoute,
  BreadcrumbItem,
  BreadcrumbOptions,
} from "./types";

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
} from "./core/utils";
