# Known Behaviours & Gotchas

## Routes are genuine primitive strings

`defineRoutes` returns **plain primitive strings** — `typeof` a route value is `"string"`, and strict equality against the template works. `.build()` (and `.paramNames` on dynamic routes) are not own properties of the route value; they are added to `String.prototype` once, so every route value can still call them lazily from its own text:

```ts
// ✓ These all work as expected
PATHS.HOME === "/";                 // true  (strict equality works)
typeof PATHS.HOME;                  // 'string'
String(PATHS.USERS.EDIT);          // '/users/edit/:id'
`${PATHS.USERS.EDIT}`;             // '/users/edit/:id'
PATHS.USERS.EDIT.build({ id: 42 }); // '/users/42' (via String.prototype)
PATHS.USERS.EDIT.paramNames;        // ['id']
```

Because route values are primitives, they behave like any other string: usable as object/`Map` keys, safe with React Router's `<Link to={...}>` (which branches on `typeof to === "string"`), and passed straight to `navigate()` or `useNavigateTo()` without a `.build()` call for static paths.

### The flip side: every string gains `.build` and `.paramNames`

The helpers live on `String.prototype`, so **every** string in your app — route or not — has a `.build` method and a `.paramNames` getter:

```ts
("/foo").build({}); // → '/foo'  (static template: no params to fill)
"/a/:b".paramNames; // → ['b']   (lazily parsed from the string itself)
```

This is what lets plain template literals act like routes. `.paramNames` is a lazy getter that parses the string's own text, so it is always correct for whatever string it is called on — but be aware the properties exist globally when you're using the library.

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
