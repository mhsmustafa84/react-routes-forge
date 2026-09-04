# useActivePath (Next.js)

`useActivePath(template, options?): boolean`

Checks if the current pathname matches a given route template. Backed by Next.js `usePathname()` — a thin wrapper around [`isActivePath()`](/api/is-active-path) with the same matching semantics: case-insensitive by default, trailing slashes tolerated, `exact: true` by default.

> [!NOTE]
> Must be used inside a **Client Component** (`"use client"`).

## Options

| Option | Default | Description |
| ------ | ------- | ----------- |
| `exact` | `true` | Require a full match; pass `false` for prefix matching |
| `caseSensitive` | `false` | Match case-sensitively |

## Example

```tsx
"use client";

import { useActivePath } from "react-routes-forge/next";
import { PATHS } from "@/routes";

function NavLink() {
  const isUsersActive = useActivePath(PATHS.USERS.ROOT, { exact: false });
  const isProfileActive = useActivePath("/users/:id", { caseSensitive: true });

  return (
    <a className={isUsersActive ? "font-bold" : ""} href={PATHS.USERS.ROOT}>
      Users
    </a>
  );
}
```

## See also

- [React Router variant](/hooks/use-active-path)
- [`isActivePath()`](/api/is-active-path) — the underlying utility
