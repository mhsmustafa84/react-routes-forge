# extractQueryFromPath

`extractQueryFromPath(path, options?): QueryParams`

Parses the query string out of a path (or bare query string) back into a plain object. Repeated keys become arrays; single keys are scalar strings.

## Options

- **`coerceBooleans?: boolean`** — convert the strings `"true"`/`"false"` to real booleans.
- **`coerceNumbers?: boolean`** — convert numeric strings (`"42"`, `"3.14"`) to real numbers.

```ts
import { extractQueryFromPath } from "react-routes-forge";

extractQueryFromPath("/users/42?tab=profile&tag=a&tag=b");
// → { tab: "profile", tag: ["a", "b"] }

extractQueryFromPath("/search?active=true", { coerceBooleans: true });
// → { active: true }

extractQueryFromPath("/search?page=2&limit=10", { coerceNumbers: true });
// → { page: 2, limit: 10 }
```

> For reading query params inside a React component, prefer the [`useTypedSearchParams`](/hooks/use-typed-search-params) hook.
