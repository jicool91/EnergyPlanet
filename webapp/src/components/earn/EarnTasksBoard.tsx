import { useState, memo } from 'react';
import { BoostHub } from '@/components/BoostHub';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

type TaskFilter = 'all' | 'daily' | 'ad' | 'premium';

const FILTERS: Array<{ id: TaskFilter; label: string }> = [
  { id: 'all', label: 'Все задания' },
  { id: 'daily', label: 'Ежедневные' },
  { id: 'ad', label: 'Реклама' },
  { id: 'premium', label: 'Премиум' },
];

export const EarnTasksBoard = memo(function EarnTasksBoard() {
  const [filter, setFilter] = useState<TaskFilter>('all');

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-heading font-semibold text-[var(--color-text-primary)]">
            Задания и бусты
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Выполняйте ежедневные миссии, смотрите рекламу или активируйте премиум-бонусы, чтобы
            ускорить прогресс.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setFilter('all')}>
          Сбросить фильтр
        </Button>
      </header>

      <nav
        className="flex flex-wrap gap-2 rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(28,31,38,0.72)] p-2"
        aria-label="Фильтр заданий"
      >
        {FILTERS.map(option => {
          const isActive = filter === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)] ${
                isActive
                  ? 'bg-[rgba(243,186,47,0.18)] text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.05)]'
              }`}
              aria-pressed={isActive}
            >
              {option.label}
            </button>
          );
        })}
      </nav>

      <Card className="flex flex-col gap-4 border-[rgba(255,255,255,0.08)] bg-[rgba(36,38,45,0.72)]">
        <BoostHub
          showHeader={false}
          filter={filter === 'all' ? undefined : (filter as 'daily' | 'ad' | 'premium')}
        />
      </Card>
    </div>
  );
});
