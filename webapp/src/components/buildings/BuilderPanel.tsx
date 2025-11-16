import { useMemo } from 'react';
import { Panel } from '@/components/Panel';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/Button';
import { useConstructionStore } from '@/store/constructionStore';

interface BuilderPanelProps {
  onPurchaseBuilder?: () => void;
  onAccelerate?: (jobId: string) => void;
}

export function BuilderPanel({ onPurchaseBuilder, onAccelerate }: BuilderPanelProps) {
  const builders = useConstructionStore(state => state.builders);
  const activeJobs = useConstructionStore(state => state.activeJobs);
  const queuedJobs = useConstructionStore(state => state.queuedJobs);
  const completeJob = useConstructionStore(state => state.completeJobRequest);

  const builderCards = useMemo(() => {
    return builders.map(builder => {
      const job = activeJobs.find(item => item.builderSlot === builder.slotIndex);
      const eta = job ? new Date(job.completesAt) : null;
      const isReady = job ? new Date(job.completesAt).getTime() <= Date.now() : false;
      return (
        <Panel key={builder.slotIndex} tone="overlay" spacing="sm" border="subtle">
          <div className="flex items-center justify-between">
            <div>
              <Text variant="body" weight="semibold">
                Строитель #{builder.slotIndex + 1}
              </Text>
              <Text variant="caption" tone="secondary">
                {builder.status === 'active'
                  ? 'Работает'
                  : builder.status === 'inactive'
                    ? 'Отключён'
                    : 'Истёк'}
              </Text>
            </div>
            {builder.slotIndex === 1 && builder.status !== 'active' && (
              <Button size="xs" variant="primary" onClick={onPurchaseBuilder}>
                Купить дрона
              </Button>
            )}
          </div>
          {job ? (
            <div className="mt-2">
              <Text variant="bodySm">
                {job.buildingId} • {job.action}
              </Text>
              <Text variant="caption" tone="secondary">
                Завершение: {eta ? eta.toLocaleTimeString() : '—'}
              </Text>
              {isReady ? (
                <Button
                  size="xs"
                  variant="primary"
                  className="mt-2"
                  onClick={() => completeJob(job.id).catch(console.error)}
                >
                  Забрать
                </Button>
              ) : (
                onAccelerate && (
                  <Button
                    size="xs"
                    variant="ghost"
                    className="mt-2"
                    onClick={() => onAccelerate(job.id)}
                  >
                    Ускорить
                  </Button>
                )
              )}
            </div>
          ) : (
            <Text variant="caption" tone="secondary" className="mt-2">
              Свободен — выберите здание в магазине
            </Text>
          )}
        </Panel>
      );
    });
  }, [builders, activeJobs, onPurchaseBuilder, onAccelerate]);

  return (
    <div className="flex flex-col gap-sm">
      <Text variant="body" weight="semibold">
        Строители
      </Text>
      {builderCards.length > 0 ? (
        builderCards
      ) : (
        <Panel tone="overlay" spacing="sm">
          <Text variant="bodySm">Строители не найдены. Обратитесь в поддержку.</Text>
        </Panel>
      )}
      {queuedJobs.length > 0 && (
        <Panel tone="overlayStrong" spacing="sm">
          <Text variant="body" weight="semibold">
            В очереди ({queuedJobs.length})
          </Text>
          <ul className="mt-2 space-y-1">
            {queuedJobs.map(job => (
              <li key={job.id} className="text-sm text-text-secondary">
                {job.buildingId} • старт при освобождении строителя • XP {job.xpReward}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
