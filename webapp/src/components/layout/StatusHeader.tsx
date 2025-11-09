import { useMemo, useId } from 'react';
import { Surface, Text, ProgressBar, Button, IconButton } from '@/components';
import type { HeaderActionConfig } from '@/constants/headerSchema';
import { useGameStore } from '@/store/gameStore';

type NavigateHandler = (path: string, options?: { replace?: boolean }) => void;

type PreparedAction = Omit<HeaderActionConfig, 'variant'> & {
  variant: NonNullable<HeaderActionConfig['variant']>;
};

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
  const progressDescriptionId = useId();
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
      border="none"
      elevation="medium"
      padding="md"
      rounded="2xl"
      className="flex items-center justify-between gap-4"
      role="region"
      aria-label="Сводка прогресса"
    >
      <div className="flex flex-col gap-1" role="group" aria-label="Статистика профиля">
        <Text
          variant="label"
          weight="semibold"
          tone="accent"
          transform="uppercase"
          aria-label={`Текущий уровень ${preparedStats.level}`}
        >
          Уровень {preparedStats.level}
        </Text>
        <div className="flex items-center gap-3" role="list">
          <Text
            as="span"
            variant="body"
            tone="primary"
            className="flex items-center gap-1"
            role="listitem"
            aria-label={`Энергия ${preparedStats.formattedEnergy}`}
          >
            ⚡ {preparedStats.formattedEnergy}
          </Text>
          <Text
            as="span"
            variant="body"
            tone="accent"
            className="flex items-center gap-1"
            role="listitem"
            aria-label={`Звёзды ${preparedStats.formattedStars}`}
          >
            ⭐ {preparedStats.formattedStars}
          </Text>
        </div>
        <ProgressBar
          value={preparedStats.progressValue}
          max={preparedStats.progressMax}
          className="max-w-[220px]"
          aria-describedby={progressDescriptionId}
        />
        <Text id={progressDescriptionId} className="sr-only">
          Опыт {preparedStats.progressValue} из {preparedStats.progressMax}
        </Text>
      </div>
      <div className="flex items-center gap-2">
        {preparedActions.map(action =>
          action.icon ? (
            <IconButton
              key={action.id}
              type="button"
              size="md"
              variant={action.variant}
              aria-label={action.label}
              onClick={() => onNavigate(action.target, { replace: action.replace })}
              icon={<span className="text-xl">{action.icon}</span>}
            />
          ) : (
            <Button
              key={action.id}
              type="button"
              size="md"
              variant={action.variant}
              aria-label={action.label}
              onClick={() => onNavigate(action.target, { replace: action.replace })}
            >
              {action.label}
            </Button>
          )
        )}
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
      border="none"
      elevation="medium"
      padding="md"
      rounded="2xl"
      className="flex items-center justify-between"
      role="region"
      aria-label={`Заголовок ${title}`}
    >
      <Text as="span" variant="title" tone="primary" weight="semibold">
        {title}
      </Text>
      <div className="flex items-center gap-2">
        {preparedActions.map(action =>
          action.icon ? (
            <IconButton
              key={action.id}
              type="button"
              size="md"
              variant={action.variant}
              aria-label={action.label}
              onClick={() => onNavigate(action.target, { replace: action.replace })}
              icon={<span className="text-xl">{action.icon}</span>}
            />
          ) : (
            <Button
              key={action.id}
              type="button"
              size="md"
              variant={action.variant}
              className="text-text-secondary"
              aria-label={action.label}
              onClick={() => onNavigate(action.target, { replace: action.replace })}
            >
              {action.label}
            </Button>
          )
        )}
      </div>
    </Surface>
  );
}

interface ConnectedTapStatusHeaderProps {
  actions?: HeaderActionConfig[];
  onNavigate: NavigateHandler;
}

export function ConnectedTapStatusHeader({ actions, onNavigate }: ConnectedTapStatusHeaderProps) {
  const level = useGameStore(state => state.level);
  const energy = useGameStore(state => state.energy);
  const stars = useGameStore(state => state.stars);
  const xpIntoLevel = useGameStore(state => state.xpIntoLevel);
  const xpToNextLevel = useGameStore(state => state.xpToNextLevel);

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 }),
    []
  );

  return (
    <TapStatusHeader
      level={level}
      energy={energy}
      stars={stars}
      xpIntoLevel={xpIntoLevel}
      xpToNextLevel={xpToNextLevel}
      actions={actions}
      onNavigate={onNavigate}
      numberFormatter={numberFormatter}
    />
  );
}
