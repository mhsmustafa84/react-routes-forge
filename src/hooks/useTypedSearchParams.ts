"use client";

import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { extractQueryFromPath } from "../core/query";
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
  if (typeof window === "undefined") {
    throw new Error(
      "useTypedSearchParams can only be used in browser environment. " +
        "Call this hook only in client components or after hydration.",
    );
  }
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = useMemo(
    () => extractQueryFromPath(location.search, options),
    [location.search, options],
  );

  const setTypedQuery = useCallback(
    (
      newQuery: QueryParams,
      navigateOptions?: { replace?: boolean; state?: unknown },
    ) => {
      const searchParams = new URLSearchParams();
      Object.entries(newQuery).forEach(([key, value]) => {
        if (!Object.prototype.hasOwnProperty.call(newQuery, key)) return;
        if (value === undefined || value === null) return;

        if (Array.isArray(value)) {
          value.forEach((v) => {
            if (v !== undefined && v !== null) {
              searchParams.append(key, String(v));
            }
          });
        } else {
          searchParams.append(key, String(value));
        }
      });

      const queryString = searchParams.toString();
      const prefix = queryString ? "?" : "";
      navigate(`${prefix}${queryString}${location.hash}`, navigateOptions);
    },
    [navigate, location.hash],
  );

  return [queryParams, setTypedQuery] as const;
}
