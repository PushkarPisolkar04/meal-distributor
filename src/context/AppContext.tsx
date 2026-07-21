// App-wide state: the authenticated user, their profile, the active org, the
// current member record (role), org settings and live members list. Also wires
// local notification rescheduling whenever role/settings change.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Member, Organization, UserProfile } from '@/types';
import { observeAuth, ensureUserProfile, signOut as authSignOut } from '@/services/auth';
import { subscribeOrg } from '@/services/orgs';
import { subscribeMembers, getMember } from '@/services/members';
import { rescheduleForRole } from '@/services/notifications';

const ACTIVE_ORG_KEY = 'tiffin.activeOrgId';

interface AppState {
  initializing: boolean;
  user: User | null;
  profile: UserProfile | null;
  org: Organization | null;
  me: Member | null; // my member record in the active org
  members: Member[];
  role: 'coordinator' | 'member' | null;
  setActiveOrg: (orgId: string | null) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [me, setMe] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  const orgUnsub = useRef<null | (() => void)>(null);
  const membersUnsub = useRef<null | (() => void)>(null);

  // Auth listener + profile bootstrap.
  useEffect(() => {
    const unsub = observeAuth(async (u) => {
      setUser(u);
      if (u) {
        const p = await ensureUserProfile(u);
        setProfile(p);
        const stored = await AsyncStorage.getItem(ACTIVE_ORG_KEY);
        const next = stored && p.orgIds.includes(stored) ? stored : p.orgIds[0] ?? null;
        setActiveOrgId(next);
      } else {
        setProfile(null);
        setActiveOrgId(null);
        setOrg(null);
        setMe(null);
        setMembers([]);
      }
      setInitializing(false);
    });
    return unsub;
  }, []);

  // Subscribe to the active org + its members whenever the selection changes.
  useEffect(() => {
    orgUnsub.current?.();
    membersUnsub.current?.();
    setOrg(null);
    setMe(null);
    setMembers([]);

    if (!activeOrgId || !user) return;

    orgUnsub.current = subscribeOrg(activeOrgId, setOrg);
    membersUnsub.current = subscribeMembers(activeOrgId, (list) => {
      setMembers(list);
      const mine = list.find((m) => m.uid === user.uid) ?? null;
      setMe(mine);
    });

    // Best-effort immediate member fetch (in case listener is slow).
    getMember(activeOrgId, user.uid).then((m) => m && setMe(m)).catch(() => undefined);

    return () => {
      orgUnsub.current?.();
      membersUnsub.current?.();
    };
  }, [activeOrgId, user]);

  // Reschedule local notifications when role or settings change.
  useEffect(() => {
    if (!org || !me) return;
    rescheduleForRole(me.role, org.settings).catch(() => undefined);
  }, [org?.settings, me?.role]);

  const setActiveOrg = useCallback(async (orgId: string | null) => {
    if (orgId) await AsyncStorage.setItem(ACTIVE_ORG_KEY, orgId);
    else await AsyncStorage.removeItem(ACTIVE_ORG_KEY);
    setActiveOrgId(orgId);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await ensureUserProfile(user);
    setProfile(p);
    if (!activeOrgId && p.orgIds[0]) setActiveOrgId(p.orgIds[0]);
  }, [user, activeOrgId]);

  const signOut = useCallback(async () => {
    await authSignOut();
  }, []);

  const value = useMemo<AppState>(
    () => ({
      initializing,
      user,
      profile,
      org,
      me,
      members,
      role: me?.role ?? null,
      setActiveOrg,
      refreshProfile,
      signOut,
    }),
    [initializing, user, profile, org, me, members, setActiveOrg, refreshProfile, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
