# joinPaths

`joinPaths(...segments): string`

Safely joins path segments, normalizing duplicate/missing slashes.

```ts
import { joinPaths } from "react-routes-forge";

joinPaths("/users", "edit", ":id");   // → '/users/edit/:id'
joinPaths("/api/", "/v1/", "/users"); // → '/api/v1/users'
```
