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

export function OfflineSummaryModal({ energy, xp, durationSec, capped, onClose }: OfflineSummaryModalProps) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <h2>Возврат офлайн</h2>
        <p>
          За {formatDuration(durationSec)} вы накопили <strong>{Math.floor(energy).toLocaleString()} энергии</strong>
          {xp > 0 ? ` и ${Math.floor(xp).toLocaleString()} XP` : ''}.
        </p>
        {capped && <p>Достигнут лимит офлайна — подключайтесь чаще, чтобы не терять доход!</p>}
        <div className="modal-actions">
          <button className="modal-button primary" type="button" onClick={onClose}>
            Понял
          </button>
        </div>
      </div>
    </div>
  );
}
