# UI Deep Audit (2025-11-15)

This folder contains the working package for a layered UI teardown of the Energy Planet mini-app. It is split into:

- `prompt.md` — the reusable deep-analysis prompt sourced from current heuristic, accessibility, and game UI best practices.
- `screens/` — one markdown per in-product screen. Each file maps the stack (base layout → primary surface → overlays) and lists element-level findings with remediation ideas.
- `roadmap.md` — an actionable backlog that links every problem statement to the originating analysis file.

How to work with the pack:
1. Start with `prompt.md` whenever you need to re-run or delegate the teardown. It encodes the heuristics, accessibility checks, visual-layer inspection, and monetization guardrails we want every reviewer to apply.
2. Use the relevant screen document during design reviews or grooming. Each file tags issues by layer so designers, engineers, and QA can focus on the precise fragment of UI.
3. Track delivery in `roadmap.md`. Problems are grouped by priority, reference back to the evidence, and contain “definition of done” hints.

Every document was generated from the code present on November 15, 2025 (see `webapp/src/screens`). When UI code changes, mirror the edits here so that links in the roadmap stay accurate.
