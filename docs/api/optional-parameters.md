# Optional Parameters (`:param?`)

`react-routes-forge` supports optional parameter segments natively using the `:param?` syntax. This is particularly useful for configuration pages, tabs, or settings where a portion of the URL is not strictly required.

## Syntax & Behavior

Define an optional parameter by appending a `?` to the parameter name:

```ts
import { defineRoutes } from "react-routes-forge";

export const PATHS = defineRoutes({
  ADMIN: "/admin/:tab?",
  PROFILE: "/user/:id/settings/:section?",
} as const);
```

When building a path, if the optional parameter is omitted or passed as `undefined`/`null`, the entire segment (including the leading slash) is cleanly dropped from the resulting URL.

```ts
// With the parameter provided
PATHS.ADMIN.build({ tab: "users" });
// → '/admin/users'

// With the parameter omitted
PATHS.ADMIN.build({});
// → '/admin'
```

This behavior is consistent across all utilities:
- `buildPath()`
- `extractParamsFromPath()`
- `isActivePath()`

## TypeScript Type Inference

TypeScript automatically infers the optional nature of the parameter. You can provide it, or completely omit it when calling `.build()`.

```ts
// The type of PATHS.ADMIN.build expects an optional `tab` param
PATHS.ADMIN.build(); // ✅ Valid
PATHS.ADMIN.build({ tab: "reports" }); // ✅ Valid
PATHS.ADMIN.build({ typo: "reports" }); // ❌ Error: unknown property 'typo'
```

## Comparison with Splat Segments (`/*`)

While both optional parameters and splat segments allow for flexible routing, they serve different purposes:

- **Optional Parameters (`:param?`)**: 
  - Restricts the match to a **single segment** of the URL.
  - Automatically URL-encodes the value.
  - Example: `/admin/:tab?` matches `/admin` and `/admin/users`, but not `/admin/users/details`.

- **Splat Segments (`/*`)**: 
  - Captures the **entire remainder** of the URL, including multiple slashes.
  - Does NOT encode slashes, preserving the path structure.
  - Example: `/files/*` matches `/files`, `/files/docs`, and `/files/docs/2026/q1`.

Use `:param?` for controlled, single-depth optional paths, and `/*` for unbounded deep linking or file paths.

## Real-World Patterns

### 1. Tabbed Interfaces
When a component defaults to the first tab if none is specified:

```ts
// routes.ts
export const PATHS = defineRoutes({
  SETTINGS: "/settings/:tab?",
} as const);

// Settings.tsx
import { useRouteParams } from "react-routes-forge/hooks";

function Settings() {
  const { tab = "profile" } = useRouteParams(PATHS.SETTINGS);
  return <SettingsLayout activeTab={tab} />;
}
```

### 2. Optional Modals in the URL
Keeping UI state in the URL without requiring a separate route:

```ts
// routes.ts
export const PATHS = defineRoutes({
  DASHBOARD: "/dashboard/:modal?",
} as const);

// Dashboard.tsx
import { useRouteParams } from "react-routes-forge/hooks";
import { CreateWidgetModal } from "./CreateWidgetModal";

function Dashboard() {
  const { modal } = useRouteParams(PATHS.DASHBOARD);
  return (
    <>
      <DashboardContent />
      {modal === "new" && <CreateWidgetModal />}
    </>
  );
}
```
