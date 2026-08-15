import { describe, it, expect } from "vitest";
import { flattenRoutes, getBreadcrumbs } from "../../core/routes";
import { defineRoutes } from "../../core/defineRoutes";

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
    const flat = flattenRoutes(
      { ROOT: "/users", EDIT: "/users/edit/:id" },
      "USERS",
    );
    const keys = flat.map((r) => r.key);
    expect(keys).toContain("USERS.ROOT");
    expect(keys).toContain("USERS.EDIT");
  });
});

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
    expect(crumbs[0]).toMatchObject({
      key: "HOME",
      label: "Home",
      path: "/",
      isCurrent: false,
    });
    expect(crumbs[1]).toMatchObject({
      key: "USERS.ROOT",
      label: "Users",
      path: "/users",
      isCurrent: false,
    });
    expect(crumbs[2]).toMatchObject({
      key: "USERS.EDIT",
      label: "Edit",
      path: "/users/edit/42",
      isCurrent: true,
    });
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

  it("uses the labels map for matching keys", () => {
    const crumbs = getBreadcrumbs(PATHS, "/users/edit/42", {
      labels: { "USERS.ROOT": "Members", "USERS.EDIT": "Edit member" },
    });

    expect(crumbs[0].label).toBe("Home");
    expect(crumbs[1].label).toBe("Members");
    expect(crumbs[2].label).toBe("Edit member");
  });

  it("labels map takes precedence over labelResolver", () => {
    const crumbs = getBreadcrumbs(PATHS, "/users/edit/42", {
      labels: { HOME: "Start" },
      labelResolver: (key) => key.toLowerCase(),
    });

    expect(crumbs[0].label).toBe("Start");
    expect(crumbs[1].label).toBe("USERS.ROOT".toLowerCase());
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

  // Regression: breadcrumb items were previously sorted by raw template
  // string length as a stand-in for hierarchy depth. That breaks whenever a
  // shallower route has a long param name and a deeper route has short
  // segment names — e.g. "/shop/:reallyLongCategorySlugName" (2 segments,
  // 33 chars) is shallower than "/shop/widgets/details" (3 segments, 21
  // chars), but the old length-based sort put the deeper, shorter-string
  // route first — and even after the "current page" entry.
  it("orders breadcrumbs by path depth, not by template string length", () => {
    const SHOP_PATHS = defineRoutes({
      SHOP_CATEGORY: "/shop/:reallyLongCategorySlugName",
      SHOP_ITEM_DETAILS: "/shop/widgets/details",
      SHOP_ITEM_DETAILS_ID: "/shop/widgets/details/:id",
    } as const);

    // Sanity check the premise: the shallower route's template is the
    // longer string, so a naive length-based sort would get this backwards.
    expect(SHOP_PATHS.SHOP_CATEGORY.length).toBeGreaterThan(
      SHOP_PATHS.SHOP_ITEM_DETAILS.length,
    );

    const crumbs = getBreadcrumbs(SHOP_PATHS, "/shop/widgets/details/42");

    expect(crumbs.map((c) => c.key)).toEqual([
      "SHOP_CATEGORY",
      "SHOP_ITEM_DETAILS",
      "SHOP_ITEM_DETAILS_ID",
    ]);
    expect(crumbs[crumbs.length - 1]!.isCurrent).toBe(true);
  });
});
