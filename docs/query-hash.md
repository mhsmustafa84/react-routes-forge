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

**`null` and `undefined` values are dropped**, so you can pass optional filters without conditionally building the object:

```ts
build("/users", {}, { sort: "asc", filter: undefined });
// → '/users?sort=asc'
```

### Static Routes

Static routes don't have a fluent `.build()` (there's nothing to interpolate), so use the standalone `build()` util to attach a query string:

```ts
import { build } from "react-routes-forge";

build(PATHS.USERS.ROOT, {}, { sort: "asc", page: 2 });
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
