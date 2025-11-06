import { ModalBase } from './ModalBase';
import { Panel } from './Panel';
import { Text } from './ui/Text';
import { formatCompactNumber } from '../utils/number';

/**
 * OfflineSummaryModal Component
 * Displays offline progress summary with energy, XP, and level gains
 * Uses ModalBase for consistent styling and animation
 */

interface OfflineSummaryModalProps {
  isOpen: boolean;
  energy: number;
  xp: number;
  durationSec: number;
  capped: boolean;
  levelStart?: number;
  levelEnd?: number;
  levelsGained?: number;
  onClose: () => void;
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;

  if (hours > 0) {
    return `${hours}ч ${minutes}м`;
  }
  if (minutes > 0) {
    return `${minutes}м ${remaining}с`;
  }
  return `${remaining}с`;
};

export function OfflineSummaryModal({
  isOpen,
  energy,
  xp,
  durationSec,
  capped,
  levelStart,
  levelEnd,
  levelsGained,
  onClose,
}: OfflineSummaryModalProps) {
  const startLevel = levelStart ?? null;
  const endLevel = levelEnd ?? null;
  const computedLevelDelta =
    levelStart != null && levelEnd != null ? Math.max(levelEnd - levelStart, 0) : null;
  const gainedLevels = Math.max(levelsGained ?? computedLevelDelta ?? 0, 0);
  const energyLabel = formatCompactNumber(Math.floor(energy));
  const xpLabel = xp > 0 ? formatCompactNumber(Math.floor(xp)) : null;
  const passivePerSecondLabel =
    energy > 0 && durationSec > 0
      ? formatCompactNumber(Math.floor(energy / Math.max(durationSec, 1)))
      : null;

  return (
    <ModalBase
      isOpen={isOpen}
      title="Возврат офлайн"
      onClose={onClose}
      size="sm"
      actions={[{ label: 'Продолжить', variant: 'primary', onClick: onClose }]}
    >
      <div className="flex max-h-[70vh] flex-col gap-md overflow-y-auto pr-1">
        <Panel tone="overlay" border="subtle" spacing="sm">
          <Text variant="body" weight="semibold">
            Пока вас не было
          </Text>
          <Text variant="bodySm" tone="secondary">
            {durationSec > 0
              ? `Вы были офлайн ${formatDuration(durationSec)}.`
              : 'Вы вернулись практически сразу — прогресс почти не копился.'}
          </Text>
          <div className="grid gap-xs">
            <div className="flex items-center justify-between">
              <Text variant="caption" tone="secondary">
                Энергия
              </Text>
              <Text variant="bodySm" weight="semibold">
                +{energyLabel}
              </Text>
            </div>
            {xpLabel && (
              <div className="flex items-center justify-between">
                <Text variant="caption" tone="secondary">
                  XP
                </Text>
                <Text variant="bodySm" weight="semibold">
                  +{xpLabel}
                </Text>
              </div>
            )}
            {passivePerSecondLabel && (
              <div className="flex items-center justify-between">
                <Text variant="caption" tone="secondary">
                  Средний пассивный доход
                </Text>
                <Text variant="bodySm" weight="semibold">
                  {passivePerSecondLabel} E/с
                </Text>
              </div>
            )}
            {gainedLevels > 0 && (
              <div className="flex items-center justify-between">
                <Text variant="caption" tone="secondary">
                  Уровень
                </Text>
                <Text variant="bodySm" weight="semibold">
                  {startLevel ?? '—'} → {endLevel ?? '—'}
                </Text>
              </div>
            )}
          </div>
        </Panel>

        {gainedLevels === 0 && (energy > 0 || xp > 0) && (
          <Panel tone="overlay" border="none" spacing="sm">
            <Text variant="caption" tone="secondary">
              Уровень не изменился, но накопленная энергия уже добавлена на ваш счёт.
            </Text>
          </Panel>
        )}

        {capped && (
          <Panel tone="accent" border="accent" spacing="sm">
            <Text variant="bodySm" weight="semibold" tone="inverse">
              Лимит офлайна достигнут
            </Text>
            <Text variant="caption" tone="inverse" transform="uppercase">
              Подключайтесь чаще, чтобы не терять доход.
            </Text>
          </Panel>
        )}
      </div>
    </ModalBase>
  );
}
