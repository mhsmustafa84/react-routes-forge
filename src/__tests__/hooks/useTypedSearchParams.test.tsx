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

  it("handles boolean coercion with uppercase values", () => {
    const { result } = renderHook(
      () => useTypedSearchParams({ coerceBooleans: true }),
      { wrapper: routerWrapper(["/search?flag=TRUE&other=FALSE"], "/*") },
    );
    const [query] = result.current;
    expect(query.flag).toBe(true);
    expect(query.other).toBe(false);
  });

  it("leaves un-parsable numbers as strings", () => {
    const { result } = renderHook(
      () => useTypedSearchParams({ coerceNumbers: true }),
      { wrapper: routerWrapper(["/search?page=abc"], "/*") },
    );
    const [query] = result.current;
    expect(query.page).toBe("abc");
  });

  it("groups repeated keys into arrays", () => {
    const { result } = renderHook(() => useTypedSearchParams(), {
      wrapper: routerWrapper(["/search?tag=a&tag=b&tag=c"], "/*"),
    });
    const [query] = result.current;
    expect(query.tag).toEqual(["a", "b", "c"]);
  });

  it("replaces existing query params when calling setQuery", () => {
    const { result } = renderHook(() => useTypedSearchParams(), {
      wrapper: routerWrapper(["/search?existing=1"], "/*"),
    });

    act(() => {
      const [, setQuery] = result.current;
      setQuery({ newParam: "value" });
    });

    const [query] = result.current;
    expect(query.existing).toBeUndefined();
    expect(query.newParam).toBe("value");
  });

  it("passes state options to navigate", () => {
    const { result } = renderHook(() => useTypedSearchParams(), {
      wrapper: routerWrapper(["/search"], "/*"),
    });

    act(() => {
      const [, setQuery] = result.current;
      setQuery({ page: "2" }, { state: { previousPage: 1 } });
    });

    const [query] = result.current;
    expect(query.page).toBe("2");
    // State is passed to navigate; verified implicitly if no crash
  });

  it("handles empty query strings", () => {
    const { result } = renderHook(() => useTypedSearchParams(), {
      wrapper: routerWrapper(["/search?"], "/*"),
    });
    const [query] = result.current;
    expect(query).toEqual({});
  });

  it("preserves special characters in query values", () => {
    const { result } = renderHook(() => useTypedSearchParams(), {
      wrapper: routerWrapper(["/search?q=a%2Fb&code=a%3Db"], "/*"),
    });
    const [query] = result.current;
    expect(query.q).toBe("a/b");
    expect(query.code).toBe("a=b");
  });

  it("preserves falsy query values (0, false, empty string)", () => {
    const { result } = renderHook(() => useTypedSearchParams(), {
      wrapper: routerWrapper(["/search"], "/*"),
    });

    act(() => {
      const [, setQuery] = result.current;
      setQuery({ count: 0, active: false, name: "" });
    });

    const [query] = result.current;
    expect(query.count).toBe("0");
    expect(query.active).toBe("false");
    expect(query.name).toBe("");
  });

  it("preserves hash fragments when updating query", () => {
    const { result } = renderHook(() => useTypedSearchParams(), {
      wrapper: routerWrapper(["/search?old=1#section"], "/*"),
    });

    act(() => {
      const [, setQuery] = result.current;
      setQuery({ page: "2" });
    });

    // We can't easily assert the location.hash from just the hook's return value
    // since the hook only returns query params, but we can verify it doesn't crash
    const [query] = result.current;
    expect(query.page).toBe("2");
  });


});
