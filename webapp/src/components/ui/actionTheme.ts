export type ActionTone = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

type ToneStyle = {
  solid: string;
  icon: string;
};

export const ACTION_TONE_STYLES: Record<ActionTone, ToneStyle> = {
  primary: {
    solid:
      'bg-accent-gold text-text-inverse shadow-glow-gold hover:brightness-105 active:scale-[0.97]',
    icon: 'bg-accent-gold text-text-inverse shadow-glow-gold hover:brightness-105 active:scale-[0.97]',
  },
  secondary: {
    solid:
      'border border-border-layer bg-layer-strong text-text-primary hover:border-border-layer-strong hover:bg-layer-elevated hover:shadow-elevation-2 active:scale-[0.97]',
    icon: 'border border-border-layer bg-layer-strong text-text-primary hover:border-border-layer-strong hover:bg-layer-elevated hover:shadow-elevation-2 active:scale-[0.97]',
  },
  success: {
    solid:
      'bg-feedback-success text-text-inverse shadow-glow-lime hover:brightness-105 active:scale-[0.97]',
    icon: 'bg-feedback-success text-text-inverse shadow-glow-lime hover:brightness-110 active:scale-[0.97]',
  },
  danger: {
    solid:
      'bg-feedback-error text-text-inverse shadow-elevation-3 hover:brightness-110 active:scale-[0.97]',
    icon: 'bg-feedback-error text-text-inverse shadow-elevation-3 hover:brightness-115 active:scale-[0.97]',
  },
  ghost: {
    solid: 'bg-transparent text-text-accent hover:text-text-primary active:scale-[0.97]',
    icon: 'bg-transparent text-text-primary hover:bg-layer-overlay-ghost-soft active:scale-[0.97]',
  },
};

type ToneColor = {
  backgroundVar: string;
  foregroundVar: string;
  backgroundFallback: string;
  foregroundFallback: string;
};

export const ACTION_TONE_COLORS: Record<Exclude<ActionTone, 'ghost'>, ToneColor> = {
  primary: {
    backgroundVar: '--color-accent-gold',
    foregroundVar: '--color-text-inverse',
    backgroundFallback: '#f3ba2f',
    foregroundFallback: '#080b12',
  },
  secondary: {
    backgroundVar: '--layer-surface-strong',
    foregroundVar: '--color-text-primary',
    backgroundFallback: '#1d2025',
    foregroundFallback: '#ffffff',
  },
  success: {
    backgroundVar: '--state-success-pill-strong',
    foregroundVar: '--color-text-inverse',
    backgroundFallback: '#22c55e',
    foregroundFallback: '#080b12',
  },
  danger: {
    backgroundVar: '--state-danger-pill-hover',
    foregroundVar: '--color-text-inverse',
    backgroundFallback: '#ef4444',
    foregroundFallback: '#080b12',
  },
};

function normalizeToHex(value: string | undefined | null, fallback: string): `#${string}` {
  if (!value) {
    return fallback as `#${string}`;
  }

  const trimmed = value.trim();
  const hexMatch = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex =
      trimmed.length === 4
        ? `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`
        : trimmed;
    return hex.toLowerCase() as `#${string}`;
  }

  const rgbMatch = trimmed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    const toHex = (num: string) => {
      const clamped = Math.max(0, Math.min(255, Number(num)));
      return clamped.toString(16).padStart(2, '0');
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}` as `#${string}`;
  }

  return fallback as `#${string}`;
}

export function getActionToneHex(tone: ActionTone): {
  background: `#${string}`;
  foreground: `#${string}`;
} {
  if (tone === 'ghost') {
    return getActionToneHex('primary');
  }

  const mapping = ACTION_TONE_COLORS[tone];

  if (typeof window === 'undefined') {
    return {
      background: mapping.backgroundFallback as `#${string}`,
      foreground: mapping.foregroundFallback as `#${string}`,
    };
  }

  const style = getComputedStyle(document.documentElement);
  const backgroundValue = style.getPropertyValue(mapping.backgroundVar);
  const foregroundValue = style.getPropertyValue(mapping.foregroundVar);

  return {
    background: normalizeToHex(backgroundValue, mapping.backgroundFallback),
    foreground: normalizeToHex(foregroundValue, mapping.foregroundFallback),
  };
}
