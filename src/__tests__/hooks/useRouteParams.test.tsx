// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import React, { type ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { Routes, Route } from "react-router";
import { useRouteParams } from "../../hooks";
import { defineRoutes } from "../../core/defineRoutes";
import { Router, routerWrapper } from "./hooks.test-utils";

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
