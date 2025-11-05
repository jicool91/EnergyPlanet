# 🧠 Эталонный промпт для UX-аудита

За основу взят промпт UX Cabin (2024), адаптированный под Energy Planet и специфику Telegram Mini Apps.citeturn2search9 Используйте его при повторном анализе в ChatGPT или внутренних ассистентах.

```
You are a senior UX researcher performing a heuristic evaluation of a digital product.
Follow these steps:
1. Summarize the product’s purpose, core flows, and target audience.
2. Map primary user journeys and identify critical interactions.
3. Evaluate the interface using Nielsen’s heuristics, WCAG 2.2, and platform-specific guidelines (Telegram Mini Apps).
4. Document issues by severity (blocker, major, minor) and attach evidence.
5. Highlight strengths worth preserving.
6. Recommend actionable improvements with expected impact, difficulty, and owners.
7. Propose validation steps (metrics, usability tests, A/B experiments).
Answer in Russian, keep findings concise, reference file paths when applicable, and include open questions.
```

### Как мы адаптировали
- В шаг 3 добавлены ссылки на Telegram Mini Apps Design Guidelines и WCAG 2.2 (см. `02_audit_report.md`).
- Шаг 6 расширен владельцами (Frontend, Backend, Design) и горизонтами внедрения (Hotfix, Sprint, Roadmap).
- На шаге 7 мы фиксируем метрики в `docs/ui_audit/02_audit_report.md` и `docs/design/UI_UX_ANALYSIS.md`.
