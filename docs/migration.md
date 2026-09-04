# Migration Guide

This guide covers every version of `react-routes-forge` — what changed, what new patterns are available, and how to update your code. All releases have been backwards-compatible unless explicitly stated.

---

## Version history at a glance

| Version | Date | Highlights |
| ------- | ---- | ---------- |
| [v1.6.0](#upgrading-to-v160) | 2026-09-04 | Nested query params (bracket notation), `useTypedSearchParams<T>` generic, `useNavigateTo().prefetch()`, `QueryParamValue` type |
| [v1.5.0](#upgrading-to-v150) | 2026-09-03 | Next.js hooks (`/next`), `buildRelative`, locale support, SSR guards |
| [v1.4.x](#upgrading-to-v14x) | 2026-08-15 | React Router v6 & v7 cross-compatibility |
| [v1.3.x](#upgrading-to-v13x) | 2026-08-01 | Static `.build()`, splat routes, `useActivePath`, `useTypedSearchParams`, query helpers |
| [v1.2.x](#upgrading-to-v12x) | 2026-07-26 | Hash fragments, breadcrumbs, `matchPath` |
| [v1.1.x](#upgrading-to-v11x) | 2026-07-12 | Query parameter support, strict mode, `flattenRoutes` |
| [v1.0.x](#upgrading-to-v10x) | 2026-07-11 | Initial release |

---

## Upgrading to v1.6.0

**No breaking changes.** All existing code continues to work without modification.

### 1. Nested query parameters with bracket notation

In v1.6.0, query parameter utilities (`appendQuery`, `buildPath`, `.build()`) now support nested objects by automatically serializing them into standard bracket notation. In addition, `extractQueryFromPath` parses bracket notation back into nested JavaScript objects.

```ts
// Serializing nested objects with .build() or appendQuery:
PATHS.USERS.ROOT.build(undefined, {
  filter: { status: "active", role: "admin" },
  sort: "name",
});
// → '/users?filter[status]=active&filter[role]=admin&sort=name'

// Deeply nested objects are fully supported:
appendQuery("/search", {
  settings: { pagination: { page: 1, limit: 20 } },
});
// → '/search?settings[pagination][page]=1&settings[pagination][limit]=20'

// Parsing bracket notation back into nested objects:
extractQueryFromPath("/search?settings[pagination][page]=1&settings[pagination][limit]=20", {
  coerceNumbers: true,
});
// → { settings: { pagination: { page: 1, limit: 20 } } }
```

Updating nested parameters with `setQuery` in `useTypedSearchParams` or with `appendQuery` automatically cleans up existing keys under that root key before serializing the new object.

### 2. `useTypedSearchParams<T>` — generic type parameter

Previously the hook always returned the generic `QueryParams` type. You can now pass your own query shape as a type argument for compile-time safety on both the returned object and the setter.

```ts
// Before (v1.5.0) — still works, no changes required
const [query, setQuery] = useTypedSearchParams({ coerceNumbers: true });
// query is typed as QueryParams — all values are QueryParamValue

// After (v1.6.0) — opt-in generic for strong typing
type Filters = { page?: number; sort?: string; active?: boolean };

const [query, setQuery] = useTypedSearchParams<Filters>({ coerceNumbers: true });
// query.page is now typed as number | undefined ✓
// setQuery only accepts keys from Filters ✓
```

Works identically for both `react-routes-forge/hooks` (React Router) and `react-routes-forge/next` (Next.js).

### 3. `useNavigateTo().prefetch()` — Next.js only

The `useNavigateTo` hook from `react-routes-forge/next` now returns a function with an attached `.prefetch()` method, enabling route prefetching on hover or any other trigger without a separate `useRouter()` call.

```tsx
// Before (v1.5.0) — had to reach for useRouter() directly
import { useRouter } from "next/navigation";
const router = useRouter();
router.prefetch(PATHS.USERS.DETAILS.build({ id }));

// After (v1.6.0) — prefetch via the same navigateTo handle
import { useNavigateTo } from "react-routes-forge/next";
const navigateTo = useNavigateTo();

<div
  onMouseEnter={() => navigateTo.prefetch(PATHS.USERS.DETAILS.build({ id }))}
  onClick={() => navigateTo(PATHS.USERS.DETAILS.build({ id }))}
/>
```

### 4. New `QueryParamValue` exported type

The value type for a single query param (previously inlined inside `QueryParams`) is now exported as its own named type.

```ts
// v1.6.0+
import type { QueryParamValue } from "react-routes-forge";
// type QueryParamValue = string | number | boolean
//   | (string | number | boolean | null | undefined)[]
//   | null | undefined | QueryParams

function serializeParam(value: QueryParamValue) { ... }
```

### 5. Removed SSR runtime guards in Next.js hooks

In v1.5.0, all Next.js hooks threw an `Error` at runtime when called outside the browser (`typeof window === 'undefined'`). These guards have been removed because Next.js already enforces the `"use client"` boundary at build time — the runtime check was redundant and produced confusing errors.

**Action needed:** If you had workarounds (e.g. conditional rendering or `useEffect` guards protecting these hook calls), they can be safely removed when using Next.js App Router with `"use client"` properly applied.

```tsx
// Before (v1.5.0) — workaround for the runtime guard
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
const navigateTo = useNavigateTo();

// After (v1.6.0) — no workaround needed
"use client";
const navigateTo = useNavigateTo(); // safe, Next.js enforces "use client" at build time
```

---

## Upgrading to v1.5.0

**No breaking changes.**

### 1. Next.js hooks — new `react-routes-forge/next` entry point

All four hooks are now available for Next.js App Router and Pages Router via a dedicated entry point backed by `next/navigation`:

```ts
import {
  useActivePath,
  useNavigateTo,
  useRouteParams,
  useTypedSearchParams,
} from "react-routes-forge/next";
```

They share the same API as their React Router counterparts in `react-routes-forge/hooks`. No code changes are needed for existing React Router users — this is purely additive.

### 2. `buildRelative` — relative path generation

A new `buildRelative` utility that generates relative paths for use cases where absolute paths are not appropriate (e.g. same-origin links or sub-app navigation):

```ts
import { buildRelative } from "react-routes-forge";

buildRelative("/users/:id", { id: 42 });
// → 'users/42'  (no leading slash)
```

### 3. `locale` option on `buildPath`

The `buildPath` function (and `.build()`) now accepts a `locale` option for prepending a locale prefix to paths, useful for i18n routing:

```ts
PATHS.USERS.DETAILS.build({ id: 42 }, undefined, { locale: "fr" });
// → '/fr/users/42'

PATHS.USERS.DETAILS.build({ id: 42 }, undefined, { locale: "/en-US" });
// → '/en-US/users/42'
```

---

## Upgrading to v1.4.x

**No breaking changes.**

### React Router v6 & v7 cross-compatibility

All hooks in `react-routes-forge/hooks` now work identically with both `react-router-dom` (v6/v7) and `react-router` (v6/v7). You can upgrade your React Router version without changing any `react-routes-forge` code.

```ts
// Works with all of these:
import { ... } from "react-router-dom"; // v6
import { ... } from "react-router-dom"; // v7
import { ... } from "react-router";     // v6
import { ... } from "react-router";     // v7
```

---

## Upgrading to v1.3.x

v1.3.0 is a significant feature release. It is fully backwards-compatible, but introduces several patterns worth adopting.

### 1. Static routes now support `.build()`

Static routes (without `:params`) gained a `.build(query?, options?)` method for attaching query strings and hash fragments consistently:

```ts
// Before (v1.2.x)
navigate(PATHS.HOME);
navigate(`${PATHS.HOME}?sort=asc`); // manual query string

// After (v1.3.x+)
navigate(PATHS.HOME.build());                          // same path
navigate(PATHS.HOME.build({ sort: "asc" }));           // with query
navigate(PATHS.HOME.build({ sort: "asc" }, { hash: "top" })); // with hash
```

### 2. Pass a PATHS route to `useRouteParams` for automatic type inference

Instead of manually providing the param name as a generic string, pass the route definition directly:

```ts
// Before (v1.2.x)
const { id } = useRouteParams<"id">();

// After (v1.3.x+) — params are inferred from the route template
const { id } = useRouteParams(PATHS.USERS.EDIT);
const { postId, commentId } = useRouteParams(PATHS.POSTS.COMMENTS.DETAIL);
```

### 3. `useActivePath` hook

Check whether the current location matches a route template — a reactive, hook-based wrapper around `isActivePath()`:

```tsx
// New in v1.3.x
import { useActivePath } from "react-routes-forge/hooks";

function Nav() {
  const isUsersActive = useActivePath(PATHS.USERS.ROOT, { exact: false });
  return <a className={isUsersActive ? "active" : ""}>Users</a>;
}
```

### 4. `useTypedSearchParams` hook

A typed, reactive wrapper for reading and writing URL query parameters:

```tsx
// New in v1.3.x
import { useTypedSearchParams } from "react-routes-forge/hooks";

function Filters() {
  const [query, setQuery] = useTypedSearchParams({ coerceBooleans: true });
  return <button onClick={() => setQuery({ page: 1 })}>Reset</button>;
}
```

### 5. Splat (`/*`) route support

Routes with a trailing `/*` capture the rest of the URL into a `*` param:

```ts
// New in v1.3.x
const PATHS = defineRoutes({ FILES: "/files/*" } as const);

PATHS.FILES.build({ "*": "docs/readme.md" });
// → '/files/docs/readme.md'

PATHS.FILES.paramNames; // → ['*']
```

### 6. Duplicate path detection

`defineRoutes` now warns in development if two different keys resolve to the same path:

```ts
// This will emit a console warning in development:
const PATHS = defineRoutes({
  A: { FOO: "/foo" },
  B: { FOO: "/foo" }, // ⚠ Duplicate!
} as const);
```

### 7. `appendQuery` and `extractQueryFromPath` helpers

New standalone utilities for query string manipulation:

```ts
import { appendQuery, extractQueryFromPath } from "react-routes-forge";

appendQuery("/users/42", { tab: "profile", tags: ["a", "b"] });
// → '/users/42?tab=profile&tags=a&tags=b'

extractQueryFromPath("/search?page=2&active=true", { coerceBooleans: true });
// → { page: '2', active: true }
```

---

## Upgrading to v1.2.x

**No breaking changes.**

### 1. Hash fragment support

`.build()` and `buildPath` now accept a `hash` option:

```ts
// New in v1.2.x
PATHS.DOCS.INTRO.build({}, { hash: "installation" });
// → '/docs/intro#installation'

buildPath("/users/:id", { id: 42 }, undefined, { hash: "settings" });
// → '/users/42#settings'
```

### 2. `getBreadcrumbs` utility

Automatically derive a breadcrumb trail from your route tree and the current URL:

```ts
// New in v1.2.x
import { getBreadcrumbs } from "react-routes-forge";

const crumbs = getBreadcrumbs(PATHS, "/users/42/settings");
// → [
//     { key: "USERS.ROOT",     label: "Users",    path: "/users",           isCurrent: false },
//     { key: "USERS.DETAILS",  label: "Details",  path: "/users/42",        isCurrent: false },
//     { key: "USERS.SETTINGS", label: "Settings", path: "/users/42/settings", isCurrent: true }
//   ]

// With custom labels:
getBreadcrumbs(PATHS, "/users/42", { labels: { "USERS.ROOT": "All Users" } });
```

### 3. `matchPath` utility

Convert a route template into an anchored `RegExp` for custom matching logic:

```ts
// New in v1.2.x
import { matchPath } from "react-routes-forge";

const regex = matchPath("/users/:id", { caseSensitive: false });
regex.test("/users/42");  // → true
regex.test("/users/");    // → false
```

---

## Upgrading to v1.1.x

**No breaking changes.**

### 1. Query parameter support in `.build()`

Pass a second argument to `.build()` for query strings:

```ts
// New in v1.1.x
PATHS.USERS.EDIT.build({ id: 42 }, { tab: "profile", page: 1 });
// → '/users/edit/42?tab=profile&page=1'

// Arrays serialize to repeated keys:
PATHS.SEARCH.build({}, { tags: ["react", "typescript"] });
// → '/search?tags=react&tags=typescript'
```

### 2. Strict mode — fail fast on missing params

Pass `{ strict: true }` to throw a `RangeError` instead of emitting a warning when a required param is missing. Recommended for test environments:

```ts
// New in v1.1.x
PATHS.USERS.EDIT.build({}, undefined, { strict: true });
// Throws: RangeError: [route-forge] Missing required param(s) ":id" in template "/users/edit/:id"

// Also works on the standalone function:
buildPath("/users/:id", {}, undefined, { strict: true });
```

### 3. `flattenRoutes` utility

Get a flat list of every route in your `PATHS` tree — useful for generating sitemaps or detecting duplicate paths:

```ts
// New in v1.1.x
import { flattenRoutes } from "react-routes-forge";

flattenRoutes(PATHS);
// → [
//     { key: "USERS.ROOT",    path: "/users" },
//     { key: "USERS.DETAILS", path: "/users/:id" },
//     ...
//   ]
```

---

## Upgrading to v1.0.x

This is the initial release. If you are migrating from raw string constants, follow the guide below.

### Migrating from raw string constants

If your routes currently look like this:

```ts
// ❌ Before — common manual pattern
export const PATHS = {
  USERS: {
    ROOT: "/users",
    DETAILS: "/users/:id",
    SETTINGS: "/users/:id/settings",
  },
};

// Hand-written builders alongside the templates — two sources of truth
export const userPath = (id: string) => `/users/${id}`;
export const userSettingsPath = (id: string) => `/users/${id}/settings`;
```

This pattern has several problems:
- Duplicate definitions — template string + separate builder function
- No type-safety — wrong or missing params are runtime bugs, not compile errors
- Templates and builders can drift apart silently over time

**Wrap with `defineRoutes` — no structural changes required:**

```ts
// ✅ After — one key, two uses
import { defineRoutes } from "react-routes-forge";

export const PATHS = defineRoutes({
  USERS: {
    ROOT: "/users",
    DETAILS: "/users/:id",
    SETTINGS: "/users/:id/settings",
  },
} as const); // 👈 Required for TypeScript param inference
```

**Update navigation call sites:**

```ts
// Before
navigate(`/users/${id}`);
navigate(`${PATHS.USERS.ROOT}/${id}`);
navigate(userSettingsPath(id));

// After
navigate(PATHS.USERS.DETAILS.build({ id }));
navigate(PATHS.USERS.SETTINGS.build({ id }));
```

**Delete hand-written builder functions** — `.build()` replaces them all.

**Route registrations need no changes** — the path value is the same string:

```tsx
// This still works exactly as before — no changes needed
<Route path={PATHS.USERS.DETAILS} element={<UserDetails />} />
```

### Migration checklist

1. Wrap your existing route object with `defineRoutes(...)` and add `as const`.
2. Replace manual path template literals with `.build()` calls.
3. Remove hand-written path builder helper functions.
4. Run TypeScript — missing or misspelled params will now be compile errors.
5. Verify navigation in the app works as expected.

### Incremental adoption

You do not need to migrate everything at once. `defineRoutes()` works alongside existing plain string constants — migrate one section at a time.
