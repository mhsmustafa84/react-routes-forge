import { describe, it, expect } from "vitest";
import {
  extractParamNames,
  extractParamsFromPath,
  isDynamic,
} from "../../core/params";

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

  it("stops at a static suffix after the param name", () => {
    expect(extractParamNames("/files/:name.json")).toEqual(["name"]);
    expect(extractParamNames("/users/:id-suffix")).toEqual(["id"]);
    expect(extractParamNames("/users/:id2")).toEqual(["id2"]);
  });
});

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

  it("detects params before a static suffix", () => {
    expect(isDynamic("/files/:name.json")).toBe(true);
  });
});

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

  it("resolves params before a static suffix", () => {
    expect(
      extractParamsFromPath("/files/:name.json", "/files/report.json"),
    ).toEqual({ name: "report" });
  });

  it("extracts params correctly from paths with query parameters", () => {
    expect(
      extractParamsFromPath("/users/:id", "/users/42?tab=profile&theme=dark"),
    ).toEqual({
      id: "42",
    });
  });
});

describe("optional param segments (:param?)", () => {
  it("extracts param name without trailing ?", () => {
    expect(extractParamNames("/users/:id?")).toEqual(["id"]);
  });

  it("extracts multiple optional params correctly", () => {
    expect(extractParamNames("/:a?/:b?")).toEqual(["a", "b"]);
  });

  it("mixes optional and required params", () => {
    expect(extractParamNames("/users/:id?/posts/:postId")).toEqual([
      "id",
      "postId",
    ]);
  });

  it("isDynamic returns true for paths with optional params", () => {
    expect(isDynamic("/users/:id?")).toBe(true);
  });

  it("extractParamsFromPath handles optional param syntax", () => {
    expect(extractParamsFromPath("/users/:id?", "/users/42")).toEqual({
      id: "42",
    });
  });

  it("extractParamsFromPath omits missing optional params", () => {
    expect(extractParamsFromPath("/users/:id?", "/users")).toEqual({});
    expect(
      extractParamsFromPath("/users/:id?/posts/:postId", "/users/posts/1"),
    ).toEqual({ postId: "1" });
  });
});

describe("splat (*) segments in params", () => {
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

  it("extractParamsFromPath returns the splat remainder", () => {
    expect(extractParamsFromPath("/files/*", "/files/a/b/c")).toEqual({
      "*": "a/b/c",
    });
  });
});
