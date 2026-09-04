# useTypedSearchParams

`useTypedSearchParams<T>(options?): [T, setter]`

A typed wrapper around React Router's search-params API (built on `useLocation` + `useNavigate`, which both `react-router-dom` and `react-router` export in v6 and v7). Returns the parsed query params object (via `extractQueryFromPath`) and a setter that updates the query string.

## Generic type parameter

You can pass a type argument `T extends QueryParams` to strongly-type the returned query object and the setter's input:

```tsx
import { useTypedSearchParams } from "react-routes-forge/hooks";

type SearchQuery = { page?: number; sort?: string; active?: boolean };

function Filters() {
  const [query, setQuery] = useTypedSearchParams<SearchQuery>({
    coerceBooleans: true,
    coerceNumbers: true,
  });

  // query.page is typed as number | undefined
  const nextPage = (query.page ?? 0) + 1;

  return (
    <button onClick={() => setQuery({ ...query, page: nextPage })}>
      Next page
    </button>
  );
}
```

When `T` is omitted the hook falls back to the untyped `QueryParams` shape (same behaviour as before).

## Options

| Option | Description |
| ------ | ----------- |
| `coerceBooleans` | Convert `"true"`/`"false"` to real booleans |
| `coerceNumbers` | Convert numeric strings to numbers |

The setter accepts a `navigateOptions` second argument (`{ replace?, state? }`), passed through to the underlying navigation.
