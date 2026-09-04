"use client";

import { useCallback } from "react";
import { useNavigate } from "react-router";

export type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

/**
 * A typed `navigate` helper that accepts a resolved path (output of `.build()`)
 * or a route value straight from `defineRoutes()` (e.g. a `String` object or a
 * primitive string), with optional navigation options.
 *
 * `String` objects (used by route values so they can carry `.build()`) are
 * coerced to primitives, since React Router's `navigate()` ignores them.
 *
 * @example
 * ```tsx
 * const navigateTo = useNavigateTo();
 * navigateTo(PATHS.USERS.EDIT.build({ id: 42 }));
 * navigateTo(PATHS.HOME, { replace: true });
 * ```
 */
export function useNavigateTo() {

  const navigate = useNavigate();

  return useCallback(
    (path: string, options?: NavigateOptions) => {
      navigate(String(path), options);
    },
    [navigate],
  );
}
