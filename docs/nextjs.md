# Next.js Integration

`react-routes-forge` works with Next.js App Router and Pages Router. The core utilities (`defineRoutes`, `.build()`, query helpers) are fully isomorphic and can be used on both client and server.

## Quick Start

### 1. Define routes in a shared file

```ts
// app/paths.ts
import { defineRoutes } from "react-routes-forge";

export const PATHS = defineRoutes({
  HOME: "/",
  ABOUT: "/about",
  USERS: {
    ROOT: "/users",
    DETAILS: "/users/:id",
    SETTINGS: "/users/:id/settings",
  },
  DASHBOARD: "/dashboard",
} as const);
```

This file can be imported safely in both Server Components and Client Components.

### 2. Use `.build()` in Client Components

When using hooks or navigating client-side, mark your component as a Client Component:

```tsx
// app/users/UserCard.tsx
"use client";

import Link from "next/link";
import { useNavigate } from "next/navigation";
import { PATHS } from "../paths";

export function UserCard({ id, name }: { id: string; name: string }) {
  const router = useNavigate();

  return (
    <div>
      <Link href={PATHS.USERS.DETAILS.build({ id })}>{name}</Link>
      <button onClick={() => router.push(PATHS.USERS.SETTINGS.build({ id }))}>
        Settings
      </button>
    </div>
  );
}
```

### 3. Use route definitions in Server Components

Route definitions and `.build()` work on the server without any client runtime:

```tsx
// app/users/page.tsx
import { PATHS } from "../paths";
import { UserList } from "./UserList";

// This is a Server Component — no "use client" needed
export default async function UsersPage() {
  const users = await fetchUsers();

  // Use .build() on the server for redirects, metadata, etc.
  const editPath = PATHS.USERS.DETAILS.build({ id: "example" });

  return <UserList users={users} />;
}
```

## Key Differences from React Router

| Aspect | React Router | Next.js App Router |
|--------|-------------|-------------------|
| Route definitions | `<Route path={PATHS.HOME} />` | File-based (`app/page.tsx`) |
| Navigation | `useNavigate()` from `react-router` | `useRouter()` from `next/navigation` |
| Links | `<Link to={PATHS.HOME}>` | `<Link href={PATHS.HOME}>` |
| Client boundary | `react-router-dom` is client-only | Explicit `"use client"` directive |

The `PATHS` object and `.build()` method work identically in both environments. Only the routing framework changes.

## Hooks

All hooks from `react-routes-forge/hooks` require a Client Component context:

```tsx
"use client";

import { useActivePath, useRouteParams } from "react-routes-forge/hooks";
import { PATHS } from "../paths";

export function Sidebar() {
  const isUsersActive = useActivePath(PATHS.USERS.ROOT);
  const { id } = useRouteParams(PATHS.USERS.DETAILS);

  return <nav>...</nav>;
}
```

> **Note:** The library adds `'use client'` directives to all hook files automatically, so Next.js will correctly identify them as client-only. You still need `"use client"` on your own component files that import these hooks.

## Server-Side Patterns

### Generating metadata

Use `.build()` to construct canonical URLs or Open Graph paths:

```ts
// app/users/[id]/page.tsx
import { PATHS } from "../../paths";

export function generateMetadata({ params }: { params: { id: string } }) {
  return {
    alternates: {
      canonical: `https://example.com${PATHS.USERS.DETAILS.build(params)}`,
    },
  };
}
```

### Redirects

```ts
// middleware.ts
import { NextResponse } from "next/server";
import { PATHS } from "./app/paths";

export function middleware() {
  return NextResponse.redirect(PATHS.LOGIN);
}
```

### Breadcrumbs

```tsx
// app/users/[id]/layout.tsx
import { getBreadcrumbs } from "react-routes-forge";
import { PATHS } from "../../paths";

export default function Layout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  const breadcrumbs = getBreadcrumbs(PATHS, PATHS.USERS.DETAILS.build(params));
  // Use breadcrumbs in your layout
}
```

## Pages Router

If you're using the Pages Router (`pages/` directory), the approach is similar but you'll use `next/router` instead:

```tsx
// pages/users/[id].tsx
import { useRouter } from "next/router";
import { PATHS } from "../../paths";

export default function UserPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div>
      <button onClick={() => router.push(PATHS.USERS.SETTINGS.build({ id: id as string }))}>
        Settings
      </button>
    </div>
  );
}
```

## Troubleshooting

### Hooks crash during SSR

If you see `useLocation must be used within a <Routes> component`, your hook is being called during server rendering. Ensure:

1. The component using the hook has `"use client"` at the top
2. You're not calling hooks in a Server Component

### TypeScript errors with `.build()` on static routes

Static routes (without parameters) support `.build()` at runtime, but TypeScript may not show autocomplete for it. You can still call it:

```ts
// Works at runtime, even if TS doesn't suggest it
PATHS.HOME.build({ sort: "asc" });
```
