# useTypedSearchParams (Next.js)

`useTypedSearchParams<T>(options?): [T, setter]`

Retrieves and parses the URL search parameters into a typed object, and provides a setter to update them. Backed by Next.js `useSearchParams()`, `usePathname()`, and `useRouter()`.

> [!NOTE]
> Must be used inside a **Client Component** (`"use client"`).

## Generic type parameter

Pass a type argument `T extends QueryParams` to get a strongly-typed `query` object and a constrained setter. When `T` is omitted, the hook falls back to the untyped `QueryParams` shape.

```tsx
"use client";

import { useTypedSearchParams } from "react-routes-forge/next";

type SearchQuery = { q?: string; page?: number; active?: boolean };

function Search() {
  const [query, setQuery] = useTypedSearchParams<SearchQuery>({
    coerceNumbers: true,
    coerceBooleans: true,
  });

  // query.q is typed as string | undefined
  // query.page is typed as number | undefined
  return (
    <input
      value={query.q ?? ""}
      onChange={(e) => setQuery({ ...query, q: e.target.value })}
    />
  );
}
```

## Options

| Option | Description |
| ------ | ----------- |
| `coerceBooleans` | Convert `"true"`/`"false"` strings to real booleans |
| `coerceNumbers` | Convert numeric strings to numbers |

## Setter options

The setter accepts an optional second argument for navigation behavior:

```tsx
// Use router.replace to avoid adding a history entry
setQuery({ page: 2 }, { replace: true });

// Control scroll restoration
setQuery({ page: 2 }, { scroll: false });
```

| Option | Type | Description |
| ------ | ---- | ----------- |
| `replace` | `boolean` | Uses `router.replace` instead of `router.push` |
| `scroll` | `boolean` | Controls Next.js scroll behavior after navigation |

## See also

- [React Router variant](/hooks/use-typed-search-params)
- [`extractQueryFromPath()`](/api/extract-query-from-path) — the underlying parser
- [`appendQuery()`](/api/append-query) — the underlying serializer
