import { motion } from 'framer-motion';

interface OfflineSummaryModalProps {
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

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[1000]"
      role="dialog"
      aria-modal="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="bg-dark-secondary rounded-lg p-6 w-full max-w-[360px] shadow-[0_16px_40px_rgba(10,17,61,0.35)] border border-cyan/20 text-[#f8fbff]"
        initial={{ scale: 0.8, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, y: 20, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.5, duration: 0.4 }}
      >
        <h2 className="m-0 mb-3 text-xl font-semibold">Возврат офлайн</h2>
        <div className="m-0 mb-4 text-sm leading-[1.45] text-white/80">
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
              Уровень вырос с {startLevel ?? '-'} до {endLevel ?? '-'} ({gainedLevels} новых
              уровней).
            </>
          )}
        </div>
        <div className="grid gap-3 text-sm text-white/75 mb-5">
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
            <div className="flex justify-between items-center bg-orange/15 border border-orange/40 text-[#ffd798] rounded-lg px-3 py-2">
              <span>Лимит офлайна достигнут</span>
              <span className="text-xs uppercase tracking-wide">подключайтесь чаще</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-end">
          <button
            className="px-[18px] py-[10px] rounded-[10px] border-0 text-sm cursor-pointer transition-all duration-[120ms] ease-in-out bg-gradient-to-br from-cyan to-[#0073ff] text-[#010414] font-semibold shadow-[0_8px_20px_rgba(0,115,255,0.35)] active:scale-[0.97]"
            type="button"
            onClick={onClose}
          >
            Понял
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
