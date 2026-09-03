# TypeScript Support

Written in strict TypeScript with no `any` in the public API surface.

## Param Type Inference

Param types for `.build()` are inferred directly from each path template via a recursive template-literal type:

```ts
PATHS.USERS.EDIT.build({ id: 42 });     // ✓ compiles
PATHS.USERS.EDIT.build({});             // ✗ compile error — 'id' is required
PATHS.USERS.EDIT.build({ userId: 42 }); // ✗ compile error — 'id' expected, not 'userId'
```

## Typed paramNames

`.paramNames` is typed as a literal array of the exact param names in the template, not a generic `string[]`:

```ts
PATHS.USERS.EDIT.paramNames; // typed as ['id'], not string[]
```

## Type Exports

The package exports the following types for advanced use cases:

| Type                | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `RoutePath`         | A static route string, e.g. `'/users/:id'`          |
| `RouteBuilder`      | A route builder function                             |
| `RouteParam`        | Accepted param value types (`string \| number \| boolean`) |
| `RouteParams`       | Record of param name to value                        |
| `QueryParams`       | Query parameter record with array (including null/undefined items) support |
| `RouteLeaf`         | Either a static path or a builder function           |
| `RouteMap`          | Recursively defined route map                        |
| `RouteTree`         | Annotatable shape of a route map for `defineRoutes`  |
| `ExtractParams`     | Extracts param names from a template string type (incl. `'*'` for splats) |
| `PathParams`        | Builds a params object type from a path template      |
| `BuildPathOptions`  | Options for `buildPath` (strict, encode, hash)       |
| `FlatRoute`         | A single flattened route entry (`{ key, path }`)     |
| `BreadcrumbItem`    | A single breadcrumb entry                            |
| `BreadcrumbOptions` | Options for `getBreadcrumbs` (resolver or labels map) |
| `StaticRoute`       | A static route leaf — a genuine primitive string with `.build(query?, options?)` |
| `DynamicRoute`      | A dynamic/splat route leaf — with `.build(params, ...)` and `.paramNames` |
| `MatchPathOptions`  | Options for `matchPath` (`end`, `caseSensitive`)      |

Annotate a plain route object with `RouteTree` before passing it to `defineRoutes()`:

```ts
import type { RouteTree } from "react-routes-forge";

const routes: RouteTree = {
  HOME: "/",
  USERS: { ROOT: "/users", EDIT: "/users/edit/:id" },
};
```

## Requirements

- **TypeScript** ≥ 5 recommended for full type inference
- The package works with plain JavaScript too, just without compile-time param checking
