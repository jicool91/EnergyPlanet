const UNITS = [
  { value: 1e12, suffix: 'T' },
  { value: 1e9, suffix: 'B' },
  { value: 1e6, suffix: 'M' },
  { value: 1e3, suffix: 'K' },
];

export function formatCompactNumber(value: number, decimals: number = 1): string {
  const absolute = Math.abs(value);

  if (absolute < 1000) {
    return Math.round(value).toLocaleString('ru-RU');
  }

  for (const unit of UNITS) {
    if (absolute >= unit.value) {
      const formatted = (value / unit.value).toFixed(decimals);
      const trimmed = formatted.replace(/\.0+$/, '');
      return `${trimmed}${unit.suffix}`;
    }
  }

  return Math.round(value).toLocaleString('ru-RU');
}

export function formatNumberWithSpaces(value: number): string {
  return Math.round(value).toLocaleString('ru-RU');
}

export function formatDelta(value: number): string {
  const rounded = Math.round(Math.abs(value));
  const formatted = rounded.toLocaleString('ru-RU');
  return value > 0 ? `+${formatted}` : `-${formatted}`;
}
