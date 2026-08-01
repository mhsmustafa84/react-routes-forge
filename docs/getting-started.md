# Getting Started

## Installation

```bash
npm install react-routes-forge
# or
pnpm add react-routes-forge
# or
yarn add react-routes-forge
# or
bun add react-routes-forge
```

> **Note:** this package ships ESM-only. See [Known Behaviours](/api-reference#known-behaviours) for details.

## Define Your Routes

Create a single file — typically `paths.ts` — as the source of truth for all routes:

```ts
// paths.ts
import { defineRoutes } from "react-routes-forge";

export const PATHS = defineRoutes({
  HOME: "/",
  LOGIN: "/login",
  USERS: {
    ROOT: "/users",
    ADD: "/users/add",
    EDIT: "/users/edit/:id",
    DETAILS: "/users/:id",
  },
  ROLES: {
    PERMISSIONS: "/roles/permissions/:name",
  },
} as const);
```

> **Always pass `as const`** — it preserves the literal string types that power `.build()`'s compile-time param checking. Without it, TypeScript widens your path strings to generic `string` and you lose type safety.

## Use in Your Router

Static paths and dynamic templates both work directly as strings in `<Route path={...} />`:

```tsx
// App.tsx
import { Routes, Route } from "react-router-dom";
import { PATHS } from "./paths";

<Routes>
  <Route path={PATHS.HOME} element={<Home />} />
  <Route path={PATHS.USERS.ROOT} element={<UserList />} />
  <Route path={PATHS.USERS.EDIT} element={<EditUser />} />
  <Route path={PATHS.ROLES.PERMISSIONS} element={<RolePermissions />} />
</Routes>;
```

## Navigate with Type Safety

Call `.build()` to resolve a dynamic path into a real URL — params are type-checked from the template:

```tsx
import { useNavigate } from "react-router-dom";

function MyComponent() {
  const navigate = useNavigate();

  //                    ↓ Param type-checked from the template ":id"
  navigate(PATHS.USERS.EDIT.build({ id: 42 })); // → '/users/edit/42'
  navigate(PATHS.ROLES.PERMISSIONS.build({ name: "admin" })); // → '/roles/permissions/admin'
  navigate(PATHS.HOME); // → '/'  (static paths work directly)
}
```

## Route Validation

In development, `defineRoutes()` warns via `console.warn` about likely mistakes — a missing leading `/`, non-trailing splats, and duplicate path templates:

```ts
defineRoutes({
  A: { FOO: "/foo" },
  B: { FOO: "/foo" },
} as const);
// ⚠ console.warn: [route-forge] Duplicate route path "/foo" for "A.FOO" and "B.FOO".
```

These are warnings, not errors — invalid routes still build, so a broken definition can't crash your app at import time.

## What's Next?

- [API Reference](/api-reference) — explore all exported functions
- [React Hooks](/hooks) — typed hooks for React Router
- [Query & Hash Support](/query-hash) — attaching query strings and hash fragments
