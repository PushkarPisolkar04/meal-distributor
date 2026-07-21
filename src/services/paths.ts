// Central Firestore path/ref builders so collection names live in one place and
// the multi-tenant structure (everything under organizations/{orgId}) is
// consistent with the security rules.

import {
  collection,
  doc,
  type CollectionReference,
  type DocumentReference,
} from 'firebase/firestore';
import { getDb } from './firebase';

export const usersCol = (): CollectionReference => collection(getDb(), 'users');
export const userDoc = (uid: string): DocumentReference => doc(getDb(), 'users', uid);

export const orgsCol = (): CollectionReference => collection(getDb(), 'organizations');
export const orgDoc = (orgId: string): DocumentReference =>
  doc(getDb(), 'organizations', orgId);

export const membersCol = (orgId: string): CollectionReference =>
  collection(getDb(), 'organizations', orgId, 'members');
export const memberDoc = (orgId: string, uid: string): DocumentReference =>
  doc(getDb(), 'organizations', orgId, 'members', uid);

export const pricingCol = (orgId: string): CollectionReference =>
  collection(getDb(), 'organizations', orgId, 'pricing');

export const menuDoc = (orgId: string, date: string): DocumentReference =>
  doc(getDb(), 'organizations', orgId, 'menus', date);

// Orders for a day are stored as a subcollection of entries keyed by member uid.
export const orderEntriesCol = (orgId: string, date: string): CollectionReference =>
  collection(getDb(), 'organizations', orgId, 'orders', date, 'entries');
export const orderEntryDoc = (
  orgId: string,
  date: string,
  uid: string,
): DocumentReference =>
  doc(getDb(), 'organizations', orgId, 'orders', date, 'entries', uid);

export const summaryDoc = (orgId: string, date: string): DocumentReference =>
  doc(getDb(), 'organizations', orgId, 'summaries', date);

export const ledgerCol = (orgId: string): CollectionReference =>
  collection(getDb(), 'organizations', orgId, 'ledger');
export const ledgerDoc = (orgId: string, id: string): DocumentReference =>
  doc(getDb(), 'organizations', orgId, 'ledger', id);

export const paymentsCol = (orgId: string): CollectionReference =>
  collection(getDb(), 'organizations', orgId, 'payments');
export const paymentDoc = (orgId: string, id: string): DocumentReference =>
  doc(getDb(), 'organizations', orgId, 'payments', id);

export const auditCol = (orgId: string): CollectionReference =>
  collection(getDb(), 'organizations', orgId, 'audit');
