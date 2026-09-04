# Changelog

All notable changes to this project will be documented in this file.

---

## [1.5.1](https://github.com/mhsmustafa84/react-routes-forge/compare/v1.5.0...v1.5.1) (2026-09-04)


### Features

* **next**: `useNavigateTo()` now returns a function with a `.prefetch(path, options?)` method, wrapping `router.prefetch()` from `next/navigation`. The options type is derived automatically from the Next.js `AppRouter` signature via the `Parameters` utility type — no manual type annotation needed.
* **hooks & next**: `useTypedSearchParams<T>()` now accepts a generic type parameter `T extends QueryParams`. Passing `T` gives you a strongly-typed `query` object and a constrained setter. Omitting `T` falls back to the previous untyped `QueryParams` shape — fully backwards-compatible.
* **types**: New exported type `QueryParamValue` — the union type for a single query parameter value (`string | number | boolean | array | null | undefined | QueryParams`). Previously this was inlined inside the `QueryParams` definition and not accessible to consumers.


### Bug Fixes

* **types**: Replace `any` with `unknown` in the `setDeepProperty` internal helper (`src/core/query.ts`). The `obj` and `value` parameters now use `Record<string, unknown>` and `unknown` respectively, eliminating implicit `any` from the library's type surface and satisfying strict `noImplicitAny` / `eslint@typescript-eslint/no-explicit-any` rules.
* **types**: `useNavigateTo` Next.js prefetch options were previously typed as `{ kind?: any }` with an `as any` cast. They now use `Parameters<ReturnType<typeof useRouter>["prefetch"]>[1]`, which automatically mirrors whatever Next.js exports — no risk of drift between library and framework types.


### Refactoring

* **next**: Removed redundant `typeof window === 'undefined'` SSR guards from all Next.js hooks (`useActivePath`, `useNavigateTo`, `useRouteParams`, `useTypedSearchParams`). Next.js enforces the `"use client"` boundary at build time, making runtime window checks unnecessary and potentially misleading to users trying to diagnose SSR issues.
* **next**: The `useTypedSearchParams` setter now delegates to the `appendQuery` core utility instead of manually constructing a `URLSearchParams` string. This guarantees consistent serialization — bracket notation for nested objects, proper array key repetition, falsy value preservation — matching the behavior of `appendQuery` and `.build()` across the rest of the API.
* **hooks**: The same `appendQuery` refactor applied to `useTypedSearchParams` in the React Router entry point (`react-routes-forge/hooks`).

---

## [1.5.0](https://github.com/mhsmustafa84/react-routes-forge/compare/v1.4.2...v1.5.0) (2026-09-03)


### Features

* **next**: Added a dedicated `react-routes-forge/next` entry point providing Next.js App Router and Pages Router equivalents of all four hooks: `useActivePath`, `useNavigateTo`, `useRouteParams`, and `useTypedSearchParams`. All hooks are backed by `next/navigation` and require `"use client"` in the consuming component. The API is intentionally identical to the React Router variants so switching between environments requires only changing the import path.
* **core**: Added `buildRelative` utility for generating paths without a leading slash — useful in sub-app navigation, same-origin `fetch` calls, or situations where an absolute path would be incorrect.
* **core**: Added a `locale` option to `buildPath` (and `.build()`) for prepending an i18n locale segment to the generated URL. Accepts a locale string with or without a leading slash (e.g. `"fr"` or `"/en-US"`).
* **hooks**: Added `"use client"` directives and SSR guards to React Router hooks to prevent accidental server-side execution and produce clearer error messages when hooks are called outside a client context.


### Bug Fixes

* **core**: Improved edge case handling in `extractParamsFromPath`, `isActivePath`, and `buildPath` for paths with consecutive slashes, empty segments, and trailing wildcards.

---

## [1.4.2](https://github.com/mhsmustafa84/react-routes-forge/compare/v1.4.1...v1.4.2) (2026-08-15)

Patch release. Internal build and type declaration fixes — no public API changes.

---

## [1.4.1](https://github.com/mhsmustafa84/react-routes-forge/compare/v1.4.0...v1.4.1) (2026-08-15)


### Bug Fixes

* **core**: `isActivePath` now correctly respects both `exact` and `caseSensitive` options that were previously being ignored in certain code paths. The `exact: false` prefix-matching mode was treating the path separator inconsistently.
* **core**: `getBreadcrumbs` now orders breadcrumb items by actual path depth (number of `/` segments) rather than by template string length. This fixes incorrect ordering for routes whose templates happen to be longer strings but represent shallower paths.

---

## [1.4.0](https://github.com/mhsmustafa84/react-routes-forge/compare/v1.3.0...v1.4.0) (2026-08-15)


### Features

* **hooks**: All hooks in `react-routes-forge/hooks` now work identically with `react-router-dom` v6, `react-router-dom` v7, `react-router` v6, and `react-router` v7 — tested and verified across all four combinations. The hooks import from a compatibility shim that resolves the correct hook regardless of which package and version is installed, eliminating the duplicate-version risk that existed when both `react-router` and `react-router-dom` were present in a monorepo.

---

## [1.3.0](https://github.com/mhsmustafa84/react-routes-forge/compare/v1.2.0...v1.3.0) (2026-08-01)


### Features

* **core**: Static routes (paths without `:params`) now have a `.build(query?, options?)` method attached, providing a consistent API regardless of whether a route is static or dynamic. Previously, callers had to use the route string directly for static routes and `.build()` only for dynamic ones.
* **core**: Added splat (`*`) segment support across the entire core API — `buildPath`, `.build()`, `extractParamsFromPath`, `isActivePath`, `matchPath`, and `flattenRoutes`. A trailing `/*` captures everything after it into a `*` param, matching React Router semantics.
* **core**: `defineRoutes` now validates the route tree on initialization. It emits a `console.warn` in development when two different keys resolve to the same path string, or when a static route is shadowed by a more-specific dynamic route.
* **core**: Added `appendQuery` utility for appending query strings to an existing path, and updated `extractQueryFromPath` to correctly ignore hash fragments when parsing. Both utilities support bracket notation for nested objects (`user[name]=John`) and repeated keys for arrays.
* **core**: Added `coerceNumbers` option to `extractQueryFromPath` to convert numeric strings to `number` values (complementing the existing `coerceBooleans`). Also added `clearPathCache()` for resetting internal regex caches in long-running processes or between tests.
* **core**: Exported the `RouteTree` type for annotating plain route objects before passing them to `defineRoutes()`. Also exported `PathParams`, `BuildPathOptions`, `FlatRoute`, `BreadcrumbItem`, `BreadcrumbOptions`, `StaticRoute`, `DynamicRoute`, and `MatchPathOptions`.
* **hooks**: Added `useActivePath(template, options?)` — a reactive wrapper around `isActivePath` that reads the current location via `useLocation()`. Matching semantics mirror React Router's `NavLink`: case-insensitive by default, trailing slashes tolerated, `exact: true` by default.
* **hooks**: Added `useTypedSearchParams(options?)` — a typed, reactive wrapper for reading and writing URL query parameters. Returns a `[query, setQuery]` tuple; the setter generates a new URL and calls `navigate()`.
* **hooks**: `useRouteParams` now accepts a dynamic route from your `PATHS` tree as an argument and infers the param names automatically from its `paramNames` array — no manual generic required.
* **core**: `isActivePath` matching semantics updated to mirror React Router's `NavLink` behavior — case-insensitive by default, trailing slashes normalized, `exact: true` requires a full path match.
* **core**: `getBreadcrumbs` now accepts a static `labels` map (`{ [routeKey]: string }`) in addition to the existing `labelResolver` function. When both are provided, the labels map takes precedence.


### Bug Fixes

* **core**: Corrected param extraction to align with React Router's `:paramName` parsing rules. Previously, params containing uppercase letters or underscores were not matched correctly.
* **core**: Fixed optional param segment handling (`:param?`) for correct segment matching, URL encoding of param values, and correct behavior when the optional segment is absent.
* **hooks**: `useRouteParams` now correctly infers param types from `route.paramNames` when a route object is passed, rather than falling back to `string`.
* **types**: `ExtractParams` kept valid for widened `DynamicRoute` values where the template string type has been broadened to `string`.

---

## [1.2.0](https://github.com/mhsmustafa84/react-routes-forge/compare/v1.1.3...v1.2.0) (2026-07-26)


### Features

* **core**: Added hash fragment support (`#section`) to `buildPath` and all `.build()` methods via a `hash` option in the options bag. The hash value is appended after the query string in the generated URL and stripped from the template when matching.
* **core**: Added `getBreadcrumbs(routes, currentPath, options?)` utility that traverses your route tree and returns a sorted array of `BreadcrumbItem` objects — one per ancestor path that is a prefix of `currentPath`, plus the current leaf. Each item includes `key`, `path`, `label`, and `isCurrent`. Supports a `labelResolver` callback and a `labels` map for per-route label overrides.
* **core**: Exposed `matchPath(template, options?)` as a public utility. It compiles a route template into an anchored `RegExp` (with optional `caseSensitive` and `end` flags) for custom path matching logic outside of the hook layer.


### Bug Fixes

* **core**: Fixed a polynomial backtracking issue in the internal route-matching regex by splitting the single regex into two sequential operations. This prevents catastrophic backtracking on deeply nested or malformed paths.

---

## [1.1.3](https://github.com/mhsmustafa84/react-routes-forge/compare/v1.1.2...v1.1.3) (2026-07-26)

Patch release. Type declaration packaging fix — no public API changes.

---

## [1.1.2](https://github.com/mhsmustafa84/react-routes-forge/compare/v1.1.1...v1.1.2) (2026-07-26)

Patch release. Build output fix for CommonJS consumers — no public API changes.

---

## [1.1.1](https://github.com/mhsmustafa84/react-routes-forge/compare/v1.1.0...v1.1.1) (2026-07-26)


### Bug Fixes

* **core**: Fixed handling of optional param segments (`:param?`) — the segment is now correctly treated as optional in `buildPath`, `extractParamsFromPath`, and `matchPath`. Previously, optional params were required at build time and caused incorrect regex matches when absent.

---

## [1.1.0](https://github.com/mhsmustafa84/react-routes-forge/compare/v1.0.3...v1.1.0) (2026-07-12)


### Features

* **core**: Added query parameter support to `buildPath` and `.build()`. Pass a query object as the second argument; it is serialized using repeated keys for arrays and bracket notation for nested objects. Falsy values (`0`, `false`, `""`) are preserved; `null` and `undefined` are skipped.
* **core**: Added strict mode via `{ strict: true }` in the options bag. When enabled, `buildPath` throws a `RangeError` instead of emitting a `console.warn` when a required param is missing. Recommended for test environments or critical navigation flows.
* **core**: Added `flattenRoutes(routes, prefix?)` utility that produces a flat `FlatRoute[]` array from any nested route tree — useful for sitemap generation, route auditing, or programmatic navigation menus.


### Bug Fixes

* **core**: Implemented `appendQuery` as a standalone function to replace the previous ad-hoc inline query string construction. `appendQuery` is used internally by `buildPath` and is also exported for direct use.

---

## [1.0.3](https://github.com/mhsmustafa84/react-routes-forge/compare/v1.0.2...v1.0.3) (2026-07-11)

Patch release. Package metadata and exports field fixes.

---

## [1.0.2](https://github.com/mhsmustafa84/react-routes-forge/compare/v1.0.1...v1.0.2) (2026-07-11)

Initial public release.

* **core**: `defineRoutes` — wraps a plain nested route object and attaches `.build(params, query?, options?)` to every dynamic route and `.build(query?, options?)` to every static route. Route values remain genuine primitive strings at runtime, ensuring they work directly with `<Route path={...} />` without unwrapping.
* **core**: `buildPath(template, params, query?, options?)` — standalone path builder, the underlying function powering `.build()`.
* **core**: `isActivePath(pathname, template, options?)` — checks whether a URL pathname matches a route template string.
* **core**: `extractParamsFromPath(template, pathname)` — extracts named param values from a real URL given a template.
* **core**: `joinPaths(...segments)` — joins path segments with correct slash handling.
* **core**: `getParamNames(template)` — returns the param names present in a template string.
* **core**: `devWarn(message)` — emits a `console.warn` in non-production environments only.
* **hooks**: `useRouteParams<T>()` — typed wrapper around React Router's `useParams`.
* **hooks**: `useNavigateTo()` — typed wrapper around React Router's `useNavigate` that accepts any string or route value.
* **hooks**: `useResolvedPath(template, params, query?, options?)` — resolves a route template to a full URL string without navigating, useful for `href` generation.
