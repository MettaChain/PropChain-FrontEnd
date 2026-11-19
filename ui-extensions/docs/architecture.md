# ui-extensions Architecture

This document describes the `ui-extensions/` folder as laid out in the repository and described in `ui-extensions/README.md`.

## Folder structure

| Subfolder | Purpose |
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

## Isolation principle

The main codebase (`src/`, `public/`, `tests/`, etc.) is undergoing active cleanup and refactoring by the core team. To avoid conflicts, all new work lives under `ui-extensions/` and the main codebase is not modified unless an issue explicitly requires it.

## Relationship to the main codebase

Extensions follow the conventions of the main codebase (style, naming, patterns) and use only dependencies already in `package.json`. Extensions may read from or mirror patterns in `src/` (for example `src/components/MultiCurrencyBalance.tsx`), but must not change it.

## Dependency direction

```
ui-extensions/*  --(read-only imports)-->  src/ and package.json dependencies
src/             --(no dependency)-->      ui-extensions/
```

Inside `ui-extensions/`, `components/`, `hooks/`, `lib/` and `utils/` may depend on `types/`; `stories/`, `tests/` and `examples/` consume the others.

## Contribution workflow

1. Keep every new file under `ui-extensions/`.
2. Match existing conventions and use TypeScript.
3. Add tests for each component, hook or utility.
4. Ensure lint and build pass before opening a PR.

## Examples

See `ui-extensions/components/WalletBalanceCard.tsx` and `ui-extensions/types/` for extensions that follow this structure.
