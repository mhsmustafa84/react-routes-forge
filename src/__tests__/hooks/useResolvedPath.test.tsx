// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useResolvedPath } from "../../hooks";
import { routerWrapper } from "./hooks.test-utils";

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
