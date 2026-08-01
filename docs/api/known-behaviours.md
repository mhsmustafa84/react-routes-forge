# Known Behaviours & Gotchas

## Routes are `String` objects

`defineRoutes` wraps **every** path — static, dynamic, and splat — in `String` objects so that `.build()` (and `.paramNames` on dynamic routes) can be attached as properties.

```ts
// ✓ These all work as expected
String(PATHS.HOME);                  // '/'
`${PATHS.USERS.EDIT}`;              // '/users/edit/:id'
PATHS.USERS.EDIT == "/users/edit/:id"; // true (loose equality)

// ✗ Watch out for these
typeof PATHS.HOME;                  // 'object' ← not 'string'
PATHS.HOME === "/";                 // false ← strict equality fails
```

Prefer template literals or explicit `String()` coercion when comparing route values, and avoid using them as plain object/`Map` keys.

## Splat Segments

Splat routes (`/files/*`) capture the rest of the path — including slashes — into a single `*` param, matching React Router semantics. Supported across the entire core API, not just the hooks.

```ts
import { defineRoutes, build, isActivePath, extractParamsFromPath } from "react-routes-forge";

const PATHS = defineRoutes({
  FILES: "/files/*",
} as const);

PATHS.FILES.build({ "*": "reports/2026/q1" }); // → '/files/reports/2026/q1'
String(PATHS.FILES); // → '/files/*'
PATHS.FILES.paramNames; // → ['*']
```

Behaviour notes:

- **Slashes in the value are preserved** (they're path separators); other special characters are still URL-encoded — `"/files/*"` with `"a b/c?d"` → `"/files/a%20b/c%3Fd"`.
- **A missing splat value drops the `/*` suffix** — `/files/*` resolves to `/files` (matching React Router, where the splat route also matches the base path).
- `isActivePath("/files/a/b", "/files/*")` → `true`; `extractParamsFromPath("/files/*", "/files/a/b")` → `{ "*": "a/b" }`.
- A splat must be **trailing** (`/files/*`). A `*` in the middle of a path is invalid and produces a dev warning.

## `useResolvedPath` vs. the library's own `buildPath`

`useResolvedPath` is a thin wrapper around the library's own `buildPath`, so splat (`*`), optional (`:param?`) and encoding behaviour are identical across every entry point — and consistent across React Router v6 and v7 (v7's `generatePath` URL-encodes values itself, which would otherwise double-encode).

## ESM + CommonJS builds

This package ships both **ESM and CommonJS** bundles (`dist/index.js` for ESM, `dist/index.cjs` for CJS), with `exports` conditions routing each environment to the right format. Modern bundlers use the ESM build; Node.js `require()` gets the CommonJS build automatically.
