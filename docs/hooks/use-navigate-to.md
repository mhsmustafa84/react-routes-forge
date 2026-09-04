# useNavigateTo

`useNavigateTo(): NavigateFunction`

Thin, typed wrapper around `useNavigate()` (React Router) or `useRouter()` (Next.js) that accepts a resolved path (the output of `.build()`) along with the usual navigation options.

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

## `.prefetch()` (Next.js only)

The Next.js variant (`react-routes-forge/next`) exposes a `.prefetch()` method on the returned function. This wraps `router.prefetch()` from `next/navigation` with the same type-safe path pattern.

```tsx
import { useNavigateTo } from "react-routes-forge/next";
import { PATHS } from "@/routes";

function UserRow({ id }: { id: number }) {
  const navigateTo = useNavigateTo();

  return (
    <div
      onMouseEnter={() => navigateTo.prefetch(PATHS.USERS.EDIT.build({ id }))}
      onClick={() => navigateTo(PATHS.USERS.EDIT.build({ id }))}
    >
      Edit User
    </div>
  );
}
```
