# devWarn

`devWarn(message): void`

Emits a `console.warn` in non-production environments. Shared by the core utilities and `defineRoutes()` so the production check lives in one place.

```ts
import { devWarn } from "react-routes-forge";

devWarn("[route-forge] Something looks wrong.");
// → console.warn in dev/test, silent in production bundles
```

## Use Cases

You can leverage `devWarn` in your own codebase to log warnings that are automatically stripped out of production bundles:

### Custom Route Validations

If you build custom routing abstractions on top of `react-routes-forge`, you can use `devWarn` to guide other developers on your team without bloating the production bundle:

```ts
import { devWarn } from "react-routes-forge";
import { PATHS } from "./routes";

function navigateToFeature(featureId) {
  if (!featureId) {
    devWarn("navigateToFeature called without a featureId. Falling back to home.");
    return PATHS.HOME;
  }
  return PATHS.FEATURES.DETAILS.build({ featureId });
}
```

### Deprecation Warnings

Use it to deprecate old routes before they are fully removed:

```ts
import { devWarn } from "react-routes-forge";
import { useEffect } from "react";
import { useActivePath } from "react-routes-forge/hooks";

function LegacyDashboard() {
  const isLegacy = useActivePath("/legacy/dashboard");
  
  useEffect(() => {
    if (isLegacy) {
      devWarn("The /legacy/dashboard route is deprecated. Use PATHS.APP.DASHBOARD instead.");
    }
  }, [isLegacy]);

  return <DashboardView />;
}
```
