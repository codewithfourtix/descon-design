# Descon Assure — LIQS

**Laboratory Information & Quality System** — a front-end demo of a lab quality-management platform, themed for [Descon](https://descon.com) and built around standard LIMS / ISO/IEC 17025 conventions.

> Demo build: pure front-end with mock data — **no backend, no API calls**. Everything (tables, CRUD, exports, the AI assistant, the file explorer) is simulated in the browser.

## Run it

No build step. Just open `index.html` in a modern browser, or serve the folder:

```bash
# any static server works, e.g.
npx serve .
# or
python -m http.server 8000
```

Chart.js, Lucide icons, and Google Fonts load from CDNs (needs internet for those); all app logic and data are local.

## Features

- **Plant streams** — Hydrogen Peroxide (Descon Oxychem), Urea, Ammonia, Nitric Acid, CAN, NP/Agri, Utilities — each with its own dashboard, **Result Entry** worksheet, **Quality & OOS**, CoA, and Non-Routine tabs. Every stream has distinct data/graphs.
- **QC analytics** — Specification Conformance bars and **SPC control charts** (mean, ±2σ/±3σ limits, out-of-control flags).
- **Quality & Compliance** — Nonconformities & CAPA, Specifications register, Documents & SOPs.
- **Inventory & Instruments** — Reagents & Chemicals, Instruments & Calibration, Sample Register.
- **Operations** — Shift Scheduling, Shift Handover, and a mocked **multi-agent Assistant** (Codex-style orchestration animation).
- **File Explorer** — right-docked, resizable file tree (SOPs, Methods, CoAs, Chromatograms, Calibration Certs, SDS) with preview.
- Interactive everywhere: live search/sort/pagination, add/edit/delete, CSV export, dark mode, collapsible + resizable sidebar, period (Daily/MTD/QTD/YTD) scaling.

## Tech

Vanilla HTML/CSS/JS · [Chart.js](https://www.chartjs.org/) · [Lucide](https://lucide.dev/) · Inter/Roboto. No framework, no bundler.

## Structure

```
index.html          # shell: top bar, sidebar, content, file panel
css/styles.css      # design system (Descon blue/red, dark mode)
js/
  data*.js          # mock datasets + per-stream generators
  ui.js             # table engine, modals, toasts, CSV export
  charts.js         # Chart.js helpers (bars, lines, SPC, doughnuts)
  ai-engine.js      # mock AI intents + multi-agent definitions
  app.js            # router, sidebar, top-bar interactivity
  screens/*.js      # one module per screen
assets/logo.jpg     # Descon logo
```

_This is a design/demo artifact, not a production system._
