You are a senior product designer, frontend architect, and UI engineer.

Your task is to COMPLETELY REVAMP the structure and layout of the existing Descon Assure LIQS website/application.

IMPORTANT:
This is NOT a color-change task.
Do NOT focus on changing colors.
Do NOT create a new color palette.
Do NOT convert the app into a dark theme unless the current app already uses it.
Do NOT waste time changing only colors, gradients, shadows, fonts, or small cosmetic details.

The goal is STRUCTURAL DIFFERENTIATION.

The current website is ours:
https://descon-design.vercel.app

The uploaded PDF is the competitor reference:
AILAB Updated1 (1)(1).pdf

The competitor design uses a very recognizable structure:
- full left sidebar
- top horizontal control bar
- date filters near the top
- Daily / MTD / QTD / YTD controls
- horizontal KPI card row
- dashboard cards in a grid
- chart cards
- table cards
- page tabs under the header
- repeated same dashboard layout across pages
- standalone AI chat page inside the same shell

Our website must NOT follow that same structural pattern.

Again:
DO NOT solve this by changing colors.
The website can keep the existing Descon colors.
The website can keep brand colors.
The website can keep the current color identity.
The main change must be layout, page composition, navigation structure, information hierarchy, and interaction model.

Before changing anything:
1. Inspect the complete codebase.
2. Find all routes/pages.
3. Find the shared app shell/layout.
4. Find sidebar/header/navigation components.
5. Find dashboard cards, tables, charts, filters, and tab components.
6. Understand how data is passed to each page.
7. Then redesign the structure across the whole app.

DO NOT redesign only one page.
DO NOT only change Overview.
DO NOT only change CSS variables.
DO NOT only change Tailwind colors.
DO NOT only change button colors.
DO NOT only change border radius.
DO NOT only add a few cards.
DO NOT leave the same layout with different styling.

The competitor PDF contains these page patterns that must be structurally avoided:

1. Sample Management dashboard:
Avoid the same left sidebar + top filters + KPI strip + charts + table layout.

2. Lab Sheet:
Avoid the same grid of many small lab test cards.

3. Quality Report:
Avoid the same KPI row + 2x2 chart-card dashboard.

4. Special Samples:
Avoid the same KPI row + table-first layout.

5. ISO 17025 Audits:
Avoid the same tabs + KPI row + progress cards + audit table structure.

6. Document Management:
Avoid the same search/filter row + KPI cards + document card layout.

7. Chemicals & Glassware:
Avoid the same metric row + inventory table layout.

8. Plant-wise Analytics:
Avoid repeating the same sample dashboard structure.

9. Site-wise Analytics:
Avoid the same KPI row + card grid + donut chart layout.

10. AI Assistance:
Avoid the same standalone full-page chat layout.

STRUCTURAL REDESIGN GOAL:

Create a new application structure called:

“Descon Operations Workspace”

This should feel like a different product even if viewed in black and white.

That is the key test:
If someone removes all colors from both designs, our layout should still look completely different from the competitor.

GLOBAL STRUCTURE REQUIREMENTS:

Replace the competitor-like structure with a new layout system.

Use one of these structural directions:

Option A:
Top workspace navigation + collapsible module drawer + main split workspace

Option B:
Left compact icon rail + secondary module panel + main work area

Option C:
Top command bar + page-specific workspace panels + right action drawer

Pick the best one based on the existing codebase, but the final product must NOT look like:
full left sidebar + top filters + KPI cards + chart grid.

Required global changes:

1. Navigation
- Replace the long full left sidebar as the main navigation pattern.
- Use a compact navigation rail, module launcher, top module switcher, or collapsible drawer.
- Page navigation should not look like the competitor sidebar.
- Active states can use existing Descon colors, but the structure must change.

2. Header
- Do not keep the same competitor-style top filter row.
- Move date filters into a collapsible filter drawer, command bar, or page header tools area.
- Do not keep Daily / MTD / QTD / YTD as the dominant visual element in the same top position.
- Make the header more like a workspace command area, not a copied dashboard toolbar.

3. KPI / Metrics
- Do not use the same horizontal KPI card strip.
- Replace with:
  - grouped health panels
  - vertical summary rail
  - status clusters
  - priority blocks
  - compact metric sidebar
  - inline metric bands inside sections
- Metrics should support the workflow, not dominate the page as a copied row.

4. Main Content
- Avoid equal dashboard cards in a predictable grid.
- Use asymmetric layouts.
- Use split panes.
- Use action queues.
- Use timelines.
- Use pipeline boards.
- Use matrix layouts.
- Use detail drawers.
- Use master-detail views.
- Use command/workspace style pages.

5. Tables
- Do not just place tables under KPI cards.
- Tables should become work queues, inspection lists, approval queues, or master-detail grids.
- Important rows should open a detail panel/drawer.
- Use filtering in side panels or drawer controls, not always top search bars.

6. AI
- Do not keep AI Assistance only as a standalone chat page.
- Add AI as a contextual assistant panel/drawer available from relevant pages.
- AI page can still exist, but it must be structurally different from the competitor full-page chat.

PAGE-BY-PAGE STRUCTURAL REDESIGN:

1. Overview / Site Dashboard

Current competitor-like pattern to avoid:
KPI row at top, charts below, tables below.

New structure:
Create an “Operations Workspace Overview”.

Suggested layout:
- Left/main area: large operational status board.
- Middle area: Today’s action queue.
- Right area: risk/insight panel.
- Use sections like:
  - Site Health
  - Critical Exceptions
  - Pending Approvals
  - Shift Progress
  - Units Requiring Attention
  - Today’s Actions
- Metrics should appear inside these sections, not as a copied KPI strip.

Do not use:
- horizontal KPI card row
- identical chart card grid
- same top filter structure

2. Sample Management

Current competitor-like pattern to avoid:
KPI strip + charts + table.

New structure:
Create “Sample Control Workspace”.

Suggested layout:
- Board/queue layout instead of dashboard layout.
- Columns or lanes:
  - Due Now
  - Late
  - In Review
  - Off Spec
  - Approved
  - Completed
- Add a selected sample detail drawer.
- Show sample timeline/activity.
- Show shift-based grouping in a side panel or section.
- Table can exist, but it should be secondary or master-detail, not the main copied layout.

3. Lab Sheet

Current competitor-like pattern to avoid:
Many small white lab cards in a grid.

New structure:
Create “Lab Entry Console”.

Suggested layout:
- One dense spreadsheet-like entry console.
- Left side: sample/test list.
- Center: editable results grid.
- Right side: selected parameter details, validation, previous readings, comments.
- Top: compact command actions only.
- Use row/column grouping instead of mini-card grid.

Do not use:
- many small cards arranged like competitor page 3

4. Quality Report

Current competitor-like pattern to avoid:
KPI row + 2x2 chart cards.

New structure:
Create “Quality Exception Workspace”.

Suggested layout:
- Left: exception severity list.
- Center: deviation investigation board.
- Right: approval/review queue.
- Add root-cause clusters, repeat issue list, parameter risk matrix.
- Charts should be embedded as supporting evidence, not arranged as copied chart cards.

Do not use:
- 2x2 dashboard chart layout
- KPI strip

5. Special Samples

Current competitor-like pattern to avoid:
Top KPI row + history table.

New structure:
Create “Special Request Pipeline”.

Suggested layout:
- Pipeline stages:
  New Request → Accepted → Testing → Review → Approved → Closed
- Each request appears as a compact work item.
- Selecting a request opens a side drawer.
- Add priority filters in a drawer or side panel.
- History table can exist as a secondary view, not the default copied structure.

6. ISO 17025 Audits

Current competitor-like pattern to avoid:
Tabs + KPI cards + progress cards + table.

New structure:
Create “Audit Compliance Workspace”.

Suggested layout:
- Left: audit timeline/calendar.
- Center: non-conformity board.
- Right: CAPA/action queue.
- Add clause risk matrix.
- Add audit closure flow.
- Make it workflow-based, not card-dashboard-based.

Do not use:
- same audit dashboard composition
- same tab row under header

7. Document Management

Current competitor-like pattern to avoid:
Search row + KPI cards + document card.

New structure:
Create “Controlled Document Vault”.

Suggested layout:
- Left: document categories/lifecycle states.
- Center: document list or vault grid.
- Right: selected document preview/details/version history.
- Lifecycle sections:
  Draft
  Active
  Under Review
  Expiring
  Archived
- Search can exist, but not as the main copied top layout.

8. Chemicals & Glassware

Current competitor-like pattern to avoid:
Metric row + inventory table.

New structure:
Create “Inventory Risk Workspace”.

Suggested layout:
- Left: stock risk lanes.
- Center: inventory master-detail grid.
- Right: reorder/replenishment panel.
- Show:
  - Out of Stock
  - Critical
  - Low Stock
  - Normal
- The table should be part of a risk workflow, not just a copied table page.

9. Plant-wise Analytics

Current competitor-like pattern to avoid:
Same as sample dashboard.

New structure:
Create “Plant Intelligence Workspace”.

Suggested layout:
- Plant comparison matrix.
- Risk-ranked plant list.
- Trend panel for selected plant.
- Operational anomalies.
- Drill-down drawer.

Do not copy:
- KPI strip + chart grid

10. Site-wise Analytics

Current competitor-like pattern to avoid:
KPI row + compliance table + performer cards + donut charts.

New structure:
Create “Site Performance Workspace”.

Suggested layout:
- Site health matrix.
- Area-of-concern ranking.
- Shift comparison section.
- Performance leaderboard.
- Drilldown panel.
- Charts should not use the same card-grid composition.

11. AI Assistance

Current competitor-like pattern to avoid:
Standalone chat page in the same shell.

New structure:
Create “Operations Assistant”.

Suggested layout:
- AI opens as right-side drawer or floating command panel.
- It should be contextual to the current page.
- Include suggested prompts based on active module.
- Include action cards, not just chat bubbles.
- AI page can exist, but should look like a command center assistant, not a copied chat window.

IMPLEMENTATION REQUIREMENTS:

Preserve:
- existing routes
- existing data
- existing APIs
- existing business modules
- existing brand colors unless absolutely necessary
- existing functionality

Change:
- layout structure
- navigation structure
- page composition
- dashboard hierarchy
- information architecture
- component arrangement
- filter placement
- tab placement
- AI placement
- table/detail interaction
- workflow presentation

Build reusable structural components:
- AppShell
- CommandBar
- CompactNavigation
- ModuleSwitcher
- FilterDrawer
- SplitWorkspace
- WorkspaceHeader
- ActionQueue
- DetailDrawer
- StatusCluster
- RiskPanel
- PipelineBoard
- MasterDetailTable
- TimelineView
- AssistantDrawer

Important:
These are structural components, not color/theme components.

RESPONSIVE REQUIREMENTS:

Desktop:
- compact navigation
- command/header area
- main workspace
- optional right drawer/panel

Tablet:
- navigation collapses
- right panel becomes drawer
- tables remain usable

Mobile:
- compact module menu
- stacked workspace sections
- bottom or drawer navigation if needed

FINAL CHECK:

After redesign, compare the site against the competitor PDF.

Ask this:
If both designs were shown in grayscale, would they still look similar?

If yes, the redesign has failed.

The final website must be structurally different in:
- navigation
- header
- filter placement
- KPI/metric presentation
- page layout
- dashboard composition
- table placement
- AI assistant placement
- workflow structure
- module organization

Success criteria:
- The app does not look like the competitor structurally.
- The app does not use the same left-sidebar/top-filter/KPI-card/chart-grid formula.
- All main pages are redesigned.
- Existing functionality still works.
- Existing brand colors are mostly preserved.
- The build passes.
- No broken routes.
- No unfinished placeholder pages.
- No TODO comments.
- No partial redesign.

Do not stop after small visual changes.
Do not say it is complete unless the structure of the full application has changed.
Start by inspecting the full codebase, then implement the structural revamp across all pages.