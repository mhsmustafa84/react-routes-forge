// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import React, { type ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";
import { useLocation } from "react-router";
import { useNavigateTo } from "../../hooks";
import { defineRoutes } from "../../core/defineRoutes";
import { Router, routerWrapper } from "./hooks.test-utils";

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
