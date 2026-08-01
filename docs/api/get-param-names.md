# getParamNames

`getParamNames(template): string[]`

Returns the list of param names present in a template string.

```ts
import { getParamNames } from "react-routes-forge";

getParamNames("/users/:id/posts/:postId"); // → ['id', 'postId']
getParamNames("/files/*");                 // → ['*']  (the splat param)
getParamNames("/users");                   // → []
```
