// Core
export { defineRoutes, buildPath, extractParamNames, isDynamic } from './defineRoutes';

// Types
export type {
  RoutePath,
  RouteBuilder,
  RouteParam,
  RouteParams,
  RouteLeaf,
  RouteMap,
  ExtractParams,
  PathParams,
} from './types';

// Utilities
export {
  isActivePath,
  extractParamsFromPath,
  joinPaths,
  build,
  getParamNames,
} from './utils';

// React hooks (tree-shakeable — only bundled if imported)
export { useRouteParams, useNavigateTo, useResolvedPath } from './hooks';
