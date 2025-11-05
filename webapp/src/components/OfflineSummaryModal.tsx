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
      <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden space-y-4">
        <section className="flex flex-col gap-2 bg-surface-secondary/70 border border-border-subtle/60 rounded-xl p-4">
          <p className="m-0 text-body text-token-primary font-semibold">Пока вас не было</p>
          <p className="m-0 text-sm text-token-secondary leading-relaxed">
            {durationSec > 0 ? (
              <>Вы были офлайн {formatDuration(durationSec)}.</>
            ) : (
              <>Вы вернулись практически сразу — прогресс почти не копился.</>
            )}
          </p>
          <ul className="m-0 list-none flex flex-col gap-2 text-sm text-token-secondary">
            <li className="flex items-center justify-between gap-3">
              <span className="text-token-secondary">Энергия</span>
              <strong className="text-token-primary">+{energyLabel}</strong>
            </li>
            {xpLabel && (
              <li className="flex items-center justify-between gap-3">
                <span className="text-token-secondary">XP</span>
                <strong className="text-token-primary">+{xpLabel}</strong>
              </li>
            )}
            {passivePerSecondLabel && (
              <li className="flex items-center justify-between gap-3">
                <span className="text-token-secondary">Средний пассивный доход</span>
                <strong className="text-token-primary">{passivePerSecondLabel} E/с</strong>
              </li>
            )}
            {gainedLevels > 0 && (
              <li className="flex items-center justify-between gap-3">
                <span className="text-token-secondary">Уровень</span>
                <strong className="text-token-primary">
                  {startLevel != null ? startLevel : '—'} → {endLevel != null ? endLevel : '—'}
                </strong>
              </li>
            )}
          </ul>
        </section>

        {gainedLevels === 0 && (energy > 0 || xp > 0) && (
          <p className="m-0 text-xs text-token-secondary/80">
            Уровень не изменился, но накопленная энергия уже добавлена на ваш счёт.
          </p>
        )}

        {capped && (
          <div className="flex flex-col gap-1 bg-orange/15 border border-orange/40 text-orange/90 rounded-xl px-4 py-3">
            <span className="font-semibold text-token-primary">Лимит офлайна достигнут</span>
            <span className="text-xs uppercase tracking-wide text-orange/80">
              подключайтесь чаще, чтобы не терять доход
            </span>
          </div>
        )}
      </div>
    </ModalBase>
  );
}
