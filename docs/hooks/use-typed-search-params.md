# useTypedSearchParams

`useTypedSearchParams(options?): [QueryParams, setter]`

A typed wrapper around React Router's search-params API (built on `useLocation` + `useNavigate`, which both `react-router-dom` and `react-router` export in v6 and v7). Returns the parsed query params object (via `extractQueryFromPath`) and a setter that updates the query string.

## Options

| Option | Description |
| ------ | ----------- |
| `coerceBooleans` | Convert `"true"`/`"false"` to real booleans |
| `coerceNumbers` | Convert numeric strings to numbers |

```tsx
import { useTypedSearchParams } from "react-routes-forge/hooks";

function Filters() {
  const [query, setQuery] = useTypedSearchParams({
    coerceBooleans: true,
    coerceNumbers: true,
  });

  // query.page is a number when the URL is '/search?page=2'
  const nextPage = (query.page ?? 0) + 1;

  return (
    <button onClick={() => setQuery({ ...query, page: nextPage })}>
      Next page
    </button>
  );
}
```

The setter accepts a `navigateOptions` second argument (`{ replace?, state? }`), passed through to the underlying navigation.
