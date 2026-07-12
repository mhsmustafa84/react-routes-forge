import type { QueryParams, RouteParam, RouteParams } from "../types";

/** Returns a fresh RegExp each call — avoids shared `lastIndex` state on /g patterns. */
const PATH_PARAM_RE = () => /:([^/]+)/g;
const ESCAPE_RE = () => /[.*+?^${}()|[\]\\]/g;

function escapeRegex(value: string): string {
  return value.replace(ESCAPE_RE(), "\\$&");
}

function createTemplatePattern(template: string): string {
  return escapeRegex(template).replace(PATH_PARAM_RE(), "([^/]+)");
}

export function appendQuery(path: string, query?: QueryParams): string {
  if (!query) return path;

  const searchParams = new URLSearchParams();
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

  const queryString = searchParams.toString();
  if (!queryString) return path;

  return path + (path.includes("?") ? "&" : "?") + queryString;
}

export function buildPath(
  template: string,
  params: RouteParams,
  query?: QueryParams,
): string {
  const paramNames = extractParamNames(template);

  const resolved = paramNames.reduce((path, name) => {
    const value = params[name];
    const replacement = value === undefined ? `:${name}` : String(value);
    return path.replace(
      new RegExp(`:${escapeRegex(name)}(?=/|$)`, "g"),
      replacement,
    );
  }, template);

  const runtimeProcess = (
    globalThis as typeof globalThis & {
      process?: {
        env?: Record<string, string | undefined>;
      };
    }
  ).process;

  if (
    runtimeProcess?.env?.NODE_ENV !== "production" &&
    resolved.includes(":")
  ) {
    console.warn(
      `[route-forge] Unresolved params in path "${resolved}". ` +
        `Check that all :param segments have matching keys.`,
    );
  }

  return appendQuery(resolved, query);
}

export function extractParamNames(template: string): string[] {
  return [...template.matchAll(PATH_PARAM_RE())].map(
    (match) => match[1] as string,
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
  const pattern = createTemplatePattern(template);
  const regex = options.exact
    ? new RegExp(`^${pattern}$`)
    : new RegExp(`^${pattern}`);

  return regex.test(pathWithoutSearch);
}

export function extractParamsFromPath(
  template: string,
  resolvedPath: string,
): Record<string, string> {
  const pathWithoutSearch = resolvedPath.split("?")[0] ?? "";
  const paramNames = extractParamNames(template);
  const regex = new RegExp(`^${createTemplatePattern(template)}$`);
  const match = pathWithoutSearch.match(regex);

  if (!match) return {};

  return Object.fromEntries(
    paramNames.map((name, index) => [name, match[index + 1] ?? ""]),
  );
}

export function joinPaths(...segments: string[]): string {
  return (
    "/" +
    segments
      .map((segment) => segment.replace(/^\/+|\/+$/g, ""))
      .filter(Boolean)
      .join("/")
  );
}

export function build(
  template: string,
  params: RouteParams,
  query?: QueryParams,
): string {
  return buildPath(template, params, query);
}

export function getParamNames(template: string): string[] {
  return extractParamNames(template);
}
