// Daily summary service: persists the consolidated order (counts + the exact
// vendor message) with the moment it was sent, for records and reconciliation.

import { getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { summaryDoc } from './paths';
import type { DailySummary } from '@/types';

export async function saveSummarySent(orgId: string, summary: DailySummary): Promise<void> {
  await setDoc(summaryDoc(orgId, summary.date), {
    ...summary,
    sentAt: serverTimestamp(),
  });
}

export function subscribeSummary(
  orgId: string,
  date: string,
  cb: (summary: DailySummary | null) => void,
): () => void {
  return onSnapshot(summaryDoc(orgId, date), (snap) => {
    cb(snap.exists() ? (snap.data() as DailySummary) : null);
  });
}

export async function getSummary(orgId: string, date: string): Promise<DailySummary | null> {
  const snap = await getDoc(summaryDoc(orgId, date));
  return snap.exists() ? (snap.data() as DailySummary) : null;
}
