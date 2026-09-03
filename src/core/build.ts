import { escapeRegex, isOptionalParam } from "./pattern";
import { extractParamNames } from "./params";
import { appendQuery } from "./query";
import { devWarn } from "./environment";
import type { BuildPathOptions, QueryParams, RouteParams } from "../types";

/**
 * Resolve a route template against a params object, appending an optional
 * query string and hash fragment.
 *
 * Missing required params are left as their `:name` placeholder and a
 * `console.warn` is emitted — pass `{ strict: true }` to throw a `RangeError`
 * instead. Optional (`:param?`) segments are dropped entirely when missing;
 * a missing splat just drops the trailing `/*`. Values are URL-encoded by
 * default (`{ encode: false }` opts out).
 */
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

      if (typeof value !== 'string' && typeof value !== 'number') {
        throw new TypeError(
          `Splat parameter must be string or number, got ${typeof value}`
        );
      }

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

/**
 * Standalone alias of {@link buildPath} — resolves a template against params.
 */
export function build(
  template: string,
  params: RouteParams,
  query?: QueryParams,
  options?: BuildPathOptions,
): string {
  return buildPath(template, params, query, options);
}

/**
 * Join URL path segments into a single slash-prefixed path, normalising
 * duplicate slashes.
 *
 * @example
 * joinPaths("/api/", "/v1/", "users"); // → "/api/v1/users"
 */
export function joinPaths(...segments: string[]): string {
  const processed = segments.map((segment) =>
    segment.replace(/^\/+/, "").replace(/\/+$/, ""),
  );
  const filtered = processed.filter(Boolean);
  return "/" + filtered.join("/");
}
