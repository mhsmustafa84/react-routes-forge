# useActivePath

`useActivePath(template, options?): boolean`

Checks whether the current location matches a route template or path — a thin wrapper around `isActivePath(useLocation().pathname, template, options)`. Matching semantics mirror React Router's `NavLink`: case-insensitive by default, trailing slashes tolerated, `exact: true` by default.

## Options

| Option | Default | Description |
| ------ | ------- | ----------- |
| `exact` | `true` | Require a full match; pass `false` for prefix matching |
| `caseSensitive` | `false` | Match case-sensitively |

```tsx
import { useActivePath } from "react-routes-forge/hooks";

function Nav() {
  const isUsersActive = useActivePath(PATHS.USERS.ROOT, { exact: false });
  const isProfileActive = useActivePath("/users/:id", { caseSensitive: true });

  return (
    <Link className={isUsersActive ? "active" : ""} to={PATHS.USERS.ROOT}>
      Users
    </Link>
  );
}
```
