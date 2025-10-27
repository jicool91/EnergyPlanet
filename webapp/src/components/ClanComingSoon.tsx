import { memo } from 'react';

/**
 * Placeholder component for upcoming clan functionality.
 */
const ClanComingSoonComponent = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <span className="text-4xl" role="img" aria-label="Clan emblem">
        🛡️
      </span>
      <div className="flex flex-col gap-2 max-w-xs">
        <h2 className="text-heading text-[var(--color-text-primary)]">Кланы скоро</h2>
        <p className="text-body text-[var(--color-text-secondary)]">
          Мы готовим систему кланов, чтобы вы могли объединяться и получать больше наград. Следите
          за обновлениями!
        </p>
      </div>
    </div>
  );
};

export const ClanComingSoon = memo(ClanComingSoonComponent);
