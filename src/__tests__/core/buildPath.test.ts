import { describe, it, expect, vi } from "vitest";
import { buildPath, build, joinPaths } from "../../core/build";
import { getParamNames } from "../../core/params";
import { defineRoutes } from "../../core/defineRoutes";

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

  it("safely handles circular references in params without stack overflow", () => {
    const circular: any = { id: 1 };
    circular.self = circular;
    // It should extract id normally
    expect(buildPath("/items/:id", circular)).toBe("/items/1");
    // If the circular object is the param value itself
    expect(buildPath("/items/:ref", { ref: circular })).toBe("/items/%5Bobject%20Object%5D");
  });

  it("handles empty strings and whitespace param values", () => {
    expect(buildPath("/users/:name", { name: "" })).toBe("/users/");
    expect(buildPath("/users/:name", { name: "   " })).toBe("/users/%20%20%20");
    expect(buildPath("/users/:name", { name: "\n\t" })).toBe("/users/%0A%09");
  });

  it("handles boolean coercion to strings safely", () => {
    expect(buildPath("/items/:flag", { flag: true } as any)).toBe("/items/true");
    expect(buildPath("/items/:flag", { flag: false } as any)).toBe("/items/false");
  });
});

describe("locale support", () => {
  it("prepends the locale to the path", () => {
    expect(buildPath("/users/:id", { id: 1 }, undefined, { locale: "fr" })).toBe("/fr/users/1");
  });

  it("handles locale with leading slashes", () => {
    expect(buildPath("/users/:id", { id: 1 }, undefined, { locale: "/en-US/" })).toBe("/en-US/users/1");
  });

  it("handles locale with query parameters", () => {
    expect(buildPath("/search", {}, { q: "test" }, { locale: "de" })).toBe("/de/search?q=test");
  });
  
  it("handles locale with hash fragments", () => {
    expect(buildPath("/about", {}, undefined, { locale: "es", hash: "team" })).toBe("/es/about#team");
  });
});

describe("params with static suffixes", () => {
  it("buildPath resolves params before a static suffix", () => {
    expect(buildPath("/files/:name.json", { name: "report" })).toBe(
      "/files/report.json",
    );
    expect(buildPath("/users/:id-suffix", { id: 7 })).toBe("/users/7-suffix");
    expect(buildPath("/files/:name.json", { name: "a b" })).toBe(
      "/files/a%20b.json",
    );
  });

  it("buildPath keeps the suffix literal when the param is missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(buildPath("/files/:name.json", {})).toBe("/files/:name.json");
    warn.mockRestore();
  });

  it("defineRoutes .build() resolves params before a static suffix", () => {
    const PATHS = defineRoutes({ FILE: "/files/:name.json" } as const);
    expect(PATHS.FILE.build({ name: "report" })).toBe("/files/report.json");
    expect(String(PATHS.FILE)).toBe("/files/:name.json");
    expect((PATHS.FILE as any).paramNames).toEqual(["name"]);
  });
});

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

describe("build", () => {
  it("resolves a template with params", () => {
    expect(build("/roles/permissions/:name", { name: "admin" })).toBe(
      "/roles/permissions/admin",
    );
  });
});

describe("getParamNames", () => {
  it("returns param names", () => {
    expect(getParamNames("/users/:id/posts/:postId")).toEqual(["id", "postId"]);
  });

  it("returns empty array for static path", () => {
    expect(getParamNames("/users")).toEqual([]);
  });
});

describe("search query support in buildPath", () => {
  it("appends query parameters when passed as a separate argument in buildPath", () => {
    expect(
      buildPath("/users/:id", { id: 42 }, { tab: "profile", theme: "dark" }),
    ).toBe("/users/42?tab=profile&theme=dark");
  });

  it("supports array values in query parameters", () => {
    expect(
      buildPath("/users/:id", { id: 42 }, { tags: ["admin", "moderator"] }),
    ).toBe("/users/42?tags=admin&tags=moderator");
  });

  it("ignores undefined and null values in query parameters", () => {
    expect(
      buildPath(
        "/users/:id",
        { id: 42 },
        { tab: null, theme: undefined, ref: "home" },
      ),
    ).toBe("/users/42?ref=home");
  });

  it("supports building dynamic routes with search query in defineRoutes", () => {
    const PATHS = defineRoutes({
      USERS: "/users/:id",
    } as const);

    expect(PATHS.USERS.build({ id: 100 }, { filter: "active" })).toBe(
      "/users/100?filter=active",
    );
  });
});

describe("hash fragment support", () => {
  it("appends a hash to a static path via buildPath options", () => {
    expect(buildPath("/users", {}, undefined, { hash: "section" })).toBe(
      "/users#section",
    );
  });

  it("appends a hash after the query string", () => {
    expect(
      buildPath("/users/:id", { id: 42 }, { tab: "info" }, { hash: "details" }),
    ).toBe("/users/42?tab=info#details");
  });

  it("appends a hash without query string", () => {
    expect(buildPath("/users/:id", { id: 7 }, undefined, { hash: "top" })).toBe(
      "/users/7#top",
    );
  });

  it("works with defineRoutes fluent .build()", () => {
    const PATHS = defineRoutes({
      USERS: "/users/:id",
    } as const);

    expect(PATHS.USERS.build({ id: 5 }, undefined, { hash: "profile" })).toBe(
      "/users/5#profile",
    );
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
    expect(
      buildPath("/users/:id", { id: 1 }, undefined, { strict: true }),
    ).toBe("/users/1");
  });

  it("build() standalone supports hash option", () => {
    expect(build("/users/:id", { id: 3 }, undefined, { hash: "edit" })).toBe(
      "/users/3#edit",
    );
  });
});

describe("optional param segments (:param?)", () => {
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

  it("buildPath works with optional param in defineRoutes", () => {
    const PATHS = defineRoutes({
      USERS: "/users/:id?",
    } as const);

    expect(PATHS.USERS.build({ id: 42 })).toBe("/users/42");
  });
});

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
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Unresolved params"),
    );
    warn.mockRestore();
  });

  it("URL-encodes parameter values by default", () => {
    expect(buildPath("/search/:query", { query: "a:b" })).toBe("/search/a%3Ab");
    expect(buildPath("/search/:query", { query: "a/b" })).toBe("/search/a%2Fb");
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
    const path = buildPath("/search/:query", { query: "a:b" }, undefined, {
      strict: true,
    });
    expect(path).toBe("/search/a%3Ab");
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("build() strict mode (standalone helper)", () => {
  it("proxies strict option through to buildPath", () => {
    expect(() =>
      build("/items/:id", {}, undefined, { strict: true }),
    ).toThrowError(RangeError);
  });
});

describe("splat (*) segments in buildPath", () => {
  it("buildPath resolves a splat value, preserving slashes", () => {
    expect(buildPath("/files/*", { "*": "a/b/c" })).toBe("/files/a/b/c");
  });

  it("buildPath encodes special characters in splat segments but not slashes", () => {
    expect(buildPath("/files/*", { "*": "a b/c?d" })).toBe(
      "/files/a%20b/c%3Fd",
    );
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
    expect(buildPath("/files/*", {}, undefined, { strict: true })).toBe(
      "/files",
    );
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
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
