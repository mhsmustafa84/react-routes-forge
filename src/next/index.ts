import { useCallback, useMemo } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
  useParams,
} from "next/navigation";
import { isActivePath, extractQueryFromPath, appendQuery } from "../index";
import type { QueryParams, ExtractParams } from "../types";

/**
 * Checks if the current path matches the given template.
 */
export function useActivePath(
  template: string,
  options: { exact?: boolean; caseSensitive?: boolean } = {},
): boolean {

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
  const router = useRouter();

  return useMemo(() => {
    const navigateTo = (path: string, options?: NavigateOptions) => {
      const navOpts = options?.scroll !== undefined ? { scroll: options.scroll } : undefined;
      if (options?.replace) {
        router.replace(path, navOpts);
      } else {
        router.push(path, navOpts);
      }
    };
    
    navigateTo.prefetch = (
      path: string,
      options?: Parameters<ReturnType<typeof useRouter>["prefetch"]>[1]
    ) => {
      router.prefetch(path, options);
    };

    return navigateTo;
  }, [router]);
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

  return (useParams() as Record<string, string>) || {};
}

/**
 * Typed search params hook.
 */
export function useTypedSearchParams<T extends QueryParams = QueryParams>(options?: {
  coerceBooleans?: boolean;
  coerceNumbers?: boolean;
}) {

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const queryParams = useMemo(
    () =>
      extractQueryFromPath(
        searchParams ? "?" + searchParams.toString() : "",
        options,
      ) as T,
    [searchParams, options],
  );

  const setTypedQuery = useCallback(
    (
      newQuery: Partial<T> | QueryParams,
      navigateOptions?: { replace?: boolean; scroll?: boolean },
    ) => {
      const queryString = appendQuery("", newQuery as QueryParams);
      const prefix = queryString.startsWith("?") ? "" : (queryString ? "?" : "");
      
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
