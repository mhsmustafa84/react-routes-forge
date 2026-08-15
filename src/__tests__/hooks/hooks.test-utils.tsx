// @vitest-environment jsdom
/**
 * Shared router scaffolding for the hook test suites.
 *
 * The React Router v7 behaviours are opted into so the suites run
 * warning-free: v7 made them the defaults and dropped the `future` prop from
 * its types, so it is injected via a spread — consumed by v6, inert on v7.
 */
import React, { type ReactNode } from "react";
import { MemoryRouter, Routes, Route } from "react-router";

export const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

export function Router({
  children,
  initialEntries,
}: {
  children: ReactNode;
  initialEntries: string[];
}) {
  return (
    <MemoryRouter
      initialEntries={initialEntries}
      {...({ future: routerFuture } as any)}
    >
      {children}
    </MemoryRouter>
  );
}

/** Wraps a hook in a MemoryRouter with an optional initial URL. */
export function routerWrapper(initialEntries: string[] = ["/"], routePath = "*") {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Router initialEntries={initialEntries}>
        <Routes>
          <Route path={routePath} element={<>{children}</>} />
        </Routes>
      </Router>
    );
  };
}
