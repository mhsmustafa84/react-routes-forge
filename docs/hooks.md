# React Hooks

These hooks are tree-shakeable and only bundled when imported. They require `react-router-dom` as a peer dependency.

## useRouteParams

`useRouteParams<T>(): Record<ExtractParams<T>, string>`

Typed wrapper around React Router's `useParams`. Pass the route's template string as a generic to get a correctly typed params object back.

```tsx
import { useRouteParams } from "react-routes-forge";

// Route: '/users/edit/:id'
function EditUser() {
  const { id } = useRouteParams<"/users/edit/:id">();
  return <div>Editing user {id}</div>;
}

// Multiple params
// Route: '/posts/:postId/comments/:commentId'
function Comment() {
  const { postId, commentId } =
    useRouteParams<"/posts/:postId/comments/:commentId">();
}
```

## useNavigateTo

`useNavigateTo(): (path: string, options?: NavigateOptions) => void`

Thin, typed wrapper around `useNavigate()` that accepts a resolved path (the output of `.build()`) along with the usual navigation options.

```tsx
import { useNavigateTo } from "react-routes-forge";
import { PATHS } from "./paths";

function Component() {
  const navigateTo = useNavigateTo();

  return (
    <button onClick={() => navigateTo(PATHS.USERS.EDIT.build({ id: 42 }))}>
      Edit
    </button>
  );
}

navigateTo(PATHS.HOME, { replace: true });
navigateTo(PATHS.USERS.ROOT, { state: { from: "settings" } });
```

## useResolvedPath

`useResolvedPath(template, params, query?, options?): string`

Resolves a path template to a concrete URL string without navigating — useful for `<Link to={...} />`, preloading, or building a URL for something other than `navigate()`. Backed by React Router's `generatePath`, so it correctly supports splat (`*`) and optional (`:param?`) segments.

```tsx
import { useResolvedPath } from "react-routes-forge";

const path = useResolvedPath("/users/:id", { id: 42 });
// → '/users/42'

const path = useResolvedPath("/users/:id", { id: 42 }, { tab: "info" });
// → '/users/42?tab=info'

// Strict mode — throws RangeError instead of warning on missing params
const path = useResolvedPath("/users/:id", {}, undefined, { strict: true });

// With hash fragment
const path = useResolvedPath("/page", {}, undefined, { hash: "section" });
// → '/page#section'
```

### useResolvedPath vs buildPath

`useResolvedPath` delegates to React Router's `generatePath` when all params are present, which correctly handles splat (`*`) and optional (`:param?`) segments that the library's own regex-based substitution does not. If params are missing, it falls back to the same `buildPath`/strict-mode behaviour — so failure modes stay consistent.
