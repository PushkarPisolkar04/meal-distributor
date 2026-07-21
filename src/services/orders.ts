// Order service: a member sets their half/full/skip for a day; the coordinator
// subscribes to the live list, locks orders at cutoff, and tracks container
// returns. Order docs are keyed by member uid so a member has exactly one entry
// per day (idempotent taps).

import {
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { getDb } from './firebase';
import { orderEntriesCol, orderEntryDoc } from './paths';
import type { OrderEntry, TiffinChoice } from '@/types';

export async function setOrder(params: {
  orgId: string;
  date: string;
  uid: string;
  memberName: string;
  officeId: string;
  choice: TiffinChoice;
}): Promise<void> {
  await setDoc(
    orderEntryDoc(params.orgId, params.date, params.uid),
    {
      uid: params.uid,
      memberName: params.memberName,
      officeId: params.officeId,
      choice: params.choice,
      locked: false,
      containerReturned: false,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function subscribeOrders(
  orgId: string,
  date: string,
  cb: (entries: OrderEntry[]) => void,
): () => void {
  return onSnapshot(orderEntriesCol(orgId, date), (snap) => {
    cb(snap.docs.map((d) => d.data() as OrderEntry));
  });
}

export async function getOrders(orgId: string, date: string): Promise<OrderEntry[]> {
  const snap = await getDocs(orderEntriesCol(orgId, date));
  return snap.docs.map((d) => d.data() as OrderEntry);
}

/** Lock every entry for the day so members can no longer change their choice. */
export async function lockOrders(orgId: string, date: string): Promise<void> {
  const snap = await getDocs(orderEntriesCol(orgId, date));
  const batch = writeBatch(getDb());
  snap.docs.forEach((d) => batch.update(d.ref, { locked: true }));
  await batch.commit();
}

export async function setContainerReturned(
  orgId: string,
  date: string,
  uid: string,
  returned: boolean,
): Promise<void> {
  await updateDoc(orderEntryDoc(orgId, date, uid), { containerReturned: returned });
}
