import type { RouteParam } from '../types';

/** Returns a fresh RegExp each call — avoids shared `lastIndex` state on /g patterns. */
const PATH_PARAM_RE = () => /:([^/]+)/g;
const ESCAPE_RE = () => /[.*+?^${}()|[\]\\]/g;

function escapeRegex(value: string): string {
  return value.replace(ESCAPE_RE(), '\\$&');
}

function createTemplatePattern(template: string): string {
  return escapeRegex(template).replace(PATH_PARAM_RE(), '([^/]+)');
}

export function buildPath(
  template: string,
  params: Record<string, RouteParam>
): string {
  const paramNames = extractParamNames(template);

  const resolved = paramNames.reduce((path, name) => {
    const value = params[name];
    const replacement = value === undefined ? `:${name}` : String(value);
    return path.replace(new RegExp(`:${escapeRegex(name)}(?=/|$)`, 'g'), replacement);
  }, template);

  const runtimeProcess = (globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>;
    };
  }).process;

  if (runtimeProcess?.env?.NODE_ENV !== 'production' && resolved.includes(':')) {
    console.warn(
      `[route-forge] Unresolved params in path "${resolved}". ` +
        `Check that all :param segments have matching keys.`
    );
  }

  return resolved;
}

export function extractParamNames(template: string): string[] {
  return [...template.matchAll(PATH_PARAM_RE())].map((match) => match[1] as string);
}

export function isDynamic(path: string): boolean {
  return PATH_PARAM_RE().test(path);
}

export function isActivePath(
  currentPath: string,
  template: string,
  options: { exact?: boolean } = { exact: true }
): boolean {
  const pattern = createTemplatePattern(template);
  const regex = options.exact
    ? new RegExp(`^${pattern}$`)
    : new RegExp(`^${pattern}`);

  return regex.test(currentPath);
}

export function extractParamsFromPath(
  template: string,
  resolvedPath: string
): Record<string, string> {
  const paramNames = extractParamNames(template);
  const regex = new RegExp(`^${createTemplatePattern(template)}$`);
  const match = resolvedPath.match(regex);

  if (!match) return {};

  return Object.fromEntries(
    paramNames.map((name, index) => [name, match[index + 1] ?? ''])
  );
}

export function joinPaths(...segments: string[]): string {
  return (
    '/' +
    segments
      .map((segment) => segment.replace(/^\/+|\/+$/g, ''))
      .filter(Boolean)
      .join('/')
  );
}

export function build(
  template: string,
  params: Record<string, RouteParam>
): string {
  return buildPath(template, params);
}

export function getParamNames(template: string): string[] {
  return extractParamNames(template);
}
