# appendQuery

`appendQuery(path, query?, hash?): string`

Appends a query string and/or hash fragment to a path that may already contain a query or hash. Existing query pairs are preserved, the query is inserted before any hash, and an existing hash is kept unless a new one is given.

```ts
import { appendQuery } from "react-routes-forge";

appendQuery("/users?tab=list", { page: 2 }); // → '/users?tab=list&page=2'
appendQuery("/users#top", { tab: "list" });  // → '/users?tab=list#top'
appendQuery("/users", { active: true });     // → '/users?active=true'
appendQuery("/users", { tag: ["a", "b"] });  // → '/users?tag=a&tag=b'
```

This is the same helper every path-resolving function uses internally.
