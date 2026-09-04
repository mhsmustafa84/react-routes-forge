# react-routes-forge Agent Guidelines

Welcome to `react-routes-forge`! When assisting with this repository, please adhere to the following architecture rules, style guidelines, and best practices.

## 🏗️ Architecture & Philosophy

- **Zero Core Dependencies**: The core package (`src/core/*`) must remain dependency-free. Do not add `react`, `react-router`, or `next` as dependencies to the core API.
- **Framework Adapters**:
  - React Router specific code lives in `src/hooks/*`.
  - Next.js specific code lives in `src/next/*`.
  - Never import from router libraries in the core implementation.
- **Strict Typing**: This is a heavily type-driven library. Avoid using `any`. Ensure all route param inference, query string serializations, and hook return types are strictly typed with generic TypeScript magic.
- **Single Source of Truth**: The library's core philosophy is maintaining a single source of truth for both route definitions and path building.

## 💻 Tech Stack & Commands

- **Package Manager**: Use `bun` for installing dependencies and running scripts.
- **Build Tool**: Built using `tsup`. Run `bun run build` to generate `esm` and `cjs` outputs.
- **Testing**:
  - Run unit tests with `bun run test`.
  - To generate coverage, use `bun run test:coverage`.
- **Linting**:
  - Run `bun run lint` to check types (`tsc --noEmit`).
  - Run `bun run lint:eslint` to check code style.
- **Documentation**: Built with VitePress. Run `bun run docs:dev` for local development.

## 📝 Code Style & Guidelines

- **Exports**: Ensure all types and utilities are properly exported from `src/index.ts`.
- **Comments & JSDoc**: Add detailed JSDoc comments for all public APIs. Ensure code examples are included in the JSDoc comments to help users leverage autocomplete features effectively.
- **Backward Compatibility**: Be mindful of backward compatibility. The hooks must continue to work identically with both `react-router` and `react-router-dom` across v6 and v7.

## 📚 Documentation Updates

When modifying or adding new features (e.g. core functions or hooks):

1. Update the `README.md`.
2. Add or update the markdown pages inside the `docs/` directory.
3. Make sure `migration.md` and `changelog.md` are updated inside the `docs/` directory.
4. If changing API signatures, make sure both React Router and Next.js variants are documented where applicable.
