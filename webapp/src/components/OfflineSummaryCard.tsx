import { Panel } from '@/components/Panel';
import { Text } from '@/components/ui/Text';
import { formatCompactNumber } from '@/utils/number';

interface OfflineSummaryCardProps {
  energy: number;
  xp: number;
  durationSec: number;
  levelsGained?: number;
  capped?: boolean;
  onExpand?: () => void;
}

export function OfflineSummaryCard({
  energy,
  xp,
  durationSec,
  levelsGained,
  capped,
  onExpand,
}: OfflineSummaryCardProps) {
  const hours = Math.floor(durationSec / 3600);
  const minutes = Math.floor((durationSec % 3600) / 60);
  const durationLabel = hours > 0 ? `${hours}ч ${minutes}м` : `${minutes}м`;

  return (
    <Panel tone="overlay" spacing="sm" border="subtle">
      <div className="flex items-center justify-between">
        <div>
          <Text variant="body" weight="semibold">
            Возврат офлайн
          </Text>
          <Text variant="caption" tone="secondary">
            {durationSec > 0 ? `Вы были вне игры ${durationLabel}` : 'Вы вернулись почти сразу.'}
          </Text>
        </div>
        {onExpand && (
          <button
            type="button"
            className="rounded-full bg-layer-overlay-ghost px-3 py-1 text-caption"
            onClick={onExpand}
          >
            Детали
          </button>
        )}
      </div>
      <div className="mt-2 grid gap-2 text-bodySm">
        <div className="flex items-center justify-between">
          <Text variant="caption" tone="secondary">
            Энергия
          </Text>
          <Text variant="bodySm" weight="semibold">
            +{formatCompactNumber(Math.floor(energy))}
          </Text>
        </div>
        <div className="flex items-center justify-between">
          <Text variant="caption" tone="secondary">
            XP
          </Text>
          <Text variant="bodySm" weight="semibold">
            +{formatCompactNumber(Math.floor(xp))}
          </Text>
        </div>
        {levelsGained && levelsGained > 0 && (
          <div className="flex items-center justify-between">
            <Text variant="caption" tone="secondary">
              Уровни
            </Text>
            <Text variant="bodySm" weight="semibold">
              +{levelsGained}
            </Text>
          </div>
        )}
      </div>
      {capped && (
        <Text variant="caption" tone="warning" className="mt-2">
          Достигнут лимит офлайна. Заходите чаще!
        </Text>
      )}
    </Panel>
  );
}
