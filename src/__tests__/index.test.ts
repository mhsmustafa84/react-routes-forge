import { describe, it, expect, vi } from "vitest";
import {
  defineRoutes,
  buildPath,
  extractParamNames,
  isDynamic,
} from "../core/defineRoutes";
import {
  isActivePath,
  extractParamsFromPath,
  matchPath,
  joinPaths,
  build,
  getParamNames,
  flattenRoutes,
} from "../core/utils";

// ─── defineRoutes ────────────────────────────────────────────────────────────

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

  it("preserves static paths as strings", () => {
    expect(PATHS.HOME).toBe("/");
    expect(PATHS.LOGIN).toBe("/login");
    expect(PATHS.USERS.ROOT).toBe("/users");
    expect(PATHS.USERS.ADD).toBe("/users/add");
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

  it("does not attach .build() to static paths", () => {
    expect((PATHS.HOME as any).build).toBeUndefined();
    expect((PATHS.USERS.ROOT as any).build).toBeUndefined();
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

    expect(PATHS.SERVICES.ROOT).toBe("/services");
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


// ─── buildPath ───────────────────────────────────────────────────────────────

describe("buildPath", () => {
  it("replaces a single param", () => {
    expect(buildPath("/users/:id", { id: 1 })).toBe("/users/1");
  });

  it("replaces multiple params", () => {
    expect(
      buildPath("/users/:userId/posts/:postId", { userId: 1, postId: 2 }),
    ).toBe("/users/1/posts/2");
  });

  it("coerces numbers to strings", () => {
    expect(buildPath("/items/:id", { id: 99 })).toBe("/items/99");
  });

  it("leaves static paths unchanged", () => {
    expect(buildPath("/users", {})).toBe("/users");
  });
});

// ─── extractParamNames ───────────────────────────────────────────────────────

describe("extractParamNames", () => {
  it("extracts a single param", () => {
    expect(extractParamNames("/users/:id")).toEqual(["id"]);
  });

  it("extracts multiple params", () => {
    expect(extractParamNames("/users/:userId/posts/:postId")).toEqual([
      "userId",
      "postId",
    ]);
  });

  it("returns empty array for static paths", () => {
    expect(extractParamNames("/users")).toEqual([]);
  });
});

// ─── isDynamic ───────────────────────────────────────────────────────────────

describe("isDynamic", () => {
  it("returns true for dynamic paths", () => {
    expect(isDynamic("/users/:id")).toBe(true);
  });

  it("returns false for static paths", () => {
    expect(isDynamic("/users")).toBe(false);
  });
});

// ─── isActivePath ────────────────────────────────────────────────────────────

describe("isActivePath", () => {
  it("matches exact dynamic paths", () => {
    expect(isActivePath("/users/42", "/users/:id")).toBe(true);
  });

  it("does not match prefixes by default (exact mode)", () => {
    expect(isActivePath("/users/42/posts", "/users/:id")).toBe(false);
  });

  it("matches prefixes when exact is false", () => {
    expect(
      isActivePath("/users/42/posts", "/users/:id", { exact: false }),
    ).toBe(true);
  });

  it("matches static paths exactly", () => {
    expect(isActivePath("/users", "/users")).toBe(true);
    expect(isActivePath("/users/extra", "/users")).toBe(false);
  });
});

// ─── extractParamsFromPath ───────────────────────────────────────────────────

describe("extractParamsFromPath", () => {
  it("extracts a single param", () => {
    expect(extractParamsFromPath("/users/:id", "/users/42")).toEqual({
      id: "42",
    });
  });

  it("extracts multiple params", () => {
    expect(
      extractParamsFromPath(
        "/users/:userId/posts/:postId",
        "/users/1/posts/99",
      ),
    ).toEqual({ userId: "1", postId: "99" });
  });

  it("returns empty object when path does not match", () => {
    expect(extractParamsFromPath("/users/:id", "/roles/42")).toEqual({});
  });
});

// ─── matchPath ────────────────────────────────────────────────────────────────

describe("matchPath", () => {
  it("returns a RegExp from a static template", () => {
    const re = matchPath("/users");
    expect(re).toBeInstanceOf(RegExp);
  });

  it("returns a RegExp from a dynamic template", () => {
    const re = matchPath("/users/:id");
    expect(re).toBeInstanceOf(RegExp);
  });

  it("matches exact paths", () => {
    const re = matchPath("/users/:id");
    expect(re.test("/users/42")).toBe(true);
    expect(re.test("/users/42/posts")).toBe(false);
  });

  it("captures param values via exec", () => {
    const re = matchPath("/users/:id");
    const match = re.exec("/users/42");
    expect(match).not.toBeNull();
    expect(match![1]).toBe("42");
  });

  it("captures multiple params", () => {
    const re = matchPath("/users/:userId/posts/:postId");
    const match = re.exec("/users/1/posts/99");
    expect(match).not.toBeNull();
    expect(match![1]).toBe("1");
    expect(match![2]).toBe("99");
  });

  it("query strings are included in the captured value (caller strips ?query before matching)", () => {
    const re = matchPath("/users/:id");
    const match = re.exec("/users/42?tab=profile");
    expect(match![1]).toBe("42?tab=profile");
  });

  it("strips query string before matching for correct param extraction", () => {
    const pathname = "/users/42?tab=profile".split("?")[0];
    const re = matchPath("/users/:id");
    expect(re.test(pathname)).toBe(true);
    expect(re.exec(pathname)![1]).toBe("42");
  });

  it("works with optional param templates", () => {
    const re = matchPath("/users/:id?");
    expect(re.test("/users/42")).toBe(true);
  });

  it("does not match non-matching paths", () => {
    const re = matchPath("/users/:id");
    expect(re.test("/roles/42")).toBe(false);
    expect(re.test("/users/")).toBe(false);
  });

  it("returns a fresh RegExp each call (no lastIndex bleed)", () => {
    const re1 = matchPath("/users/:id");
    const re2 = matchPath("/users/:id");
    expect(re1).not.toBe(re2);
  });

  it("handles regex-special characters in static path segments", () => {
    const re = matchPath("/search/:query");
    expect(re.test("/search/foo.bar")).toBe(true);
    expect(re.test("/search/foo+bar")).toBe(true);
  });
});

// ─── joinPaths ───────────────────────────────────────────────────────────────

describe("joinPaths", () => {
  it("joins clean segments", () => {
    expect(joinPaths("/users", "edit", ":id")).toBe("/users/edit/:id");
  });

  it("normalises duplicate slashes", () => {
    expect(joinPaths("/api/", "/v1/", "/users")).toBe("/api/v1/users");
  });

  it("handles a single segment", () => {
    expect(joinPaths("users")).toBe("/users");
  });
});

// ─── build (standalone) ──────────────────────────────────────────────────────

describe("build", () => {
  it("resolves a template with params", () => {
    expect(build("/roles/permissions/:name", { name: "admin" })).toBe(
      "/roles/permissions/admin",
    );
  });
});

// ─── getParamNames ───────────────────────────────────────────────────────────

describe("getParamNames", () => {
  it("returns param names", () => {
    expect(getParamNames("/users/:id/posts/:postId")).toEqual(["id", "postId"]);
  });

  it("returns empty array for static path", () => {
    expect(getParamNames("/users")).toEqual([]);
  });
});

// ─── search query support ────────────────────────────────────────────────────

describe("search query support", () => {
  it("appends query parameters when passed as a separate argument in buildPath", () => {
    expect(buildPath("/users/:id", { id: 42 }, { tab: "profile", theme: "dark" })).toBe(
      "/users/42?tab=profile&theme=dark"
    );
  });

  it("supports array values in query parameters", () => {
    expect(buildPath("/users/:id", { id: 42 }, { tags: ["admin", "moderator"] })).toBe(
      "/users/42?tags=admin&tags=moderator"
    );
  });

  it("ignores undefined and null values in query parameters", () => {
    expect(buildPath("/users/:id", { id: 42 }, { tab: null, theme: undefined, ref: "home" })).toBe(
      "/users/42?ref=home"
    );
  });

  it("matches paths with query parameters in isActivePath", () => {
    expect(isActivePath("/users/42?tab=profile&theme=dark", "/users/:id")).toBe(true);
    expect(isActivePath("/users/42/posts?tab=profile", "/users/:id")).toBe(false);
    expect(isActivePath("/users/42/posts?tab=profile", "/users/:id", { exact: false })).toBe(true);
  });

  it("extracts params correctly from paths with query parameters", () => {
    expect(extractParamsFromPath("/users/:id", "/users/42?tab=profile&theme=dark")).toEqual({
      id: "42",
    });
  });

  it("supports building dynamic routes with search query in defineRoutes", () => {
    const PATHS = defineRoutes({
      USERS: "/users/:id",
    } as const);

    expect(PATHS.USERS.build({ id: 100 }, { filter: "active" })).toBe("/users/100?filter=active");
  });
});

// ─── flattenRoutes ────────────────────────────────────────────────────────────

describe("flattenRoutes", () => {
  const PATHS = defineRoutes({
    HOME: "/",
    LOGIN: "/login",
    USERS: {
      ROOT: "/users",
      EDIT: "/users/edit/:id",
    },
    SERVICES: {
      BCC: {
        EDIT: "/services/bcc/edit/:id",
      },
    },
  } as const);

  it("returns a flat array with one entry per leaf", () => {
    const flat = flattenRoutes(PATHS);
    expect(flat).toHaveLength(5);
  });

  it("uses dot-joined keys for nested groups", () => {
    const flat = flattenRoutes(PATHS);
    const keys = flat.map((r) => r.key);
    expect(keys).toContain("USERS.ROOT");
    expect(keys).toContain("USERS.EDIT");
    expect(keys).toContain("SERVICES.BCC.EDIT");
  });

  it("includes top-level leaves with no prefix", () => {
    const flat = flattenRoutes(PATHS);
    const keys = flat.map((r) => r.key);
    expect(keys).toContain("HOME");
    expect(keys).toContain("LOGIN");
  });

  it("resolves dynamic paths to their template string", () => {
    const flat = flattenRoutes(PATHS);
    const edit = flat.find((r) => r.key === "USERS.EDIT");
    expect(edit?.path).toBe("/users/edit/:id");
  });

  it("resolves static paths correctly", () => {
    const flat = flattenRoutes(PATHS);
    const home = flat.find((r) => r.key === "HOME");
    expect(home?.path).toBe("/");
  });

  it("can detect duplicate path strings across the tree", () => {
    const DUPED = defineRoutes({
      A: { FOO: "/foo" },
      B: { FOO: "/foo" },
    } as const);
    const flat = flattenRoutes(DUPED);
    const paths = flat.map((r) => r.path);
    const dupes = paths.filter((p, i) => paths.indexOf(p) !== i);
    expect(dupes).toEqual(["/foo"]);
  });

  it("accepts an optional prefix argument", () => {
    const flat = flattenRoutes({ ROOT: "/users", EDIT: "/users/edit/:id" }, "USERS");
    const keys = flat.map((r) => r.key);
    expect(keys).toContain("USERS.ROOT");
    expect(keys).toContain("USERS.EDIT");
  });
});

// ─── optional param segments (:param?) ────────────────────────────────────────

describe("optional param segments (:param?)", () => {
  it("extracts param name without trailing ?", () => {
    expect(extractParamNames("/users/:id?")).toEqual(["id"]);
  });

  it("extracts multiple optional params correctly", () => {
    expect(extractParamNames("/:a?/:b?")).toEqual(["a", "b"]);
  });

  it("mixes optional and required params", () => {
    expect(extractParamNames("/users/:id?/posts/:postId")).toEqual(["id", "postId"]);
  });

  it("buildPath resolves optional param when provided", () => {
    expect(buildPath("/users/:id?", { id: 42 })).toBe("/users/42");
  });

  it("buildPath leaves :param placeholder when optional param is missing", () => {
    expect(buildPath("/users/:id?", {})).toBe("/users/:id");
  });

  it("buildPath warns when optional param is missing (same warning as required)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    buildPath("/users/:id?", {});
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Unresolved params"));
    warn.mockRestore();
  });

  it("buildPath throws in strict mode when optional param is missing", () => {
    expect(() =>
      buildPath("/users/:id?", {}, undefined, { strict: true }),
    ).toThrowError(RangeError);
  });

  it("isDynamic returns true for paths with optional params", () => {
    expect(isDynamic("/users/:id?")).toBe(true);
  });

  it("buildPath works with optional param in defineRoutes", () => {
    const PATHS = defineRoutes({
      USERS: "/users/:id?",
    } as const);

    expect(PATHS.USERS.build({ id: 42 })).toBe("/users/42");
  });

  it("isActivePath matches optional param path", () => {
    expect(isActivePath("/users/42", "/users/:id?")).toBe(true);
  });

  it("extractParamsFromPath handles optional param syntax", () => {
    expect(extractParamsFromPath("/users/:id?", "/users/42")).toEqual({ id: "42" });
  });
});

// ─── buildPath strict mode ────────────────────────────────────────────────────

describe("buildPath strict mode", () => {
  it("throws a RangeError when a required param is missing", () => {
    expect(() =>
      buildPath("/users/:id", {}, undefined, { strict: true }),
    ).toThrowError(RangeError);
  });

  it("includes the param name in the error message", () => {
    expect(() =>
      buildPath("/users/:id", {}, undefined, { strict: true }),
    ).toThrowError(/\":id\"/);
  });

  it("throws with multiple missing params listed", () => {
    expect(() =>
      buildPath("/a/:x/b/:y", {}, undefined, { strict: true }),
    ).toThrowError(/\":x\".*\":y\"/);
  });

  it("does not throw when all params are supplied", () => {
    expect(() =>
      buildPath("/users/:id", { id: 42 }, undefined, { strict: true }),
    ).not.toThrow();
  });

  it("returns the resolved path when all params are supplied", () => {
    expect(
      buildPath("/users/:id", { id: 42 }, undefined, { strict: true }),
    ).toBe("/users/42");
  });

  it("still appends query strings in strict mode", () => {
    expect(
      buildPath("/users/:id", { id: 7 }, { tab: "info" }, { strict: true }),
    ).toBe("/users/7?tab=info");
  });

  it("emits console.warn (not throw) when strict is omitted and a param is missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    buildPath("/users/:id", {});
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Unresolved params"));
    warn.mockRestore();
  });

  it("handles parameter values containing colons without throwing or warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const path = buildPath("/search/:query", { query: "a:b" }, undefined, { strict: true });
    expect(path).toBe("/search/a:b");
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

// ─── build() strict mode (standalone helper) ─────────────────────────────────

describe("build() strict mode", () => {
  it("proxies strict option through to buildPath", () => {
    expect(() =>
      build("/items/:id", {}, undefined, { strict: true }),
    ).toThrowError(RangeError);
  });
});

