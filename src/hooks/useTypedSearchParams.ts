import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { appendQuery, extractQueryFromPath } from "../core/query";
import type { QueryParams } from "../types";

/**
 * A typed wrapper around React Router's `useSearchParams`.
 * Returns parsed query params object and a setter that updates query params.
 *
 * Implemented on top of `useLocation` + `useNavigate` (both exported by the
 * `react-router` core in v6 and v7) rather than `useSearchParams`, because in
 * React Router v6 `useSearchParams` only exists in the DOM wrapper package
 * (`react-router-dom`), while v7 moved it into `react-router`. Reimplementing
 * it lets the whole hooks entry work identically against both packages.
 *
 * @example
 * ```tsx
 * const [query, setQuery] = useTypedSearchParams({ coerceBooleans: true, coerceNumbers: true });
 * setQuery({ tab: 'details', page: 2 });
 * ```
 */
export function useTypedSearchParams(options?: {
  coerceBooleans?: boolean;
  coerceNumbers?: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = extractQueryFromPath(location.search, options);

  const setTypedQuery = useCallback(
    (
      newQuery: QueryParams,
      navigateOptions?: { replace?: boolean; state?: unknown },
    ) => {
      const updatedPath = appendQuery("", newQuery);
      const updatedSearchParams = new URLSearchParams(
        updatedPath.startsWith("?") ? updatedPath.slice(1) : updatedPath,
      );
      navigate(`?${updatedSearchParams.toString()}`, navigateOptions);
    },
    [navigate],
  );

  return [queryParams, setTypedQuery] as const;
}
