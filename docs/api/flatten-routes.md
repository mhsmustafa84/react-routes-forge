# flattenRoutes

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
