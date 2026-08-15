import { PARAM_SEGMENT_RE, matchPath, safeDecode } from "./pattern";

/**
 * Extract the `:param` names from a route template.
 *
 * A param is only recognized at the start of a segment (see
 * {@link PARAM_SEGMENT_RE}), so literal colons (`/users/foo:bar`) and static
 * suffixes after a param (`/files/:name.json`) are not treated as params.
 * A trailing splat (`/*`) is reported as the `"*"` name.
 */
export function extractParamNames(template: string): string[] {
  const names = [...template.matchAll(PARAM_SEGMENT_RE())].map(
    (match) => match[2] as string,
  );
  if (template.endsWith("/*")) names.push("*");
  return names;
}

/** Returns `true` when the template contains a `:param` or trailing `/*` splat. */
export function isDynamic(path: string): boolean {
  return PARAM_SEGMENT_RE().test(path) || path.endsWith("/*");
}

/**
 * Alias of {@link extractParamNames} — kept for backwards compatibility.
 */
export function getParamNames(template: string): string[] {
  return extractParamNames(template);
}

/**
 * Extract the param values matched by `template` from a resolved path.
 *
 * The query string is stripped before matching, so `/users/42?tab=profile`
 * still yields `{ id: "42" }`. Values are URL-decoded back to their original
 * form; a non-matching path yields an empty object.
 */
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
