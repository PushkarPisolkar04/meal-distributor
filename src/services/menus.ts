// Menu service: coordinator posts the day's menu; everyone subscribes to it.

import { getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { menuDoc } from './paths';
import type { Menu } from '@/types';

export async function setMenu(
  orgId: string,
  date: string,
  items: string,
  postedBy: string,
): Promise<void> {
  await setDoc(menuDoc(orgId, date), {
    date,
    items,
    postedBy,
    postedAt: serverTimestamp(),
  });
}

export function subscribeMenu(
  orgId: string,
  date: string,
  cb: (menu: Menu | null) => void,
): () => void {
  return onSnapshot(menuDoc(orgId, date), (snap) => {
    cb(snap.exists() ? (snap.data() as Menu) : null);
  });
}

export async function getMenu(orgId: string, date: string): Promise<Menu | null> {
  const snap = await getDoc(menuDoc(orgId, date));
  return snap.exists() ? (snap.data() as Menu) : null;
}
