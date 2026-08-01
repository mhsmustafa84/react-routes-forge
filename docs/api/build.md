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
```

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
