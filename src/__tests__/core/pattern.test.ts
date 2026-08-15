import { describe, it, expect } from "vitest";
import { matchPath } from "../../core/pattern";

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

  it("caches compiled patterns per template (no lastIndex bleed)", () => {
    const re1 = matchPath("/users/:id");
    const re2 = matchPath("/users/:id");
    expect(re1).toBe(re2);
    // Non-global regexes ignore lastIndex, so repeated .test() stays correct.
    expect(re1.test("/users/1")).toBe(true);
    expect(re1.test("/users/2")).toBe(true);
  });

  it("handles regex-special characters in static path segments", () => {
    const re = matchPath("/search/:query");
    expect(re.test("/search/foo.bar")).toBe(true);
    expect(re.test("/search/foo+bar")).toBe(true);
  });

  it("treats a static suffix after a param as a literal", () => {
    const re = matchPath("/files/:name.json");
    expect(re.test("/files/report.json")).toBe(true);
    expect(re.test("/files/report.yaml")).toBe(false);
    expect(re.test("/files/report.json/extra")).toBe(false);
  });

  it("matches splat paths and captures the remainder", () => {
    const re = matchPath("/files/*");
    expect(re.test("/files/a/b")).toBe(true);
    expect(re.test("/files")).toBe(true);
    expect(re.exec("/files/a/b")![1]).toBe("a/b");
  });

  it("on a bare splat matches everything", () => {
    const re = matchPath("/*");
    expect(re.test("/")).toBe(true);
    expect(re.test("/anything/here")).toBe(true);
    expect(re.exec("/anything/here")![1]).toBe("anything/here");
  });
});
