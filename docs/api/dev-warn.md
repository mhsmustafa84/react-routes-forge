# devWarn

`devWarn(message): void`

Emits a `console.warn` in non-production environments. Shared by the core utilities and `defineRoutes()` so the production check lives in one place.

```ts
import { devWarn } from "react-routes-forge";

devWarn("[route-forge] Something looks wrong.");
// → console.warn in dev/test, silent in production bundles
```
