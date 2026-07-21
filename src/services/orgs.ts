// Organization service: create an org (becomes coordinator), join by code
// (becomes member), read/update settings, offices, UPI details and pricing.

import {
  addDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  orderBy,
} from 'firebase/firestore';
import { orgDoc, orgsCol, memberDoc, membersCol, pricingCol } from './paths';
import { addOrgToProfile } from './auth';
import type { Member, Office, Organization, OrgSettings, PriceRecord } from '@/types';
import { generateJoinCode } from '@/logic/validation';

export const DEFAULT_SETTINGS: OrgSettings = {
  menuReminderTime: '10:00',
  orderReminderTime: '10:30',
  cutoffTime: '11:30',
  settlementWeekday: 5,
  activeWeekdays: [1, 2, 3, 4, 5],
  holidays: [],
  currency: 'Rs',
};

async function uniqueJoinCode(): Promise<string> {
  // Retry a few times in the (unlikely) event of a collision.
  for (let i = 0; i < 8; i += 1) {
    const code = generateJoinCode();
    const existing = await getDocs(query(orgsCol(), where('joinCode', '==', code)));
    if (existing.empty) return code;
  }
  return generateJoinCode() + generateJoinCode().slice(0, 2);
}

export async function createOrg(params: {
  uid: string;
  coordinatorName: string;
  orgName: string;
  offices: Office[];
  halfPrice: number;
  fullPrice: number;
  effectiveFrom: string;
}): Promise<Organization> {
  const joinCode = await uniqueJoinCode();
  const orgRef = await addDoc(orgsCol(), {
    name: params.orgName,
    createdBy: params.uid,
    offices: params.offices,
    joinCode,
    settings: DEFAULT_SETTINGS,
    createdAt: serverTimestamp(),
  });
  const orgId = orgRef.id;

  // Creator becomes the coordinator member FIRST, so subsequent coordinator-only
  // writes (like pricing) pass the security rules.
  const member: Member = {
    uid: params.uid,
    name: params.coordinatorName,
    role: 'coordinator',
    officeId: params.offices[0]?.id ?? 'main',
    defaultChoice: 'skip',
    active: true,
    joinedAt: Date.now(),
  };
  await setDoc(memberDoc(orgId, params.uid), { ...member, joinedAt: serverTimestamp() });

  // First pricing record (now allowed: creator is a coordinator).
  await addDoc(pricingCol(orgId), {
    halfPrice: params.halfPrice,
    fullPrice: params.fullPrice,
    effectiveFrom: params.effectiveFrom,
  });

  await addOrgToProfile(params.uid, orgId);

  return {
    id: orgId,
    name: params.orgName,
    createdBy: params.uid,
    offices: params.offices,
    joinCode,
    settings: DEFAULT_SETTINGS,
    createdAt: Date.now(),
  };
}

export async function findOrgByJoinCode(code: string): Promise<Organization | null> {
  const snap = await getDocs(
    query(orgsCol(), where('joinCode', '==', code.trim().toUpperCase())),
  );
  const first = snap.docs[0];
  if (!first) return null;
  return { id: first.id, ...(first.data() as Omit<Organization, 'id'>) };
}

export async function joinOrg(params: {
  uid: string;
  memberName: string;
  joinCode: string;
  officeId: string;
}): Promise<Organization | null> {
  const org = await findOrgByJoinCode(params.joinCode);
  if (!org) return null;
  const member: Member = {
    uid: params.uid,
    name: params.memberName,
    role: 'member',
    officeId: params.officeId || org.offices[0]?.id || 'main',
    defaultChoice: 'skip',
    active: true,
    joinedAt: Date.now(),
  };
  await setDoc(memberDoc(org.id, params.uid), { ...member, joinedAt: serverTimestamp() });
  await addOrgToProfile(params.uid, org.id);
  return org;
}

export function subscribeOrg(orgId: string, cb: (org: Organization | null) => void): () => void {
  return onSnapshot(orgDoc(orgId), (snap) => {
    cb(snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Organization, 'id'>) } : null);
  });
}

export async function getOrg(orgId: string): Promise<Organization | null> {
  const snap = await getDoc(orgDoc(orgId));
  return snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Organization, 'id'>) } : null;
}

export async function updateSettings(orgId: string, settings: Partial<OrgSettings>): Promise<void> {
  const org = await getOrg(orgId);
  if (!org) throw new Error('Org not found');
  await updateDoc(orgDoc(orgId), { settings: { ...org.settings, ...settings } });
}

export async function updateOffices(orgId: string, offices: Office[]): Promise<void> {
  await updateDoc(orgDoc(orgId), { offices });
}

export async function updateUpi(orgId: string, upiId: string, upiPayeeName: string): Promise<void> {
  await updateDoc(orgDoc(orgId), { upiId, upiPayeeName });
}

// ---- Pricing ----

export async function addPriceRecord(
  orgId: string,
  rec: Omit<PriceRecord, 'id'>,
): Promise<void> {
  await addDoc(pricingCol(orgId), rec);
}

export function subscribePricing(orgId: string, cb: (records: PriceRecord[]) => void): () => void {
  return onSnapshot(query(pricingCol(orgId), orderBy('effectiveFrom', 'desc')), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PriceRecord, 'id'>) })));
  });
}

export async function getPricing(orgId: string): Promise<PriceRecord[]> {
  const snap = await getDocs(query(pricingCol(orgId), orderBy('effectiveFrom', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PriceRecord, 'id'>) }));
}
