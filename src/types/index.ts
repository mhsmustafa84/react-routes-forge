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
