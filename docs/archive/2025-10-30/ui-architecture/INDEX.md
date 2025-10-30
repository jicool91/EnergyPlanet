# UI Architecture Portal

**Location:** `/docs/ui-architecture/`
**Status:** Living document ✅
**Last Updated:** 2025-10-27

---

## Document Set (7 files)

| # | File | Focus | Why Read It |
|---|------|-------|-------------|
| 1 | `README.md` | Executive summary | High-level state of the UI stack, strengths, and the roadmap we are driving.
| 2 | `Pages-Architecture.md` | Screen topology | How `App.tsx` and `MainScreen.tsx` orchestrate the seven tabs, data lifecycles, and transitions.
| 3 | `Current-Pages-Analysis.md` | Deep dive per tab | What already works, tech debt, and blockers for each panel (`HomePanel`, `ShopPanel`, etc.).
| 4 | `Design-Tokens.md` | Design system source of truth | CSS token inventory, Tailwind bridge plan, and theming guidelines for Telegram Mini Apps.
| 5 | `Component-Guidelines.md` | Component library reference | Usage patterns for `Card`, `Button`, skeletons, virtualization helpers, plus upcoming consolidations.
| 6 | `Quick-Start.md` | First implementation sprint | 3–4 hour implementation track to align spacing, layout surfaces, and telemetry around the design system.
| 7 | `INDEX.md` | Navigation | You are here.

---

## Suggested Reading Paths

- **Strategy first (45 min):** `README.md` → `Pages-Architecture.md` → skim `Design-Tokens.md` tables.
- **Implementation first (2–3 h hands-on):** `Quick-Start.md` → relevant sections in `Design-Tokens.md` → `Component-Guidelines.md` checklists.
- **Audit & planning (60 min):** `Current-Pages-Analysis.md` → `Pages-Architecture.md` → backlog tables in `README.md`.

---

## How to Keep This Updated

1. When UI code changes materially (layout, tokens, navigation), update the affected doc in the same PR.
2. Record the new `Last Updated` date and note major deltas in the `README.md` changelog section.
3. Cross-link Jira / Linear tickets in the checklists so the docs stay execution-focused.
