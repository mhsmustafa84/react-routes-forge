import type { QueryParams } from "../types";

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
export function appendQuery(
  path: string,
  query?: QueryParams,
  hash?: string,
): string {
  const hashIdx = path.indexOf("#");
  const base = hashIdx === -1 ? path : path.slice(0, hashIdx);
  const existingHash = hashIdx === -1 ? "" : path.slice(hashIdx + 1);

  const searchParams = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v !== undefined && v !== null)
            searchParams.append(key, String(v));
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
