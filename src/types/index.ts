/**
 * A static route string (template or resolved), e.g. '/users/:id' or '/users/42'
 */
export type RoutePath = `/${string}`;

/**
 * A route builder function that accepts params and returns a resolved path.
 */
export type RouteBuilder<TParams extends RouteParams = RouteParams> = (
  params: TParams,
) => RoutePath;

/**
 * Acceptable param value types for route builders.
 */
export type RouteParam = string | number;
export type RouteParams = Record<string, RouteParam>;

/**
 * A leaf node in a route definition: either a static path or a builder function.
 */
export type RouteLeaf = RoutePath | RouteBuilder;

/**
 * Recursively defines a route map: each key is either a leaf or a nested map.
 */
export type RouteMap = {
  [key: string]: RouteLeaf | RouteMap;
};

/**
 * Extracts param names from a path template string.
 * e.g. '/users/:id/posts/:postId' → 'id' | 'postId'
 */
export type ExtractParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<`/${Rest}`>
    : T extends `${string}:${infer Param}`
      ? Param
      : never;

/**
 * Builds a params object type from a path template.
 * e.g. '/users/:id' → { id: RouteParam }
 */
export type PathParams<T extends string> =
  ExtractParams<T> extends never
    ? never
    : { [K in ExtractParams<T>]: RouteParam };

/**
 * Acceptable query param value types for route builders.
 */
export type QueryParams = Record<
  string,
  RouteParam | RouteParam[] | null | undefined
>;

/**
 * Options accepted by `buildPath` (4th positional argument).
 *
 * @example
 * // Throws a RangeError when a :param segment is missing rather than
 * // silently leaving the colon-placeholder in the output string.
 * buildPath('/users/:id', {}, undefined, { strict: true });
 */
export type BuildPathOptions = {
  /**
   * When `true`, `buildPath` throws a `RangeError` if any `:param`
   * placeholder is left unresolved instead of emitting a console.warn.
   * Useful in dev/test environments to catch missing params early.
   */
  strict?: boolean;
};

/**
 * A single entry produced by `flattenRoutes()`.
 */
export type FlatRoute = {
  /** Dot-joined key path from the root, e.g. `"SERVICES.BCC.EDIT"`. */
  key: string;
  /** The raw path template string, e.g. `"/services/bcc/edit/:id"`. */
  path: string;
};
