# react-routes-forge

**Type-safe route definitions with automatic path builders for React apps.**

One source of truth for your routes — templates for `<Route path={...} />` and typed builders for navigation — with no duplication and no manual string concatenation.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](#)
[![Node.js 24+](https://img.shields.io/badge/Node.js-24+-green.svg)](#requirements)
[![Combined CI/CD](https://github.com/mhsmustafa84/react-routes-forge/actions/workflows/ci-security.yml/badge.svg)](https://github.com/mhsmustafa84/react-routes-forge/actions/workflows/ci-security.yml)

---

## Table of contents

- [Why react-routes-forge?](#why-react-routes-forge)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Cheat sheet](#cheat-sheet)
- [Core concepts](#core-concepts)
- [API reference](#api-reference)
  - [`defineRoutes(routeMap)`](#defineroutesroutemap)
  - [`build(template, params, query?, options?)`](#buildtemplate-params-query-options)
  - [`isActivePath(currentPath, template, options?)`](#isactivepathcurrentpath-template-options)
  - [`extractParamsFromPath(template, resolvedPath)`](#extractparamsfrompathtemplate-resolvedpath)
  - [`joinPaths(...segments)`](#joinpathssegments)
  - [`getParamNames(template)`](#getparamnamestemplate)
  - [`flattenRoutes(routes)`](#flattenroutesroutes)
  - [`getBreadcrumbs(routes, currentPath, options?)`](#getbreadcrumbsroutes-currentpath-options)
- [React hooks](#react-hooks)
  - [`useRouteParams<T>()`](#useroutparamst)
  - [`useNavigateTo()`](#usenavigateto)
  - [`useResolvedPath(template, params, query?, options?)`](#useresolvedpathtemplate-params-query-options)
- [Query string support](#query-string-support)
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
- **Zero runtime dependencies** for the core API — React Router is an optional peer dependency, only required if you use the hooks
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

React Router is an **optional** peer dependency — only needed if you use the bundled hooks (`useRouteParams`, `useNavigateTo`, `useResolvedPath`).

```bash
npm install react-router-dom   # only if you're using the hooks
# or
pnpm add react-router-dom
# or
yarn add react-router-dom
# or
bun add react-router-dom
```

> **Note:** this package ships ESM-only. See [Known behaviours & gotchas](#known-behaviours--gotchas) for details.

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

```ts
// Navigating — call .build() to resolve a dynamic path into a real URL
navigate(PATHS.USERS.EDIT.build({ id: 42 })); // '/users/edit/42'
navigate(PATHS.ROLES.PERMISSIONS.build({ name: "admin" })); // '/roles/permissions/admin'
navigate(PATHS.HOME); // '/'
```

That's the entire API surface you need for most apps. Everything below covers the rest of the toolkit.

---

## Cheat sheet

Quick reference for everything the package exports. Click through to the full section for details and examples.

| Export                                                                                         | Kind     | Purpose                                                   |
| ---------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------- |
| [`defineRoutes(routeMap)`](#defineroutesroutemap)                                              | function | Builds the typed `PATHS` object from a nested route map   |
| [`build(template, params, query?, options?)`](#buildtemplate-params-query-options)             | function | Resolve a template into a URL without `defineRoutes`      |
| [`isActivePath(currentPath, template, options?)`](#isactivepathcurrentpath-template-options)   | function | Check if a path matches a template (nav-highlighting)     |
| [`extractParamsFromPath(template, resolvedPath)`](#extractparamsfrompathtemplate-resolvedpath) | function | Pull param values back out of a resolved URL              |
| [`joinPaths(...segments)`](#joinpathssegments)                                                 | function | Join and normalize path segments                          |
| [`getParamNames(template)`](#getparamnamestemplate)                                            | function | List the `:param` names in a template                     |
| [`flattenRoutes(routes)`](#flattenroutesroutes)                                                | function | Flatten a `PATHS` tree for sitemaps / duplicate detection |
| [`getBreadcrumbs(routes, currentPath, options?)`](#getbreadcrumbsroutes-currentpath-options)    | function | Build a breadcrumb trail from a route tree and current URL |
| [`useRouteParams<T>()`](#useroutparamst)                                                       | hook     | Typed wrapper around React Router's `useParams`           |
| [`useNavigateTo()`](#usenavigateto)                                                            | hook     | Typed wrapper around React Router's `useNavigate`         |
| [`useResolvedPath(...)`](#useresolvedpathtemplate-params-query-options)                        | hook     | Resolve a template to a string without navigating         |
| `.build(params, query?, options?)`                                                             | method   | On every dynamic route — resolves to a concrete URL       |
| `.paramNames`                                                                                  | property | On every dynamic route — the param names it expects       |

---

## Core concepts

| Route type  | Example                 | Behaves as                              | Gains                                                |
| ----------- | ----------------------- | --------------------------------------- | ---------------------------------------------------- |
| **Static**  | `HOME: '/'`             | Plain string primitive                  | Nothing extra — use it directly                      |
| **Dynamic** | `DETAILS: '/users/:id'` | String-like (coercible to its template) | `.build(params, query?, options?)` and `.paramNames` |

`defineRoutes()` walks your route object recursively, leaving static paths untouched and wrapping any path containing a `:param` segment so it can carry a builder alongside its template string.

---

## API reference

### `defineRoutes(routeMap)`

Creates a fully typed route object from a nested plain object.

- Static paths are returned as-is — use them directly anywhere a string is expected (e.g. `<Route path={...} />`).
- Dynamic paths (containing `:param`) gain:
  - **`.build(params, query?, options?)`** — resolves the template into a concrete URL
  - **`.paramNames`** — array of the param names extracted from the template, e.g. `['id']`

Nesting is unlimited — organize routes into as many groups and sub-groups as your app needs.

```ts
const PATHS = defineRoutes({
  SERVICES: {
    ROOT: "/services",
    BENEFICIARY_CARE_CENTER: {
      DETAILS: "/services/beneficiary-care-center/:id",
      EDIT: "/services/beneficiary-care-center/edit/:id",
    },
  },
} as const);

PATHS.SERVICES.ROOT; // '/services'
PATHS.SERVICES.BENEFICIARY_CARE_CENTER.EDIT.build({ id: 7 }); // '/services/beneficiary-care-center/edit/7'
PATHS.SERVICES.BENEFICIARY_CARE_CENTER.EDIT.paramNames; // ['id']
```

> Always pass `as const` to `defineRoutes()` — it preserves the literal string types that power `.build()`'s compile-time param checking.

---

### `build(template, params, query?, options?)`

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
// ✗ throws RangeError: [route-forge] Missing required param(s) ":id" in template "/users/:id".
```

---

### `isActivePath(currentPath, template, options?)`

Checks whether a resolved path matches a route template — the building block for nav-highlighting ("is this link active?"). Query strings on `currentPath` are ignored automatically.

```ts
import { isActivePath } from "react-routes-forge";

isActivePath("/users/42", "/users/:id"); // true
isActivePath("/users/42/posts", "/users/:id"); // false (exact match by default)
isActivePath("/users/42/posts", "/users/:id", { exact: false }); // true  (prefix match)
isActivePath("/users/42?tab=profile", "/users/:id"); // true  (query string ignored)
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
getParamNames("/users"); // → []
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
  labelResolver: (key) => key.split(".").pop()!.replace(/_/g, " ").toUpperCase(),
});
// → [{ label: "HOME" }, { label: "ROOT" }, { label: "EDIT" }]
```

**Pre-flattened input** — pass a cached `flattenRoutes()` result instead of the tree:

```ts
const flat = flattenRoutes(PATHS);
getBreadcrumbs(flat, "/users/edit/42"); // same result as passing the tree
```

---

## React hooks

Import these only if you're using React Router — they're tree-shakeable and won't be bundled unless imported.

### `useRouteParams<T>()`

Typed wrapper around React Router's `useParams`. Pass the route's template string as a generic to get a correctly typed params object back — no casting, and it works for any number of `:param` segments.

```tsx
import { useRouteParams } from "react-routes-forge";

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
```

---

### `useNavigateTo()`

Thin, typed wrapper around `useNavigate()` that accepts a resolved path (the output of `.build()`) along with the usual navigation options.

```tsx
import { useNavigateTo } from "react-routes-forge";
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

Resolves a path template to a concrete URL string without navigating — useful for `<Link to={...} />`, preloading, or building a URL for something other than `navigate()`. Backed by React Router's `generatePath`, so it correctly supports splat (`*`) and optional (`:param?`) segments. Accepts the same `query` and `options` as [`build()`](#buildtemplate-params-query-options).

```tsx
import { useResolvedPath } from "react-routes-forge";

const path = useResolvedPath("/users/:id", { id: 42 });
// → '/users/42'

const path = useResolvedPath("/users/:id", { id: 42 }, { tab: "info" });
// → '/users/42?tab=info'

// Strict mode — throws RangeError instead of warning on missing params
const path = useResolvedPath("/users/:id", {}, undefined, { strict: true });
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

**`null` and `undefined` values are dropped**, so you can pass optional filters without conditionally building the object:

```ts
build("/users", {}, { sort: "asc", filter: undefined });
// → '/users?sort=asc'
```

Static routes don't have a fluent `.build()` (there's nothing to interpolate), so use the standalone `build()` util to attach a query string to them:

```ts
import { build } from "react-routes-forge";

build(PATHS.USERS.ROOT, {}, { sort: "asc", page: 2 });
// → '/users?sort=asc&page=2'
```

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

### Dynamic routes are `String` objects, not primitives

`defineRoutes` wraps dynamic paths in [`String` objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/String) so that `.build()` and `.paramNames` can be attached as properties. This means:

```ts
// ✓ These all work as expected
String(PATHS.USERS.EDIT); // '/users/edit/:id'
`${PATHS.USERS.EDIT}`; // '/users/edit/:id'
PATHS.USERS.EDIT == "/users/edit/:id"; // true  (loose equality)

// ✗ Watch out for these
typeof PATHS.USERS.EDIT; // 'object' ← not 'string'
PATHS.USERS.EDIT === "/users/edit/:id"; // false    ← strict equality fails
```

Prefer template literals or explicit `String()` coercion when comparing dynamic route values, and avoid using them as plain object/`Map` keys. Static routes (`HOME`, `USERS.ROOT`, …) remain genuine string primitives and are unaffected.

### `useResolvedPath` vs. the library's own `buildPath`

`useResolvedPath` delegates to React Router's `generatePath` when all params are present, which correctly handles splat (`*`) and optional (`:param?`) segments that the library's own regex-based substitution does not. If params are missing, it falls back to the same `buildPath`/strict-mode behaviour described above — so failure modes stay consistent, but full splat/optional support is only guaranteed via the hook, not via `.build()`.

### ESM-only package

This package ships **ESM only** (`"type": "module"`, no `require` export condition). Consumers on a plain CommonJS setup (`require('react-routes-forge')`) are not supported. All modern bundlers (Vite, Webpack ≥ 5, esbuild, Rollup) handle ESM packages transparently. If you're in a CJS-only environment, you'll need a bundler transform or a compatibility shim.

---

## TypeScript support

Written in strict TypeScript with no `any` in the public API surface. Param types for `.build()` are inferred directly from each path template via a recursive template-literal type, so:

```ts
PATHS.USERS.EDIT.build({ id: 42 }); // ✓ compiles
PATHS.USERS.EDIT.build({}); // ✗ compile error — 'id' is required
PATHS.USERS.EDIT.build({ userId: 42 }); // ✗ compile error — 'id' expected, not 'userId'
```

`.paramNames` is similarly typed as a literal array of the exact param names in the template, not a generic `string[]`.

---

## Testing

The package ships with a full test suite covering the core builder/utility functions and the React hooks, including strict-mode behaviour, query string edge cases (arrays, `null`/`undefined` filtering), nested route groups, and duplicate-path detection via `flattenRoutes`.

```bash
npm test            # run the full suite once
npm run test:watch  # watch mode

# equivalent with other package managers
pnpm test / pnpm test:watch
yarn test / yarn test:watch
bun test / bun test:watch
```

If you're contributing, new behaviour should come with a matching test — the existing suite is organized by function/hook, so add cases alongside the relevant `describe` block rather than starting a new file.

---

## Requirements

- **React** ≥ 17 (peer dependency)
- **react-router-dom** ≥ 6 (optional peer dependency — required only for the bundled hooks)
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
