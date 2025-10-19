export function durationToMilliseconds(duration: string): number {
  if (!duration) {
    throw new Error('Duration string is required');
  }

  const trimmed = duration.trim();

  const regex = /^(\d+)([smhdw])$/i;
  const match = trimmed.match(regex);

  if (!match) {
    const asNumber = Number(trimmed);
    if (!Number.isFinite(asNumber)) {
      throw new Error(`Unsupported duration format: ${duration}`);
    }
    return asNumber;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    case 'w':
      return value * 7 * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unsupported duration unit: ${unit}`);
  }
}

export function addDuration(date: Date, duration: string): Date {
  const ms = durationToMilliseconds(duration);
  return new Date(date.getTime() + ms);
}

export function secondsBetween(start: Date, end: Date): number {
  const diff = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}
