import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import clsx from 'clsx';
import { Panel, type PanelProps } from './Panel';
import { Text } from './ui/Text';
import { Badge, type BadgeVariant } from './Badge';

export interface ProductMetric {
  label: string;
  value: string;
  icon?: ReactNode;
  tone?: 'primary' | 'secondary' | 'accent' | 'inverse' | 'success' | 'warning' | 'danger';
}

export interface ProductTileProps extends Omit<PanelProps, 'variant' | 'spacing' | 'tone'> {
  title: string;
  description?: string;
  badge?: {
    label: string;
    variant?: BadgeVariant;
    tone?: 'primary' | 'secondary' | 'inverse';
  };
  highlightLabel?: string;
  highlighted?: boolean;
  media?: ReactNode;
  orientation?: 'vertical' | 'horizontal';
  metrics?: ProductMetric[];
  helper?: string;
  priceLabel?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
}

export const ProductTile = forwardRef<HTMLDivElement, ProductTileProps>(
  (
    {
      title,
      description,
      badge,
      highlightLabel,
      highlighted = false,
      media,
      orientation = 'horizontal',
      metrics,
      helper,
      priceLabel,
      meta,
      actions,
      footer,
      className,
      children,
      ...panelProps
    },
    ref
  ) => {
    const isHorizontal = orientation === 'horizontal';

    return (
      <Panel
        ref={ref}
        variant={highlighted ? 'accent' : 'default'}
        tone={highlighted ? 'accent' : 'overlay'}
        border={highlighted ? 'accent' : 'subtle'}
        elevation={highlighted ? 'medium' : 'soft'}
        spacing="lg"
        className={clsx(
          'relative w-full',
          isHorizontal ? 'flex flex-col gap-lg sm:flex-row' : 'flex flex-col gap-lg',
          highlighted ? 'text-text-inverse' : 'text-text-primary',
          className
        )}
        {...panelProps}
      >
        {highlighted && highlightLabel ? (
          <div className="absolute right-lg top-lg">
            <Badge variant="legendary" size="sm">
              {highlightLabel}
            </Badge>
          </div>
        ) : null}

        <div className={clsx('flex gap-lg', isHorizontal ? 'flex-1 flex-col sm:flex-row' : '')}>
          {media ? (
            <div className="flex-shrink-0">
              <div
                className={clsx(
                  'flex h-20 w-20 items-center justify-center rounded-2xl border border-border-layer bg-layer-overlay-soft',
                  highlighted && 'border-white/40 bg-white/10'
                )}
              >
                {media}
              </div>
            </div>
          ) : null}

          <div className="flex flex-1 flex-col gap-md">
            <div className="flex flex-wrap items-start gap-sm">
              <Text as="h3" variant="title" weight="semibold" className="m-0">
                {title}
              </Text>
              {badge ? (
                <Badge
                  size="sm"
                  variant={badge.variant ?? (highlighted ? 'epic' : 'primary')}
                  className={clsx(
                    highlighted && badge.tone !== 'inverse' && 'text-text-inverse',
                    badge.tone === 'secondary' && 'text-text-secondary'
                  )}
                >
                  {badge.label}
                </Badge>
              ) : null}
            </div>

            {description ? (
              <Text variant="bodySm" tone={highlighted ? 'inverse' : 'secondary'}>
                {description}
              </Text>
            ) : null}

            {children}

            {metrics && metrics.length > 0 ? (
              <dl className="grid gap-sm sm:grid-cols-3">
                {metrics.map(metric => (
                  <div
                    key={`${metric.label}-${metric.value}`}
                    className="flex items-center gap-sm rounded-2xl border border-border-layer bg-layer-overlay-soft px-sm py-xs"
                  >
                    {metric.icon ? (
                      <span className="text-heading" aria-hidden="true">
                        {metric.icon}
                      </span>
                    ) : null}
                    <div className="flex flex-col leading-tight">
                      <Text variant="micro" tone={highlighted ? 'inverse' : 'tertiary'}>
                        {metric.label}
                      </Text>
                      <Text
                        variant="bodySm"
                        weight="semibold"
                        tone={metric.tone ?? (highlighted ? 'inverse' : 'primary')}
                      >
                        {metric.value}
                      </Text>
                    </div>
                  </div>
                ))}
              </dl>
            ) : null}

            {meta}

            {helper ? (
              <Text variant="caption" tone={highlighted ? 'inverse' : 'tertiary'}>
                {helper}
              </Text>
            ) : null}
          </div>
        </div>

        {(priceLabel || actions) && (
          <div
            className={clsx(
              'flex flex-col gap-sm',
              isHorizontal ? 'sm:items-end sm:justify-between sm:self-stretch' : ''
            )}
          >
            {priceLabel ? (
              <Text
                variant="title"
                weight="bold"
                tone={highlighted ? 'inverse' : 'accent'}
                className="whitespace-nowrap"
              >
                {priceLabel}
              </Text>
            ) : null}
            {actions}
          </div>
        )}

        {footer}
      </Panel>
    );
  }
);

ProductTile.displayName = 'ProductTile';
