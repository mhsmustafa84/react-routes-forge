# Next.js Integration

`react-routes-forge` works with Next.js App Router and Pages Router. The core utilities (`defineRoutes`, `.build()`, query helpers) are fully isomorphic and can be used on both client and server.

> [!NOTE]
> All hooks in `react-routes-forge/next` are backed by `next/navigation` and must be used inside **Client Components** (i.e. files with `"use client"` at the top).

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

This file can be imported safely in both Server Components and Client Components — it has **zero runtime dependencies**.

### 2. Use in Client Components

```tsx
// app/users/UserCard.tsx
"use client";

import Link from "next/link";
import { useNavigateTo } from "react-routes-forge/next";
import { PATHS } from "../paths";

export function UserCard({ id, name }: { id: string; name: string }) {
  const navigateTo = useNavigateTo();

  return (
    <div>
      <Link href={PATHS.USERS.DETAILS.build({ id })}>{name}</Link>
      <button onClick={() => navigateTo(PATHS.USERS.SETTINGS.build({ id }))}>
        Settings
      </button>
    </div>
  );
}
```

### 3. Use in Server Components

Route definitions and `.build()` work on the server with no client runtime:

```tsx
// app/users/page.tsx
import { PATHS } from "../paths";

// This is a Server Component — no "use client" needed
export default async function UsersPage() {
  const users = await fetchUsers();
  const editPath = PATHS.USERS.DETAILS.build({ id: "example" });
  return <UserList users={users} />;
}
```

## Available Hooks

| Hook | Description |
| ---- | ----------- |
| [`useActivePath`](./use-active-path) | Check if the current pathname matches a route template |
| [`useNavigateTo`](./use-navigate-to) | Navigate client-side; includes `.prefetch()` |
| [`useRouteParams`](./use-route-params) | Strongly-typed wrapper around `useParams()` |
| [`useTypedSearchParams`](./use-typed-search-params) | Typed query params with coercion and a setter |

## Key Differences from React Router

| Aspect | React Router | Next.js App Router |
|--------|-------------|--------------------|
| Route definitions | `<Route path={PATHS.HOME} />` | File-based (`app/page.tsx`) |
| Navigation | `useNavigate()` from `react-router` | `useRouter()` from `next/navigation` |
| Links | `<Link to={PATHS.HOME}>` | `<Link href={PATHS.HOME}>` |
| Client boundary | `react-router-dom` is client-only | Explicit `"use client"` directive |

The `PATHS` object and `.build()` method work identically in both environments.

## Server-Side Patterns

### Generating metadata

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

If you're using the Pages Router (`pages/` directory), use `next/router` instead:

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

## Exported Types

`react-routes-forge/next` exports the following TypeScript types alongside the hooks:

| Type | Description |
| ---- | ----------- |
| `NavigateOptions` | `{ replace?: boolean; scroll?: boolean }` — second argument to `useNavigateTo()` |

Import them when you need to annotate your own wrappers:

```ts
import type { NavigateOptions } from "react-routes-forge/next";

function myNavigate(path: string, opts?: NavigateOptions) { ... }
```

## Troubleshooting

### Hooks throw during SSR

All hooks from `react-routes-forge/next` use `next/navigation` under the hood, which is safe for Next.js's streaming SSR — **as long as the component has `"use client"` at the top**. Without it, Next.js will throw at build time because server components cannot call client-only hooks.

```tsx
// ✅ Correct
"use client";
import { useNavigateTo } from "react-routes-forge/next";

// ❌ Wrong — missing "use client"
import { useNavigateTo } from "react-routes-forge/next";
```

### Don't import from `react-routes-forge/hooks` in Next.js

`react-routes-forge/hooks` wraps **React Router** hooks (`useNavigate`, `useLocation`, etc.), which require a `<BrowserRouter>` context. These will crash in Next.js. Always use `react-routes-forge/next` instead.

| ✅ Use in Next.js | ❌ Don't use in Next.js |
| --- | --- |
| `react-routes-forge/next` | `react-routes-forge/hooks` |

### `useTypedSearchParams` returns stale data

This can happen when you call `setQuery` and immediately read `query` in the same render. The query object is derived from `useSearchParams()`, which is reactive — the updated value will be available after the next render triggered by the navigation.

