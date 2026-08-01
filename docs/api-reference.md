# API Reference

## defineRoutes

`defineRoutes(routeMap): ResolvedRoutes<T>`

Creates a fully typed route object from a nested plain object.

- Static paths are returned as-is — use them directly anywhere a string is expected.
- Dynamic paths (containing `:param`) and splat paths (trailing `/*`) gain:
  - **`.build(params, query?, options?)`** — resolves the template into a concrete URL
  - **`.paramNames`** — array of the param names extracted from the template (a splat is reported as `['*']`)

Nesting is unlimited — organize routes into as many groups and sub-groups as your app needs.

> `defineRoutes()` also validates every template in development (no-op in production), warning on missing leading `/`, invalid param names, non-trailing `*`, and duplicate path templates. See [Route validation](/getting-started#route-validation).

```ts
const PATHS = defineRoutes({
  SERVICES: {
    ROOT: "/services",
    SUPPORT_CENTER: {
      DETAILS: "/services/support-center/:id",
      EDIT: "/services/support-center/edit/:id",
    },
  },
} as const);

PATHS.SERVICES.ROOT; // '/services'
PATHS.SERVICES.SUPPORT_CENTER.EDIT.build({ id: 7 });
// → '/services/support-center/edit/7'

PATHS.SERVICES.SUPPORT_CENTER.EDIT.build(
  { id: 7 },
  { tab: "info" },
  { hash: "details" },
);
// → '/services/support-center/edit/7?tab=info#details'

PATHS.SERVICES.SUPPORT_CENTER.EDIT.paramNames; // ['id']
```

> Always pass `as const` to `defineRoutes()` — it preserves the literal string types that power `.build()`'s compile-time param checking.

---

## build

`build(template, params, query?, options?): string`

Standalone path resolver — for building a URL without going through `defineRoutes`, or for adding a query string to a **static** path (which has no `.build()` of its own).

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

---

## isActivePath

`isActivePath(currentPath, template, options?): boolean`

Checks whether a resolved path matches a route template — the building block for nav-highlighting. Query strings on `currentPath` are ignored automatically. Mirrors React Router's `NavLink` matching semantics:

- **Case-insensitive by default** — pass `{ caseSensitive: true }` to opt out.
- **Trailing slashes are tolerated** — `/users/` matches `/users`.
- **`exact: true` (default)** requires a full match; `exact: false` matches any path starting with the template.

```ts
import { isActivePath } from "react-routes-forge";

isActivePath("/users/42", "/users/:id");              // true
isActivePath("/users/42/posts", "/users/:id");        // false (exact match by default)
isActivePath("/users/42/posts", "/users/:id", { exact: false }); // true (prefix match)
isActivePath("/users/42?tab=profile", "/users/:id");  // true (query string ignored)
isActivePath("/Users/42", "/users/:id");              // true (case-insensitive by default)
isActivePath("/Users/42", "/users/:id", { caseSensitive: true }); // false
isActivePath("/users/42/", "/users/:id");             // true (trailing slash tolerated)
```

A common real-world use — highlighting the active nav link:

```tsx
function NavLink({ to, children }) {
  const location = useLocation();
  const active = isActivePath(location.pathname, to, { exact: false });

  return (
    <Link to={to} className={active ? "nav-link active" : "nav-link"}>
      {children}
    </Link>
  );
}
```

---

## extractParamsFromPath

`extractParamsFromPath(template, resolvedPath): Record<string, string>`

Extracts param values back out of a resolved URL, given its template. Also strips query strings before matching.

```ts
import { extractParamsFromPath } from "react-routes-forge";

extractParamsFromPath("/users/:id", "/users/42");
// → { id: '42' }

extractParamsFromPath("/a/:x/b/:y", "/a/foo/b/bar");
// → { x: 'foo', y: 'bar' }
```

---

## matchPath

`matchPath(template): RegExp`

Converts a route template string into an anchored `RegExp` — useful when you need custom matching logic beyond `isActivePath` or `extractParamsFromPath`.

```ts
import { matchPath } from "react-routes-forge";

const re = matchPath("/users/:id");
re.test("/users/42");       // true
re.exec("/users/42");       // ['/users/42', '42']
re.test("/users/42/posts"); // false (exact match only)
```

This is the building block used internally by `isActivePath` and `extractParamsFromPath`.

---

## joinPaths

`joinPaths(...segments): string`

Safely joins path segments, normalizing duplicate/missing slashes.

```ts
import { joinPaths } from "react-routes-forge";

joinPaths("/users", "edit", ":id");   // → '/users/edit/:id'
joinPaths("/api/", "/v1/", "/users"); // → '/api/v1/users'
```

---

## getParamNames

`getParamNames(template): string[]`

Returns the list of param names present in a template string.

```ts
import { getParamNames } from "react-routes-forge";

getParamNames("/users/:id/posts/:postId"); // → ['id', 'postId']
getParamNames("/files/*");                 // → ['*']  (the splat param)
getParamNames("/users");                   // → []
```

---

## flattenRoutes

`flattenRoutes(routes): FlatRoute[]`

Walks a `defineRoutes()` tree and returns a flat array of `{ key, path }` entries, where `key` is the dot-joined path from the root (e.g. `"SERVICES.BENEFICIARY_CARE_CENTER.EDIT"`) and `path` is the raw template string.

Primary uses:
- **Sitemap generation** — one call gives you every route in the app.
- **Duplicate detection** — catch the same path string under different keys.

```ts
import { defineRoutes, flattenRoutes } from "react-routes-forge";

const PATHS = defineRoutes({
  HOME: "/",
  USERS: {
    ROOT: "/users",
    EDIT: "/users/edit/:id",
  },
} as const);

flattenRoutes(PATHS);
// [
//   { key: 'HOME',       path: '/' },
//   { key: 'USERS.ROOT', path: '/users' },
//   { key: 'USERS.EDIT', path: '/users/edit/:id' },
// ]

// Detect duplicate paths across the tree
const flat = flattenRoutes(PATHS);
const paths = flat.map((r) => r.path);
const dupes = paths.filter((p, i) => paths.indexOf(p) !== i);
if (dupes.length) console.warn("Duplicate route paths:", dupes);
```

---

## getBreadcrumbs

`getBreadcrumbs(routes, currentPath, options?): BreadcrumbItem[]`

Walks a route tree (or a pre-flattened array) and returns every route that is an ancestor of (or an exact match to) the current URL. Dynamic params in ancestor paths are automatically resolved.

Each breadcrumb entry contains:
- **`key`** — the dot-joined key from the route tree
- **`label`** — a human-readable label derived from the key
- **`path`** — the resolved breadcrumb path with params filled in
- **`isCurrent`** — `true` only for the deepest (exact) match

```ts
import { defineRoutes, getBreadcrumbs } from "react-routes-forge";

const PATHS = defineRoutes({
  HOME: "/",
  USERS: {
    ROOT: "/users",
    EDIT: "/users/edit/:id",
  },
} as const);

getBreadcrumbs(PATHS, "/users/edit/42");
// →
// [
//   { key: "HOME",       label: "Home",  path: "/",             isCurrent: false },
//   { key: "USERS.ROOT", label: "Users", path: "/users",        isCurrent: false },
//   { key: "USERS.EDIT", label: "Edit",  path: "/users/edit/42", isCurrent: true  },
// ]
```

**Custom label resolver**:

```ts
getBreadcrumbs(PATHS, "/users/edit/42", {
  labelResolver: (key) => key.split(".").pop()!.replace(/_/g, " ").toUpperCase(),
});
// → [{ label: "HOME" }, { label: "ROOT" }, { label: "EDIT" }]
```

**Label map** — matching keys take precedence over `labelResolver`:

```ts
getBreadcrumbs(PATHS, "/users/edit/42", {
  labels: { "USERS.ROOT": "Members", "USERS.EDIT": "Edit member" },
});
// → [{ label: "Home" }, { label: "Members" }, { label: "Edit member" }]
```

## appendQuery

`appendQuery(path, query?, hash?): string`

Appends a query string and/or hash fragment to a path that may already contain a query or hash. Existing query pairs are preserved, the query is inserted before any hash, and an existing hash is kept unless a new one is given.

```ts
import { appendQuery } from "react-routes-forge";

appendQuery("/users?tab=list", { page: 2 }); // → '/users?tab=list&page=2'
appendQuery("/users#top", { tab: "list" });  // → '/users?tab=list#top'
appendQuery("/users", { active: true });     // → '/users?active=true'
```

## extractQueryFromPath

`extractQueryFromPath(path, options?): QueryParams`

Parses the query string out of a path (or bare query string) back into a plain object. Repeated keys become arrays; single keys are scalar strings. Pass `{ coerceBooleans: true }` to convert `"true"`/`"false"` to real booleans.

```ts
import { extractQueryFromPath } from "react-routes-forge";

extractQueryFromPath("/users/42?tab=profile&tag=a&tag=b");
// → { tab: "profile", tag: ["a", "b"] }

extractQueryFromPath("/search?active=true", { coerceBooleans: true });
// → { active: true }
```

## Known Behaviours

### Dynamic routes are `String` objects

`defineRoutes` wraps dynamic paths in `String` objects so that `.build()` and `.paramNames` can be attached as properties.

```ts
// ✓ These all work as expected
String(PATHS.USERS.EDIT);     // '/users/edit/:id'
`${PATHS.USERS.EDIT}`;       // '/users/edit/:id'
PATHS.USERS.EDIT == "/users/edit/:id"; // true (loose equality)

// ✗ Watch out for these
typeof PATHS.USERS.EDIT;                // 'object' ← not 'string'
PATHS.USERS.EDIT === "/users/edit/:id"; // false ← strict equality fails
```

Static routes remain genuine string primitives and are unaffected.

### ESM-only package

This package ships **ESM only** (`"type": "module"`, no `require` export condition). All modern bundlers (Vite, Webpack ≥ 5, esbuild, Rollup) handle ESM transparently.
