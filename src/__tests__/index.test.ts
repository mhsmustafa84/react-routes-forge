/**
 * Tests for route-forge
 * Run with: npx vitest (or jest)
 */

import { describe, it, expect } from "vitest";
import {
  defineRoutes,
  buildPath,
  extractParamNames,
  isDynamic,
} from "../core/defineRoutes";
import {
  isActivePath,
  extractParamsFromPath,
  joinPaths,
  build,
  getParamNames,
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
