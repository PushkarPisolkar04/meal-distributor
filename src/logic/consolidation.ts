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

/**
 * Build the short vendor message. Only offices with at least one tiffin appear.
 * Example: "Tiffin order 20 Jul: Teerth 2 (1F, 1H), SBC 1 (1F). Total 3."
 */
export function buildVendorMessage(summary: DailySummary, dateLabel?: string): string {
  const active = summary.perOffice.filter((o) => o.total > 0);
  if (active.length === 0) {
    return `No tiffin order${dateLabel ? ` for ${dateLabel}` : ''} today.`;
  }
  const parts = active.map((o) => {
    const breakdown: string[] = [];
    if (o.full > 0) breakdown.push(`${o.full}F`);
    if (o.half > 0) breakdown.push(`${o.half}H`);
    return `${o.officeName} ${o.total} (${breakdown.join(', ')})`;
  });
  const head = dateLabel ? `Tiffin order ${dateLabel}: ` : 'Tiffin order: ';
  return `${head}${parts.join(', ')}. Total ${summary.totalTiffins}.`;
}

/** Full consolidation: counts, totals and the ready-to-send vendor message. */
export function consolidate(
  entries: OrderEntry[],
  offices: Office[],
  date: string,
  dateLabel?: string,
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
  summary.vendorMessage = buildVendorMessage(summary, dateLabel);
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
