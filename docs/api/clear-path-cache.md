# clearPathCache

`clearPathCache(): void`

Clears the internal regex caches used by `matchPath()` / prefix matching. Primarily useful in test suites to prevent cached patterns from leaking across test cases.

```ts
import { clearPathCache } from "react-routes-forge";

beforeEach(() => {
  clearPathCache();
});
```
