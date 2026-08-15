import { describe, it, expect } from "vitest";
import { appendQuery, extractQueryFromPath } from "../../core/query";

describe("appendQuery", () => {
  it("appends a query string to a bare path", () => {
    expect(appendQuery("/users", { page: "2" })).toBe("/users?page=2");
  });

  it("merges with an existing query string using &", () => {
    expect(appendQuery("/users?tab=list", { page: 2 })).toBe(
      "/users?tab=list&page=2",
    );
  });

  it("inserts the query before an existing hash fragment", () => {
    expect(appendQuery("/users#top", { tab: "list" })).toBe(
      "/users?tab=list#top",
    );
    expect(appendQuery("/users?tab=list#top", { page: 2 })).toBe(
      "/users?tab=list&page=2#top",
    );
  });

  it("preserves the existing hash when no new hash is given", () => {
    expect(appendQuery("/users#section", { page: 1 })).toBe(
      "/users?page=1#section",
    );
  });

  it("replaces the hash when a new one is provided", () => {
    expect(appendQuery("/users#old", { page: 1 }, "new")).toBe(
      "/users?page=1#new",
    );
  });

  it("appends only the hash when there is no query", () => {
    expect(appendQuery("/users", undefined, "top")).toBe("/users#top");
  });

  it("supports boolean query values", () => {
    expect(appendQuery("/search", { active: true })).toBe(
      "/search?active=true",
    );
  });

  it("supports array values", () => {
    expect(appendQuery("/users", { tag: ["a", "b"] })).toBe(
      "/users?tag=a&tag=b",
    );
  });
});

describe("extractQueryFromPath", () => {
  it("returns an empty object when there is no query", () => {
    expect(extractQueryFromPath("/users/42")).toEqual({});
  });

  it("parses scalar values", () => {
    expect(extractQueryFromPath("/users/42?tab=profile&page=2")).toEqual({
      tab: "profile",
      page: "2",
    });
  });

  it("groups repeated keys into arrays", () => {
    expect(extractQueryFromPath("/search?tag=a&tag=b&tag=c")).toEqual({
      tag: ["a", "b", "c"],
    });
  });

  it("ignores the hash fragment", () => {
    expect(extractQueryFromPath("/users?tab=list#section")).toEqual({
      tab: "list",
    });
  });

  it("coerces true/false strings to booleans when requested", () => {
    expect(
      extractQueryFromPath("/search?active=true&draft=false&name=x", {
        coerceBooleans: true,
      }),
    ).toEqual({ active: true, draft: false, name: "x" });
  });

  it("keeps strings as strings by default", () => {
    expect(extractQueryFromPath("/search?active=true")).toEqual({
      active: "true",
    });
  });
});
