// Member service: list/subscribe members, update role/office/default choice,
// activate/deactivate.

import { getDoc, getDocs, onSnapshot, updateDoc } from 'firebase/firestore';
import { memberDoc, membersCol } from './paths';
import type { Member, Role, TiffinChoice } from '@/types';

function mapMember(d: { id: string; data: () => unknown }): Member {
  return d.data() as Member;
}

export function subscribeMembers(orgId: string, cb: (members: Member[]) => void): () => void {
  return onSnapshot(membersCol(orgId), (snap) => {
    cb(snap.docs.map(mapMember));
  });
}

export async function listMembers(orgId: string): Promise<Member[]> {
  const snap = await getDocs(membersCol(orgId));
  return snap.docs.map(mapMember);
}

export async function getMember(orgId: string, uid: string): Promise<Member | null> {
  const snap = await getDoc(memberDoc(orgId, uid));
  return snap.exists() ? (snap.data() as Member) : null;
}

export async function setDefaultChoice(
  orgId: string,
  uid: string,
  defaultChoice: TiffinChoice,
): Promise<void> {
  await updateDoc(memberDoc(orgId, uid), { defaultChoice });
}

export async function updateMember(
  orgId: string,
  uid: string,
  patch: Partial<Pick<Member, 'name' | 'officeId' | 'role' | 'active'>>,
): Promise<void> {
  await updateDoc(memberDoc(orgId, uid), patch);
}

export async function setRole(orgId: string, uid: string, role: Role): Promise<void> {
  await updateDoc(memberDoc(orgId, uid), { role });
}
