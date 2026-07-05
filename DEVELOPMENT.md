# Development Guide

## Prerequisites

- **Node.js 18+** — the only requirement.

## Setup

```bash
npm install
```

## Everyday commands

| Command             | What it does                                                        |
| ------------------- | ------------------------------------------------------------------- |
| `npm run dev`       | Vite dev server + Electron window, hot reload for renderer and main |
| `npm run dev:web`   | Renderer only, in your browser (localStorage-backed bridge)         |
| `npm test`          | Vitest unit suite (`tests/`)                                        |
| `npm run test:watch`| Vitest in watch mode                                                |
| `npm run typecheck` | `tsc --noEmit` over `src/`, `electron/`, `tests/`                   |
| `npm run lint`      | ESLint                                                              |
| `npm run build`     | Typecheck + production build + `electron-builder` installers        |
| `npm run build:dir` | Unpacked packaged app in `release/` (fast smoke test)               |

## Project layout

```
electron/          Main process + preload (thin: window, dialogs, storage IPC)
src/core/          Pure business logic — no DOM/Electron imports, fully unit-tested
  types.ts         Domain types + the persisted Store shape
  csv.ts           RFC 4180 parser, bank-format detection, amount/date parsing
  pdf.ts           PURE statement parser: extracted text -> transaction rows
  categorize.ts    Merchant extraction + rule matching
  categories.ts    Built-in categories and ~150 keyword rules
  analytics.ts     Aggregations: summaries, trends, breakdowns, budgets
  query.ts         Natural-language question answering
  store.ts         Default store, validation/migration, import pipeline (dedup)
  demo.ts          Seeded demo dataset generator
src/services/      backend.ts — typed bridge (Electron IPC ⇄ browser fallback)
                   pdfExtract.ts — PDF.js text extraction (renderer-only, lazy)
src/contexts/      DataContext — app state, actions, debounced persistence
src/components/    Layout, shared UI primitives, ImportButton
src/pages/         Dashboard, Transactions, Analytics, Budgets, Chat, Settings
tests/             Vitest suites for everything in src/core
sample-data/       Example CSVs in two different bank formats
```

## Architecture rules of thumb

1. **Business logic goes in `src/core`** and must stay pure (no `window`, no `electron`, no React). That is what makes it testable and lets the whole app run in a browser.
2. **The main process stays thin.** It only owns things the renderer cannot do: native dialogs and durable file storage. Storage is one JSON document written atomically (`tmp` + `rename`); corrupt files are set aside as `*.corrupt-<ts>`, never silently overwritten.
3. **State flows through `DataContext`.** Components call its actions; it recomputes derived data with the pure functions in `src/core` and persists with a 250 ms debounce.
4. **Renderer ⇄ host contract** is the `SpendWiseBridge` interface in `src/services/backend.ts`. If you add an IPC channel, update the preload script and that interface together.

## Data & privacy

User data lives at Electron's `userData` path (e.g. `~/Library/Application Support/SpendWise/spendwise-data.json`). Delete that file to reset the app. The app must never make network requests — keep it that way.

## Releasing

`npm run build` produces platform installers in `release/` (DMG on macOS, NSIS on Windows, AppImage on Linux — build on each platform or in CI). macOS code signing requires a Developer ID certificate; unsigned builds work locally with right-click → Open.
