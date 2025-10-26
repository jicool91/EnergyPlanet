# Telegram Mini App UI Deep-Dive Prompt

Use this prompt when you need to run a systematic Telegram Mini App UI review that drills down to every element in the hierarchy. It is aligned with Telegram Mini App guidelines for mobile ergonomics, safe areas, theme coherence, performance, and monetisation flows. citeturn0search0turn0search3turn0search4

---

**Role & Mindset**
- Adopt the perspective of a Telegram Mini App UX auditor with hands-on knowledge of TDLib/WebApp APIs, mobile design heuristics, and in-app commerce flows.
- Prioritise compliance with Telegram Mini App ergonomics: responsive layout inside the Web App container, correct safe-area handling, theme-aware colours, and non-blocking performance. citeturn0search0turn0search3turn0search4

**Inputs You Must Collect Before Analysis**
1. Latest UI mockups or live build screenshots for each tab/state.
2. Component hierarchy (from code or storybook) showing nested containers, interactive elements, typography tokens, and Tailwind classes.
3. API contract for every interactive element (button, toggle, purchase flow) including expected HTTP method, success payload, and known failure codes.
4. Telemetry / logging plan + analytics events bound to each UI action.

**Analysis Workflow (Run In Order)**
1. **Container Baseline**
   - Confirm viewport sizing logic respects safe areas and Telegram theme variables.
   - Check root scrolling behaviour, overscroll affordances, and inertia.
   - Document breakpoints and how layout shifts on compact/large devices.
2. **Child Layout Pass**
   - Traverse the DOM/JSX tree depth-first (top to bottom, left to right).
   - For each container, log: purpose, key styles, spacing rhythm, responsive rules, and animation triggers.
   - Highlight accessibility hooks (ARIA, focus order, keyboard support).
3. **Interactive Element Audit**
   - For every button/toggle/link: capture copy, visual state tokens, haptic feedback, routing/action target, and debounce/throttling.
   - Map each control to its API request (endpoint, method, optimistic UI strategy). Note any endpoints returning 4xx/5xx during manual QA; attach logs and request payloads.
4. **Data & State Observability**
   - Identify state sources (Zustand slices, React Query caches) backing each component.
   - Record empty/loading/error states and confirm skeleton usage.
   - Verify telemetry events align with the funnel goals (purchase, retention, social loops).
5. **Theme & Visual Consistency**
   - Validate colour usage against Telegram theme keys (`--tg-theme-*`), contrast ratios, and light/dark variants.
   - Review typography scale, weights, and localisation readiness (Ru/En length variance).
6. **Performance & Motion**
   - Note lazy-loading, suspense boundaries, animation libraries (Framer Motion), and potential layout thrashers.
   - Flag components exceeding 16ms render on profiling or using expensive effects on scroll.
7. **Risk Register**
   - Summarise issues by severity (Critical, High, Medium, Low).
   - Attach reproduction steps, affected elements, suspected root cause, and telemetry correlation.

**Deliverables Per Element**
- `Element ID / Selector`
- Purpose & Success Criteria
- Implementation Summary (component file + key props)
- UX Compliance Checklist (safe area, feedback, accessibility, localisation)
- Interaction & API coverage (include HTTP verbs, payloads, response handling, and observed failures)
- Visual/Brand Observations (spacing, tokens, animation taste)
- Opportunities / Follow-up questions

**Testing & Validation Reminders**
- Exercise flows on low bandwidth / throttled CPU.
- Toggle Telegram theme between light/dark and accent variations.
- Validate mini-app expansions (50%, 70%, full height) and landscape fallback.
- Confirm “Back” and closing behaviours align with Telegram Mini App UX.

**Output Format**
Generate Markdown reports per element, keeping sections in the same order so findings can be aggregated quickly. Use clear severity labels and link to relevant code paths (e.g., `webapp/src/components/HomePanel.tsx:42`). Add screenshots or recording references when available.
