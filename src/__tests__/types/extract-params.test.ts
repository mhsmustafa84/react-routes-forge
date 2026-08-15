import { describe, it, expect } from "vitest";
import { defineRoutes } from "../../core/defineRoutes";
import type { ExtractParams } from "../../types";

describe("ExtractParams type-level", () => {
  const PATHS = defineRoutes({
    USER: { DETAILS: "/users/:id" },
    POST: { DETAILS: "/posts/:postId/comments/:commentId" },
    PROFILE: { DETAILS: "/profile/:section?" },
  } as const);

  it("preserves dynamic templates at runtime", () => {
    expect(String(PATHS.USER.DETAILS)).toBe("/users/:id");
  });

  it("keeps param access valid for DynamicRoute values", () => {
    // A regression here (collapse to `never`) fails at compile time.
    const id: ExtractParams<typeof PATHS.USER.DETAILS> = "id";
    expect(id).toBe("id");
  });

  it("extracts every param from a DynamicRoute value", () => {
    const params: ExtractParams<typeof PATHS.POST.DETAILS>[] = [
      "postId",
      "commentId",
    ];
    expect(params).toEqual(["postId", "commentId"]);
  });

  it("keeps optional params in DynamicRoute values", () => {
    const section: ExtractParams<typeof PATHS.PROFILE.DETAILS> = "section";
    expect(section).toBe("section");
  });

  it("splits a static suffix from literal templates", () => {
    const name: ExtractParams<"/files/:name.json"> = "name";
    expect(name).toBe("name");
  });

  it("extracts a splat from literal templates", () => {
    const star: ExtractParams<"/files/*"> = "*";
    expect(star).toBe("*");
  });

  it("drops non-word suffixes from literal templates", () => {
    const id: ExtractParams<"/api/:id?"> = "id";
    expect(id).toBe("id");
  });
});
