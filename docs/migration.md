# Migrating from Old Patterns

## The Problem

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

## The Solution

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

## What Stays the Same

Everywhere the template string itself was used (e.g. `<Route path={PATHS.SERVICES.DETAILS} />`) needs **no changes at all**.

## Migration Checklist

1. Wrap your existing `PATHS` object with `defineRoutes(...)` and add `as const`
2. Replace manual path concatenation with `.build()` calls
3. Remove any hand-written path builder helper functions
4. Run TypeScript — any missing or misspelled params will show as errors
5. Verify your routes still work by checking navigation in the app

## Incremental Adoption

You don't need to migrate everything at once. `defineRoutes()` works alongside existing paths — mix and match as you refactor each section of your app.
