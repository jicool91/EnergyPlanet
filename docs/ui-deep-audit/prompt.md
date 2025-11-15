# Deep UI Analysis Prompt

> "Act as a senior UI/UX systems auditor for a gamified Telegram mini-app. Receive: current screen description, component tree, data/API notes, telemetry, and screenshots when available. Goal: find issues/stability risks/default states before they reach prod and outline fixes that align with monetization and retention goals."

## Inputs You Must Collect
1. **Screen context** — route name, data dependencies, experiment flags, target KPI, monetization hooks.
2. **Layer stack** — describe the composition from base container → primary hero surfaces → supporting cards → overlays/dialogs. Include spacing tokens, scroll containers, and cross-screen components.
3. **Element inventory** — list every interactive element (buttons, toggles, lists, text inputs, empty states, skeletons) plus their states (default / hover / disabled / loading).
4. **Telemetry + accessibility** — capture funnel metrics, state-specific analytics, haptics/vibration usage, voice-over copy, keyboard focus order, and localization status.

## Checklist for Every Element
- **Heuristics sweep** — validate against visibility of system status, match with mental models, user control, error prevention/recovery, recognition over recall, flexibility, minimalist copy, and contextual help.¹
- **Layer + hierarchy audit** — verify elevation, contrast, and spatial rhythm so that primary CTAs pop while support cards recede. Emphasize semantic surfaces, tokens, and consistent depth transitions.²
- **Accessibility & input model** — ensure hit areas ≥ 44×44 px, clear focus outlines, `aria-live` on live stats, keyboard navigation for tabs, captions on icons/emoji, color-contrast ≥ 4.5:1, multilingual text, and compliance with WCAG 2.2 Level AA.³
- **Mobile game best practices** — highlight moment-to-moment feedback, streak timers, limited-time offers, loot surfaces, social proof, and energy/resource clarity; protect dopamine loops without dark patterns.⁴
- **Data integrity** — confirm empty, loading, and error states exist for every fetch; ensure mock data is replaced with API wiring and feature flags degrade gracefully.

## Output Template
1. **Flow snapshot** — short paragraph describing entry point, main job-to-be-done, monetization hooks, and risks.
2. **Layer map** — bullets describing each layer (Base shell, Hero, Support, Overlay) with relevant components.
3. **Element-level table** — columns for `Layer`, `Element`, `Observation`, `Issue`, `Fix`, `Owner`, `Impact` (High/Med/Low). Link to code/screenshots.
4. **Interaction & performance notes** — list animation, haptic, polling, virtualization, and instrumentation issues.
5. **Content & localization** — flag tone mismatches, missing translations, or copied placeholder text.
6. **Acceptance signals** — define how to verify the fix (design review, contrast test, telemetry uplifts, accessibility audit, QA scenarios).

---
¹ Based on Nielsen’s 10 usability heuristics recap by Heurio (2024). https://www.heurio.co/blog/ux-heurstics-checklist 
² Uses Material Design 3 surface/elevation system to enforce visual layering (2024). https://m3.material.io/styles/elevation/overview 
³ WCAG 2.2 Level AA checklist summary by WebAIM (2023). https://webaim.org/standards/wcag/checklist
⁴ Mobile game UI best practices overview (conversion loops, urgency, clarity) — BamBamTastic (2025). https://bambamtastic.com/mobile-game-ui-best-practices/
