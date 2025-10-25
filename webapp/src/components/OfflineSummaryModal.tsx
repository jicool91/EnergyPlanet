import { ModalBase } from './ModalBase';
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
  const gainedLevels =
    levelsGained ?? (levelStart != null && levelEnd != null ? levelEnd - levelStart : null);
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
      <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden pr-1 space-y-4">
        <p className="text-body text-token-secondary leading-relaxed break-words">
          {durationSec > 0 || energy > 0 || xp > 0 ? (
            <>
              {`За ${formatDuration(durationSec)} вы накопили `}
              <strong>{energyLabel} энергии</strong>
              {xpLabel ? ` и ${xpLabel} XP` : ''}.
            </>
          ) : (
            <>Пока вы были офлайн, прогресс продолжал считаться.</>
          )}
          {gainedLevels && gainedLevels > 0 && (
            <span className="block mt-2">
              Уровень вырос с {startLevel ?? '-'} до {endLevel ?? '-'} ({gainedLevels} новых
              уровней).
            </span>
          )}
        </p>

        <div className="grid gap-3 text-sm text-token-secondary">
          {(energy > 0 || durationSec > 0) && passivePerSecondLabel && (
            <div
              className="grid grid-cols-[1fr_auto] gap-3 items-center rounded-lg px-3 py-2"
              style={{
                background: 'color-mix(in srgb, var(--color-border-subtle) 20%, transparent)',
                border: '1px solid color-mix(in srgb, var(--color-border-subtle) 60%, transparent)',
              }}
            >
              <span className="text-token-secondary break-words">Пассивный доход</span>
              <span className="font-semibold text-right whitespace-nowrap text-token-primary">
                {passivePerSecondLabel} E/с
              </span>
            </div>
          )}
          {gainedLevels != null && (
            <div
              className="grid grid-cols-[1fr_auto] gap-3 items-center rounded-lg px-3 py-2"
              style={{
                background: 'color-mix(in srgb, var(--color-border-subtle) 20%, transparent)',
                border: '1px solid color-mix(in srgb, var(--color-border-subtle) 60%, transparent)',
              }}
            >
              <span className="text-token-secondary break-words">Новые уровни</span>
              <span className="font-semibold text-right text-token-primary">
                {gainedLevels > 0 ? `+${gainedLevels}` : '—'}
              </span>
            </div>
          )}
          {capped && (
            <div className="grid gap-1 bg-orange/15 border border-orange/40 text-orange/90 rounded-lg px-3 py-2">
              <span className="font-semibold text-token-primary">Лимит офлайна достигнут</span>
              <span className="text-xs uppercase tracking-wide text-orange/80">
                подключайтесь чаще
              </span>
            </div>
          )}
        </div>
      </div>
    </ModalBase>
  );
}
