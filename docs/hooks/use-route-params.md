# useRouteParams

`useRouteParams<T>(): Record<ExtractParams<T>, string>`

Typed wrapper around React Router's and Next.js's `useParams`. Pass the route's template string as a generic to get a correctly typed params object back — or pass a dynamic route from your `PATHS` tree and the params are inferred automatically.

```tsx
// For React Router
import { useRouteParams } from "react-routes-forge/hooks";

// For Next.js App/Pages Router
import { useRouteParams } from "react-routes-forge/next";

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
