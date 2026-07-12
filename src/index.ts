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
} from "./types";

// Utilities
export {
  isActivePath,
  extractParamsFromPath,
  joinPaths,
  build,
  getParamNames,
  flattenRoutes,
} from "./core/utils";

// React hooks (tree-shakeable — only bundled if imported)
export { useRouteParams, useNavigateTo, useResolvedPath } from "./hooks";
