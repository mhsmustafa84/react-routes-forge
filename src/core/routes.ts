import { matchPath, matchPrefix } from "./pattern";
import { extractParamsFromPath, isDynamic } from "./params";
import { buildPath } from "./build";
import type {
  BreadcrumbItem,
  BreadcrumbOptions,
  FlatRoute,
} from "../types";

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
  visited = new Set<Record<string, unknown>>(),
): FlatRoute[] {
  if (visited.has(routes)) return [];
  visited.add(routes);

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
      entries.push(...flattenRoutes(value as Record<string, unknown>, fullKey, visited));
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
  const raw =
    last === "ROOT" && parts.length > 1 ? parts[parts.length - 2]! : last;
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
  const flat = Array.isArray(routes) ? routes : flattenRoutes(routes);
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

  // Sort by path depth (segment count), not raw string length — a shallow
  // route with a long param name (e.g. "/shop/:reallyLongSlugName") must
  // still sort before a deeper route with short segments (e.g.
  // "/shop/widgets/details"), even though the latter has fewer characters.
  const segmentCount = (t: string) => t.split("/").filter(Boolean).length;
  items.sort((a, b) => segmentCount(a.template) - segmentCount(b.template));

  return items.map((item) => ({
    key: item.key,
    label: labels[item.key] ?? labelFn(item.key),
    path: item.resolvedPath,
    isCurrent: item.isCurrent,
  }));
}
