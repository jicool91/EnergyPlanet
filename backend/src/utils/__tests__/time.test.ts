import { addDuration, durationToMilliseconds, secondsBetween } from '../time';

describe('time utils', () => {
  test('durationToMilliseconds parses units', () => {
    expect(durationToMilliseconds('30s')).toBe(30000);
    expect(durationToMilliseconds('15m')).toBe(900000);
    expect(durationToMilliseconds('2h')).toBe(7200000);
    expect(durationToMilliseconds('1d')).toBe(86400000);
    expect(durationToMilliseconds('1w')).toBe(604800000);
  });

  test('addDuration adds correctly', () => {
    const start = new Date('2024-01-01T00:00:00.000Z');
    const result = addDuration(start, '30m');
    expect(result.toISOString()).toBe('2024-01-01T00:30:00.000Z');
  });

  test('secondsBetween returns positive integers', () => {
    const start = new Date('2024-01-01T00:00:00.000Z');
    const end = new Date('2024-01-01T00:01:30.500Z');
    expect(secondsBetween(start, end)).toBe(90);
    expect(secondsBetween(end, start)).toBe(0);
  });
});
