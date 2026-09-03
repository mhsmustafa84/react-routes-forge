# Troubleshooting

If you run into issues while using `react-routes-forge`, this guide addresses the most common questions and pitfalls.

## Top Issues

### 1. `.build()` autocomplete doesn't appear on static routes

**Symptom**: When typing `PATHS.HOME.b...`, your editor doesn't suggest `build`.

**Cause**: `react-routes-forge` adds `.build()` to `String.prototype` at runtime to keep route templates as genuine primitive strings (so they work perfectly with `<Link to={PATHS.HOME}>`). While TypeScript knows `.build()` exists on dynamic routes via the `DynamicRoute` type, static routes are typed simply as literal strings to preserve perfect type inference.

**Solution**: The method *is* there at runtime! You can call it safely:
```ts
// Valid, though TS might not suggest it in autocomplete
PATHS.HOME.build({ sort: 'asc' }); 
```

### 2. `as const` is required on route definitions

**Symptom**: Params are inferred as `string` instead of literals, or you get TypeScript errors about missing `.build()` on dynamic routes.

**Cause**: Without `as const`, TypeScript widens literal strings (`"/users/:id"`) to just `string`. `react-routes-forge` relies on literal types to extract the `:id` parameter.

**Solution**: Always append `as const` to your `defineRoutes` configuration:
```ts
export const PATHS = defineRoutes({
  USERS: "/users/:id",
} as const); // 👈 Critical for type inference
```

### 3. Missing params show up as `:id` in the URL

**Symptom**: Your app navigates to `/users/:id` literally, instead of `/users/42`.

**Cause**: A required parameter was not passed to `.build()`. By default, `react-routes-forge` emits a console warning in development but leaves the placeholder in the string so the app doesn't crash completely.

**Solution**: 
Check your browser console for warnings from `[route-forge]`. If you want to fail fast during development or testing, use strict mode:
```ts
PATHS.USERS.EDIT.build({}, undefined, { strict: true });
// Throws: RangeError: [route-forge] Missing required param(s) ":id" in template "/users/edit/:id".
```

### 4. Why `clearPathCache()` might be needed

**Symptom**: Memory usage slowly grows in a long-running Node.js process (SSR) with thousands of unique dynamic routes, or tests behave inconsistently.

**Cause**: To guarantee fast route matching, the library caches compiled regular expressions for every path template it sees. In normal usage, the number of unique *templates* is small and finite. If you dynamically generate infinite distinct *templates* (not paths, but templates), the cache will grow.

**Solution**: If you are dynamically generating route templates in a long-running process, you can periodically flush the cache:
```ts
import { clearPathCache } from "react-routes-forge";
clearPathCache();
```

### 5. Query params appearing as `undefined` in hooks

**Symptom**: `useTypedSearchParams` returns `undefined` for a query parameter you know is in the URL.

**Cause**: By default, empty query parameters (like `?sort=`) are parsed as empty strings (`""`). If a parameter is entirely absent from the URL, it won't be in the returned object at all, which means accessing it yields `undefined`.

**Solution**: Provide fallback values when destructuring:
```ts
const [query] = useTypedSearchParams();
const { sort = "desc", page = "1" } = query;
```

### 6. Hooks crashing in Server-Side Rendering (SSR)

**Symptom**: Next.js or Remix crashes with "useLocation must be used within a <Routes> component" or similar errors during server render.

**Cause**: The hooks provided by `react-routes-forge/hooks` wrap React Router hooks (`useLocation`, `useNavigate`, `useParams`). React Router requires a router context, which often isn't present during SSR unless explicitly provided.

**Solution**: Ensure these hooks are only called in client components, or wrap them in environment checks:
```tsx
'use client'; // For Next.js App Router

import { useActivePath } from "react-routes-forge/hooks";
// ...
```
