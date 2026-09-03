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

  it("preserves static paths as genuine primitive strings with .build()", () => {
    expect(PATHS.HOME).toBe("/");
    expect(PATHS.LOGIN).toBe("/login");
    expect(PATHS.USERS.ROOT).toBe("/users");
    expect(PATHS.USERS.ADD).toBe("/users/add");
  });

  it("supports buildRelative on static paths", () => {
    expect(PATHS.HOME.buildRelative()).toBe(".");
    expect(PATHS.LOGIN.buildRelative()).toBe("login");
    expect(PATHS.USERS.ROOT.buildRelative()).toBe("users");
    expect(PATHS.USERS.ADD.buildRelative()).toBe("users/add");
  });

  it("supports buildRelative on dynamic paths", () => {
    expect(PATHS.USERS.EDIT.buildRelative({ id: 42 })).toBe("users/edit/42");
    expect(PATHS.USERS.DETAILS.buildRelative({ id: 99 })).toBe("users/99");
  });

  it("keeps dynamic paths as their template string", () => {
    expect(PATHS.USERS.EDIT).toBe("/users/edit/:id");
    expect(PATHS.USERS.DETAILS).toBe("/users/:id");
  });

  it("returns real primitive strings (typeof 'string', strict equality works)", () => {
    expect(typeof PATHS.HOME).toBe("string");
    expect(typeof PATHS.USERS.EDIT).toBe("string");
    expect(PATHS.HOME === "/").toBe(true);
    expect(PATHS.USERS.EDIT === "/users/edit/:id").toBe(true);
  });

  it("works directly anywhere a plain string is expected", () => {
    // Route values previously were String *objects* (typeof 'object'), which
    // broke code that branches on typeof === 'string' — e.g. React Router's
    // <Link to={...}> and internal resolveTo(). They are primitives now.
    expect(`prefix:${PATHS.USERS.EDIT}`).toBe("prefix:/users/edit/:id");
    expect(String.prototype.includes.call(PATHS.USERS.EDIT, ":id")).toBe(true);
    const map = new Map<string, string>([[PATHS.HOME, "root"]]);
    expect(map.get("/")).toBe("root");
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

  it("warns when a static route is shadowed by a dynamic route defined before it", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineRoutes({
      USERS: { DETAILS: "/users/:id", ME: "/users/me" },
    } as const);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("is shadowed by dynamic route"),
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("USERS.ME"));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("USERS.DETAILS"));
    warn.mockRestore();
  });

  it("does not warn when static routes come before the dynamic route", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineRoutes({
      USERS: { ME: "/users/me", DETAILS: "/users/:id" },
    } as const);
    expect(warn).not.toHaveBeenCalled();
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

  it("skips duplicate and shadowing detection entirely in production", () => {
    // Perf: detectDuplicatePaths is an O(n^2) walk that only produces
    // console.warn output — it's skipped when NODE_ENV is production.
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineRoutes({
      A: { FOO: "/foo" },
      B: { FOO: "/foo" },
      USERS: { DETAILS: "/users/:id", ME: "/users/me" },
    } as const);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
    process.env.NODE_ENV = original;
  });
});
