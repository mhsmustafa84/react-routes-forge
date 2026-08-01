# isActivePath

`isActivePath(currentPath, template, options?): boolean`

Checks whether a resolved path matches a route template — the building block for nav-highlighting. Query strings on `currentPath` are ignored automatically. Mirrors React Router's `NavLink` matching semantics:

- **Case-insensitive by default** — pass `{ caseSensitive: true }` to opt out.
- **Trailing slashes are tolerated** — `/users/` matches `/users`.
- **`exact: true` (default)** requires a full match; `exact: false` matches any path starting with the template.

```ts
import { isActivePath } from "react-routes-forge";

isActivePath("/users/42", "/users/:id");              // true
isActivePath("/users/42/posts", "/users/:id");        // false (exact match by default)
isActivePath("/users/42/posts", "/users/:id", { exact: false }); // true (prefix match)
isActivePath("/users/42?tab=profile", "/users/:id");  // true (query string ignored)
isActivePath("/Users/42", "/users/:id");              // true (case-insensitive by default)
isActivePath("/Users/42", "/users/:id", { caseSensitive: true }); // false
isActivePath("/users/42/", "/users/:id");             // true (trailing slash tolerated)
```

A common real-world use — highlighting the active nav link:

```tsx
function NavLink({ to, children }) {
  const location = useLocation();
  const active = isActivePath(location.pathname, to, { exact: false });

  return (
    <Link to={to} className={active ? "nav-link active" : "nav-link"}>
      {children}
    </Link>
  );
}
```

> Prefer the [`useActivePath`](/hooks/use-active-path) hook inside React components — it reads the location from the router for you.
