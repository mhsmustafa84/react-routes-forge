# useRouteParams (Next.js)

`useRouteParams<T>(): Record<ExtractParams<T>, string>`

Strongly-typed wrapper around Next.js `useParams()`. Pass the route's template string as a generic to get a correctly typed params object — or pass a dynamic route from your `PATHS` tree and the params are inferred automatically.

> [!NOTE]
> Must be used inside a **Client Component** (`"use client"`).

## Examples

```tsx
"use client";

import { useRouteParams } from "react-routes-forge/next";
import { PATHS } from "@/routes";

// Using a template string literal
function EditUser() {
  const { id } = useRouteParams<"/users/:id">();
  return <div>Editing user {id}</div>;
}

// Using a route from PATHS — types are inferred automatically
function EditUserInferred() {
  const { id } = useRouteParams(PATHS.USERS.DETAILS);
  return <div>Editing user {id}</div>;
}

// Multiple params
function Comment() {
  const { postId, commentId } =
    useRouteParams<"/posts/:postId/comments/:commentId">();
}
```

## See also

- [React Router variant](/hooks/use-route-params)
