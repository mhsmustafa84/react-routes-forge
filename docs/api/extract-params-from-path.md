# extractParamsFromPath

`extractParamsFromPath(template, resolvedPath): Record<string, string>`

Extracts param values back out of a resolved URL, given its template. Also strips query strings before matching.

```ts
import { extractParamsFromPath } from "react-routes-forge";

extractParamsFromPath("/users/:id", "/users/42");
// → { id: '42' }

extractParamsFromPath("/a/:x/b/:y", "/a/foo/b/bar");
// → { x: 'foo', y: 'bar' }
```
