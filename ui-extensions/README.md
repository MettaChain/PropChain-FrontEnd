# UI Extensions

This folder contains self-contained extensions to the PropChain frontend application.

## Purpose

The main codebase (`src/`, `public/`, `tests/`, etc.) is undergoing active cleanup and refactoring by the core team. To keep new work isolated, all external additions live here.

## Subfolders

| Subfolder | Contents |
|-----------|---------|
| `components/` | React components |
| `hooks/` | Custom React hooks |
| `utils/` | Utility functions, formatters, validators |
| `lib/` | Data services, API clients, business logic |
| `stories/` | Storybook stories |
| `tests/` | Test files and fixtures |
| `docs/` | Tutorials, guides, architecture notes |
| `types/` | TypeScript interfaces and types |
| `examples/` | Usage examples, demos |

## Rules

1. **Stay in this folder.** All new files must be under `ui-extensions/`.
2. **Do not modify the main codebase** (`src/`, `public/`, `tests/`, etc.) unless an issue explicitly requires it.
3. **Follow existing conventions.** Match the coding style, naming, and patterns in the main codebase.
4. **Write tests.** Every component, hook, or utility should include tests.
5. **Use TypeScript.** All code must be properly typed.
6. **Keep dependencies self-contained.** Use only dependencies already in `package.json`.
7. **Ensure lint and build pass** before submitting a PR.
