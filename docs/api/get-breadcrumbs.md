# getBreadcrumbs

`getBreadcrumbs(routes, currentPath, options?): BreadcrumbItem[]`

Walks a route tree (or a pre-flattened array) and returns every route that is an ancestor of (or an exact match to) the current URL. Dynamic params in ancestor paths are automatically resolved.

Each breadcrumb entry contains:
- **`key`** — the dot-joined key from the route tree
- **`label`** — a human-readable label derived from the key
- **`path`** — the resolved breadcrumb path with params filled in
- **`isCurrent`** — `true` only for the deepest (exact) match

```ts
import { defineRoutes, getBreadcrumbs } from "react-routes-forge";

const PATHS = defineRoutes({
  HOME: "/",
  USERS: {
    ROOT: "/users",
    EDIT: "/users/edit/:id",
  },
} as const);

getBreadcrumbs(PATHS, "/users/edit/42");
// →
// [
//   { key: "HOME",       label: "Home",  path: "/",             isCurrent: false },
//   { key: "USERS.ROOT", label: "Users", path: "/users",        isCurrent: false },
//   { key: "USERS.EDIT", label: "Edit",  path: "/users/edit/42", isCurrent: true  },
// ]
```

## Options

**Custom label resolver**:

```ts
getBreadcrumbs(PATHS, "/users/edit/42", {
  labelResolver: (key) => key.split(".").pop()!.replace(/_/g, " ").toUpperCase(),
});
// → [{ label: "HOME" }, { label: "ROOT" }, { label: "EDIT" }]
```

**Label map** — matching keys take precedence over `labelResolver`:

```ts
getBreadcrumbs(PATHS, "/users/edit/42", {
  labels: { "USERS.ROOT": "Members", "USERS.EDIT": "Edit member" },
});
// → [{ label: "Home" }, { label: "Members" }, { label: "Edit member" }]
```

**Pre-flattened input** — pass a cached `flattenRoutes()` result instead of the tree:

```ts
const flat = flattenRoutes(PATHS);
getBreadcrumbs(flat, "/users/edit/42"); // same result as passing the tree
```
