import { useCallback, useMemo } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
  useParams,
} from "next/navigation";
import { isActivePath, extractQueryFromPath } from "../index";
import type { QueryParams, ExtractParams } from "../types";

/**
 * Checks if the current path matches the given template.
 */
export function useActivePath(
  template: string,
  options: { exact?: boolean; caseSensitive?: boolean } = {},
): boolean {
  if (typeof window === "undefined") {
    throw new Error(
      "useActivePath can only be used in browser environment. " +
        "Call this hook only in client components.",
    );
  }
  const pathname = usePathname();
  return useMemo(
    () => isActivePath(pathname || "/", template, options),
    [pathname, template, options.exact, options.caseSensitive],
  );
}

export type NavigateOptions = {
  replace?: boolean;
  scroll?: boolean;
};

/**
 * Returns a function to navigate to a new path.
 */
export function useNavigateTo() {
  if (typeof window === "undefined") {
    throw new Error(
      "useNavigateTo can only be used in browser environment. " +
        "Call this hook only in client components.",
    );
  }
  const router = useRouter();

  return useCallback(
    (path: string, options?: NavigateOptions) => {
      const navOpts = options?.scroll !== undefined ? { scroll: options.scroll } : undefined;
      if (options?.replace) {
        router.replace(path, navOpts);
      } else {
        router.push(path, navOpts);
      }
    },
    [router],
  );
}

/**
 * Extracts route parameters. Optionally strongly typed.
 */
export function useRouteParams<T extends string = string>(): Record<
  ExtractParams<T>,
  string
>;
export function useRouteParams<P extends string>(route: {
  readonly paramNames: ReadonlyArray<P> | Array<P>;
}): Record<P, string>;
export function useRouteParams<P extends string>(_route?: {
  readonly paramNames: ReadonlyArray<P> | Array<P>;
}): Record<string, string> {
  if (typeof window === "undefined") {
    throw new Error(
      "useRouteParams can only be used in browser environment. " +
        "Call this hook only in client components.",
    );
  }
  return (useParams() as Record<string, string>) || {};
}

/**
 * Typed search params hook.
 */
export function useTypedSearchParams(options?: {
  coerceBooleans?: boolean;
  coerceNumbers?: boolean;
}) {
  if (typeof window === "undefined") {
    throw new Error(
      "useTypedSearchParams can only be used in browser environment. " +
        "Call this hook only in client components.",
    );
  }
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const queryParams = useMemo(
    () =>
      extractQueryFromPath(
        searchParams ? "?" + searchParams.toString() : "",
        options,
      ),
    [searchParams, options],
  );

  const setTypedQuery = useCallback(
    (
      newQuery: QueryParams,
      navigateOptions?: { replace?: boolean; scroll?: boolean },
    ) => {
      const sp = new URLSearchParams();
      Object.entries(newQuery).forEach(([key, value]) => {
        if (!Object.prototype.hasOwnProperty.call(newQuery, key)) return;
        if (value === undefined || value === null) return;

        if (Array.isArray(value)) {
          value.forEach((v) => {
            if (v !== undefined && v !== null) {
              sp.append(key, String(v));
            }
          });
        } else {
          sp.append(key, String(value));
        }
      });

      const queryString = sp.toString();
      const prefix = queryString ? "?" : "";

      const newPath = `${pathname}${prefix}${queryString}`;
      const navOpts = navigateOptions?.scroll !== undefined ? { scroll: navigateOptions.scroll } : undefined;
      if (navigateOptions?.replace) {
        router.replace(newPath, navOpts);
      } else {
        router.push(newPath, navOpts);
      }
    },
    [router, pathname],
  );

  return [queryParams, setTypedQuery] as const;
}
