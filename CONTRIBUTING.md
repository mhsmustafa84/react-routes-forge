# Contributing to react-routes-forge

First off, thank you for considering contributing to `react-routes-forge`!

## Getting Started

1. Clone the repository
2. Install dependencies using [bun](https://bun.sh/):
   ```bash
   bun install
   ```

## Development Workflow

- Run `bun run dev` to watch for file changes and compile TypeScript automatically.
- Ensure that the code successfully compiles with `bun run build` before pushing.

## Commit Guidelines

We use `standard-version` for automatic versioning and changelog generation. Therefore, **we strictly follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification** for our commit messages.

### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Best Practices

- **Use the imperative mood** in the description (e.g., "add feature" instead of "added feature" or "adds feature").
- **Keep the subject line short**, ideally under 50 characters, and do not end it with a period.
- **Separate subject from body** with a blank line.
- **Wrap the body at 72 characters** to ensure it's easy to read in git tools.
- **Explain _what_ and _why_** in the body, instead of _how_. The code already explains how.
- **Reference issues or tickets** in the footer (e.g., `Fixes #123`).

**Allowed `<type>`s:**

- `feat`: A new feature (triggers a MINOR version bump)
- `fix`: A bug fix (triggers a PATCH version bump)
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to our CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

**Note:** Adding `BREAKING CHANGE:` in the footer or a `!` after the type/scope (e.g., `feat!: new API`) will trigger a MAJOR version bump.
