# useResolvedPath

`useResolvedPath(template, params, query?, options?): string`

Resolves a path template to a concrete URL string without navigating — useful for `<Link to={...} />`, preloading, or building a URL for something other than `navigate()`. It mirrors the library's own `buildPath`, so splat (`*`) and optional (`:param?`) segments work identically to the core API — with encoding and `strict` behaviour consistent across React Router v6 and v7.

```tsx
import { useResolvedPath } from "react-routes-forge/hooks";

const path = useResolvedPath("/users/:id", { id: 42 });
// → '/users/42'

const path = useResolvedPath("/users/:id", { id: 42 }, { tab: "info" });
// → '/users/42?tab=info'

// Splat segments are preserved
const path = useResolvedPath("/files/*", { "*": "a/b/c" });
// → '/files/a/b/c'

// Strict mode — throws RangeError instead of warning on missing params
const path = useResolvedPath("/users/:id", {}, undefined, { strict: true });

// With hash fragment
const path = useResolvedPath("/page", {}, undefined, { hash: "section" });
// → '/page#section'
```

## useResolvedPath vs buildPath

`useResolvedPath` is a thin wrapper around the library's own `buildPath`, so splat (`*`), optional (`:param?`) and encoding behaviour are identical across every entry point. This keeps behaviour consistent across React Router v6 and v7 — v7's `generatePath` URL-encodes values itself, which would otherwise double-encode the values this library already encodes.
