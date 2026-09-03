# react-routes-forge

**Type-safe route definitions, automatic path builders, query parameter handling, and active route matching for React applications with zero duplication.**

📖 **[Documentation](https://mhsmustafa84.github.io/react-routes-forge)** | 🚀 **[Live Demo (POC)](https://mhsmustafa84.github.io/react-routes-forge-poc)**

[![Documentation](https://img.shields.io/badge/Documentation-VitePress-646cff.svg)](https://mhsmustafa84.github.io/react-routes-forge)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-POC-brightgreen.svg)](https://mhsmustafa84.github.io/react-routes-forge-poc)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](#)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18+-green.svg)](#requirements)
[![Combined CI/CD](https://github.com/mhsmustafa84/react-routes-forge/actions/workflows/ci-security.yml/badge.svg)](https://github.com/mhsmustafa84/react-routes-forge/actions/workflows/ci-security.yml)

---

## Table of contents

- [Why react-routes-forge?](#why-react-routes-forge)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Cheat sheet](#cheat-sheet)
- [API reference](#api-reference)
  - [`defineRoutes(routeMap)`](#defineroutesroutemap)
  - [`build(template, params, query?, options?)`](#buildtemplate-params-query-options)
  - [`buildPath(template, params, query?, options?)`](#buildpathtemplate-params-query-options)
  - [`isActivePath(currentPath, template, options?)`](#isactivepathcurrentpath-template-options)
  - [`extractParamsFromPath(template, resolvedPath)`](#extractparamsfrompathtemplate-resolvedpath)
  - [`matchPath(template, options?)`](#matchpathtemplate-options)
  - [`joinPaths(...segments)`](#joinpathssegments)
  - [`getParamNames(template)`](#getparamnamestemplate)
  - [`extractParamNames(template)`](#extractparamnamestemplate)
  - [`isDynamic(template)`](#isdynamictemplate)
  - [`flattenRoutes(routes)`](#flattenroutesroutes)
  - [`getBreadcrumbs(routes, currentPath, options?)`](#getbreadcrumbsroutes-currentpath-options)
  - [`appendQuery(path, query?, hash?)`](#appendquerypath-query-hash)
  - [`extractQueryFromPath(path, options?)`](#extractqueryfrompathpath-options)
  - [`devWarn(message)`](#devwarnmessage)
  - [`clearPathCache()`](#clearpathcache)
- [React hooks](#react-hooks)
  - [`useRouteParams<T>()`](#useroutparamst)
  - [`useNavigateTo()`](#usenavigateto)
  - [`useResolvedPath(template, params, query?, options?)`](#useresolvedpathtemplate-params-query-options)
  - [`useActivePath(template, options?)`](#useactivepathtemplate-options)
  - [`useTypedSearchParams(options?)`](#usetypedsearchparamsoptions)
- [Splat (`/*`) segments](#splat--segments)
- [Route validation](#route-validation)
- [Query string support](#query-string-support)
- [Hash fragment support](#hash-fragment-support)
- [Strict mode](#strict-mode)
- [Migrating from the old pattern](#migrating-from-the-old-pattern)
- [Known behaviours & gotchas](#known-behaviours--gotchas)
- [TypeScript support](#typescript-support)
- [Testing](#testing)
- [Requirements](#requirements)
- [Contributing](#contributing)
- [License](#license)

---

## Why react-routes-forge?

Most React apps end up with route definitions like this:

```ts
// ❌ The common pattern
export const PATHS = {
  USERS: {
    ROOT: "/users",
    DETAILS: "/users/:id",
  },
};
```

Dynamic routes typically need a **second** entry alongside the template — a hand-written function to build the real URL. As the app grows, the two drift apart, and nothing stops the template and the builder from disagreeing.

`react-routes-forge` collapses both into a single key:

```ts
// ✅ One key, two uses
export const PATHS = defineRoutes({
  USERS: {
    ROOT: "/users",
    DETAILS: "/users/:id",
  },
} as const);

PATHS.USERS.ROOT; // '/users'            → static, used directly
PATHS.USERS.DETAILS; // '/users/:id'        → use in <Route path={...} />
PATHS.USERS.DETAILS.build({ id: 42 }); // '/users/42'        → use when navigating
```

You get:

- **Single source of truth** — no duplicate template/builder pairs to keep in sync
- **Compile-time param safety** — `.build()` is typed from the path string itself; missing or misspelled params are TypeScript errors
- **Query string support** — built into `.build()`, no manual `URLSearchParams` wrangling
- **Zero runtime dependencies** for the core API
- **Deep nesting supported out of the box** — organize routes into as many nested groups as your app needs

---

## Installation

```bash
npm install react-routes-forge
# or
pnpm add react-routes-forge
# or
yarn add react-routes-forge
# or
bun add react-routes-forge
```

> **Note:** this package ships dual **ESM + CommonJS** builds. See [Known behaviours & gotchas](#known-behaviours--gotchas) for details.

---

## Quick start

```ts
// paths.ts
import { defineRoutes } from "react-routes-forge";

export const PATHS = defineRoutes({
  HOME: "/",
  LOGIN: "/login",
  USERS: {
    ROOT: "/users",
    ADD: "/users/add",
    EDIT: "/users/edit/:id",
    DETAILS: "/users/:id",
  },
  ROLES: {
    PERMISSIONS: "/roles/permissions/:name",
  },
} as const);
```

> **Always pass `as const`** — it preserves the literal string types that power `.build()`'s compile-time param checking. Without it, TypeScript widens your path strings to generic `string` and you lose type safety.

```tsx
// App.tsx — static paths and dynamic templates both work directly as strings
import { Routes, Route } from "react-router-dom";
import { PATHS } from "./paths";

<Routes>
  <Route path={PATHS.HOME} element={<Home />} />
  <Route path={PATHS.USERS.ROOT} element={<UserList />} />
  <Route path={PATHS.USERS.EDIT} element={<EditUser />} />
  <Route path={PATHS.ROLES.PERMISSIONS} element={<RolePermissions />} />
</Routes>;
```

```tsx
// Navigating — call .build() to resolve a dynamic path into a real URL
import { useNavigate } from "react-router-dom";

function MyComponent() {
  const navigate = useNavigate();
  //                    ↓ Param type-checked from the template ":id"
  navigate(PATHS.USERS.EDIT.build({ id: 42 })); // → '/users/edit/42'
  navigate(PATHS.ROLES.PERMISSIONS.build({ name: "admin" })); // → '/roles/permissions/admin'
  navigate(PATHS.HOME); // → '/'  (static paths work directly)
}
```

That's the entire API surface you need for most apps. Everything below covers the rest of the toolkit.

### Route types

| Route type  | Example                 | Behaves as                            | Gains                                                                 |
| ----------- | ----------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| **Static**  | `HOME: '/'`             | A primitive string (its template)     | `.build(query?, options?)` — attach query/hash, no params to fill      |
| **Dynamic** | `DETAILS: '/users/:id'` | A primitive string (its template)     | `.build(params, query?, options?)` and `.paramNames`                  |
| **Splat**   | `FILES: '/files/*'`     | A primitive string (its template)     | `.build(params, query?, options?)` and `.paramNames`                  |

`defineRoutes()` walks your route object recursively, returning every path as a genuine primitive string. `.build()` (and `.paramNames` on dynamic paths) are attached to `String.prototype` once, so both static and dynamic routes can carry a query string or hash. Dynamic paths (containing a `:param` segment or a trailing `/*` splat) additionally gain `.paramNames`.

Param names are `[A-Za-z0-9_]` only (matching React Router), so a static suffix after a param stays literal — `/files/:name.json` builds `{ name: "report" }` → `/files/report.json`, and `:name.json` is **not** treated as a single param name.

> `defineRoutes()` also validates your templates in development — missing leading `/`, non-trailing `*`, and duplicate path templates all produce a `console.warn`. See [Route validation](#route-validation).

---

## Cheat sheet

Quick reference for everything the package exports — grouped by kind. Click through to the full section for details and examples.

### Route definition

| Export                                            | Purpose                                                 |
| ------------------------------------------------- | ------------------------------------------------------- |
| [`defineRoutes(routeMap)`](#defineroutesroutemap) | Builds the typed `PATHS` object from a nested route map |
| `.build(query?, options?)`                        | On every **static** route — attach query string / hash  |
| `.build(params, query?, options?)`                | On every **dynamic** route — resolves to a concrete URL |
| `.paramNames`                                     | On every dynamic route — the param names it expects     |

### Utilities

| Export                                                                                         | Purpose                                                    |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [`build(template, params, query?, options?)`](#buildtemplate-params-query-options)             | Resolve a template into a URL without `defineRoutes`       |
| [`buildPath(template, params, query?, options?)`](#buildpathtemplate-params-query-options)     | Same as `build()` — the underlying resolver `build` aliases |
| [`isActivePath(currentPath, template, options?)`](#isactivepathcurrentpath-template-options)   | Check if a path matches a template (nav-highlighting)      |
| [`extractParamsFromPath(template, resolvedPath)`](#extractparamsfrompathtemplate-resolvedpath) | Pull param values back out of a resolved URL               |
| [`matchPath(template, options?)`](#matchpathtemplate-options)                                 | Convert a route template into an anchored `RegExp`         |
| [`joinPaths(...segments)`](#joinpathssegments)                                                 | Join and normalize path segments                           |
| [`getParamNames(template)`](#getparamnamestemplate)                                            | List the `:param` names in a template                      |
| [`extractParamNames(template)`](#extractparamnamestemplate)                                    | Same as `getParamNames()` — the canonical implementation   |
| [`isDynamic(template)`](#isdynamictemplate)                                                    | `true` if a template contains a `:param` or trailing `/*`  |
| [`flattenRoutes(routes)`](#flattenroutesroutes)                                                | Flatten a `PATHS` tree for sitemaps / duplicate detection  |
| [`getBreadcrumbs(routes, currentPath, options?)`](#getbreadcrumbsroutes-currentpath-options)   | Build a breadcrumb trail from a route tree and current URL |
| [`appendQuery(path, query?, hash?)`](#appendquerypath-query-hash)                              | Append query params / hash to an existing path             |
| [`extractQueryFromPath(path, options?)`](#extractqueryfrompathpath-options)                    | Parse a query string back into an object                   |
| [`devWarn(message)`](#devwarnmessage)                                                          | Emit a `console.warn` in non-production builds             |
| [`clearPathCache()`](#clearpathcache)                                                         | Reset internal regex caches (mainly for tests)             |

### React hooks

| Export                                                                  | Purpose                                                       |
| ----------------------------------------------------------------------- | ------------------------------------------------------------- |
| [`useRouteParams<T>()`](#useroutparamst)                                | Typed wrapper around React Router's `useParams`               |
| [`useNavigateTo()`](#usenavigateto)                                     | Typed wrapper around React Router's `useNavigate`             |
| [`useResolvedPath(...)`](#useresolvedpathtemplate-params-query-options) | Resolve a template to a string without navigating             |
| [`useActivePath(template, options?)`](#useactivepathtemplate-options)   | Check if the current location matches a route template        |
| [`useTypedSearchParams(options?)`](#usetypedsearchparamsoptions)        | Typed `useSearchParams` with boolean/number coercion          |

---

## API reference

### `defineRoutes(routeMap)`

Creates a fully typed route object from a nested plain object.

- Every path is a genuine primitive string — use it directly anywhere a string is expected (e.g. `<Route path={...} />`).
- Static paths gain **`.build(query?, options?)`** — attach a query string and/or hash fragment without params.
- Dynamic paths (containing `:param`) and splat paths (trailing `/*`) gain:
  - **`.build(params, query?, options?)`** — resolves the template into a concrete URL
  - **`.paramNames`** — array of the param names extracted from the template, e.g. `['id']` (a splat is reported as `['*']`)

Nesting is unlimited — organize routes into as many groups and sub-groups as your app needs.

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
PATHS.SERVICES.SUPPORT_CENTER.EDIT.build({ id: 7 }); // '/services/support-center/edit/7'
PATHS.SERVICES.SUPPORT_CENTER.EDIT.build(
  { id: 7 },
  { tab: "info" },
  { hash: "details" },
); // → '/services/support-center/edit/7?tab=info#details'
PATHS.SERVICES.SUPPORT_CENTER.EDIT.paramNames; // ['id']
```

> Always pass `as const` to `defineRoutes()` — it preserves the literal string types that power `.build()`'s compile-time param checking.

---

### `build(template, params, query?, options?)`

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
// ✗ throws RangeError: [route-forge] Missing required param(s) ":id" in template "/users/:id".

// Hash fragment — appended after the query string
build("/users/:id", { id: 42 }, { tab: "info" }, { hash: "details" });
// → '/users/42?tab=info#details'
build("/page", {}, undefined, { hash: "section" });
// → '/page#section'
```

**Param values are URL-encoded by default** (`encodeURIComponent`), so characters like `/`, `?`, `#`, or `%` in a value can't break the URL structure:

```ts
build("/search/:query", { query: "a/b" });
// → '/search/a%2Fb'

// Pass { encode: false } if a value is already encoded
build("/search/:query", { query: "a%2Fb" }, undefined, { encode: false });
// → '/search/a%2Fb'

// Splat segments capture a path-like remainder, preserving `/` separators
build("/files/*", { "*": "reports/2026/q1" });
// → '/files/reports/2026/q1'
```

See [Splat (`/*`) segments](#splat--segments) for details.

---

### `buildPath(template, params, query?, options?)`

The canonical path resolver that [`build()`](#buildtemplate-params-query-options) is an alias of — identical signature and behaviour. It is exported under both names; reach for `buildPath` when you want the name to match the internals (e.g. when reading the [`useResolvedPath()`](#useresolvedpathtemplate-params-query-options) wrapper), and `build` for a shorter call site.

```ts
import { buildPath } from "react-routes-forge";

buildPath("/users/:id", { id: 42 }); // → '/users/42'
buildPath("/users", {}, { sort: "asc" }); // → '/users?sort=asc'
```

All `build()` examples above apply verbatim to `buildPath`.

---

### `isActivePath(currentPath, template, options?)`

Checks whether a resolved path matches a route template — the building block for nav-highlighting ("is this link active?"). Query strings on `currentPath` are ignored automatically. It mirrors React Router's `NavLink` matching semantics:

- **Case-insensitive by default** — pass `{ caseSensitive: true }` to opt out.
- **Trailing slashes are tolerated** — `/users/` matches `/users`.
- **`exact: true` (default)** requires a full match; **`exact: false`** matches any path that starts with the template (so `/` matches every path as a prefix).

```ts
import { isActivePath } from "react-routes-forge";

isActivePath("/users/42", "/users/:id"); // true
isActivePath("/users/42/posts", "/users/:id"); // false (exact match by default)
isActivePath("/users/42/posts", "/users/:id", { exact: false }); // true  (prefix match)
isActivePath("/users/42?tab=profile", "/users/:id"); // true  (query string ignored)
isActivePath("/Users/42", "/users/:id"); // true  (case-insensitive by default)
isActivePath("/Users/42", "/users/:id", { caseSensitive: true }); // false
isActivePath("/users/42/", "/users/:id"); // true  (trailing slash tolerated)
```

A common real-world use — highlighting the active nav link:

```tsx
function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
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

### `extractParamsFromPath(template, resolvedPath)`

Extracts param values back out of a resolved URL, given its template. Also strips query strings before matching.

```ts
import { extractParamsFromPath } from "react-routes-forge";

extractParamsFromPath("/users/:id", "/users/42");
// → { id: '42' }

extractParamsFromPath("/a/:x/b/:y", "/a/foo/b/bar");
// → { x: 'foo', y: 'bar' }
```

---

### `matchPath(template, options?)`

Converts a route template string into an anchored `RegExp` — useful when you need custom matching logic beyond [`isActivePath`](#isactivepathcurrentpath-template-options) or [`extractParamsFromPath`](#extractparamsfrompathtemplate-resolvedpath). Query strings are **not** stripped; split on `"?"` first if needed.

```ts
import { matchPath } from "react-routes-forge";

const re = matchPath("/users/:id");
re.test("/users/42"); // true
re.exec("/users/42"); // ['/users/42', '42']
re.test("/users/42/posts"); // false (exact match only)
```

**Options:**

- **`end?: boolean`** (default `true`) — anchor the pattern to the end of the path. Pass `false` to match a prefix at a segment boundary (`/users` matches `/users/42` but not `/usersettings`).
- **`caseSensitive?: boolean`** (default `false`) — match case-insensitively by default; pass `true` to opt out.

```ts
matchPath("/users/:id", { end: false }).test("/users/42/posts"); // true
matchPath("/Users/42", { caseSensitive: true }).test("/users/42"); // false
```

This is the building block used internally by `isActivePath` and `extractParamsFromPath`.

---

### `joinPaths(...segments)`

Safely joins path segments, normalizing duplicate/missing slashes.

```ts
import { joinPaths } from "react-routes-forge";

joinPaths("/users", "edit", ":id"); // → '/users/edit/:id'
joinPaths("/api/", "/v1/", "/users"); // → '/api/v1/users'
```

---

### `getParamNames(template)`

Returns the list of param names present in a template string.

```ts
import { getParamNames } from "react-routes-forge";

getParamNames("/users/:id/posts/:postId"); // → ['id', 'postId']
getParamNames("/files/*"); // → ['*']  (the splat param)
getParamNames("/users"); // → []
```

---

### `extractParamNames(template)`

The canonical implementation behind [`getParamNames()`](#getparamnamestemplate) — same signature and results, kept under both names for compatibility. Param names are `[A-Za-z0-9_]` only, recognized at the start of a segment; a trailing `/*` splat is reported as `['*']`.

```ts
import { extractParamNames } from "react-routes-forge";

extractParamNames("/users/:id/posts/:postId"); // → ['id', 'postId']
extractParamNames("/files/*"); // → ['*']
extractParamNames("/users"); // → []
```

---

### `isDynamic(template)`

Returns `true` when a template contains a `:param` segment or a trailing `/*` splat, and `false` otherwise. This is exactly the test `defineRoutes()` uses to decide whether a path gains `.paramNames`:

```ts
import { isDynamic } from "react-routes-forge";

isDynamic("/users/:id"); // true
isDynamic("/users/:id?"); // true  (optional params count)
isDynamic("/files/*"); // true  (splat)
isDynamic("/users"); // false
isDynamic("/users/foo:bar"); // false  (literal colon inside a segment)
```

---

### `flattenRoutes(routes)`

Walks a `defineRoutes()` tree and returns a flat array of `{ key, path }` entries, where `key` is the dot-joined path from the root (e.g. `"SERVICES.BENEFICIARY_CARE_CENTER.EDIT"`) and `path` is the raw template string.

Primary uses:

- **Sitemap generation** — one call gives you every route in the app.
- **Duplicate detection** — catch the same path string defined under two different keys before it ships.

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

A useful pattern is running the duplicate check once at app startup (or in a test) so a copy-paste route collision fails fast instead of surfacing as a confusing routing bug later:

```ts
// routes.test.ts
it("has no duplicate route paths", () => {
  const paths = flattenRoutes(PATHS).map((r) => r.path);
  const dupes = paths.filter((p, i) => paths.indexOf(p) !== i);
  expect(dupes).toEqual([]);
});
```

---

### `getBreadcrumbs(routes, currentPath, options?)`

Walks a route tree (or a pre-flattened array from `flattenRoutes()`) and returns every route that is an ancestor of (or an exact match to) the current URL. Dynamic params in ancestor paths are automatically resolved from the matched portion of the URL. Query strings on `currentPath` are ignored.

Each breadcrumb entry contains:

- **`key`** — the dot-joined key from the route tree (e.g. `"USERS.EDIT"`)
- **`label`** — a human-readable label derived from the key (e.g. `"USERS.ROOT"` → `"Users"`, `"USERS.EDIT"` → `"Edit"`)
- **`path`** — the resolved breadcrumb path with params filled in (e.g. `"/users/edit/42"`)
- **`isCurrent`** — `true` only for the deepest (exact) match

```ts
import { defineRoutes, getBreadcrumbs } from "react-routes-forge";

const PATHS = defineRoutes({
  HOME: "/",
  USERS: {
    ROOT: "/users",
    EDIT: "/users/edit/:id",
  },
  SERVICES: {
    BCC: {
      EDIT: "/services/bcc/edit/:id",
    },
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

**Custom label resolver** — override the default key-to-label conversion:

```ts
getBreadcrumbs(PATHS, "/users/edit/42", {
  labelResolver: (key) =>
    key.split(".").pop()!.replace(/_/g, " ").toUpperCase(),
});
// → [{ label: "HOME" }, { label: "ROOT" }, { label: "EDIT" }]
```

**Label map** — the ergonomic alternative for a handful of overrides. Keys are dot-joined route keys; matching keys take precedence over `labelResolver`:

```ts
getBreadcrumbs(PATHS, "/users/edit/42", {
  labels: { "USERS.ROOT": "Members", "USERS.EDIT": "Edit member" },
});
// → [{ label: "Home" }, { label: "Members" }, { label: "Edit member" }]
```

**Pre-flattened input** — pass a cached `flattenRoutes()` result instead of the tree:

```ts
const flat = flattenRoutes(PATHS);
getBreadcrumbs(flat, "/users/edit/42"); // same result as passing the tree
```

---

### `appendQuery(path, query?, hash?)`

Appends a query string and/or hash fragment to a path that may already contain a query or hash. Existing query pairs are preserved, the query is inserted before any hash, and an existing hash is kept unless a new one is given.

```ts
import { appendQuery } from "react-routes-forge";

appendQuery("/users?tab=list", { page: 2 }); // → '/users?tab=list&page=2'
appendQuery("/users#top", { tab: "list" }); // → '/users?tab=list#top'
appendQuery("/users", { active: true }); // → '/users?active=true'
appendQuery("/users", { tag: ["a", "b"] }); // → '/users?tag=a&tag=b'
appendQuery("/users", { tag: ["a", null, "b", undefined] }); // → '/users?tag=a&tag=b'
```

This is the same helper every path-resolving function uses internally.

---

### `extractQueryFromPath(path, options?)`

Parses the query string out of a path (or bare query string) back into a plain object. Repeated keys become arrays; single keys are scalar strings.

**Options:**

- **`coerceBooleans?: boolean`** — convert the strings `"true"`/`"false"` to real booleans.
- **`coerceNumbers?: boolean`** — convert numeric strings (`"42"`, `"3.14"`) to real numbers.

```ts
import { extractQueryFromPath } from "react-routes-forge";

extractQueryFromPath("/users/42?tab=profile&tag=a&tag=b");
// → { tab: "profile", tag: ["a", "b"] }

extractQueryFromPath("/search?active=true", { coerceBooleans: true });
// → { active: true }

extractQueryFromPath("/search?page=2&limit=10", { coerceNumbers: true });
// → { page: 2, limit: 10 }
```

---

### `devWarn(message)`

Emits a `console.warn` in non-production environments. Shared by the core utilities and `defineRoutes()` so the production check lives in one place.

```ts
import { devWarn } from "react-routes-forge";

devWarn("[route-forge] Something looks wrong.");
// → console.warn in dev/test, silent in production bundles
```

---

### `clearPathCache()`

Clears the internal regex caches used by `matchPath()` / prefix matching. Primarily useful in test suites to prevent cached patterns from leaking across test cases.

```ts
import { clearPathCache } from "react-routes-forge";

beforeEach(() => {
  clearPathCache();
});
```

---

## React hooks

Import these only if you're using React Router — they live in a separate `react-routes-forge/hooks` entry, so the core package never pulls in `react-router`. The hooks work identically with **`react-router-dom`** (v6/v7) and **`react-router`** (v6/v7) — they're implemented on top of hooks that both packages export, so you get the same behaviour no matter which one your app imports from.

### `useRouteParams<T>()`

Typed wrapper around React Router's `useParams`. Pass the route's template string as a generic to get a correctly typed params object back — no casting, and it works for any number of `:param` segments. Alternatively, pass a **dynamic route value from your `PATHS` tree** and the params are inferred from it automatically:

```tsx
import { useRouteParams } from "react-routes-forge/hooks";

// Route: '/users/edit/:id'
function EditUser() {
  const { id } = useRouteParams<"/users/edit/:id">();
  return <div>Editing user {id}</div>;
}

// Multiple params also work correctly
// Route: '/posts/:postId/comments/:commentId'
function Comment() {
  const { postId, commentId } =
    useRouteParams<"/posts/:postId/comments/:commentId">();
  // ...
}

// Or pass a route from your PATHS tree — types are inferred:
const PATHS = defineRoutes({ USERS: { EDIT: "/users/edit/:id" } } as const);
function EditUserInferred() {
  const { id } = useRouteParams(PATHS.USERS.EDIT);
  // ...
}
```

---

### `useNavigateTo()`

Thin, typed wrapper around `useNavigate()` that accepts a resolved path (the output of `.build()`) along with the usual navigation options.

```tsx
import { useNavigateTo } from "react-routes-forge/hooks";
import { PATHS } from "./paths";

function Component() {
  const navigateTo = useNavigateTo();

  return (
    <button onClick={() => navigateTo(PATHS.USERS.EDIT.build({ id: 42 }))}>
      Edit
    </button>
  );
}

navigateTo(PATHS.HOME, { replace: true });
navigateTo(PATHS.USERS.ROOT, { state: { from: "settings" } });
```

---

### `useResolvedPath(template, params, query?, options?)`

Resolves a path template to a concrete URL string without navigating — useful for `<Link to={...} />`, preloading, or building a URL for something other than `navigate()`. It mirrors the library's own [`build()`](#buildtemplate-params-query-options), so splat (`*`) and optional (`:param?`) segments work identically to the core API — and the encoding/`strict` behaviour is consistent across React Router v6 and v7. Accepts the same `query` and `options` as [`build()`](#buildtemplate-params-query-options).

```tsx
import { useResolvedPath } from "react-routes-forge/hooks";

const path = useResolvedPath("/users/:id", { id: 42 });
// → '/users/42'

const path = useResolvedPath("/users/:id", { id: 42 }, { tab: "info" });
// → '/users/42?tab=info'

// Splat segments are preserved
const path = useResolvedPath("/files/*", { "*": "a/b/c" });
// → '/files/a/b/c'

// Strict mode — throws RangeError instead of warning on missing params
const path = useResolvedPath("/users/:id", {}, undefined, { strict: true });

// With hash fragment
const path = useResolvedPath("/page", {}, undefined, { hash: "section" });
// → '/page#section'
```

---

### `useActivePath(template, options?)`

A hook that checks whether the current location matches a route template or path — a thin wrapper around [`isActivePath()`](#isactivepathcurrentpath-template-options) that reads the location from the router. Same matching semantics: case-insensitive by default, trailing slashes tolerated, `exact: true` by default.

```tsx
import { useActivePath } from "react-routes-forge/hooks";

function Nav() {
  const isUsersActive = useActivePath(PATHS.USERS.ROOT, { exact: false });
  const isProfileActive = useActivePath("/users/:id", { caseSensitive: true });

  return (
    <Link className={isUsersActive ? "active" : ""} to={PATHS.USERS.ROOT}>
      Users
    </Link>
  );
}
```

---

### `useTypedSearchParams(options?)`

A typed wrapper around React Router's search-params API (built on `useLocation` + `useNavigate`, which both `react-router-dom` and `react-router` export in v6 and v7). Returns a parsed query params object (using [`extractQueryFromPath()`](#extractqueryfrompathpath-options)) and a setter that updates the query string. The same coercion options are supported: `{ coerceBooleans: true }` and `{ coerceNumbers: true }`.

```tsx
import { useTypedSearchParams } from "react-routes-forge/hooks";

function Filters() {
  const [query, setQuery] = useTypedSearchParams({
    coerceBooleans: true,
    coerceNumbers: true,
  });

  // query.page is a number when the URL is '/search?page=2'
  const nextPage = (query.page ?? 0) + 1;
  setQuery({ ...query, page: nextPage });

  // Clear a filter by omitting it (or pass null/undefined)
  setQuery({ page: 1, sort: "asc" });
}
```

---

## Splat (`/*`) segments

Splat routes (`/files/*`) capture the rest of the path — including slashes — into a single `*` param, matching React Router semantics. Supported across the entire core API, not just the hooks.

```ts
import { defineRoutes, build, isActivePath, extractParamsFromPath } from "react-routes-forge";

const PATHS = defineRoutes({
  FILES: "/files/*",
} as const);

PATHS.FILES.build({ "*": "reports/2026/q1" }); // → '/files/reports/2026/q1'
String(PATHS.FILES); // → '/files/*'
PATHS.FILES.paramNames; // → ['*']
```

Behaviour notes:

- **Slashes in the value are preserved** (they're path separators); other special characters are still URL-encoded — `"/files/*"` with `"a b/c?d"` → `"/files/a%20b/c%3Fd"`.
- **A missing splat value drops the `/*` suffix** — `/files/*` resolves to `/files` (matching React Router, where the splat route also matches the base path).
- `isActivePath("/files/a/b", "/files/*")` → `true`; `extractParamsFromPath("/files/*", "/files/a/b")` → `{ "*": "a/b" }`.
- A splat must be **trailing** (`/files/*`). A `*` in the middle of a path is invalid and produces a dev warning (see below).

---

## Route validation

`defineRoutes()` validates every template in development (no-op in production) and warns via `console.warn` about likely mistakes:

| Problem | Example | Warning |
| ------- | ------- | ------- |
| Missing leading `/` | `"users/:id"` | `does not start with "/"` |
| Non-trailing splat | `"/files/*/extra"` | `*` outside a trailing `"/*"` |
| Duplicate path template | `FOO: "/foo"` and `BAR: "/foo"` | `Duplicate route path "/foo"` (names both keys) |
| Static route shadowed by a dynamic route above it | `DETAILS: "/users/:id"` defined before `ME: "/users/me"` | `"ME" is shadowed by dynamic route "DETAILS"` |

```ts
// duplicate route paths are caught at startup instead of as a routing bug later
defineRoutes({
  A: { FOO: "/foo" },
  B: { FOO: "/foo" },
} as const);
// ⚠ console.warn: [route-forge] Duplicate route path "/foo" for "A.FOO" and "B.FOO". Only one of them will be reachable.
```

These are warnings, not errors — invalid routes still build, so a broken definition can't crash your app at import time. Run a stricter check once in tests if you want duplicates to fail the build:

```ts
it("has no duplicate route paths", () => {
  const paths = flattenRoutes(PATHS).map((r) => r.path);
  expect(paths).toEqual([...new Set(paths)]);
});
```

---

## Query string support

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

Static routes have a `.build()` too — there are no params to interpolate, but you can still attach a query string or hash:

```ts
PATHS.USERS.ROOT.build({ sort: "asc", page: 2 });
// → '/users?sort=asc&page=2'

// The standalone build() util works the same way for raw templates:
import { build } from "react-routes-forge";
build(PATHS.USERS.ROOT, {}, { sort: "asc", page: 2 });
// → '/users?sort=asc&page=2'
```

Reading query params back out is handled by [`extractQueryFromPath(path, options?)`](#extractqueryfrompathpath-options), and appending to an existing URL (e.g. a link with pre-set filters) by [`appendQuery(path, query?, hash?)`](#appendquerypath-query-hash).

---

## Hash fragment support

URL hash fragments (`#section`) are supported in every path-resolving function — `.build()`, `build()`, and `useResolvedPath()` — via the `hash` option. The hash is appended after the query string, if any.

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
useResolvedPath(
  "/users/:id",
  { id: 5 },
  { tab: "billing" },
  { hash: "invoice" },
);
// → '/users/5?tab=billing#invoice'
```

The leading `#` is added automatically — pass just the fragment name (e.g. `"details"`, not `"#details"`).

---

## Strict mode

By default, a missing required param leaves the `:param` placeholder in the resolved string and logs a `console.warn` — useful for catching bugs during development without crashing the app.

Pass `{ strict: true }` as the last argument to any builder to throw a `RangeError` instead:

```ts
build("/users/:id", {}, undefined, { strict: true });
// ✗ throws RangeError: [route-forge] Missing required param(s) ":id" in template "/users/:id".
```

This is consistent across the whole API surface:

| API                                    | Default (no `strict`)                         | `{ strict: true }`  |
| -------------------------------------- | --------------------------------------------- | ------------------- |
| `.build()` (fluent, on dynamic routes) | `console.warn`, leaves `:param` in the string | throws `RangeError` |
| `build()` / `buildPath()` (standalone) | `console.warn`, leaves `:param` in the string | throws `RangeError` |
| `useResolvedPath()`                    | `console.warn`, leaves `:param` in the string | throws `RangeError` |

A common pattern is enabling strict mode only in tests or development builds:

```ts
const opts = { strict: process.env.NODE_ENV === "test" };
navigate(PATHS.USERS.EDIT.build({ id: userId }, undefined, opts));
```

---

## Migrating from the old pattern

If your routes currently look like this:

```ts
// ❌ Before
export const PATHS = {
  SERVICES: {
    ROOT: "/services",
    DETAILS: "/services/:id",
  },
};

navigate(`/services/${id}`);
navigate(`${PATHS.SERVICES.ROOT}/${id}`);
```

Drop the manual string concatenation and wrap the object in `defineRoutes()`:

```ts
// ✅ After
export const PATHS = defineRoutes({
  SERVICES: {
    ROOT: "/services",
    DETAILS: "/services/:id",
  },
} as const);
```

Update call sites to use `.build()` instead of template literals or hand-written helper functions:

```ts
// Before
navigate(`/services/${id}`);
navigate(`${PATHS.SERVICES.ROOT}/${id}`);

// After
navigate(PATHS.SERVICES.DETAILS.build({ id }));
```

Everywhere the template string itself was used (e.g. `<Route path={PATHS.SERVICES.DETAILS} />`) needs no changes at all.

---

## Known behaviours & gotchas

### Routes are genuine primitive strings

`defineRoutes()` returns **plain primitive strings** — `typeof` a route value is `"string"` and strict equality against the template works. `.build()` (and `.paramNames` on dynamic routes) are not own properties of the route value; they are attached to `String.prototype` once, so every route value can still call them lazily from its own text:

```ts
// ✓ These all work as expected
PATHS.HOME === "/"; // true  (strict equality works)
typeof PATHS.HOME; // 'string'
String(PATHS.HOME); // '/'
`${PATHS.USERS.EDIT}`; // '/users/edit/:id'
PATHS.USERS.EDIT.build({ id: 42 }); // '/users/42'  (via String.prototype)
PATHS.USERS.EDIT.paramNames; // ['id']
```

Because route values are primitives, they work anywhere a plain string does — as object/`Map` keys, and directly with React Router's `<Link to={...}>` or `navigate()` (which branch on `typeof to === "string"`), no `.build()` call required for static paths.

The flip side: since `.build` and `.paramNames` live on `String.prototype`, **every** string in your app has them, not just routes. `"/foo".build({})` → `'/foo'`, and `"/a/:b".paramNames` → `['b']` — `.paramNames` is a lazy getter that parses the string's own text, so it's always correct. Just be aware the helpers exist globally when you're using the library.

### `useResolvedPath` vs. the library's own `buildPath`

`useResolvedPath` is a thin wrapper around the library's own `buildPath`, so splat (`*`), optional (`:param?`) and encoding behaviour are identical across every entry point — and consistent across React Router v6 and v7 (v7's `generatePath` URL-encodes values itself, which would otherwise double-encode).

### ESM + CommonJS builds

This package ships both **ESM and CommonJS** bundles (`dist/index.js` for ESM, `dist/index.cjs` for CJS), with `exports` conditions routing each environment to the right format. Modern bundlers use the ESM build; Node.js `require()` gets the CommonJS build automatically. Consumers on plain CommonJS are fully supported.

---

## TypeScript support

Written in strict TypeScript with no `any` in the public API surface. Param types for `.build()` are inferred directly from each path template via a recursive template-literal type, so:

```ts
PATHS.USERS.EDIT.build({ id: 42 }); // ✓ compiles
PATHS.USERS.EDIT.build({}); // ✗ compile error — 'id' is required
PATHS.USERS.EDIT.build({ userId: 42 }); // ✗ compile error — 'id' expected, not 'userId'
```

`.paramNames` is similarly typed as a literal array of the exact param names in the template, not a generic `string[]`.

To annotate a plain route object (e.g. a shared constant used by `defineRoutes()`), import the `RouteTree` type:

```ts
import type { RouteTree } from "react-routes-forge";

const routes: RouteTree = {
  HOME: "/",
  USERS: { ROOT: "/users", EDIT: "/users/edit/:id" },
};
```

The result of `defineRoutes()` is typed as `ResolvedRoutes`, and individual leaves are `StaticRoute<T>` (static paths, with `.build(query?, options?)`) or `DynamicRoute<T>` (dynamic/splat paths, with `.build(params, ...)` and `.paramNames`) — all exported as types if you need to reference them. `MatchPathOptions` types the [`matchPath()`](#matchpathtemplate-options) options bag.

---

## Testing

The package ships with a full test suite covering the core builder/utility functions and the React hooks, including strict-mode behaviour, query string edge cases (arrays, booleans, `null`/`undefined` filtering), splat segments, route validation, nested route groups, and duplicate-path detection.

```bash
npm test                # run the full suite once (bun test)
npm run test:watch      # watch mode
npm run test:coverage   # run with coverage (vitest + v8, outputs lcov.info)

# equivalent with other package managers
pnpm test / pnpm test:watch
yarn test / yarn test:watch
bun test / bun test:watch
```

CI runs the suite across a **matrix of Node.js versions (18 / 20 / 22 / 24)** and **React Router v6 and v7**, plus lint, a production build, and a coverage job that uploads `lcov.info` as a build artifact (see `.github/workflows/ci-security.yml`).

If you're contributing, new behaviour should come with a matching test — the existing suite is organized by function/hook, so add cases alongside the relevant `describe` block rather than starting a new file.

---

## Requirements

- **React** ≥ 17 (peer dependency)
- **react-router-dom** ≥ 6 **or** **react-router** ≥ 6 (both optional peer dependencies — one of them is required only for the `react-routes-forge/hooks` entry. The hooks behave identically with either package and across v6 and v7, so `react-router-dom`-based apps and `react-router`-only v7 apps both work with no extra setup)
- **Node.js** ≥ 18
- **TypeScript** ≥ 5 recommended for full type inference (the package works with plain JavaScript too, just without compile-time param checking)

---

## Contributing

Issues and pull requests are welcome.

1. Fork the repo and create a branch for your change.
2. Add or update tests for any behavioural change — see [Testing](#testing).
3. Run `npm run lint` and `npm test` before opening a PR.
4. Keep commit messages conventional (`feat:`, `fix:`, `docs:`, …) — this repo uses [standard-version](https://github.com/conventional-changelog/standard-version) for releases.

---

## License

MIT
