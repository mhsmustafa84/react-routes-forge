// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTypedSearchParams } from "../../hooks";
import { routerWrapper } from "./hooks.test-utils";

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
