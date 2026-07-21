// Authentication service. Email/password via Firebase Auth (free), plus a
// user profile document in Firestore that tracks which orgs the user belongs to.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getFirebaseAuth } from './firebase';
import { userDoc } from './paths';
import type { UserProfile } from '@/types';
import { sanitizeName } from '@/logic/validation';

export function observeAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), cb);
}

export function currentUser(): User | null {
  return getFirebaseAuth().currentUser;
}

export async function signUp(name: string, email: string, password: string): Promise<User> {
  const cleanName = sanitizeName(name);
  const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  await updateProfile(cred.user, { displayName: cleanName });
  const profile: UserProfile = {
    uid: cred.user.uid,
    name: cleanName,
    email: email.trim(),
    orgIds: [],
    createdAt: Date.now(),
  };
  await setDoc(userDoc(cred.user.uid), { ...profile, createdAt: serverTimestamp() });
  return cred.user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  return cred.user;
}

export async function signOut(): Promise<void> {
  await fbSignOut(getFirebaseAuth());
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userDoc(uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

/** Record org membership on the user profile (used for routing + rules). */
export async function addOrgToProfile(uid: string, orgId: string): Promise<void> {
  await updateDoc(userDoc(uid), { orgIds: arrayUnion(orgId) });
}

/** Ensure a profile exists (self-heals older accounts). */
export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const ref = userDoc(user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as UserProfile;
  const profile: UserProfile = {
    uid: user.uid,
    name: sanitizeName(user.displayName ?? user.email ?? 'User'),
    email: user.email ?? '',
    orgIds: [],
    createdAt: Date.now(),
  };
  await setDoc(ref, { ...profile, createdAt: serverTimestamp() });
  return profile;
}
