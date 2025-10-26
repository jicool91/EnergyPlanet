# Home Panel – Stats Grid

- **Element ID**: `<div className="grid grid-cols-2 gap-2 px-4 py-2 ...">` containing `StatCard`s
- **Source**: `webapp/src/components/HomePanel.tsx:57`
- **Role**: Display four key metrics (Energy, Tap Lvl, Passive, Level progress).

## Implementation Summary
- Four `StatCard` instances with icon, label, primary value, and sublabel.
- Responsive grid adjusts to `xl:grid-cols-4`; uses Russian labels except `Tap Lvl`.
- Values already formatted (energy compact, XP remaining etc.).

## Checklist Findings
- **Consistency**: Mixed language (English `Tap Lvl`, `Passive` vs Russian) harms localisation clarity. **Severity: Medium**
- **Accessibility**: Icons rely on emoji; ensure accessible `aria-hidden` (handled by `StatCard`? confirm). Provide descriptive text for screen reader users. **Severity: Low**
- **Theme & Contrast**: `StatCard` uses gradient backgrounds? Need to verify contrast in dark mode; ensure text meets Telegram spec (contrast ratio > 4.5:1). citeturn0search0 **Severity: Medium**
- **Dynamic Values**: `passiveIncomeLabel` can be `'—'`; confirm this is acceptable placeholder and consider tooltip.

## Interaction & API Coverage
- Purely informational; no CTA. If players expect to tap for details, consider clickable expansion.

## Issues & Risks
1. **Locale Mix**: Standardise to Russian or introduce i18n. **Severity: Medium**
2. **Missing Tooltips**: Without explanation of multipliers, new users may not grasp `Престиж ×` string; add info icon. **Severity: Low**

## Opportunities
- Display delta indicators (e.g., +5%) to emphasise recent upgrades.
- Hook each card to analytics (e.g., `stat_hover`) if interactive tooltips added.
