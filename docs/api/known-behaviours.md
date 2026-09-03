# Known Behaviours & Gotchas

## Routes are genuine primitive strings

`defineRoutes` returns **plain primitive strings** — `typeof` a route value is `"string"`, and strict equality against the template works. `.build()` (and `.paramNames` on dynamic routes) are not own properties of the route value; they are added to `String.prototype` once, so every route value can still call them lazily from its own text:

```ts
// ✓ These all work as expected
PATHS.HOME === "/"; // true  (strict equality works)
typeof PATHS.HOME; // 'string'
String(PATHS.USERS.EDIT); // '/users/edit/:id'
`${PATHS.USERS.EDIT}`; // '/users/edit/:id'
PATHS.USERS.EDIT.build({ id: 42 }); // '/users/edit/42' (via String.prototype)
PATHS.USERS.EDIT.paramNames; // ['id']
```

Because route values are primitives, they behave like any other string: usable as object/`Map` keys, safe with React Router's `<Link to={...}>` (which branches on `typeof to === "string"`), and passed straight to `navigate()` or `useNavigateTo()` without a `.build()` call for static paths.

### The flip side: every string gains `.build` and `.paramNames`

The helpers live on `String.prototype`, so **every** string in your app — route or not — has a `.build` method and a `.paramNames` getter:

```ts
"/foo".build({}); // → '/foo'  (static template: no params to fill)
"/a/:b".paramNames; // → ['b']   (lazily parsed from the string itself)
```

This is what lets plain template literals act like routes. `.paramNames` is a lazy getter that parses the string's own text, so it is always correct for whatever string it is called on — but be aware the properties exist globally when you're using the library.

## Splat Segments

Splat routes (`/files/*`) capture the rest of the path — including slashes — into a single `*` param, matching React Router semantics. Supported across the entire core API, not just the hooks.

```ts
import {
  defineRoutes,
  build,
  isActivePath,
  extractParamsFromPath,
} from "react-routes-forge";

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

## React Router v6 vs v7 Compatibility

`react-routes-forge` is designed to be completely version-agnostic between React Router v6 and v7. 

The library's hooks (exported from `react-routes-forge/hooks`) use `react-router` core APIs (`useLocation`, `useNavigate`, `useParams`) under the hood, which both `react-router-dom` and `react-router` export in both v6 and v7.

This approach guarantees several benefits regardless of your React Router version:
1. **Zero Double-Encoding**: React Router v7's `generatePath` introduced automatic URL encoding. Because `react-routes-forge` bypasses `generatePath` and uses its own `buildPath` internally (even in `useResolvedPath`), it avoids double-encoding bugs completely.
2. **`useSearchParams` Independence**: `useSearchParams` is notoriously tricky—it existed only in `react-router-dom` in v6, but was moved to `react-router` in v7. `react-routes-forge` avoids this break entirely by re-implementing search param state atop `useLocation` and `useNavigate`, ensuring `useTypedSearchParams` behaves identically across all versions.
3. **No Duplicate React Router Versions**: By only defining `react-router` and `react-router-dom` as optional peer dependencies, `react-routes-forge` will never inadvertently install a duplicate version of React Router in your `node_modules`.

## `useResolvedPath` vs. the library's own `buildPath`

`useResolvedPath` is a thin wrapper around the library's own `buildPath`, so splat (`*`), optional (`:param?`) and encoding behaviour are identical across every entry point — and consistent across React Router v6 and v7.

## ESM + CommonJS builds

This package ships both **ESM and CommonJS** bundles (`dist/index.js` for ESM, `dist/index.cjs` for CJS), with `exports` conditions routing each environment to the right format. Modern bundlers use the ESM build; Node.js `require()` gets the CommonJS build automatically.
