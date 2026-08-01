# defineRoutes

`defineRoutes(routeMap): ResolvedRoutes<T>`

Creates a fully typed route object from a nested plain object.

- Every path is string-coercible — use it directly anywhere a string is expected.
- Static paths gain **`.build(query?, options?)`** — attach a query string and/or hash fragment without params.
- Dynamic paths (containing `:param`) and splat paths (trailing `/*`) gain:
  - **`.build(params, query?, options?)`** — resolves the template into a concrete URL
  - **`.paramNames`** — array of the param names extracted from the template (a splat is reported as `['*']`)

Nesting is unlimited — organize routes into as many groups and sub-groups as your app needs.

> `defineRoutes()` also validates every template in development (no-op in production), warning on missing leading `/`, non-trailing `*`, duplicate path templates, and static routes shadowed by a dynamic route defined above them. See [Route Validation](/getting-started#route-validation).

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
PATHS.SERVICES.SUPPORT_CENTER.EDIT.build({ id: 7 });
// → '/services/support-center/edit/7'

PATHS.SERVICES.SUPPORT_CENTER.EDIT.build(
  { id: 7 },
  { tab: "info" },
  { hash: "details" },
);
// → '/services/support-center/edit/7?tab=info#details'

PATHS.SERVICES.SUPPORT_CENTER.EDIT.paramNames; // ['id']
```

> Always pass `as const` to `defineRoutes()` — it preserves the literal string types that power `.build()`'s compile-time param checking.

## Route Types

| Route type  | Example                 | Behaves as                              | Gains                                                                 |
| ----------- | ----------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| **Static**  | `HOME: '/'`             | String-like (coercible to its template) | `.build(query?, options?)` — attach query/hash, no params to fill      |
| **Dynamic** | `DETAILS: '/users/:id'` | String-like (coercible to its template) | `.build(params, query?, options?)` and `.paramNames`                  |
| **Splat**   | `FILES: '/files/*'`     | String-like (coercible to its template) | `.build(params, query?, options?)` and `.paramNames`                  |

`defineRoutes()` walks your route object recursively, wrapping every path in a string-coercible object and attaching a `.build()` helper so both static and dynamic routes can carry a query string or hash. Dynamic paths (containing a `:param` segment or a trailing `/*` splat) additionally gain `.paramNames`.
