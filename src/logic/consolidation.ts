// Turns a day's individual order entries into per-office counts, totals and the
// short message the coordinator sends to the vendor on WhatsApp.

import type { DailySummary, Office, OfficeCount, OrderEntry } from '@/types';

/** Group order entries into per-office half/full counts. Skips are ignored. */
export function countByOffice(entries: OrderEntry[], offices: Office[]): OfficeCount[] {
  const byId = new Map<string, OfficeCount>();
  for (const office of offices) {
    byId.set(office.id, {
      officeId: office.id,
      officeName: office.name,
      half: 0,
      full: 0,
      total: 0,
    });
  }
  for (const entry of entries) {
    if (entry.choice === 'skip') continue;
    let bucket = byId.get(entry.officeId);
    if (!bucket) {
      // Order references an office not in the list (e.g. deleted office):
      // keep it visible under its id rather than silently dropping it.
      bucket = {
        officeId: entry.officeId,
        officeName: entry.officeId,
        half: 0,
        full: 0,
        total: 0,
      };
      byId.set(entry.officeId, bucket);
    }
    if (entry.choice === 'half') bucket.half += 1;
    else bucket.full += 1;
    bucket.total += 1;
  }
  // Preserve the provided office order; extras appended after.
  const ordered: OfficeCount[] = [];
  for (const office of offices) {
    const c = byId.get(office.id);
    if (c) ordered.push(c);
  }
  for (const [id, c] of byId) {
    if (!offices.some((o) => o.id === id)) ordered.push(c);
  }
  return ordered;
}

function plural(n: number, word: string): string {
  return n === 1 ? word : `${word}s`;
}

/**
 * Build the vendor message: a date header, then one line per office. Half is the
 * default and written as just "Tiffin"; full is called out as "Full Tiffin".
 * `contactName` is the point-of-contact (coordinator) shown to the vendor.
 *
 * Example:
 *   21 Jul
 *   2 Tiffins Pushkar SBC
 *   1 Tiffin Pushkar Teerth
 */
export function buildVendorMessage(
  summary: DailySummary,
  dateLabel?: string,
  contactName = '',
): string {
  const who = contactName.trim() ? `${contactName.trim()} ` : '';
  const active = summary.perOffice.filter((o) => o.total > 0);
  if (active.length === 0) {
    return `${dateLabel ? `${dateLabel}: ` : ''}No tiffin order today.`;
  }
  const lines = active.map((o) => {
    const parts: string[] = [];
    // Half tiffins are the default label.
    if (o.half > 0) parts.push(`${o.half} ${plural(o.half, 'Tiffin')} ${who}${o.officeName}`);
    // Full tiffins are explicitly marked.
    if (o.full > 0) parts.push(`${o.full} Full ${plural(o.full, 'Tiffin')} ${who}${o.officeName}`);
    return parts.join(', ');
  });
  return [dateLabel, ...lines].filter(Boolean).join('\n');
}

/** Full consolidation: counts, totals and the ready-to-send vendor message. */
export function consolidate(
  entries: OrderEntry[],
  offices: Office[],
  date: string,
  dateLabel?: string,
  contactName = '',
): DailySummary {
  const perOffice = countByOffice(entries, offices);
  const totalHalf = perOffice.reduce((s, o) => s + o.half, 0);
  const totalFull = perOffice.reduce((s, o) => s + o.full, 0);
  const summary: DailySummary = {
    date,
    perOffice,
    totalHalf,
    totalFull,
    totalTiffins: totalHalf + totalFull,
    vendorMessage: '',
  };
  summary.vendorMessage = buildVendorMessage(summary, dateLabel, contactName);
  return summary;
}

/** Members who still have no explicit order (used to chase before cutoff). */
export function pendingMembers(
  allMemberUids: string[],
  entries: OrderEntry[],
): string[] {
  const answered = new Set(entries.map((e) => e.uid));
  return allMemberUids.filter((uid) => !answered.has(uid));
}
