import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Field, GradientHeader } from '@/components';
import { colors, radius, spacing } from '@/theme';
import { useApp } from '@/context/AppContext';
import { createOrg, findOrgByJoinCode, joinOrg } from '@/services/orgs';
import { todayISO } from '@/logic/datetime';
import { isNonEmptyName, isValidPrice, isValidJoinCode } from '@/logic/validation';
import type { Office, Organization } from '@/types';

export function OnboardingScreen() {
  const { user, profile, setActiveOrg, refreshProfile } = useApp();
  const [tab, setTab] = useState<'create' | 'join'>('create');

  return (
    <View style={styles.fill}>
      <GradientHeader title="Get started" subtitle="Create your office group or join one" />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.tabs}>
          <TabButton label="Create group" active={tab === 'create'} onPress={() => setTab('create')} />
          <TabButton label="Join group" active={tab === 'join'} onPress={() => setTab('join')} />
        </View>
        {tab === 'create' ? (
          <CreateOrg
            uid={user!.uid}
            name={profile?.name ?? 'Coordinator'}
            onDone={async (org) => {
              await refreshProfile();
              await setActiveOrg(org.id);
            }}
          />
        ) : (
          <JoinOrg
            uid={user!.uid}
            name={profile?.name ?? 'Member'}
            onDone={async (org) => {
              await refreshProfile();
              await setActiveOrg(org.id);
            }}
          />
        )}
      </ScrollView>
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function CreateOrg({ uid, name, onDone }: { uid: string; name: string; onDone: (o: Organization) => void }) {
  const [orgName, setOrgName] = useState('');
  const [offices, setOffices] = useState('Teerth, SBC');
  const [half, setHalf] = useState('65');
  const [full, setFull] = useState('90');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!isNonEmptyName(orgName)) return setError('Enter a group name.');
    const seen = new Set<string>();
    const officeList: Office[] = [];
    for (const raw of offices.split(',')) {
      const name = raw.trim();
      if (!name) continue;
      const id = name.toLowerCase().replace(/\s+/g, '-');
      if (!id || seen.has(id)) continue; // drop blanks & duplicates
      seen.add(id);
      officeList.push({ id, name });
    }
    if (officeList.length === 0) return setError('Add at least one office/location.');
    const halfN = Number(half);
    const fullN = Number(full);
    if (!isValidPrice(halfN) || !isValidPrice(fullN)) return setError('Enter valid half/full prices.');
    setLoading(true);
    try {
      const org = await createOrg({
        uid,
        coordinatorName: name,
        orgName: orgName.trim(),
        offices: officeList,
        halfPrice: halfN,
        fullPrice: fullN,
        effectiveFrom: todayISO(),
      });
      onDone(org);
    } catch {
      setError('Could not create the group. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Text style={styles.cardTitle}>You'll be the coordinator</Text>
      <Field label="Group name" value={orgName} onChangeText={setOrgName} placeholder="e.g. Pushkar Office Tiffin" />
      <Field label="Offices / locations (comma separated)" value={offices} onChangeText={setOffices} placeholder="Teerth, SBC" />
      <View style={styles.priceRow}>
        <Field label="Half tiffin price" value={half} onChangeText={setHalf} keyboardType="numeric" style={styles.priceField} />
        <Field label="Full tiffin price" value={full} onChangeText={setFull} keyboardType="numeric" style={styles.priceField} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label="Create group" onPress={submit} loading={loading} />
    </Card>
  );
}

function JoinOrg({ uid, name, onDone }: { uid: string; name: string; onDone: (o: Organization) => void }) {
  const [code, setCode] = useState('');
  const [found, setFound] = useState<Organization | null>(null);
  const [officeId, setOfficeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    setError(null);
    if (!isValidJoinCode(code)) return setError('Join codes are 6 letters/numbers.');
    setLoading(true);
    try {
      const org = await findOrgByJoinCode(code);
      if (!org) setError('No group found for that code.');
      else {
        setFound(org);
        setOfficeId(org.offices[0]?.id ?? null);
      }
    } catch {
      setError('Lookup failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!found || !officeId) return;
    setLoading(true);
    try {
      const org = await joinOrg({ uid, memberName: name, joinCode: found.joinCode, officeId });
      if (org) onDone(org);
      else setError('Could not join. Try again.');
    } catch {
      setError('Could not join. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Text style={styles.cardTitle}>Join with a code from your coordinator</Text>
      <Field
        label="Join code"
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        placeholder="ABC234"
        autoCapitalize="characters"
        maxLength={6}
      />
      {!found ? (
        <Button label="Find group" onPress={lookup} loading={loading} />
      ) : (
        <>
          <Text style={styles.foundName}>{found.name}</Text>
          <Text style={styles.fieldLabel}>Your office / location</Text>
          <View style={styles.officeWrap}>
            {found.offices.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => setOfficeId(o.id)}
                style={[styles.officeChip, officeId === o.id && styles.officeChipActive]}
              >
                <Text style={[styles.officeText, officeId === o.id && styles.officeTextActive]}>{o.name}</Text>
              </Pressable>
            ))}
          </View>
          <Button label="Join group" onPress={confirm} loading={loading} />
        </>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.xl, gap: spacing.lg },
  tabs: { flexDirection: 'row', backgroundColor: colors.bgWarm, borderRadius: radius.pill, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: radius.pill, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontWeight: '700', color: colors.body },
  tabTextActive: { color: colors.white },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.ink, marginBottom: spacing.lg },
  priceRow: { flexDirection: 'row', gap: spacing.md },
  priceField: { flex: 1 },
  error: { color: colors.red, marginTop: spacing.sm, marginBottom: spacing.sm, fontWeight: '600' },
  foundName: { fontSize: 18, fontWeight: '800', color: colors.primary, marginBottom: spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.body, marginBottom: 6 },
  officeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  officeChip: { paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.bgWarm, borderWidth: 1, borderColor: colors.line },
  officeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  officeText: { fontWeight: '700', color: colors.body },
  officeTextActive: { color: colors.white },
});
