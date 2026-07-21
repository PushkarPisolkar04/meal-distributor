import { getRateForDate, priceForSize, amountForChoice } from './pricing';
import type { PriceRecord } from '@/types';

const history: PriceRecord[] = [
  { id: 'p1', halfPrice: 60, fullPrice: 80, effectiveFrom: '2026-01-01' },
  { id: 'p2', halfPrice: 65, fullPrice: 90, effectiveFrom: '2026-06-01' },
];

describe('pricing history', () => {
  test('picks the rate in effect on the date', () => {
    expect(getRateForDate(history, '2026-03-15')).toEqual({ halfPrice: 60, fullPrice: 80 });
    expect(getRateForDate(history, '2026-06-01')).toEqual({ halfPrice: 65, fullPrice: 90 });
    expect(getRateForDate(history, '2026-07-20')).toEqual({ halfPrice: 65, fullPrice: 90 });
  });

  test('date before any record yields null', () => {
    expect(getRateForDate(history, '2025-12-31')).toBeNull();
  });

  test('unordered records still resolve correctly', () => {
    const shuffled = [history[1]!, history[0]!];
    expect(getRateForDate(shuffled, '2026-02-01')).toEqual({ halfPrice: 60, fullPrice: 80 });
  });

  test('priceForSize', () => {
    expect(priceForSize('half', { halfPrice: 65, fullPrice: 90 })).toBe(65);
    expect(priceForSize('full', { halfPrice: 65, fullPrice: 90 })).toBe(90);
  });

  test('amountForChoice: skip is free, missing rate is null', () => {
    expect(amountForChoice('skip', history, '2026-07-20')).toBe(0);
    expect(amountForChoice('full', history, '2026-07-20')).toBe(90);
    expect(amountForChoice('half', history, '2026-03-01')).toBe(60);
    expect(amountForChoice('full', history, '2025-01-01')).toBeNull();
  });
});
