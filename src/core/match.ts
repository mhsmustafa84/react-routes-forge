import { matchPath, matchPrefix } from "./pattern";

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
  options: { exact?: boolean; caseSensitive?: boolean } = {},
): boolean {
  // NOTE: default each property individually rather than relying on a
  // default *object* for `options` — JS default parameters only apply when
  // the whole argument is omitted, so `isActivePath(a, b, { caseSensitive: true })`
  // would otherwise silently lose the documented `exact: true` default.
  const exact = options.exact ?? true;
  const caseSensitive = options.caseSensitive ?? false;

  const pathname = (currentPath.split("?")[0] ?? "").replace(/\/+$/, "") || "/";
  const normalizedTemplate = template.replace(/\/+$/, "") || "/";
  const target = caseSensitive
    ? normalizedTemplate
    : normalizedTemplate.toLowerCase();
  const candidate = caseSensitive ? pathname : pathname.toLowerCase();
  const regex = exact
    ? matchPath(target, { caseSensitive })
    : matchPrefix(target);

  return regex.test(candidate);
}
