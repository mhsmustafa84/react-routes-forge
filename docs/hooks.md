# React Hooks

These hooks live in a separate `react-routes-forge/hooks` entry, so the core package never pulls in `react-router-dom`. They require `react-router-dom` as a peer dependency.

## useRouteParams

`useRouteParams<T>(): Record<ExtractParams<T>, string>`

Typed wrapper around React Router's `useParams`. Pass the route's template string as a generic to get a correctly typed params object back — or pass a dynamic route from your `PATHS` tree and the params are inferred automatically.

```tsx
import { useRouteParams } from "react-routes-forge/hooks";

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

// Or pass a route from your PATHS tree — types are inferred:
const PATHS = defineRoutes({ USERS: { EDIT: "/users/edit/:id" } } as const);
function EditUserInferred() {
  const { id } = useRouteParams(PATHS.USERS.EDIT);
}
```

## useNavigateTo

`useNavigateTo(): (path: string, options?: NavigateOptions) => void`

Thin, typed wrapper around `useNavigate()` that accepts a resolved path (the output of `.build()`) along with the usual navigation options.

```tsx
import { useNavigateTo } from "react-routes-forge/hooks";
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

### useResolvedPath vs buildPath

`useResolvedPath` is a thin wrapper around the library's own `buildPath`, so splat (`*`), optional (`:param?`) and encoding behaviour are identical across every entry point. This keeps behaviour consistent across React Router v6 and v7 — v7's `generatePath` URL-encodes values itself, which would otherwise double-encode the values this library already encodes.

## useActivePath

`useActivePath(template, options?): boolean`

Checks whether the current location matches a route template or path — a thin wrapper around `isActivePath(useLocation().pathname, template, options)`. Matching semantics mirror React Router's `NavLink`: case-insensitive by default, trailing slashes tolerated, `exact: true` by default.

| Option | Default | Description |
| ------ | ------- | ----------- |
| `exact` | `true` | Require a full match; pass `false` for prefix matching |
| `caseSensitive` | `false` | Match case-sensitively |

```tsx
import { useActivePath } from "react-routes-forge/hooks";

function Nav() {
  const isUsersActive = useActivePath(PATHS.USERS.ROOT, { exact: false });
  const isProfileActive = useActivePath("/users/:id", { caseSensitive: true });

  return (
    <Link className={isUsersActive ? "active" : ""} to={PATHS.USERS.ROOT}>
      Users
    </Link>
  );
}
```

## useTypedSearchParams

`useTypedSearchParams(options?): [QueryParams, setter]`

A typed wrapper around React Router's `useSearchParams`. Returns the parsed query params object (via `extractQueryFromPath`) and a setter that updates the query string.

| Option | Description |
| ------ | ----------- |
| `coerceBooleans` | Convert `"true"`/`"false"` to real booleans |
| `coerceNumbers` | Convert numeric strings to numbers |

```tsx
import { useTypedSearchParams } from "react-routes-forge/hooks";

function Filters() {
  const [query, setQuery] = useTypedSearchParams({
    coerceBooleans: true,
    coerceNumbers: true,
  });

  // query.page is a number when the URL is '/search?page=2'
  const nextPage = (query.page ?? 0) + 1;

  return (
    <button onClick={() => setQuery({ ...query, page: nextPage })}>
      Next page
    </button>
  );
}
```

The setter accepts a `navigateOptions` second argument (`{ replace?, state? }`), passed through to React Router's `setSearchParams`.
