/**
 * Returns `true` when running in a production bundle (suppresses dev warnings).
 */
export function isProduction(): boolean {
  const runtimeProcess = (
    globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process;
  return runtimeProcess?.env?.NODE_ENV === "production";
}

/**
 * Emits a `console.warn` in non-production environments.
 * Shared by the core utilities and `defineRoutes()` so the production check
 * lives in one place.
 */
export function devWarn(message: string): void {
  if (!isProduction()) {
    console.warn(message);
  }
}
