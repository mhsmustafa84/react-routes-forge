# Query String & Hash Fragment Support

## Query Strings

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

Reading query params back out is handled by `extractQueryFromPath(path, options?)` (pass `{ coerceBooleans: true }` to turn `"true"`/`"false"` into real booleans, `{ coerceNumbers: true }` to turn numeric strings into numbers), and appending to an existing URL by `appendQuery(path, query?, hash?)`. Both are exported from the main entry.

```ts
import { appendQuery, extractQueryFromPath } from "react-routes-forge";

extractQueryFromPath("/users/42?tab=profile&tag=a&tag=b");
// → { tab: "profile", tag: ["a", "b"] }

extractQueryFromPath("/search?page=2", { coerceNumbers: true });
// → { page: 2 }

appendQuery("/users?tab=list", { page: 2 });
// → '/users?tab=list&page=2'
```

### Static Routes

Static routes have a fluent `.build(query?, options?)` — there are no params to interpolate, but query strings and hashes still work:

```ts
PATHS.USERS.ROOT.build({ sort: "asc", page: 2 });
// → '/users?sort=asc&page=2'

// The standalone build() util works the same way for raw templates:
import { build } from "react-routes-forge";

build("/users", {}, { sort: "asc", page: 2 });
// → '/users?sort=asc&page=2'
```

## Hash Fragments

URL hash fragments (`#section`) are supported via the `hash` option. The hash is appended after the query string, if any.

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

// Via useResolvedPath
useResolvedPath("/users/:id", { id: 5 }, { tab: "billing" }, { hash: "invoice" });
// → '/users/5?tab=billing#invoice'
```

The leading `#` is added automatically — pass just the fragment name (e.g. `"details"`, not `"#details"`).
