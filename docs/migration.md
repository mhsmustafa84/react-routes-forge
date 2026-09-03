# Migration Guide

This guide covers how to migrate between different versions of `react-routes-forge`, as well as how to migrate your app from raw string patterns to using the library.

---

## Upgrading to v1.4.x

No breaking changes! v1.4.x introduces cross-compatibility with **React Router v7** while maintaining full support for v6. Your existing hooks and configurations will continue to work seamlessly.

---

## Upgrading to v1.3.x

v1.3.0 is a significant release adding new hooks and DX improvements. It is fully backwards compatible, but offers new patterns you might want to adopt:

### 1. Static Routes now support `.build()`

Previously, static routes (paths without parameters) did not have a `.build()` method in TypeScript, meaning you had to use the string directly. Now, they do:

```ts
// v1.2 and below
navigate(PATHS.HOME);

// v1.3+
navigate(PATHS.HOME.build()); // Optional, but provides a consistent API
```

### 2. Improved `useRouteParams`

You can now pass the route definition directly to `useRouteParams` to infer parameter types automatically, instead of passing generic strings:

```ts
// v1.2 and below
const { id } = useRouteParams<"id">();

// v1.3+
const { id } = useRouteParams(PATHS.USERS.EDIT);
```

### 3. Duplicate Path Warning

`defineRoutes` now validates your route tree and will emit a console warning in development if it detects duplicate paths (e.g. two different keys resolving to `"/users"`).

### 4. Splat Routes Support

You can now define and extract splat/catch-all routes using `*`:
```ts
const PATHS = defineRoutes({ FILES: "/files/*" } as const);
PATHS.FILES.build({ "*": "docs/readme.md" }); // "/files/docs/readme.md"
```

---

## Upgrading to v1.2.x

No breaking changes. 
- **Hash Fragments**: The `.build()` method and hooks now fully support URL hash fragments (e.g., `#section`).
- **Breadcrumbs**: Introduced the `getBreadcrumbs` utility to automatically generate breadcrumb trails based on your `defineRoutes` map.

---

## Upgrading to v1.1.x

No breaking changes.
- **Query Parameters**: Added support for query parameters in the `.build(params, query)` method.
- **Strict Mode**: Added the `{ strict: true }` option to throw runtime `RangeError`s when required parameters are missing.

---

## Migrating from Old Patterns (Raw Strings)

If you are just adopting `react-routes-forge` and moving away from raw string constants, follow this guide.

### The Problem

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

This pattern has several issues:
- Duplicate route definitions (template + builder)
- No type safety for params
- Manual string concatenation prone to errors
- Templates and builders can drift apart over time

### The Solution

Wrap your route object in `defineRoutes()` — no structural changes required:

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

### What Stays the Same

Everywhere the template string itself was used (e.g. `<Route path={PATHS.SERVICES.DETAILS} />`) needs **no changes at all**.

### Migration Checklist

1. Wrap your existing `PATHS` object with `defineRoutes(...)` and add `as const`.
2. Replace manual path concatenation with `.build()` calls.
3. Remove any hand-written path builder helper functions.
4. Run TypeScript — any missing or misspelled params will show as errors.
5. Verify your routes still work by checking navigation in the app.

### Incremental Adoption

You don't need to migrate everything at once. `defineRoutes()` works alongside existing paths — mix and match as you refactor each section of your app.
