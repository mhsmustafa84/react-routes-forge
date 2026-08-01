# matchPath

`matchPath(template, options?): RegExp`

Converts a route template string into an anchored `RegExp` — useful when you need custom matching logic beyond `isActivePath` or `extractParamsFromPath`.

```ts
import { matchPath } from "react-routes-forge";

const re = matchPath("/users/:id");
re.test("/users/42");       // true
re.exec("/users/42");       // ['/users/42', '42']
re.test("/users/42/posts"); // false (exact match only)
```

## Options

- **`end?: boolean`** (default `true`) — anchor the pattern to the end of the path. Pass `false` to match a prefix at a segment boundary (`/users` matches `/users/42` but not `/usersettings`).
- **`caseSensitive?: boolean`** (default `false`) — match case-insensitively by default; pass `true` to opt out.

```ts
matchPath("/users/:id", { end: false }).test("/users/42/posts"); // true
matchPath("/Users/42", { caseSensitive: true }).test("/users/42"); // false
```

This is the building block used internally by `isActivePath` and `extractParamsFromPath`. Compiled patterns are cached — see [`clearPathCache`](/api/clear-path-cache) if you need to reset them.
