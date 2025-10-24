import { ModalBase } from './ModalBase';
import { useTelegramMainButton } from '../hooks';

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
  const supportsMainButton =
    typeof window !== 'undefined' && Boolean(window.Telegram?.WebApp?.MainButton);

  useTelegramMainButton({
    text: 'Продолжить',
    onClick: onClose,
    enabled: isOpen && supportsMainButton,
  });

  return (
    <ModalBase
      isOpen={isOpen}
      title="Возврат офлайн"
      onClose={onClose}
      showClose={false}
      size="sm"
      actions={supportsMainButton ? [] : [{ label: 'Понял', variant: 'primary', onClick: onClose }]}
    >
      <div className="max-h-[80vh] overflow-y-auto pr-1 space-y-4">
        <div className="text-body text-white/80">
          {durationSec > 0 || energy > 0 || xp > 0 ? (
            <>
              За {formatDuration(durationSec)} вы накопили{' '}
              <strong>{Math.floor(energy).toLocaleString()} энергии</strong>
              {xp > 0 ? ` и ${Math.floor(xp).toLocaleString()} XP` : ''}.
            </>
          ) : (
            <>Пока вы были офлайн, прогресс продолжал считаться.</>
          )}
          {gainedLevels && gainedLevels > 0 && (
            <>
              {' '}
              Уровень вырос с {startLevel ?? '-'} до {endLevel ?? '-'} ({gainedLevels} новых уровней).
            </>
          )}
        </div>

        <div className="grid gap-3 text-sm text-white/75">
          {(energy > 0 || durationSec > 0) && (
            <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <span className="text-white/60">Пассивный доход</span>
              <span className="font-semibold">
                {Math.floor(energy / Math.max(durationSec, 1)).toLocaleString()} E/с
              </span>
            </div>
          )}
          {gainedLevels != null && (
            <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <span className="text-white/60">Новые уровни</span>
              <span className="font-semibold">{gainedLevels > 0 ? `+${gainedLevels}` : '—'}</span>
            </div>
          )}
          {capped && (
            <div className="flex justify-between items-center bg-orange/15 border border-orange/40 text-orange/90 rounded-lg px-3 py-2">
              <span>Лимит офлайна достигнут</span>
              <span className="text-xs uppercase tracking-wide">подключайтесь чаще</span>
            </div>
          )}
        </div>
      </div>
    </ModalBase>
  );
}
