// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useActivePath } from "../../hooks";
import { routerWrapper } from "./hooks.test-utils";

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
