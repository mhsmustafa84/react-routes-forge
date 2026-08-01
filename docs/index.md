# react-routes-forge

**Type-safe route definitions with automatic path builders for React apps.**

One source of truth for your routes — templates for `<Route path={...} />` and typed builders for navigation — with no duplication and no manual string concatenation.

<div style="display: flex; gap: 8px; flex-wrap: wrap; margin: 16px 0;">
  <a href="https://github.com/mhsmustafa84/react-routes-forge/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/TypeScript-strict-blue.svg" alt="TypeScript strict">
  <img src="https://img.shields.io/badge/Node.js-18+-green.svg" alt="Node.js 18+">
</div>

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

PATHS.USERS.ROOT;            // '/users'            → static, used directly
PATHS.USERS.DETAILS;         // '/users/:id'        → use in <Route path={...} />
PATHS.USERS.DETAILS.build({ id: 42 }); // '/users/42' → use when navigating
```

## Key Features

- **Single source of truth** — no duplicate template/builder pairs to keep in sync
- **Compile-time param safety** — `.build()` is typed from the path string itself; missing or misspelled params are TypeScript errors
- **Query string support** — built into `.build()`, no manual `URLSearchParams` wrangling
- **Hash fragment support** — append `#hash` via the options bag
- **Splat (`*`) segments** — supported across the entire core API, not just the hooks
- **Route validation** — development-time warnings for missing `/`, non-trailing splats, and duplicate paths
- **Zero runtime dependencies** for the core API — React Router is an optional peer dependency
- **Deep nesting** — organize routes into as many nested groups as your app needs
- **Breadcrumbs** — automatic breadcrumb generation from your route tree, with per-route label overrides
- **React hooks** — `useActivePath`, `useTypedSearchParams`, `useRouteParams`, `useNavigateTo`, `useResolvedPath`
- **Separate hooks entry** — React hooks are published under `react-routes-forge/hooks`, so the core package never pulls in `react-router-dom`
- **ESM + CommonJS** — dual builds with proper `exports` conditions for bundlers and Node.js `require()`

## Route Types

| Route type  | Example                 | Behaves as                              | Gains                                                                 |
| ----------- | ----------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| **Static**  | `HOME: '/'`             | String-like (coercible to its template) | `.build(query?, options?)` — attach query/hash, no params to fill      |
| **Dynamic** | `DETAILS: '/users/:id'` | String-like (coercible to its template) | `.build(params, query?, options?)` and `.paramNames`                  |
| **Splat**   | `FILES: '/files/*'`     | String-like (coercible to its template) | `.build(params, query?, options?)` and `.paramNames`                  |

## Quick Links

- [Getting Started](/getting-started) — install and first route definition
- [API Reference](/api/define-routes) — full API documentation
- [React Hooks](/hooks/use-route-params) — typed hooks for React Router integration
- [Query & Hash Support](/query-hash) — query strings and hash fragments
- [Strict Mode](/strict-mode) — catching missing params at compile time
- [Migration Guide](/migration) — migrate from manual path patterns
- [TypeScript Support](/typescript-support) — type inference details
