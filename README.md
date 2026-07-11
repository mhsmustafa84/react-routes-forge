# react-routes-forge

Type-safe route definitions with automatic path builders for React apps.

## Why react-routes-forge?

`react-routes-forge` eliminates the duplicate template/builder pattern used in route definitions. One source of truth defines:

- static path templates for routing
- dynamic path builders for navigation
- typed params for safer runtime usage

## Installation

```bash
npm install react-routes-forge
```

## Quick start

```ts
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

## Usage

### Router definitions

Use route templates directly in route declarations.

```tsx
import { PATHS } from './paths';

<Route path={PATHS.HOME} />
<Route path={PATHS.USERS.EDIT} />
<Route path={PATHS.ROLES.PERMISSIONS} />
```

### Navigation

Build resolved paths from dynamic templates.

```ts
navigate(PATHS.USERS.EDIT.build({ id: 42 }));
navigate(PATHS.ROLES.PERMISSIONS.build({ name: "admin" }));
navigate(PATHS.HOME);
```

### Dynamic routes keep plain-string behavior

Dynamic routes remain usable as strings while gaining helper methods.

```ts
PATHS.USERS.EDIT; // '/users/edit/:id'
PATHS.USERS.EDIT.build({ id: 42 }); // '/users/edit/42'
PATHS.USERS.EDIT.paramNames; // ['id']
```

## API

### `defineRoutes(routeMap)`

Create a typed route object from a nested route definition.

- static routes remain plain strings
- dynamic routes gain `.build(params)` and `.paramNames`

### `build(template, params)`

Resolve a route template without using `defineRoutes`.

```ts
import { build } from "react-routes-forge";

build("/users/:id/posts/:postId", { id: 1, postId: 42 });
// '/users/1/posts/42'
```

### `isActivePath(currentPath, template, options?)`

Check whether a path matches a template.

```ts
import { isActivePath } from "react-routes-forge";

isActivePath("/users/42", "/users/:id");
isActivePath("/users/42/posts", "/users/:id");
isActivePath("/users/42/posts", "/users/:id", { exact: false });
```

### `extractParamsFromPath(template, resolvedPath)`

Extract path params from a resolved route.

```ts
import { extractParamsFromPath } from "react-routes-forge";

extractParamsFromPath("/users/:id", "/users/42");
// { id: '42' }
```

### `joinPaths(...segments)`

Join path fragments and normalise slashes.

```ts
import { joinPaths } from "react-routes-forge";

joinPaths("/api/", "/v1/", "/users");
// '/api/v1/users'
```

### `getParamNames(template)`

Return all parameter names from a template.

```ts
import { getParamNames } from "react-routes-forge";

getParamNames("/users/:id/posts/:postId");
// ['id', 'postId']
```

## React hooks

Import only when using React Router.

### `useRouteParams<T>()`

Typed wrapper around React Router's `useParams`.

```tsx
import { useRouteParams } from "react-routes-forge";

function EditUser() {
  const { id } = useRouteParams<"/users/edit/:id">();
  return <div>{id}</div>;
}
```

### `useNavigateTo()`

Thin, typed wrapper around React Router's `useNavigate()`.

```tsx
import { useNavigateTo } from "react-routes-forge";

function Component() {
  const navigateTo = useNavigateTo();
  return (
    <button onClick={() => navigateTo(PATHS.USERS.EDIT.build({ id: 42 }))}>
      Edit
    </button>
  );
}
```
