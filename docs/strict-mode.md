# Strict Mode

## Default Behaviour

By default, a missing required param leaves the `:param` placeholder in the resolved string and logs a `console.warn` — useful for catching bugs during development without crashing the app.

## Enabling Strict Mode

Pass `{ strict: true }` as the last argument to any builder to throw a `RangeError` instead:

```ts
import { build } from "react-routes-forge";

build("/users/:id", {}, undefined, { strict: true });
// ✗ throws RangeError: [route-forge] Missing required param(s) ":id" in template "/users/:id".
```

This is consistent across the whole API surface:

| API                                    | Default (no `strict`)                         | `{ strict: true }`  |
| -------------------------------------- | --------------------------------------------- | ------------------- |
| `.build()` (fluent, on dynamic routes) | `console.warn`, leaves `:param` in the string | throws `RangeError` |
| `build()` / `buildPath()` (standalone) | `console.warn`, leaves `:param` in the string | throws `RangeError` |
| `useResolvedPath()`                    | `console.warn`, leaves `:param` in the string | throws `RangeError` |

## Recommended Patterns

Enable strict mode in tests or development builds to catch missing params early:

```ts
const opts = { strict: process.env.NODE_ENV === "test" };
navigate(PATHS.USERS.EDIT.build({ id: userId }, undefined, opts));
```

This way you get:
- **Development/tests**: immediate errors when params are missing
- **Production**: graceful fallback (placeholder remains in the URL)
