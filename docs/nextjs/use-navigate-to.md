# useNavigateTo (Next.js)

`useNavigateTo(): NavigateFunction & { prefetch: PrefetchFunction }`

Returns a strongly-typed navigation function backed by Next.js `useRouter()`. The returned function has an additional `.prefetch()` method for prefetching routes on hover or other interaction events.

> [!NOTE]
> Must be used inside a **Client Component** (`"use client"`).

## Basic usage

```tsx
"use client";

import { useNavigateTo } from "react-routes-forge/next";
import { PATHS } from "@/routes";

function UserActions({ id }: { id: number }) {
  const navigateTo = useNavigateTo();

  return (
    <button onClick={() => navigateTo(PATHS.USERS.DETAILS.build({ id }))}>
      View User
    </button>
  );
}
```

## Navigation options

Pass an optional second argument to control navigation behavior:

```tsx
// Use router.replace instead of router.push
navigateTo(PATHS.LOGIN, { replace: true });

// Control scroll restoration
navigateTo(PATHS.USERS.ROOT, { scroll: false });
```

| Option | Type | Description |
| ------ | ---- | ----------- |
| `replace` | `boolean` | Uses `router.replace` instead of `router.push` |
| `scroll` | `boolean` | Controls Next.js scroll behavior after navigation |

## `.prefetch(path, options?)`

The returned function exposes a `.prefetch()` method that wraps `router.prefetch()` from `next/navigation`. The `options` parameter is typed to exactly match Next.js's `AppRouter.prefetch` signature.

```tsx
"use client";

import { useNavigateTo } from "react-routes-forge/next";
import { PATHS } from "@/routes";

function UserRow({ id }: { id: number }) {
  const navigateTo = useNavigateTo();

  return (
    <div
      onMouseEnter={() => navigateTo.prefetch(PATHS.USERS.DETAILS.build({ id }))}
      onClick={() => navigateTo(PATHS.USERS.DETAILS.build({ id }))}
    >
      View User
    </div>
  );
}
```

## See also

- [React Router variant](/hooks/use-navigate-to)
