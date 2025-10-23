import { motion } from 'framer-motion';

interface OfflineSummaryModalProps {
  energy: number;
  xp: number;
  durationSec: number;
  capped: boolean;
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
  onClose,
}: OfflineSummaryModalProps) {
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
        <p className="m-0 mb-5 text-sm leading-[1.5] text-white/75">
          За {formatDuration(durationSec)} вы накопили{' '}
          <strong>{Math.floor(energy).toLocaleString()} энергии</strong>
          {xp > 0 ? ` и ${Math.floor(xp).toLocaleString()} XP` : ''}.
        </p>
        {capped && (
          <p className="m-0 mb-5 text-sm leading-[1.5] text-white/75">
            Достигнут лимит офлайна — подключайтесь чаще, чтобы не терять доход!
          </p>
        )}
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
