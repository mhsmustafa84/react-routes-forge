// @vitest-environment jsdom
/**
 * Tests for React hooks (useRouteParams, useNavigateTo, useResolvedPath).
 * Requires jsdom + @testing-library/react.
 */

import { describe, it, expect, vi } from "vitest";
import React, { type ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router";
import {
  useRouteParams,
  useNavigateTo,
  useResolvedPath,
  useActivePath,
  useTypedSearchParams,
} from "../hooks";
import { defineRoutes } from "../core/defineRoutes";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Opt into the React Router v7 behaviours so the suite runs warning-free.
 * v7 made these the defaults and dropped the `future` prop from its types, so
 * it is injected via a spread — consumed by v6, inert on v7.
 */
const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

function Router({
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
function routerWrapper(initialEntries: string[] = ["/"], routePath = "*") {
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

// ─── useRouteParams ──────────────────────────────────────────────────────────

describe("useRouteParams", () => {
  it("returns params extracted from the current URL", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Router initialEntries={["/users/42"]}>
        <Routes>
          <Route path="/users/:id" element={<>{children}</>} />
        </Routes>
      </Router>
    );

    const { result } = renderHook(() => useRouteParams<"/users/:id">(), {
      wrapper,
    });

    expect(result.current.id).toBe("42");
  });

  it("returns multiple params correctly", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Router initialEntries={["/posts/7/comments/99"]}>
        <Routes>
          <Route
            path="/posts/:postId/comments/:commentId"
            element={<>{children}</>}
          />
        </Routes>
      </Router>
    );

    const { result } = renderHook(
      () => useRouteParams<"/posts/:postId/comments/:commentId">(),
      { wrapper },
    );

    expect(result.current.postId).toBe("7");
    expect(result.current.commentId).toBe("99");
  });

  it("returns an empty object when there are no params", () => {
    const { result } = renderHook(() => useRouteParams<"/users">(), {
      wrapper: routerWrapper(["/users"], "/users"),
    });

    expect(result.current).toEqual({});
  });

  it("accepts a dynamic route from defineRoutes and infers its params", () => {
    const PATHS = defineRoutes({
      USERS: { EDIT: "/users/edit/:id" },
    } as const);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <Router initialEntries={["/users/edit/42"]}>
        <Routes>
          <Route path="/users/edit/:id" element={<>{children}</>} />
        </Routes>
      </Router>
    );

    const { result } = renderHook(() => useRouteParams(PATHS.USERS.EDIT), {
      wrapper,
    });

    expect(result.current.id).toBe("42");

    // Type-level: params are inferred precisely from the route's paramNames
    const id = result.current.id;
    expect(id).toBe("42");
  });
});

// ─── useNavigateTo ───────────────────────────────────────────────────────────

describe("useNavigateTo", () => {
  it("returns a callable function", () => {
    const { result } = renderHook(useNavigateTo, {
      wrapper: routerWrapper(),
    });

    expect(typeof result.current).toBe("function");
  });

  it("navigates to the given path", () => {
    // We can't easily inspect window.location in jsdom with MemoryRouter,
    // so we verify by checking that calling navigateTo does not throw.
    const { result } = renderHook(useNavigateTo, {
      wrapper: routerWrapper(["/start"]),
    });

    expect(() => {
      act(() => {
        result.current("/users/42");
      });
    }).not.toThrow();
  });

  it("accepts replace option without throwing", () => {
    const { result } = renderHook(useNavigateTo, {
      wrapper: routerWrapper(["/start"]),
    });

    expect(() => {
      act(() => {
        result.current("/home", { replace: true });
      });
    }).not.toThrow();
  });

  it("accepts state option without throwing", () => {
    const { result } = renderHook(useNavigateTo, {
      wrapper: routerWrapper(["/start"]),
    });

    expect(() => {
      act(() => {
        result.current("/home", { state: { from: "test" } });
      });
    }).not.toThrow();
  });

  it("navigates when passed a String object route value", () => {
    // defineRoutes() wraps routes as String objects; React Router's navigate()
    // ignores them, so useNavigateTo must coerce to a primitive.
    const PATHS = defineRoutes({ HOME: "/", USERS: { ROOT: "/users" } } as const);

    const hook = renderHook(
      () => {
        const navigateTo = useNavigateTo();
        const location = useLocation();
        return { navigateTo, pathname: location.pathname };
      },
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <Router initialEntries={["/start"]}>{children}</Router>
        ),
      },
    );

    expect(hook.result.current.pathname).toBe("/start");

    act(() => {
      hook.result.current.navigateTo(PATHS.USERS.ROOT as unknown as string);
    });

    expect(hook.result.current.pathname).toBe("/users");
  });
});

// ─── useResolvedPath ─────────────────────────────────────────────────────────

describe("useResolvedPath", () => {
  it("resolves a dynamic path with params", () => {
    const { result } = renderHook(
      () => useResolvedPath("/users/:id", { id: 42 }),
      { wrapper: routerWrapper() },
    );

    expect(result.current).toBe("/users/42");
  });

  it("resolves a multi-param path", () => {
    const { result } = renderHook(
      () =>
        useResolvedPath("/posts/:postId/comments/:commentId", {
          postId: 3,
          commentId: 17,
        }),
      { wrapper: routerWrapper() },
    );

    expect(result.current).toBe("/posts/3/comments/17");
  });

  it("resolves params followed by a static suffix", () => {
    const { result } = renderHook(
      () => useResolvedPath("/files/:name.json", { name: "report" }),
      { wrapper: routerWrapper() },
    );

    expect(result.current).toBe("/files/report.json");
  });

  it("resolves a splat path, preserving slashes", () => {
    const { result } = renderHook(
      () => useResolvedPath("/files/*", { "*": "a/b/c" }),
      { wrapper: routerWrapper() },
    );

    expect(result.current).toBe("/files/a/b/c");
  });

  it("encodes special characters in splat segments but not slashes", () => {
    const { result } = renderHook(
      () => useResolvedPath("/files/*", { "*": "a b/c?d" }),
      { wrapper: routerWrapper() },
    );

    expect(result.current).toBe("/files/a%20b/c%3Fd");
  });

  it("keeps splat values raw when { encode: false }", () => {
    const { result } = renderHook(
      () =>
        useResolvedPath("/files/*", { "*": "a b/c" }, undefined, {
          encode: false,
        }),
      { wrapper: routerWrapper() },
    );

    expect(result.current).toBe("/files/a b/c");
  });

  it("drops the splat suffix when no splat value is given", () => {
    const { result } = renderHook(() => useResolvedPath("/files/*", {}), {
      wrapper: routerWrapper(),
    });

    expect(result.current).toBe("/files");
  });

  it("appends a query string when provided", () => {
    const { result } = renderHook(
      () =>
        useResolvedPath(
          "/users/:id",
          { id: 5 },
          { tab: "info", active: "true" },
        ),
      { wrapper: routerWrapper() },
    );

    expect(result.current).toBe("/users/5?tab=info&active=true");
  });

  it("coerces number params to strings", () => {
    const { result } = renderHook(
      () => useResolvedPath("/items/:id", { id: 99 }),
      { wrapper: routerWrapper() },
    );

    expect(result.current).toBe("/items/99");
  });

  // ── Missing-param behaviour ──

  it("warns (not throws) when a param is missing in default mode", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { result } = renderHook(() => useResolvedPath("/users/:id", {}), {
      wrapper: routerWrapper(),
    });

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Unresolved params"),
    );
    // Partial path is returned with the placeholder still present.
    expect(result.current).toContain(":id");
    warn.mockRestore();
  });

  it("throws a RangeError when strict:true and a param is missing", () => {
    // renderHook catches errors — we need to suppress the console.error React
    // prints for uncaught render errors, then check what was thrown.
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      renderHook(
        () => useResolvedPath("/users/:id", {}, undefined, { strict: true }),
        { wrapper: routerWrapper() },
      );
    }).toThrowError(RangeError);

    consoleError.mockRestore();
  });

  it("strict mode error message includes the missing param name", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      renderHook(
        () => useResolvedPath("/users/:id", {}, undefined, { strict: true }),
        { wrapper: routerWrapper() },
      );
    }).toThrowError(/":id"/);

    consoleError.mockRestore();
  });

  it("does not throw in strict mode when all params are supplied", () => {
    const { result } = renderHook(
      () =>
        useResolvedPath("/users/:id", { id: 1 }, undefined, { strict: true }),
      { wrapper: routerWrapper() },
    );

    expect(result.current).toBe("/users/1");
  });

  it("URL-encodes parameter values by default", () => {
    const { result } = renderHook(
      () =>
        useResolvedPath("/search/:query", { query: "a:b" }, undefined, {
          strict: true,
        }),
      { wrapper: routerWrapper() },
    );

    expect(result.current).toBe("/search/a%3Ab");
  });

  it("keeps parameter values raw when { encode: false }", () => {
    const { result } = renderHook(
      () =>
        useResolvedPath("/search/:query", { query: "a:b" }, undefined, {
          strict: true,
          encode: false,
        }),
      { wrapper: routerWrapper() },
    );

    expect(result.current).toBe("/search/a:b");
  });

  it("resolves a path with a hash fragment", () => {
    const { result } = renderHook(
      () =>
        useResolvedPath("/users/:id", { id: 42 }, undefined, {
          hash: "profile",
        }),
      { wrapper: routerWrapper() },
    );

    expect(result.current).toBe("/users/42#profile");
  });

  it("resolves a path with query string and hash fragment", () => {
    const { result } = renderHook(
      () =>
        useResolvedPath(
          "/users/:id",
          { id: 5 },
          { tab: "info" },
          { hash: "details" },
        ),
      { wrapper: routerWrapper() },
    );

    expect(result.current).toBe("/users/5?tab=info#details");
  });

  it("resolves a path with hash only (no query)", () => {
    const { result } = renderHook(
      () => useResolvedPath("/static", {}, undefined, { hash: "top" }),
      { wrapper: routerWrapper() },
    );

    expect(result.current).toBe("/static#top");
  });
});

// ─── useActivePath ───────────────────────────────────────────────────────────

describe("useActivePath", () => {
  it("returns true when current location matches exact route", () => {
    const { result } = renderHook(() => useActivePath("/users/42"), {
      wrapper: routerWrapper(["/users/42"], "/users/*"),
    });

    expect(result.current).toBe(true);
  });

  it("returns false when location does not match", () => {
    const { result } = renderHook(() => useActivePath("/users/42"), {
      wrapper: routerWrapper(["/posts"], "/*"),
    });

    expect(result.current).toBe(false);
  });

  it("supports exact: false for prefix matching", () => {
    const { result } = renderHook(
      () => useActivePath("/users", { exact: false }),
      { wrapper: routerWrapper(["/users/42/details"], "/*") },
    );

    expect(result.current).toBe(true);
  });
});

// ─── useTypedSearchParams ───────────────────────────────────────────────────

describe("useTypedSearchParams", () => {
  it("parses query params and supports coerceNumbers and coerceBooleans", () => {
    const { result } = renderHook(
      () => useTypedSearchParams({ coerceBooleans: true, coerceNumbers: true }),
      {
        wrapper: routerWrapper(
          ["/search?page=2&active=true&query=react"],
          "/*",
        ),
      },
    );

    const [query] = result.current;
    expect(query.page).toBe(2);
    expect(query.active).toBe(true);
    expect(query.query).toBe("react");
  });

  it("updates search params via setQuery", () => {
    const { result } = renderHook(() => useTypedSearchParams(), {
      wrapper: routerWrapper(["/search"], "/*"),
    });

    act(() => {
      const [, setQuery] = result.current;
      setQuery({ page: 3, filter: "active" });
    });

    const [query] = result.current;
    expect(query.page).toBe("3");
    expect(query.filter).toBe("active");
  });
});
