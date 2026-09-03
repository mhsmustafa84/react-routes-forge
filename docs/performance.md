# Performance & Caching

`react-routes-forge` is designed to be extremely lightweight (zero dependencies) and highly performant. This guide explains its performance characteristics and caching strategies.

## Regex Caching Strategy

To parse paths and match routes efficiently, `react-routes-forge` compiles path templates into regular expressions. Because compiling regexes on every render or navigation would be slow, the library uses an internal cache.

Whenever a function like `matchPath()`, `extractParamsFromPath()`, or `isActivePath()` is called:
1. The library checks if a regular expression for the given template string already exists in the cache.
2. If so, it reuses the compiled regex.
3. If not, it compiles a new regex and stores it in the cache for future use.

### Why caching matters
In a React application, hooks like `useActivePath` may run on every render for every link in your navigation menu. Caching the regexes ensures that these hooks execute in less than a millisecond, even in large component trees.

## Memory Footprint

The cache uses a simple Map where the key is the string template (e.g., `"/users/:id"`) and the value is the compiled `RegExp`.

For the vast majority of applications, the number of unique route templates is small (typically between 10 and 100). The memory footprint for this cache is negligible (a few kilobytes).

### When to use `clearPathCache()`

You almost never need to manually clear the cache in a standard Single Page Application (SPA). The cache will naturally stay small because the number of route *templates* is finite.

However, you might need to use `clearPathCache()` in the following scenarios:
- **Long-running SSR processes**: If your server-side rendering process dynamically generates an infinite number of unique *templates* on the fly (which is an anti-pattern, but possible), the cache could grow unbounded over days or weeks.
- **Test environments**: If you want to ensure complete isolation between test runs and reset all internal state.

```ts
import { clearPathCache } from "react-routes-forge";

// Flush the compiled regex cache
clearPathCache();
```

## Benchmarks vs Manual String Building

How does `.build()` compare to manual template literals?

```ts
// Manual string building
const path = `/users/${id}`; // Extremely fast natively

// react-routes-forge
const path = PATHS.USERS.EDIT.build({ id }); // Slightly slower, but still sub-millisecond
```

The `buildPath` function is highly optimized. It uses a single regex replacement pass over the template string. In benchmarks, it can resolve hundreds of thousands of paths per second. The performance difference compared to manual string concatenation is imperceptible in real-world React applications, while providing compile-time type safety and automatic URL encoding.

## SSR Patterns

When using `react-routes-forge` in Server-Side Rendering (SSR) frameworks like Next.js or Remix:

1. **Route definition**: Your `PATHS` object can be safely imported on both the client and the server.
2. **Hooks**: Ensure that hooks imported from `react-routes-forge/hooks` are only executed on the client side, as they rely on React Router context which may not be available during server renders.
3. **Memory**: The route cache is shared across the Node.js process. As long as you use static templates in your `defineRoutes` tree, memory usage will remain flat and stable.
