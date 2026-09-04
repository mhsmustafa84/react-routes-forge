import type { QueryParams, QueryParamValue } from "../types";

function serializeToParams(keyPrefix: string, value: QueryParamValue, searchParams: URLSearchParams) {
  if (value === undefined || value === null) return;
  
  if (Array.isArray(value)) {
    value.forEach((v) => {
      if (v !== undefined && v !== null) {
        searchParams.append(keyPrefix, String(v));
      }
    });
  } else if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      serializeToParams(`${keyPrefix}[${k}]`, v, searchParams);
    }
  } else {
    searchParams.append(keyPrefix, String(value));
  }
}

function deleteMatchingKeys(searchParams: URLSearchParams, rootKey: string) {
  const prefix = `${rootKey}[`;
  const keysToDelete: string[] = [];
  for (const key of searchParams.keys()) {
    if (key === rootKey || key.startsWith(prefix)) {
      keysToDelete.push(key);
    }
  }
  for (const key of keysToDelete) {
    searchParams.delete(key);
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
export function appendQuery(
  path: string,
  query?: QueryParams,
  hash?: string,
): string {
  const hashIdx = path.indexOf("#");
  const pathWithoutHash = hashIdx === -1 ? path : path.slice(0, hashIdx);
  const existingHash = hashIdx === -1 ? "" : path.slice(hashIdx + 1);

  const queryIdx = pathWithoutHash.indexOf("?");
  const base = queryIdx === -1 ? pathWithoutHash : pathWithoutHash.slice(0, queryIdx);
  const existingQueryString = queryIdx === -1 ? "" : pathWithoutHash.slice(queryIdx + 1);

  const searchParams = new URLSearchParams(existingQueryString);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (!Object.prototype.hasOwnProperty.call(query, key)) continue;
      
      deleteMatchingKeys(searchParams, key);
      
      if (value !== undefined && value !== null) {
        serializeToParams(key, value, searchParams);
      }
    }
  }

  let result = base;
  const queryString = searchParams.toString();
  if (queryString) {
    result += "?" + queryString;
  }

  if (hash) {
    result += "#" + encodeURIComponent(hash);
  } else if (existingHash) {
    result += "#" + existingHash;
  }

  return result;
}

function setDeepProperty(obj: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.replace(/\]/g, "").split(/\[/);
  const isUnsafeKey = (k: string) => k === "__proto__" || k === "constructor" || k === "prototype";
  if (parts.some((p) => isUnsafeKey(String(p)))) return;

  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i] as string;
    if (!current[part] || typeof current[part] !== 'object' || Array.isArray(current[part])) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  const lastPart = parts[parts.length - 1] as string;
  if (isUnsafeKey(lastPart)) return;
  current[lastPart] = value;
}

/**
 * Parse the query string out of a path (or bare query string) into a plain
 * object. Repeated keys become arrays; a single key is a scalar string.
 * Supports deep object nesting via bracket notation (e.g. `user[name]=John`).
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
      if (options?.coerceBooleans) {
        const lower = String(v).toLowerCase();
        if (lower === "true" || lower === "false") {
          return lower === "true";
        }
      }
      if (options?.coerceNumbers && v.trim() !== "" && !isNaN(Number(v))) {
        return Number(v);
      }
      return v;
    });
    const finalValue = parsed.length > 1 ? parsed : (parsed[0] ?? "");
    setDeepProperty(result, key, finalValue);
  }

  return result;
}
