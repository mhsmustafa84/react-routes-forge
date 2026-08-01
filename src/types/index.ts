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
export type RouteParam = string | number | boolean;
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
 * Annotatable shape of a route map for `defineRoutes()`.
 * Each key is either a static path string or a nested route tree.
 */
export type RouteTree = {
  [key: string]: string | RouteTree;
};

/**
 * Extracts param names from a path template string.
 * e.g. '/users/:id/posts/:postId' → 'id' | 'postId'
 */
type StripOptional<S extends string> =
  S extends `${infer Name}?` ? Name : S;

export type ExtractParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? StripOptional<Param> | ExtractParams<`/${Rest}`>
    : T extends `${string}:${infer Param}`
      ? StripOptional<Param>
      : T extends `${infer Prefix}/*`
        ? "*" | ExtractParams<Prefix>
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
  /**
   * When `false`, param values are substituted verbatim instead of being
   * URL-encoded. Defaults to `true` — param values are run through
   * `encodeURIComponent` so characters like `/`, `?`, `#` cannot break the
   * URL structure.
   */
  encode?: boolean;
  /**
   * URL hash fragment to append after the query string (e.g. `"section"` → `#section`).
   * The leading `#` is added automatically.
   */
  hash?: string;
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

/**
 * A single breadcrumb entry produced by `getBreadcrumbs()`.
 *
 * @see {@link getBreadcrumbs}
 */
export type BreadcrumbItem = {
  /** Dot-joined key from the route tree, e.g. `"USERS.EDIT"`. */
  key: string;
  /** Human-readable label derived from the key (or from `labelResolver`). */
  label: string;
  /** The resolved path (params filled in), e.g. `"/users/edit/42"`. */
  path: string;
  /** `true` if this is the current page (exact match). */
  isCurrent: boolean;
};

/**
 * Options for `getBreadcrumbs()`.
 *
 * @see {@link getBreadcrumbs}
 */
export type BreadcrumbOptions = {
  /**
   * Static label map keyed by the dot-joined key (e.g. `"USERS.EDIT"`).
   * Takes precedence over `labelResolver`.
   */
  labels?: Record<string, string>;

  /**
   * Custom label resolver. Receives the dot-joined key
   * (e.g. `"USERS.BCC.EDIT"`) and returns the display label.
   *
   * @default
   * The default implementation takes the last key segment,
   * replaces underscores with spaces, and capitalises the
   * first letter (e.g. `"PRODUCT_DETAILS"` → `"Product Details"`).
   */
  labelResolver?: (key: string) => string;
};
