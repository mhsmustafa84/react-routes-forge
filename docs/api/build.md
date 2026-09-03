# build

`build(template, params, query?, options?): string`

Standalone path resolver — for building a URL without going through `defineRoutes`, or for resolving a raw template string (rather than a route from a `PATHS` tree).

```ts
import { build } from "react-routes-forge";

build("/users/:id/posts/:postId", { id: 1, postId: 42 });
// → '/users/1/posts/42'

// Append a query string to any path — including static ones
build("/users", {}, { sort: "asc" });
// → '/users?sort=asc'

// Strict mode — throw instead of warn when a param is missing
build("/users/:id", {}, undefined, { strict: true });
// ✗ throws RangeError

// Hash fragment — appended after the query string
build("/users/:id", { id: 42 }, { tab: "info" }, { hash: "details" });
// → '/users/42?tab=info#details'

// Locale prefix — pre-pends the path with a locale segment
build("/users/:id", { id: 42 }, undefined, { locale: "en-US" });
// → '/en-US/users/42'

// Param values are URL-encoded by default
build("/search/:query", { query: "a/b" });
// → '/search/a%2Fb'

// Pass { encode: false } if a value is already encoded
build("/search/:query", { query: "a%2Fb" }, undefined, { encode: false });
// → '/search/a%2Fb'

// Splat segments capture a path-like remainder, preserving `/` separators
build("/files/*", { "*": "reports/2026/q1" });
// → '/files/reports/2026/q1'
```

See [Splat Segments](/api/known-behaviours#splat-segments) for details.

## buildRelative

`buildRelative` has the exact same signature as `build()`, but it returns a relative path by stripping the leading slash (returning `"."` if the path is empty). It is available as a standalone function `buildRelative()` and as `.buildRelative()` on route values.

```ts
import { defineRoutes, buildRelative } from "react-routes-forge";

const PATHS = defineRoutes({
  USERS: {
    EDIT: "/users/:id/edit"
  }
} as const);

PATHS.USERS.EDIT.buildRelative({ id: 42 }); 
// → 'users/42/edit'

buildRelative("/users/:id", { id: 42 });
// → 'users/42'
```

## Query String Serialization

Every path-resolving function — `.build()`, `build()`, and `useResolvedPath()` — accepts an optional query object as its second-to-last argument.

```ts
navigate(
  PATHS.USERS.DETAILS.build({ id: 42 }, { tab: "billing", sort: "asc" }),
);
// → '/users/42?tab=billing&sort=asc'
```

**Array values** are serialized as repeated keys:

```ts
build("/search", {}, { tags: ["admin", "moderator"] });
// → '/search?tags=admin&tags=moderator'
```

**Boolean values** serialize to `"true"`/`"false"`:

```ts
build("/search", {}, { active: true, draft: false });
// → '/search?active=true&draft=false'
```

**`null` and `undefined` values are dropped**, so you can pass optional filters without conditionally building the object:

```ts
build("/users", {}, { sort: "asc", filter: undefined });
// → '/users?sort=asc'
```

**Static routes** have a fluent `.build(query?, options?)` — there are no params to interpolate, but query strings and hashes still work:

```ts
PATHS.USERS.ROOT.build({ sort: "asc", page: 2 });
// → '/users?sort=asc&page=2'

// You can also pass options to static routes
PATHS.USERS.ROOT.build({}, { hash: "top" });
// → '/users#top'
```

Note that for static routes, `.build()` is completely optional if you don't need to append query parameters or a hash. You can pass `PATHS.USERS.ROOT` directly to `<Link to>` or `navigate()`.

## Hash Fragments

URL hash fragments (`#section`) are supported via the `hash` option in every path-resolving function — `.build()`, `build()`, and `useResolvedPath()`. The hash is appended after the query string, if any.

```ts
// Via fluent .build() on a dynamic route
PATHS.USERS.DETAILS.build({ id: 42 }, undefined, { hash: "profile" });
// → '/users/42#profile'

// With query + hash
PATHS.USERS.DETAILS.build({ id: 42 }, { tab: "info" }, { hash: "details" });
// → '/users/42?tab=info#details'

// Via standalone build()
build("/page", {}, undefined, { hash: "section" });
// → '/page#section'
```

The leading `#` is added automatically — pass just the fragment name (e.g. `"details"`, not `"#details"`).

## URL Encoding Edge Cases

By default, all parameter values are URL-encoded using `encodeURIComponent`.

```ts
build("/search/:query", { query: "foo/bar?baz" });
// → '/search/foo%2Fbar%3Fbaz'
```

However, there are a few exceptions and options to be aware of:

1. **Opting out of encoding**: Pass `{ encode: false }` if your value is already encoded or if you specifically need raw characters to pass through (use with caution).
2. **Splat segments (`*`)**: Splat segments are treated as path-like. Forward slashes (`/`) are preserved, but other special characters (like `?` and `#`) are still encoded to prevent them from breaking the URL structure.
   ```ts
   build("/files/*", { "*": "folder/file name?" });
   // → '/files/folder/file%20name%3F'
   ```
3. **Double encoding**: React Router v7's `generatePath` (which `react-routes-forge` does not use under the hood) applies its own URL encoding. Because `react-routes-forge` builds the fully encoded string itself, you don't need to worry about double-encoding when passing the result to React Router components like `<Link>`.
