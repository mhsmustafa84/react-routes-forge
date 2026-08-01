# react-routes-forge

**Type-safe route definitions with automatic path builders for React apps.**

One source of truth for your routes — templates for `<Route path={...} />` and typed builders for navigation — with no duplication and no manual string concatenation.

<div style="display: flex; gap: 8px; flex-wrap: wrap; margin: 16px 0;">
  <a href="https://github.com/mhsmustafa84/react-routes-forge/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/TypeScript-strict-blue.svg" alt="TypeScript strict">
  <img src="https://img.shields.io/badge/Node.js-18+-green.svg" alt="Node.js 18+">
  <img src="https://img.shields.io/badge/Dual%20ESM%2FCJS-brightgreen.svg" alt="ESM + CommonJS">
</div>

## What is react-routes-forge?

`react-routes-forge` is a tiny, dependency-free toolkit that turns a plain route map into a fully typed object of paths and path builders. Each route key serves double duty:

- **The template** — passed straight to `<Route path={...} />`.
- **The builder** — `.build(params)` produces a real, type-checked URL for navigation.

Because the template and the builder come from the **same key**, they can never drift apart.

```ts
import { defineRoutes } from "react-routes-forge";

export const PATHS = defineRoutes({
  USERS: {
    ROOT: "/users",                 // static   → used directly
    EDIT: "/users/edit/:id",        // dynamic  → .build() with typed params
  },
} as const);

PATHS.USERS.ROOT;                       // '/users'
PATHS.USERS.EDIT;                       // '/users/edit/:id'
PATHS.USERS.EDIT.build({ id: 42 });     // '/users/edit/42'
```

It plugs straight into React Router with zero configuration, and the React hooks entry adds typed `useParams`, navigation, active-link matching, and search-param handling — all without dragging `react-router-dom` into the core package.

> 🚀 See it in action in the [live demo (POC)](https://mhsmustafa84.github.io/react-routes-forge-poc).

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

export const userDetailPath = (id) => `/users/${id}`; // hand-written builder
```

Dynamic routes need a **second** entry alongside the template — a hand-written function to build the real URL. As the app grows, the two drift apart, and nothing stops the template and the builder from disagreeing.

`react-routes-forge` collapses both into a single key:

```ts
// ✅ One key, two uses
export const PATHS = defineRoutes({
  USERS: {
    ROOT: "/users",
    DETAILS: "/users/:id",
  },
} as const);

PATHS.USERS.ROOT;                     // '/users'              → static, used directly
PATHS.USERS.DETAILS;                  // '/users/:id'          → use in <Route path={...} />
PATHS.USERS.DETAILS.build({ id: 42 });// '/users/42'           → use when navigating
```

## Quick Tour

Define routes once, then consume them everywhere:

```tsx
import { Routes, Route, Link } from "react-router-dom";
import { PATHS } from "./paths";

function App() {
  return (
    <Routes>
      {/* templates work directly as strings */}
      <Route path={PATHS.USERS.ROOT} element={<UserList />} />
      <Route path={PATHS.USERS.EDIT} element={<EditUser />} />
    </Routes>
  );
}

function UserList() {
  return (
    <>
      {/* typed builders for navigation */}
      <Link to={PATHS.USERS.EDIT.build({ id: 42 })}>Edit user 42</Link>
    </>
  );
}
```

React hooks round out the common router tasks:

```tsx
import { useActivePath, useRouteParams } from "react-routes-forge/hooks";

function EditUser() {
  const { id } = useRouteParams(PATHS.USERS.EDIT);  // typed params, no casting
  const isActive = useActivePath(PATHS.USERS.EDIT); // nav highlighting
  // ...
}
```

## Key Features

- **Single source of truth** — no duplicate template/builder pairs to keep in sync
- **Compile-time param safety** — `.build()` is typed from the path string itself; missing or misspelled params are TypeScript errors
- **Query string support** — built into `.build()`, no manual `URLSearchParams` wrangling
- **Hash fragment support** — append `#hash` via the options bag
- **Splat (`*`) segments** — supported across the entire core API, not just the hooks
- **Route validation** — development-time warnings for missing `/`, non-trailing splats, duplicate paths, and static routes shadowed by a dynamic route
- **Typed query parsing** — `extractQueryFromPath()` coerces booleans and numbers; `useTypedSearchParams()` brings it to components
- **Breadcrumbs** — automatic breadcrumb generation from your route tree, with per-route label overrides
- **Zero runtime dependencies** for the core API — React Router is an optional peer dependency
- **Deep nesting** — organize routes into as many nested groups as your app needs
- **React hooks** — `useRouteParams`, `useNavigateTo`, `useResolvedPath`, `useActivePath`, `useTypedSearchParams`
- **Separate hooks entry** — React hooks live under `react-routes-forge/hooks`, so the core package never pulls in `react-router-dom`
- **ESM + CommonJS** — dual builds with proper `exports` conditions for bundlers and Node.js `require()`

## Route Types

| Route type  | Example                 | Behaves as                              | Gains                                                                 |
| ----------- | ----------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| **Static**  | `HOME: '/'`             | String-like (coercible to its template) | `.build(query?, options?)` — attach query/hash, no params to fill      |
| **Dynamic** | `DETAILS: '/users/:id'` | String-like (coercible to its template) | `.build(params, query?, options?)` and `.paramNames`                  |
| **Splat**   | `FILES: '/files/*'`     | String-like (coercible to its template) | `.build(params, query?, options?)` and `.paramNames`                  |

## Next Steps

- [Getting Started](/getting-started) — install and first route definition
- [defineRoutes](/api/define-routes) — start with the core API
- [React Hooks](/hooks/use-route-params) — typed hooks for React Router integration
- [Query & Hash Support](/api/build#query-string-serialization) — query strings and hash fragments
- [Strict Mode](/strict-mode) — catching missing params at compile time
- [Migration Guide](/migration) — migrate from manual path patterns
- [TypeScript Support](/typescript-support) — type inference details
