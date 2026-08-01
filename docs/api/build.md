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
