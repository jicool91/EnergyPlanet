import clsx from 'clsx';
import { Panel } from '@/components/Panel';
import { Text } from '@/components/ui/Text';

interface ProgressBannerProps {
  levelsGained: number;
  fromLevel: number;
  toLevel: number;
  unlockedPerks?: string[];
  className?: string;
}

export function ProgressBanner({
  levelsGained,
  fromLevel,
  toLevel,
  unlockedPerks = [],
  className,
}: ProgressBannerProps) {
  if (levelsGained <= 0) {
    return null;
  }

  return (
    <Panel
      tone="overlayStrong"
      border="accent"
      spacing="sm"
      className={clsx('w-full animate-fade-in-up', className)}
    >
      <Text variant="body" weight="semibold">
        +{levelsGained} уров.
      </Text>
      <Text variant="caption" tone="secondary">
        {fromLevel} → {toLevel}
      </Text>
      {unlockedPerks.length > 0 && (
        <ul className="mt-2 space-y-1 text-caption">
          {unlockedPerks.map(perk => (
            <li key={perk}>• {perk}</li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
