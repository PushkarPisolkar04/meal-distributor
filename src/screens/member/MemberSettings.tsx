import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { Button, Card, ChoiceChips, GradientHeader, Row, Screen, Tag } from '@/components';
import { colors, spacing } from '@/theme';
import { useApp } from '@/context/AppContext';
import { setDefaultChoice } from '@/services/members';
import { ensurePermissions } from '@/services/notifications';
import { checkForUpdate, currentVersion } from '@/services/appUpdate';
import type { TiffinChoice } from '@/types';

export function MemberSettings() {
  const { org, user, me, profile, signOut } = useApp();
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);

  if (!org || !me) return null;

  const checkUpdates = async () => {
    setChecking(true);
    try {
      const s = await checkForUpdate();
      if (!s.checked) {
        Alert.alert('Could not check', 'Please check your internet connection and try again.');
      } else if (s.available && s.latest) {
        Alert.alert(
          'Update available',
          `A new version is out: v${s.current} → v${s.latest.version}.`,
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Update now', onPress: () => Linking.openURL(s.latest!.apkUrl).catch(() => undefined) },
          ],
        );
      } else {
        Alert.alert('Up to date', `You're on the latest version (v${s.current}).`);
      }
    } finally {
      setChecking(false);
    }
  };
  const officeName = org.offices.find((o) => o.id === me.officeId)?.name ?? me.officeId;

  const changeDefault = async (choice: TiffinChoice) => {
    setSaving(true);
    try {
      await setDefaultChoice(org.id, user!.uid, choice);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.fill}>
      <GradientHeader title="Profile" subtitle={profile?.email ?? me.name} gradient="dark" />
      <Screen>
        <Card>
          <Row>
            <Text style={styles.cardTitle}>{me.name}</Text>
            <Tag text={officeName} tone="advance" />
          </Row>
          <Text style={styles.sub}>Group: {org.name}</Text>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Recurring preference</Text>
          <Text style={styles.hint}>
            Your usual choice. You can still change any day before the cutoff.
          </Text>
          <View style={{ marginTop: spacing.md }}>
            <ChoiceChips value={me.defaultChoice} onChange={changeDefault} disabled={saving} />
          </View>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Notifications</Text>
          <Text style={styles.hint}>
            Daily order reminders work even when the app is closed, using your phone's clock.
          </Text>
          <View style={{ height: spacing.md }} />
          <Button label="Enable / check permission" variant="outline" onPress={() => ensurePermissions()} />
        </Card>

        <Card>
          <Row>
            <Text style={styles.cardTitle}>About</Text>
            <Text style={styles.version}>v{currentVersion()}</Text>
          </Row>
          <Button label="Check for updates" onPress={checkUpdates} loading={checking} variant="outline" gradient="sky" />
        </Card>

        <Button label="Sign out" onPress={signOut} variant="ghost" gradient="sunset" />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  version: { fontSize: 13, fontWeight: '700', color: colors.muted },
  sub: { fontSize: 13, color: colors.muted, marginTop: 4 },
  hint: { fontSize: 12, color: colors.muted, marginTop: 6 },
});
