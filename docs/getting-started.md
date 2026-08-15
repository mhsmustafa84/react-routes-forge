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

> **Note:** this package ships dual **ESM + CommonJS** builds. See [Known Behaviours](/api/known-behaviours) for details.

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

> Works identically whether you import these components from `react-router-dom` (v6/v7) or from `react-router` (v6/v7) — the library itself never imports from a specific router package, so both setups behave the same.

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

In development, `defineRoutes()` warns via `console.warn` about likely mistakes — a missing leading `/`, non-trailing splats, duplicate path templates, and static routes shadowed by a dynamic route defined above them:

```ts
defineRoutes({
  A: { FOO: "/foo" },
  B: { FOO: "/foo" },
} as const);
// ⚠ console.warn: [route-forge] Duplicate route path "/foo" for "A.FOO" and "B.FOO".

defineRoutes({
  USERS: { DETAILS: "/users/:id", ME: "/users/me" },
} as const);
// ⚠ console.warn: [route-forge] Route "USERS.ME" ("/users/me") is shadowed by
//                 dynamic route "USERS.DETAILS" ("/users/:id").
```

These are warnings, not errors — invalid routes still build, so a broken definition can't crash your app at import time. Order matters: put static routes **before** dynamic parameter routes that could swallow them.

## What's Next?

- [API Reference](/api/define-routes) — start with `defineRoutes`
- [React Hooks](/hooks/use-route-params) — typed hooks for React Router
- [Query & Hash Support](/api/build#query-string-serialization) — attaching query strings and hash fragments
