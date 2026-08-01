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
  getBreadcrumbs,
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

  it("ignores literal colons inside a segment", () => {
    expect(extractParamNames("/users/foo:bar")).toEqual([]);
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

  it("returns false for literal colons inside a segment", () => {
    expect(isDynamic("/users/foo:bar")).toBe(false);
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

  it("does not treat similar-prefix paths as matches", () => {
    expect(isActivePath("/usersettings", "/users", { exact: false })).toBe(
      false,
    );
    expect(isActivePath("/users-edit", "/users", { exact: false })).toBe(false);
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

  it("decodes URL-encoded params back to their original values", () => {
    expect(extractParamsFromPath("/search/:query", "/search/a%2Fb")).toEqual({
      query: "a/b",
    });
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
    expect(re.test("/users")).toBe(true);
  });

  it("matches paths with optional params in the middle", () => {
    const re = matchPath("/users/:id?/posts/:postId");
    expect(re.test("/users/7/posts/1")).toBe(true);
    expect(re.test("/users/posts/1")).toBe(true);
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

// ─── hash fragment support ────────────────────────────────────────────────────

describe("hash fragment support", () => {
  it("appends a hash to a static path via buildPath options", () => {
    expect(buildPath("/users", {}, undefined, { hash: "section" })).toBe("/users#section");
  });

  it("appends a hash after the query string", () => {
    expect(
      buildPath("/users/:id", { id: 42 }, { tab: "info" }, { hash: "details" }),
    ).toBe("/users/42?tab=info#details");
  });

  it("appends a hash without query string", () => {
    expect(
      buildPath("/users/:id", { id: 7 }, undefined, { hash: "top" }),
    ).toBe("/users/7#top");
  });

  it("works with defineRoutes fluent .build()", () => {
    const PATHS = defineRoutes({
      USERS: "/users/:id",
    } as const);

    expect(PATHS.USERS.build({ id: 5 }, undefined, { hash: "profile" })).toBe("/users/5#profile");
  });

  it("works with defineRoutes fluent .build() with query + hash", () => {
    const PATHS = defineRoutes({
      SEARCH: "/search/:q",
    } as const);

    expect(
      PATHS.SEARCH.build({ q: "hello" }, { page: "1" }, { hash: "results" }),
    ).toBe("/search/hello?page=1#results");
  });

  it("does not add hash when options has no hash", () => {
    expect(buildPath("/users/:id", { id: 1 })).toBe("/users/1");
    expect(buildPath("/users/:id", { id: 1 }, undefined, { strict: true })).toBe("/users/1");
  });

  it("build() standalone supports hash option", () => {
    expect(build("/users/:id", { id: 3 }, undefined, { hash: "edit" })).toBe("/users/3#edit");
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

  it("buildPath drops the segment when an optional param is missing", () => {
    expect(buildPath("/users/:id?", {})).toBe("/users");
  });

  it("buildPath does not warn when an optional param is missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    buildPath("/users/:id?", {});
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("buildPath does not throw in strict mode when an optional param is missing", () => {
    expect(buildPath("/users/:id?", {}, undefined, { strict: true })).toBe(
      "/users",
    );
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
    ).toThrowError(/":id"/);
  });

  it("throws with multiple missing params listed", () => {
    expect(() =>
      buildPath("/a/:x/b/:y", {}, undefined, { strict: true }),
    ).toThrowError(/":x".*":y"/);
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

  it("URL-encodes parameter values by default", () => {
    expect(buildPath("/search/:query", { query: "a:b" })).toBe(
      "/search/a%3Ab",
    );
    expect(buildPath("/search/:query", { query: "a/b" })).toBe(
      "/search/a%2Fb",
    );
  });

  it("keeps parameter values raw when { encode: false }", () => {
    expect(
      buildPath("/search/:query", { query: "a:b" }, undefined, {
        encode: false,
      }),
    ).toBe("/search/a:b");
  });

  it("handles parameter values containing colons without throwing or warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const path = buildPath(
      "/search/:query",
      { query: "a:b" },
      undefined,
      { strict: true },
    );
    expect(path).toBe("/search/a%3Ab");
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

// ─── splat (*) segments ──────────────────────────────────────────────────────

describe("splat (*) segments", () => {
  it("extracts the splat param as *", () => {
    expect(extractParamNames("/files/*")).toEqual(["*"]);
  });

  it("extracts named params followed by a splat", () => {
    expect(extractParamNames("/users/:id/files/*")).toEqual(["id", "*"]);
  });

  it("isDynamic returns true for splat paths", () => {
    expect(isDynamic("/files/*")).toBe(true);
    expect(isDynamic("/*")).toBe(true);
  });

  it("buildPath resolves a splat value, preserving slashes", () => {
    expect(buildPath("/files/*", { "*": "a/b/c" })).toBe("/files/a/b/c");
  });

  it("buildPath encodes special characters in splat segments but not slashes", () => {
    expect(buildPath("/files/*", { "*": "a b/c?d" })).toBe("/files/a%20b/c%3Fd");
  });

  it("buildPath keeps splat values raw when { encode: false }", () => {
    expect(
      buildPath("/files/*", { "*": "a b/c" }, undefined, { encode: false }),
    ).toBe("/files/a b/c");
  });

  it("buildPath drops the splat suffix when no value is given", () => {
    expect(buildPath("/files/*", {})).toBe("/files");
    expect(buildPath("/*", {})).toBe("/");
  });

  it("does not warn or throw in strict mode when the splat is missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(buildPath("/files/*", {}, undefined, { strict: true })).toBe("/files");
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("matchPath matches splat paths and captures the remainder", () => {
    const re = matchPath("/files/*");
    expect(re.test("/files/a/b")).toBe(true);
    expect(re.test("/files")).toBe(true);
    expect(re.exec("/files/a/b")![1]).toBe("a/b");
  });

  it("matchPath on a bare splat matches everything", () => {
    const re = matchPath("/*");
    expect(re.test("/")).toBe(true);
    expect(re.test("/anything/here")).toBe(true);
    expect(re.exec("/anything/here")![1]).toBe("anything/here");
  });

  it("isActivePath matches splat paths", () => {
    expect(isActivePath("/files/a/b", "/files/*")).toBe(true);
    expect(isActivePath("/files", "/files/*")).toBe(true);
    expect(isActivePath("/other", "/files/*")).toBe(false);
  });

  it("extractParamsFromPath returns the splat remainder", () => {
    expect(extractParamsFromPath("/files/*", "/files/a/b/c")).toEqual({
      "*": "a/b/c",
    });
  });

  it("works with splat paths in defineRoutes", () => {
    const PATHS = defineRoutes({
      FILES: "/files/*",
      USERS: "/users/:id/files/*",
    } as const);

    expect(PATHS.FILES.build({ "*": "x/y" })).toBe("/files/x/y");
    expect(PATHS.USERS.build({ id: 7, "*": "a/b" })).toBe("/users/7/files/a/b");
    expect(String(PATHS.FILES)).toBe("/files/*");
    expect((PATHS.FILES as any).paramNames).toEqual(["*"]);
    expect((PATHS.USERS as any).paramNames).toEqual(["id", "*"]);
  });

  it("types splat params at compile time", () => {
    const PATHS = defineRoutes({
      FILES: "/files/*",
    } as const);

    PATHS.FILES.build({ "*": "a/b" });
    // @ts-expect-error - build() requires the "*" splat param
    PATHS.FILES.build({});
  });
});

// ─── getBreadcrumbs ───────────────────────────────────────────────────────────

describe("getBreadcrumbs", () => {
  const PATHS = defineRoutes({
    HOME: "/",
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

  it("returns breadcrumbs for a nested dynamic path", () => {
    const crumbs = getBreadcrumbs(PATHS, "/users/edit/42");

    expect(crumbs).toHaveLength(3);
    expect(crumbs[0]).toMatchObject({ key: "HOME", label: "Home", path: "/", isCurrent: false });
    expect(crumbs[1]).toMatchObject({ key: "USERS.ROOT", label: "Users", path: "/users", isCurrent: false });
    expect(crumbs[2]).toMatchObject({ key: "USERS.EDIT", label: "Edit", path: "/users/edit/42", isCurrent: true });
  });

  it("includes ancestor routes via prefix matching", () => {
    const crumbs = getBreadcrumbs(PATHS, "/services/bcc/edit/99");

    // Only HOME matches as prefix — no intermediate route for /services/bcc
    expect(crumbs).toHaveLength(2);
    expect(crumbs[0].key).toBe("HOME");
    expect(crumbs[0].isCurrent).toBe(false);
    expect(crumbs[1].key).toBe("SERVICES.BCC.EDIT");
    expect(crumbs[1].isCurrent).toBe(true);
  });

  it("marks only the deepest match as isCurrent", () => {
    const crumbs = getBreadcrumbs(PATHS, "/users/edit/42");
    const current = crumbs.filter((c) => c.isCurrent);
    expect(current).toHaveLength(1);
    expect(current[0].key).toBe("USERS.EDIT");
  });

  it("handles static paths (no params)", () => {
    const crumbs = getBreadcrumbs(PATHS, "/users");

    expect(crumbs).toHaveLength(2);
    expect(crumbs[0].key).toBe("HOME");
    expect(crumbs[1].key).toBe("USERS.ROOT");
    expect(crumbs[1].path).toBe("/users");
    expect(crumbs[1].isCurrent).toBe(true);
  });

  it("returns one item for the root path", () => {
    const crumbs = getBreadcrumbs(PATHS, "/");
    expect(crumbs).toHaveLength(1);
    expect(crumbs[0].key).toBe("HOME");
    expect(crumbs[0].isCurrent).toBe(true);
  });

  it("accepts a pre-flattened route array", () => {
    const flat = flattenRoutes(PATHS);
    const crumbs = getBreadcrumbs(flat, "/users/edit/7");

    expect(crumbs).toHaveLength(3);
    expect(crumbs[0].key).toBe("HOME");
    expect(crumbs[1].key).toBe("USERS.ROOT");
    expect(crumbs[2].key).toBe("USERS.EDIT");
  });

  it("ignores query strings", () => {
    const crumbs = getBreadcrumbs(PATHS, "/users/edit/42?tab=info");
    expect(crumbs).toHaveLength(3);
    expect(crumbs[2].path).toBe("/users/edit/42");
  });

  it("uses custom labelResolver when provided", () => {
    const crumbs = getBreadcrumbs(PATHS, "/users/edit/42", {
      labelResolver: (key) => key.toUpperCase(),
    });

    expect(crumbs[0].label).toBe("HOME");
    expect(crumbs[1].label).toBe("USERS.ROOT");
    expect(crumbs[2].label).toBe("USERS.EDIT");
  });

  it("returns empty array when no routes match", () => {
    const crumbs = getBreadcrumbs(PATHS, "/nonexistent");
    expect(crumbs).toHaveLength(1);
    expect(crumbs[0].key).toBe("HOME");
  });

  it("does not treat similar-prefix paths as ancestors", () => {
    const crumbs = getBreadcrumbs(PATHS, "/usersettings");
    expect(crumbs.map((c) => c.key)).toEqual(["HOME"]);
  });
});

