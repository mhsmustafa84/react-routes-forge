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

  it("handles falsy query values safely (0, false, empty string)", () => {
    expect(appendQuery("/api", { count: 0 })).toBe("/api?count=0");
    expect(appendQuery("/api", { active: false })).toBe("/api?active=false");
    expect(appendQuery("/api", { name: "" })).toBe("/api?name=");
  });

  it("skips undefined and null query values but preserves others", () => {
    expect(appendQuery("/api", { a: null, b: undefined, c: 1 })).toBe("/api?c=1");
  });

  it("handles complex objects and symbols by stringifying them", () => {
    expect(appendQuery("/users", { nested: { obj: "value" } as any })).toBe("/users?nested=%5Bobject+Object%5D");
    expect(appendQuery("/users", { sym: Symbol("test") as any })).toBe("/users?sym=Symbol%28test%29");
  });

  it("preserves falsy values in arrays but skips null/undefined", () => {
    expect(appendQuery("/api", { arr: [0, false, ""] })).toBe("/api?arr=0&arr=false&arr=");
    expect(appendQuery("/api", { arr: [1, null, undefined, 2] })).toBe("/api?arr=1&arr=2");
  });

  it("handles special characters in query keys and values", () => {
    expect(appendQuery("/users", { "a=b": "c&d" })).toBe("/users?a%3Db=c%26d");
    expect(appendQuery("/users", { q: "a?b=c" })).toBe("/users?q=a%3Fb%3Dc");
    expect(appendQuery("/users", { q: "a#b" })).toBe("/users?q=a%23b");
  });

  it("safely handles massive query objects", () => {
    const hugeQuery: Record<string, string> = {};
    for (let i = 0; i < 1000; i++) hugeQuery[`key${i}`] = `value${i}`;
    const result = appendQuery("/users", hugeQuery);
    expect(result.startsWith("/users?key0=value0&key1=value1")).toBe(true);
    expect(result).toContain("key999=value999");
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

  it("coerces numeric strings to numbers when requested", () => {
    expect(
      extractQueryFromPath("/search?page=2&limit=10.5", {
        coerceNumbers: true,
      }),
    ).toEqual({ page: 2, limit: 10.5 });
  });

  it("leaves non-numeric and empty values as strings under coerceNumbers", () => {
    expect(
      extractQueryFromPath("/search?page=2&q=react&x=", {
        coerceNumbers: true,
      }),
    ).toEqual({ page: 2, q: "react", x: "" });
  });

  it("keeps strings as strings by default", () => {
    expect(extractQueryFromPath("/search?active=true")).toEqual({
      active: "true",
    });
  });
});
