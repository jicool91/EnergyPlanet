import { useMemo } from 'react';
import { Surface, Text, ProgressBar, Button } from '@/components';
import type { HeaderActionConfig } from '@/constants/headerSchema';

type NavigateHandler = (path: string, options?: { replace?: boolean }) => void;

interface PreparedAction extends HeaderActionConfig {
  variant: NonNullable<HeaderActionConfig['variant']>;
}

const EMPTY_ACTIONS: HeaderActionConfig[] = [];

function usePreparedActions(
  actions: HeaderActionConfig[] | undefined,
  fallbackVariant: PreparedAction['variant']
) {
  return useMemo<PreparedAction[]>(() => {
    const source = actions ?? EMPTY_ACTIONS;
    return source.map(action => ({
      ...action,
      variant: action.variant ?? fallbackVariant,
    }));
  }, [actions, fallbackVariant]);
}

interface TapStatusHeaderProps {
  level: number;
  energy: number;
  stars: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  actions?: HeaderActionConfig[];
  onNavigate: NavigateHandler;
  numberFormatter: Intl.NumberFormat;
}

export function TapStatusHeader({
  level,
  energy,
  stars,
  xpIntoLevel,
  xpToNextLevel,
  actions,
  onNavigate,
  numberFormatter,
}: TapStatusHeaderProps) {
  const preparedStats = useMemo(() => {
    const formattedEnergy = numberFormatter.format(energy);
    const formattedStars = numberFormatter.format(stars);
    const maxProgress = xpIntoLevel + xpToNextLevel;

    return {
      level,
      formattedEnergy,
      formattedStars,
      progressValue: xpIntoLevel,
      progressMax: maxProgress > 0 ? maxProgress : xpIntoLevel || 1,
    };
  }, [energy, level, numberFormatter, stars, xpIntoLevel, xpToNextLevel]);

  const preparedActions = usePreparedActions(actions, 'primary');

  return (
    <Surface
      tone="overlayMedium"
      border="subtle"
      elevation="strong"
      padding="md"
      rounded="3xl"
      className="flex items-center justify-between gap-4"
    >
      <div className="flex flex-col gap-1">
        <Text variant="label" weight="semibold" tone="accent" transform="uppercase">
          Уровень {preparedStats.level}
        </Text>
        <div className="flex items-center gap-3">
          <Text as="span" variant="body" tone="primary" className="flex items-center gap-1">
            ⚡ {preparedStats.formattedEnergy}
          </Text>
          <Text as="span" variant="body" tone="accent" className="flex items-center gap-1">
            ⭐ {preparedStats.formattedStars}
          </Text>
        </div>
        <ProgressBar
          value={preparedStats.progressValue}
          max={preparedStats.progressMax}
          className="max-w-[220px]"
        />
      </div>
      <div className="flex items-center gap-2">
        {preparedActions.map(action => (
          <Button
            key={action.id}
            type="button"
            size="md"
            variant={action.variant}
            onClick={() => onNavigate(action.target, { replace: action.replace })}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </Surface>
  );
}

interface SimpleHeaderProps {
  title: string;
  actions?: HeaderActionConfig[];
  onNavigate: NavigateHandler;
}

export function SimpleHeader({ title, actions, onNavigate }: SimpleHeaderProps) {
  const preparedActions = usePreparedActions(actions, 'secondary');

  return (
    <Surface
      tone="overlayMedium"
      border="subtle"
      elevation="strong"
      padding="md"
      rounded="3xl"
      className="flex items-center justify-between"
    >
      <Text as="span" variant="title" tone="primary" weight="semibold">
        {title}
      </Text>
      <div className="flex items-center gap-2">
        {preparedActions.map(action => (
          <Button
            key={action.id}
            type="button"
            size="md"
            variant={action.variant}
            className="text-text-secondary"
            onClick={() => onNavigate(action.target, { replace: action.replace })}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </Surface>
  );
}
