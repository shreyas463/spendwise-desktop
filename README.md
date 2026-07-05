# SpendWise Desktop

A **local-first** cross-platform desktop app for personal finance. Import your bank and credit-card CSV exports, get automatic transaction categorization, interactive spending analytics, budgets with alerts, and a chat interface that answers plain-English questions about your money — all computed on your machine. **No account, no server, no cloud. Your data never leaves your computer.**

## ✨ Features

- **CSV import with format detection** — handles signed-amount and debit/credit column layouts, `MM/DD/YYYY` / `DD/MM/YYYY` / ISO / text dates, quoted fields, `$1,234.56` and European `1.234,56` amounts, accounting `(45.00)` negatives, and comma/semicolon/tab delimiters. Re-importing the same file never creates duplicates.
- **Automatic categorization** — ~150 built-in merchant rules (Whole Foods → Groceries, SQ \*Blue Bottle → Dining, …) plus your own rules, which always win and can re-categorize existing history. Messy statement text like `SQ *BLUE BOTTLE COFFEE #442` becomes a clean merchant name, "Blue Bottle Coffee".
- **Dashboard** — monthly spend / income / net KPIs with month-over-month deltas, category donut, 6-month trend, budget snapshot, recent activity.
- **Analytics** — category breakdown, monthly spend + transaction-count composed chart, stacked category mix over time, top merchants; each chart exports to CSV. 3/6/12-month ranges.
- **Budgets** — monthly limits per category with on-track / approaching / over states, inline limit editing, and an over-budget badge in the sidebar.
- **Chat with your data** — ask "What did I spend on groceries last month?", "Top merchants this year", "Compare dining vs groceries", "How are my budgets doing?" and get instant, deterministic answers computed from your local data (no LLM, no network).
- **Transactions** — search, filter, paginate, inline category editing, one-click "create rule from this transaction", manual entry, CSV export.
- **Theming & settings** — light / dark / system theme, multi-currency display, JSON backup export, demo dataset for trying the app.

## 🏗 Architecture

SpendWise is intentionally simple: **one Electron app, zero services**.

```
┌────────────────────────────────────────────────────────┐
│ Electron main process (electron/)                      │
│   window · native file dialogs · atomic JSON storage   │
│   in the OS user-data directory                        │
├──────────────────── IPC (preload bridge) ──────────────┤
│ Renderer (src/)                                        │
│   React + Tailwind + Recharts UI (src/pages)           │
│   Pure business logic (src/core):                      │
│     csv.ts        RFC 4180 parser + format detection   │
│     categorize.ts merchant extraction + rules engine   │
│     analytics.ts  aggregations (trends, budgets, …)    │
│     query.ts      natural-language query engine        │
│     store.ts      import pipeline, dedup, migration    │
└────────────────────────────────────────────────────────┘
```

Everything in `src/core` is dependency-free TypeScript — no DOM, no Electron — so it runs identically in the app, in a plain browser, and under Vitest. The renderer talks to the host through a single typed bridge (`src/services/backend.ts`) that falls back to `localStorage` in a browser, which means the entire UI can be developed and tested without launching Electron (`npm run dev:web`).

> **Why no database/microservices?** Earlier iterations of this project ran five Spring Boot services, PostgreSQL, and a local LLM via Docker. For a single-user desktop app that's pure operational overhead: a JSON document (atomically written, validated and migrated on load) comfortably handles tens of thousands of transactions, keeps the install a single binary, and makes "local-first privacy" literally true.

## 🚀 Getting started

### Prerequisites

- Node.js 18+ (that's it — no Java, no Docker, no Postgres, no Ollama)

### Run in development

```bash
npm install
npm run dev        # launches Vite + the Electron app with hot reload
```

Or develop the UI in a plain browser (localStorage-backed):

```bash
npm run dev:web    # http://localhost:5173
```

Try it out with the **Load demo data** button on the dashboard, or import the files in [sample-data/](sample-data/).

### Tests & checks

```bash
npm test           # Vitest unit suite (CSV parsing, categorization, analytics, NL queries)
npm run typecheck  # strict TypeScript
npm run lint       # ESLint
```

### Package for distribution

```bash
npm run build      # typecheck + build + electron-builder
                   #   macOS: DMG · Windows: NSIS installer · Linux: AppImage
npm run build:dir  # fast unpacked build (release/) for local smoke-testing
```

## 📄 CSV formats

SpendWise auto-detects columns by header name. It needs at minimum a **date**, a **description**, and either an **amount** column (negative = money out) or a **debit**/**credit** pair. Extra columns are ignored. See [sample-data/](sample-data/) for two differently-shaped examples (a US bank export and a semicolon-delimited European credit-card export).

## 🔒 Privacy

All data lives in a single JSON document in your OS user-data folder (e.g. `~/Library/Application Support/SpendWise/` on macOS). The app makes no network requests. Backup and restore is a file copy — or use *Settings → Export backup*.

## 📜 License

MIT
