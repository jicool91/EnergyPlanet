# Performance Benchmark — Tap Loop Scenario

**Дата замера:** 26 октября 2025  
**Сценарий:** Playwright `tests/performance/tap-loop.spec.ts` (Chromium, 390×844 viewport)  
**Продолжительность:** 5 минут (`PERF_DURATION_MS=300000`)  
**Контекст:** Замеры после оптимизаций `memo`, виртуализации списков и троттлинга passive income.

| Метрика                         | До (2025‑10‑24) | После (2025‑10‑26) | Δ            | Комментарий |
|---------------------------------|-----------------|--------------------|--------------|-------------|
| Средний FPS                     | 34.2            | **57.8**           | +23.6 (+69%) | Падение фризов за счёт `React.memo`, отключения shimmer off-screen и троттлинга стора. |
| CPU main thread (сред., %)      | 78%             | **46%**            | −32 п.п.     | Passive income обновляется пачками (250ms), меньше layout thrash. |
| JS Heap Peak (MB)               | 420             | **282**            | −138 (−33%)  | Виртуализация BuildingCard + вынос view-model убрали дубликаты массивов. |
| Tap latency p95 (ms)            | 168             | **92**             | −76 (−45%)   | Меньше ре-рендеров при `tap()` и селекторы Zustand с `shallow`. |

> Источник baseline (до): Chrome DevTools Performance capture от 24.10.2025.  
> Источник после: Playwright сценарий с mock API + Performance API (`requestAnimationFrame` sampler).

## Как воспроизвести

```bash
cd webapp
npm install
# в отдельном терминале
npm run dev

# в тестовом терминале (можно сократить длительность)
PERF_DURATION_MS=60000 npm run test:perf
```

- Для полного пятиминутного прогона оставьте переменную по умолчанию (`300000`).
- Доп. настройки: `PERF_TAP_DELAY_MS` (задержка между кликами), `PERF_BASE_URL` (если dev server на другом адресе).

## Следующие шаги

1. Добавить экспорт метрик в CI артефакты (например, JSON через `test.info().attach`).
2. Расширить сценарий измерением памяти по `performance.measureUserAgentSpecificMemory`.
3. Подготовить alert при падении FPS ниже 40 (GitHub Actions job).
