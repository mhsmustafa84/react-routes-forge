import { describe, it, expect, vi } from "vitest";
import { defineRoutes } from "../../core/defineRoutes";

describe("defineRoutes", () => {
  const PATHS = defineRoutes({
    HOME: "/",
    LOGIN: "/login",
    USERS: {
      ROOT: "/users",
      ADD: "/users/add",
      EDIT: "/users/edit/:id",
      DETAILS: "/users/:id",
    },
    ROLES: {
      PERMISSIONS: "/roles/permissions/:name",
    },
    MULTI: "/resource/:type/items/:itemId",
  } as const);

  it("preserves static paths as string-coercible objects with .build()", () => {
    expect(String(PATHS.HOME)).toBe("/");
    expect(String(PATHS.LOGIN)).toBe("/login");
    expect(String(PATHS.USERS.ROOT)).toBe("/users");
    expect(String(PATHS.USERS.ADD)).toBe("/users/add");
  });

  it("keeps dynamic paths coercible to their template string", () => {
    expect(String(PATHS.USERS.EDIT)).toBe("/users/edit/:id");
    expect(String(PATHS.USERS.DETAILS)).toBe("/users/:id");
  });

  it("attaches .build() to dynamic paths", () => {
    expect(typeof (PATHS.USERS.EDIT as any).build).toBe("function");
  });

  it("builds dynamic paths correctly", () => {
    expect((PATHS.USERS.EDIT as any).build({ id: 42 })).toBe("/users/edit/42");
    expect((PATHS.USERS.DETAILS as any).build({ id: "abc" })).toBe(
      "/users/abc",
    );
  });

  it("builds multi-param paths", () => {
    expect((PATHS.MULTI as any).build({ type: "posts", itemId: 99 })).toBe(
      "/resource/posts/items/99",
    );
  });

  it("builds paths with string params", () => {
    expect((PATHS.ROLES.PERMISSIONS as any).build({ name: "admin" })).toBe(
      "/roles/permissions/admin",
    );
  });

  it("exposes .paramNames on dynamic paths", () => {
    expect((PATHS.USERS.EDIT as any).paramNames).toEqual(["id"]);
    expect((PATHS.MULTI as any).paramNames).toEqual(["type", "itemId"]);
  });

  it("attaches .build() to static paths for query/hash support", () => {
    expect(typeof (PATHS.HOME as any).build).toBe("function");
    expect((PATHS.HOME as any).build({ tab: "info" })).toBe("/?tab=info");
  });

  it("handles nested route groups", () => {
    const PATHS = defineRoutes({
      SERVICES: {
        ROOT: "/services",
        BCC: {
          EDIT: "/services/bcc/edit/:id",
        },
      },
    } as const);

    expect(String(PATHS.SERVICES.ROOT)).toBe("/services");
    expect((PATHS.SERVICES.BCC.EDIT as any).build({ id: 7 })).toBe(
      "/services/bcc/edit/7",
    );
  });

  it("fluent .build() accepts { strict: true } and throws on missing params", () => {
    expect(() =>
      (PATHS.USERS.EDIT as any).build({}, undefined, { strict: true }),
    ).toThrowError(RangeError);
  });

  it("fluent .build() resolves correctly in strict mode when all params supplied", () => {
    expect(
      (PATHS.USERS.EDIT as any).build({ id: 5 }, undefined, { strict: true }),
    ).toBe("/users/edit/5");
  });
});

describe("defineRoutes validation", () => {
  it("warns when a route path does not start with /", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineRoutes({ LOGIN: "login" } as const);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("does not start with"),
    );
    warn.mockRestore();
  });

  it("does not warn when a param is followed by a static suffix", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineRoutes({ FILE: "/files/:name.json" } as const);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("warns on non-trailing splat usage", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineRoutes({ BAD: "/files/*/extra" } as const);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("trailing"));
    warn.mockRestore();
  });

  it("warns on duplicate path templates, naming both keys", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineRoutes({
      A: { FOO: "/foo" },
      B: { FOO: "/foo" },
    } as const);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Duplicate route path"),
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"/foo"'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("A.FOO"));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("B.FOO"));
    warn.mockRestore();
  });

  it("does not warn for valid route trees", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineRoutes({
      HOME: "/",
      USERS: { ROOT: "/users", EDIT: "/users/edit/:id" },
    } as const);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("does not treat arrays as route groups", () => {
    const routes = defineRoutes({ GOOD: "/ok", BAD: ["/a", "/b"] } as any);
    expect(String(routes.GOOD)).toBe("/ok");
    expect((routes as any).BAD).toBeUndefined();
  });

  it("does not treat class instances as route groups", () => {
    const routes = defineRoutes({ GOOD: "/ok", BAD: new Date() } as any);
    expect(String(routes.GOOD)).toBe("/ok");
    expect((routes as any).BAD).toBeUndefined();
  });

  it("suppresses warnings when NODE_ENV is production", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineRoutes({ A: "no-slash" } as const);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
    process.env.NODE_ENV = original;
  });
});
