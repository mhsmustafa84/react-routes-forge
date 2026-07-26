import type { BreadcrumbItem, BreadcrumbOptions, QueryParams, RouteParam, RouteParams, BuildPathOptions, FlatRoute } from "../types";

/** Returns a fresh RegExp each call — avoids shared `lastIndex` state on /g patterns. */
const PATH_PARAM_RE = () => /:([^/]+)/g;
const ESCAPE_RE = () => /[.*+?^${}()|[\]\\]/g;

function escapeRegex(value: string): string {
  return value.replace(ESCAPE_RE(), "\\$&");
}

function createTemplatePattern(template: string): string {
  return escapeRegex(template).replace(PATH_PARAM_RE(), "([^/]+)");
}

export function appendQuery(path: string, query?: QueryParams, hash?: string): string {
  let result = path;

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

  const queryString = searchParams.toString();
  if (queryString) {
    result += (result.includes("?") ? "&" : "?") + queryString;
  }

  if (hash) {
    result += "#" + hash;
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
    (name) => params[name] === undefined || params[name] === null,
  );

  const resolved = paramNames.reduce((path, name) => {
    const value = params[name];
    const replacement = value === undefined || value === null ? `:${name}` : String(value);
    return path.replace(
      new RegExp(`:${escapeRegex(name)}\\??(?=/|$)`, "g"),
      replacement,
    );
  }, template);

  if (unresolved.length > 0) {
    if (options?.strict) {
      throw new RangeError(
        `[route-forge] Missing required param(s) ${unresolved.map((p) => `":${p}"`).join(", ")} in template "${template}".`,
      );
    }

    const runtimeProcess = (
      globalThis as typeof globalThis & {
        process?: {
          env?: Record<string, string | undefined>;
        };
      }
    ).process;

    if (runtimeProcess?.env?.NODE_ENV !== "production") {
      console.warn(
        `[route-forge] Unresolved params in path "${resolved}". ` +
          `Check that all :param segments have matching keys.`,
      );
    }
  }

  return appendQuery(resolved, query, options?.hash);
}

export function extractParamNames(template: string): string[] {
  return [...template.matchAll(PATH_PARAM_RE())].map(
    (match) => (match[1] as string).replace(/\?$/, ""),
  );
}

export function isDynamic(path: string): boolean {
  return PATH_PARAM_RE().test(path);
}

export function isActivePath(
  currentPath: string,
  template: string,
  options: { exact?: boolean } = { exact: true },
): boolean {
  const pathWithoutSearch = currentPath.split("?")[0] ?? "";
  const regex = options.exact
    ? matchPath(template)
    : new RegExp(`^${createTemplatePattern(template)}`);

  return regex.test(pathWithoutSearch);
}

export function extractParamsFromPath(
  template: string,
  resolvedPath: string,
): Record<string, string> {
  const pathWithoutSearch = resolvedPath.split("?")[0] ?? "";
  const paramNames = extractParamNames(template);
  const match = pathWithoutSearch.match(matchPath(template));

  if (!match) return {};

  return Object.fromEntries(
    paramNames.map((name, index) => [name, match[index + 1] ?? ""]),
  );
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
 */
export function matchPath(template: string): RegExp {
  return new RegExp(`^${createTemplatePattern(template)}$`);
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

    const prefixRe = new RegExp(`^${createTemplatePattern(route.path)}`);
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
    label: labelFn(item.key),
    path: item.resolvedPath,
    isCurrent: item.isCurrent,
  }));
}

