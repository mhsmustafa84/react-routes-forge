/** Global RegExp instances — safe since String.prototype.replace/matchAll don't bleed lastIndex. */
const ESCAPE_RE = /[.*+?^${}()|[\]\\]/g;

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
export const PARAM_SEGMENT_RE = /(^|\/):([A-Za-z0-9_]+)(\?)?/g;

export function escapeRegex(value: string): string {
  return value.replace(ESCAPE_RE, "\\$&");
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

  for (const match of base.matchAll(PARAM_SEGMENT_RE)) {
    const start = match.index ?? 0;
    const token = match[0];

    pattern += escapeRegex(base.slice(cursor, start));

    const [, boundary = "", , optional] = match;
    pattern += optional
      ? `(?:${escapeRegex(boundary)}([^/]+))?`
      : `${escapeRegex(boundary)}([^/]+)`;

    cursor = start + (token?.length ?? 0);
  }

  return (
    pattern + escapeRegex(base.slice(cursor)) + (splat ? "(?:/(.*))?" : "")
  );
}

/** Returns `true` when `name` is an optional (`:name?`) param in `template`. */
export function isOptionalParam(template: string, name: string): boolean {
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

export function matchPrefix(template: string): RegExp {
  if (template === "/") return ROOT_PREFIX_RE;
  const cached = PREFIX_CACHE.get(template);
  if (cached !== undefined) return cached;
  const re = new RegExp(`^${createTemplatePattern(template)}(?=/|$)`);
  PREFIX_CACHE.set(template, re);
  return re;
}

/** Decode a URL-encoded param value, falling back to the raw value on error. */
export function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
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
 * Clears internal regex cache maps (PREFIX_CACHE and PATH_CACHE).
 * Useful in test suites to prevent cached patterns from leaking across test cases.
 */
export function clearPathCache(): void {
  PREFIX_CACHE.clear();
  PATH_CACHE.clear();
}
