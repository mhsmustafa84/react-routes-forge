import type {
  BreadcrumbItem,
  BreadcrumbOptions,
  BuildPathOptions,
  FlatRoute,
  QueryParams,
  RouteParams,
} from "../types";

/** Returns a fresh RegExp each call — avoids shared `lastIndex` state on /g patterns. */
const ESCAPE_RE = () => /[.*+?^${}()|[\]\\]/g;

/**
 * Matches a `:param` token that starts a URL segment.
 *
 * A param is only recognized when its `:` sits at the very start of the
 * template or is immediately preceded by `/`, so a literal colon inside a
 * segment (e.g. `/users/foo:bar`) is not treated as a param. Param names are
 * restricted to `[A-Za-z0-9_]` (matching React Router), so any static suffix
 * (e.g. `.json` in `/files/:name.json`) stays a literal. The optional `?`
 * marker (`:param?`) is captured separately so it can be handled as a
 * whole-segment modifier.
 */
const PARAM_SEGMENT_RE = () => /(^|\/):([A-Za-z0-9_]+)(\?)?/g;

/** Returns `true` when running in a production bundle (suppresses dev warnings). */
export function isProduction(): boolean {
  const runtimeProcess = (
    globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process;
  return runtimeProcess?.env?.NODE_ENV === "production";
}

/**
 * Emits a `console.warn` in non-production environments.
 * Shared by the core utilities and `defineRoutes()` so the production check
 * lives in one place.
 */
export function devWarn(message: string): void {
  if (!isProduction()) {
    console.warn(message);
  }
}

/**
 * Clears internal regex cache maps (PREFIX_CACHE and PATH_CACHE).
 * Useful in test suites to prevent cached patterns from leaking across test cases.
 */
export function clearPathCache(): void {
  PREFIX_CACHE.clear();
  PATH_CACHE.clear();
}

function escapeRegex(value: string): string {
  return value.replace(ESCAPE_RE(), "\\$&");
}

/**
 * Convert a route template into an unanchored `RegExp` source string.
 *
 * - Required `:name` segments become a capturing group `([^/]+)`.
 * - Optional `:name?` segments become `(?:([^/]+))?` — the whole segment is
 *   optional, matching React Router semantics.
 * - A trailing splat (`/*`) becomes `(?:/(.*))?`, capturing the remainder of
 *   the path (including slashes) or nothing at all.
 * - Everything else is regex-escaped literally.
 */
function createTemplatePattern(template: string): string {
  const splat = template.endsWith("/*");
  const base = splat ? template.slice(0, -2) : template;
  let pattern = "";
  let cursor = 0;

  for (const match of base.matchAll(PARAM_SEGMENT_RE())) {
    const start = match.index ?? 0;
    const token = match[0];

    pattern += escapeRegex(base.slice(cursor, start));

    const [, boundary = "", , optional] = match;
    pattern += optional
      ? `(?:${escapeRegex(boundary)}([^/]+))?`
      : `${escapeRegex(boundary)}([^/]+)`;

    cursor = start + (token?.length ?? 0);
  }

  return pattern + escapeRegex(base.slice(cursor)) + (splat ? "(?:/(.*))?" : "");
}

/** Returns `true` when `name` is an optional (`:name?`) param in `template`. */
function isOptionalParam(template: string, name: string): boolean {
  return new RegExp(`:${escapeRegex(name)}\\?(?![A-Za-z0-9_])`).test(template);
}

/**
 * Returns a `RegExp` that matches `template` as a path prefix, honoring
 * segment boundaries (`/users` matches `/users/42` but not `/usersettings`).
 *
 * The root template `/` is a prefix of every path.
 *
 * Compiled patterns are cached per template: the resulting `RegExp` has no
 * `/g` flag, so repeated `.test()`/`.exec()` calls are side-effect free and
 * sharing instances across callers is safe.
 */
const PREFIX_CACHE = new Map<string, RegExp>();
const ROOT_PREFIX_RE = /^/;

function matchPrefix(template: string): RegExp {
  if (template === "/") return ROOT_PREFIX_RE;
  const cached = PREFIX_CACHE.get(template);
  if (cached !== undefined) return cached;
  const re = new RegExp(`^${createTemplatePattern(template)}(?=/|$)`);
  PREFIX_CACHE.set(template, re);
  return re;
}

/** Decode a URL-encoded param value, falling back to the raw value on error. */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Append a query string and/or hash fragment to a path that may already
 * contain a query or hash.
 *
 * - Existing query pairs are preserved; new ones are joined with `&`.
 * - The query string is always inserted before any hash fragment, so an
 *   existing `#section` on `path` is kept unless a new `hash` is given.
 *
 * @example
 * ```ts
 * appendQuery("/users?tab=list", { page: 2 }); // → "/users?tab=list&page=2"
 * appendQuery("/users#top", { tab: "list" });  // → "/users?tab=list#top"
 * ```
 */
export function appendQuery(path: string, query?: QueryParams, hash?: string): string {
  const hashIdx = path.indexOf("#");
  const base = hashIdx === -1 ? path : path.slice(0, hashIdx);
  const existingHash = hashIdx === -1 ? "" : path.slice(hashIdx + 1);

  const searchParams = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v !== undefined && v !== null) searchParams.append(key, String(v));
        });
      } else {
        searchParams.append(key, String(value));
      }
    }
  }

  let result = base;
  const queryString = searchParams.toString();
  if (queryString) {
    result += (result.includes("?") ? "&" : "?") + queryString;
  }

  if (hash) {
    result += "#" + hash;
  } else if (existingHash) {
    result += "#" + existingHash;
  }

  return result;
}

/**
 * Parse the query string out of a path (or bare query string) into a plain
 * object. Repeated keys become arrays; a single key is a scalar string.
 *
 * With `{ coerceBooleans: true }`, the strings `"true"`/`"false"` are
 * converted to actual booleans.
 *
 * @example
 * ```ts
 * extractQueryFromPath("/users/42?tab=profile&tag=a&tag=b");
 * // → { tab: "profile", tag: ["a", "b"] }
 * extractQueryFromPath("/search?active=true", { coerceBooleans: true });
 * // → { active: true }
 * ```
 */
export function extractQueryFromPath(
  path: string,
  options?: { coerceBooleans?: boolean; coerceNumbers?: boolean },
): QueryParams {
  const hashIdx = path.indexOf("#");
  const noHash = hashIdx === -1 ? path : path.slice(0, hashIdx);
  const queryIdx = noHash.indexOf("?");
  if (queryIdx === -1) return {};

  const params = new URLSearchParams(noHash.slice(queryIdx + 1));
  const result: QueryParams = {};

  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    const parsed = values.map((v) => {
      if (options?.coerceBooleans && (v === "true" || v === "false")) {
        return v === "true";
      }
      if (options?.coerceNumbers && v.trim() !== "" && !isNaN(Number(v))) {
        return Number(v);
      }
      return v;
    });
    result[key] = parsed.length > 1 ? parsed : (parsed[0] ?? "");
  }

  return result;
}

export function buildPath(
  template: string,
  params: RouteParams,
  query?: QueryParams,
  options?: BuildPathOptions,
): string {
  const paramNames = extractParamNames(template);
  const unresolved = paramNames.filter(
    (name) =>
      (params[name] === undefined || params[name] === null) &&
      !isOptionalParam(template, name) &&
      // A missing splat simply drops the `/*` suffix (matching React Router,
      // where `/files/*` also matches `/files`).
      name !== "*",
  );

  const resolved = paramNames.reduce((path, name) => {
    const value = params[name];
    const missing = value === undefined || value === null;

    if (name === "*") {
      if (missing) return path.replace(/\/\*$/, "") || "/";
      // Splat values are path-like: preserve `/` separators but still
      // encode characters that could break the URL (`?`, `#`, spaces, …).
      const encoded =
        options?.encode === false
          ? String(value)
          : String(value)
              .split("/")
              .map((segment) => encodeURIComponent(segment))
              .join("/");
      return path.replace(/\/\*$/, `/${encoded}`);
    }

    const re = new RegExp(
      `(^|/):${escapeRegex(name)}\\??(?![A-Za-z0-9_])`,
      "g",
    );

    return path.replace(re, (match, boundary) => {
      if (missing) {
        // Optional segment: drop the whole `/segment`. Required: keep the
        // `:name` placeholder so strict mode can report it.
        return match.endsWith("?") ? "" : `${boundary}:${name}`;
      }

      const encoded =
        options?.encode === false
          ? String(value)
          : encodeURIComponent(String(value));
      return `${boundary}${encoded}`;
    });
  }, template);

  if (unresolved.length > 0) {
    if (options?.strict) {
      throw new RangeError(
        `[route-forge] Missing required param(s) ${unresolved.map((p) => `":${p}"`).join(", ")} in template "${template}".`,
      );
    }

    devWarn(
      `[route-forge] Unresolved params in path "${resolved}". ` +
        `Check that all :param segments have matching keys.`,
    );
  }

  return appendQuery(resolved, query, options?.hash);
}

export function extractParamNames(template: string): string[] {
  const names = [...template.matchAll(PARAM_SEGMENT_RE())].map(
    (match) => match[2] as string,
  );
  if (template.endsWith("/*")) names.push("*");
  return names;
}

export function isDynamic(path: string): boolean {
  return PARAM_SEGMENT_RE().test(path) || path.endsWith("/*");
}

/**
 * Test whether `currentPath` matches `template`, mirroring React Router's
 * `NavLink` matching semantics:
 *
 * - Case-insensitive by default (pass `caseSensitive: true` to opt out).
 * - Trailing slashes are tolerated (`/users/` matches `/users`).
 * - `exact: true` (the default) requires a full match; `exact: false`
 *   matches any path that starts with the template.
 */
export function isActivePath(
  currentPath: string,
  template: string,
  options: { exact?: boolean; caseSensitive?: boolean } = {
    exact: true,
    caseSensitive: false,
  },
): boolean {
  const pathname = (currentPath.split("?")[0] ?? "").replace(/\/+$/, "") || "/";
  const normalizedTemplate = template.replace(/\/+$/, "") || "/";
  const target = options.caseSensitive
    ? normalizedTemplate
    : normalizedTemplate.toLowerCase();
  const candidate = options.caseSensitive ? pathname : pathname.toLowerCase();
  const regex = options.exact ? matchPath(target) : matchPrefix(target);

  return regex.test(candidate);
}

export function extractParamsFromPath(
  template: string,
  resolvedPath: string,
): Record<string, string> {
  const pathWithoutSearch = resolvedPath.split("?")[0] ?? "";
  const paramNames = extractParamNames(template);
  const match = pathWithoutSearch.match(matchPath(template));

  if (!match) return {};

  const result: Record<string, string> = {};
  paramNames.forEach((name, index) => {
    const raw = match[index + 1];
    if (raw !== undefined) result[name] = safeDecode(raw);
  });
  return result;
}

export function joinPaths(...segments: string[]): string {
  const processed = segments.map((segment) =>
    segment.replace(/^\/+/, "").replace(/\/+$/, ""),
  );
  const filtered = processed.filter(Boolean);
  return "/" + filtered.join("/");
}

export function build(
  template: string,
  params: RouteParams,
  query?: QueryParams,
  options?: BuildPathOptions,
): string {
  return buildPath(template, params, query, options);
}

export function getParamNames(template: string): string[] {
  return extractParamNames(template);
}

/**
 * Convert a route template string into an anchored `RegExp` for matching paths.
 *
 * Each `:param` segment becomes a capturing group so the returned regex
 * can be used with `.test()` or `.exec()`.
 *
 * Query strings are **not** stripped — callers should split on `"?"` first
 * (see {@link isActivePath} or {@link extractParamsFromPath} for higher-level
 * helpers that handle this automatically).
 *
 * @param template - A route template, e.g. `"/users/:id"` or `"/users/:id/posts/:postId"`.
 * @returns A `RegExp` anchored with `^` and `$` that captures param values.
 *
 * @example
 * ```ts
 * const re = matchPath("/users/:id");
 * re.test("/users/42");          // true
 * re.exec("/users/42");          // ["/users/42", "42"]
 * re.test("/users/42/posts");    // false (exact match)
 * re.test("/users/42?page=1");   // true (query is part of captured value)
 * ```
 *
 * Compiled patterns are cached per template (the regex has no `/g` flag, so
 * sharing instances across callers is safe).
 */
const PATH_CACHE = new Map<string, RegExp>();

export function matchPath(
  template: string,
  options?: { end?: boolean; caseSensitive?: boolean },
): RegExp {
  const end = options?.end ?? true;
  const flags = options?.caseSensitive ? "" : "i";
  const cacheKey = `${template}:${end}:${flags}`;

  const cached = PATH_CACHE.get(cacheKey);
  if (cached !== undefined) return cached;

  const basePattern = createTemplatePattern(template);
  const pattern = end ? `^${basePattern}$` : `^${basePattern}(?=/|$)`;
  const re = new RegExp(pattern, flags);
  PATH_CACHE.set(cacheKey, re);
  return re;
}

/**
 * Walk a `defineRoutes` output tree and return a flat array of
 * `{ key, path }` entries where `key` is the dot-joined key path from
 * the root (e.g. `"SERVICES.BCC.EDIT"`) and `path` is the raw template
 * string (e.g. `"/services/bcc/edit/:id"`).
 *
 * Useful for:
 * - Generating sitemaps from a single source of truth.
 * - Detecting duplicate path strings across branches at startup:
 *
 * @example
 * const flat = flattenRoutes(PATHS);
 * const paths = flat.map((r) => r.path);
 * const dupes = paths.filter((p, i) => paths.indexOf(p) !== i);
 * if (dupes.length) console.warn('Duplicate paths:', dupes);
 */
export function flattenRoutes(
  routes: Record<string, unknown>,
  prefix = "",
): FlatRoute[] {
  const entries: FlatRoute[] = [];

  for (const key of Object.keys(routes)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = routes[key];

    if (typeof value === "string") {
      // Plain static string leaf.
      entries.push({ key: fullKey, path: value });
    } else if (value instanceof String) {
      // String-object leaf (wrapped dynamic path from defineRoutes).
      entries.push({ key: fullKey, path: value.valueOf() });
    } else if (typeof value === "object" && value !== null) {
      // Nested route group — recurse.
      entries.push(
        ...flattenRoutes(value as Record<string, unknown>, fullKey),
      );
    }
    // Anything else (functions, numbers, …) is silently skipped.
  }

  return entries;
}

function deriveBreadcrumbLabel(key: string): string {
  const parts = key.split(".");
  const last = parts[parts.length - 1] ?? key;
  // Use the parent segment when the leaf is the conventional "ROOT" key,
  // so USERS.ROOT → "Users" rather than "Root".
  const raw = last === "ROOT" && parts.length > 1 ? parts[parts.length - 2]! : last;
  return raw
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Build a breadcrumb trail from a route tree or a flat route list.
 *
 * For a given `currentPath`, it walks the route tree and returns every route
 * that is an ancestor of (or an exact match to) the current page.  Ancestors
 * are matched by prefix (e.g. `/users` matches `/users/edit/42/posts`).
 *
 * Dynamic params in ancestor paths are automatically resolved from the
 * matched portion of the URL.
 *
 * @param routes - A route tree (output of `defineRoutes`) or a pre-flattened
 *                 array from `flattenRoutes()`.
 * @param currentPath - The current URL (with or without query string).
 * @param options - Optional label resolver.
 * @returns An array of {@link BreadcrumbItem} ordered by depth
 *          (most general first), where the last item is the current page.
 *
 * @example
 * ```ts
 * const PATHS = defineRoutes({
 *   HOME: "/",
 *   USERS: { ROOT: "/users", EDIT: "/users/edit/:id" },
 * } as const);
 *
 * getBreadcrumbs(PATHS, "/users/edit/42");
 * // → [
 * //     { key: "HOME",       label: "Home",  path: "/",             isCurrent: false },
 * //     { key: "USERS.ROOT", label: "Users", path: "/users",        isCurrent: false },
 * //     { key: "USERS.EDIT", label: "Edit",  path: "/users/edit/42", isCurrent: true  },
 * //   ]
 * ```
 */
export function getBreadcrumbs(
  routes: Record<string, unknown> | FlatRoute[],
  currentPath: string,
  options?: BreadcrumbOptions,
): BreadcrumbItem[] {
  const flat = Array.isArray(routes)
    ? routes
    : flattenRoutes(routes);
  const pathname = currentPath.split("?")[0] ?? "";
  const labelFn = options?.labelResolver ?? deriveBreadcrumbLabel;
  const labels = options?.labels ?? {};

  const items: Array<{
    key: string;
    resolvedPath: string;
    template: string;
    isCurrent: boolean;
  }> = [];

  for (const route of flat) {
    const exactRe = matchPath(route.path);
    const exactMatch = pathname.match(exactRe);

    if (exactMatch) {
      const params = extractParamsFromPath(route.path, exactMatch[0]);
      const resolved = isDynamic(route.path)
        ? buildPath(route.path, params)
        : route.path;
      items.push({
        key: route.key,
        resolvedPath: resolved,
        template: route.path,
        isCurrent: true,
      });
      continue;
    }

    const prefixRe = matchPrefix(route.path);
    const prefixMatch = pathname.match(prefixRe);

    if (prefixMatch) {
      const matchedPortion = prefixMatch[0];
      const params = extractParamsFromPath(route.path, matchedPortion);
      const resolved = isDynamic(route.path)
        ? buildPath(route.path, params)
        : route.path;
      items.push({
        key: route.key,
        resolvedPath: resolved,
        template: route.path,
        isCurrent: false,
      });
    }
  }

  items.sort((a, b) => a.template.length - b.template.length);

  return items.map((item) => ({
    key: item.key,
    label: labels[item.key] ?? labelFn(item.key),
    path: item.resolvedPath,
    isCurrent: item.isCurrent,
  }));
}

