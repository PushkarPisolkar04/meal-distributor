// Pricing logic with dated rate history, so a tiffin is always billed at the
// rate that was in effect on the day it was ordered (e.g. was 60/80, now 65/90).

import type { PriceRecord, TiffinChoice, TiffinSize } from '@/types';
import { parseISODate } from './datetime';

export interface Rate {
  halfPrice: number;
  fullPrice: number;
}

/**
 * The rate effective on `isoDate` = the record with the latest effectiveFrom
 * that is on or before that date. Returns null when no record qualifies (e.g.
 * date precedes all pricing history).
 */
export function getRateForDate(records: PriceRecord[], isoDate: string): Rate | null {
  const target = parseISODate(isoDate).getTime();
  let best: PriceRecord | null = null;
  let bestTime = -Infinity;
  for (const rec of records) {
    const t = parseISODate(rec.effectiveFrom).getTime();
    if (t <= target && t > bestTime) {
      best = rec;
      bestTime = t;
    }
  }
  if (!best) return null;
  return { halfPrice: best.halfPrice, fullPrice: best.fullPrice };
}

/** Price of a billable size given a rate. */
export function priceForSize(size: TiffinSize, rate: Rate): number {
  return size === 'full' ? rate.fullPrice : rate.halfPrice;
}

/**
 * Amount to charge for a day's choice. 'skip' costs nothing. Returns 0 when the
 * choice is skip, and null when a rate cannot be resolved for the date (caller
 * should treat that as a configuration error rather than a free tiffin).
 */
export function amountForChoice(
  choice: TiffinChoice,
  records: PriceRecord[],
  isoDate: string,
): number | null {
  if (choice === 'skip') return 0;
  const rate = getRateForDate(records, isoDate);
  if (!rate) return null;
  return priceForSize(choice, rate);
}
