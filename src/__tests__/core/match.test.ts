import { describe, it, expect } from "vitest";
import { isActivePath } from "../../core/match";

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

  it("is case-insensitive by default (NavLink semantics)", () => {
    expect(isActivePath("/Users/42", "/users/:id")).toBe(true);
    expect(isActivePath("/USERS", "/users")).toBe(true);
  });

  it("respects caseSensitive when enabled", () => {
    expect(
      isActivePath("/Users/42", "/users/:id", { caseSensitive: true }),
    ).toBe(false);
    expect(
      isActivePath("/users/42", "/users/:id", { caseSensitive: true }),
    ).toBe(true);
  });

  // Regression: JS default parameters only apply when the whole `options`
  // argument is omitted. A naive `options = { exact: true, ... }` default
  // silently loses `exact: true` the moment a caller passes ANY partial
  // options object (e.g. only `{ caseSensitive: true }`), because the
  // caller's object replaces the default wholesale instead of merging with
  // it — `options.exact` then reads as `undefined`, which is falsy, and the
  // function silently falls back to prefix matching instead of the
  // documented exact-match default.
  it("still defaults to exact matching when a partial options object omits `exact`", () => {
    // Extra "/posts" segment must break an exact match — this must stay
    // false whether or not other option properties are also passed.
    expect(
      isActivePath("/users/42/posts", "/users/:id", { caseSensitive: true }),
    ).toBe(false);
    expect(
      isActivePath("/users/42/posts", "/users/:id", { caseSensitive: false }),
    ).toBe(false);
    // Must match the fully-defaulted (no options at all) result exactly.
    expect(
      isActivePath("/users/42/posts", "/users/:id", { caseSensitive: true }),
    ).toBe(isActivePath("/users/42/posts", "/users/:id"));
  });

  // Regression: the exact-match branch previously called matchPath(target)
  // without forwarding `caseSensitive`, so matchPath fell back to its own
  // default (case-insensitive) regardless of what the caller requested.
  // caseSensitive:true had no effect at all when exact:true was also set.
  it("respects caseSensitive:true specifically in exact-match mode", () => {
    expect(
      isActivePath("/Users/1", "/users/:id", {
        exact: true,
        caseSensitive: true,
      }),
    ).toBe(false);
    expect(
      isActivePath("/users/1", "/users/:id", {
        exact: true,
        caseSensitive: true,
      }),
    ).toBe(true);
  });

  it("tolerates trailing slashes", () => {
    expect(isActivePath("/users/", "/users")).toBe(true);
    expect(isActivePath("/users/42/", "/users/:id")).toBe(true);
    expect(
      isActivePath("/users/edit/42/", "/users/:id", { exact: false }),
    ).toBe(true);
  });

  it("tolerates a trailing slash on the template", () => {
    expect(isActivePath("/users", "/users/")).toBe(true);
    expect(isActivePath("/users/", "/users/")).toBe(true);
  });

  it("treats the root template as a prefix of every path when exact is false", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/users", "/")).toBe(false);
    expect(isActivePath("/users", "/", { exact: false })).toBe(true);
  });

  it("matches paths with query parameters", () => {
    expect(isActivePath("/users/42?tab=profile&theme=dark", "/users/:id")).toBe(
      true,
    );
    expect(isActivePath("/users/42/posts?tab=profile", "/users/:id")).toBe(
      false,
    );
    expect(
      isActivePath("/users/42/posts?tab=profile", "/users/:id", {
        exact: false,
      }),
    ).toBe(true);
  });

  it("matches optional param paths", () => {
    expect(isActivePath("/users/42", "/users/:id?")).toBe(true);
  });

  it("matches splat paths", () => {
    expect(isActivePath("/files/a/b", "/files/*")).toBe(true);
    expect(isActivePath("/files", "/files/*")).toBe(true);
    expect(isActivePath("/other", "/files/*")).toBe(false);
  });
});
