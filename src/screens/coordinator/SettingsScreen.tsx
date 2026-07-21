import React, { useState } from 'react';
import { Alert, Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Card, Field, GradientHeader, QRCard, Row, Screen } from '@/components';
import { checkForUpdate, currentVersion } from '@/services/appUpdate';
import { colors, radius, spacing } from '@/theme';
import { useApp } from '@/context/AppContext';
import { updateSettings, updateUpi } from '@/services/orgs';
import { isValidHHmm, isValidUpiId, isNonEmptyName } from '@/logic/validation';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function SettingsScreen() {
  const { org, profile, signOut } = useApp();
  const nav = useNavigation<any>();
  const [menuTime, setMenuTime] = useState(org?.settings.menuReminderTime ?? '10:00');
  const [orderTime, setOrderTime] = useState(org?.settings.orderReminderTime ?? '10:30');
  const [cutoff, setCutoff] = useState(org?.settings.cutoffTime ?? '11:30');
  const [settleDay, setSettleDay] = useState(org?.settings.settlementWeekday ?? 5);
  const [upi, setUpi] = useState(org?.upiId ?? '');
  const [payee, setPayee] = useState(org?.upiPayeeName ?? profile?.name ?? '');
  const [savingTimes, setSavingTimes] = useState(false);
  const [savingUpi, setSavingUpi] = useState(false);
  const [checking, setChecking] = useState(false);

  if (!org) return null;

  const checkUpdates = async () => {
    setChecking(true);
    try {
      const s = await checkForUpdate();
      if (!s.checked) {
        Alert.alert('Could not check', 'Please check your internet connection and try again.');
      } else if (s.available && s.latest) {
        Alert.alert(
          'Update available',
          `A new version is out: v${s.current} → v${s.latest.version}.${s.latest.notes ? `\n\n${s.latest.notes}` : ''}`,
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

  const saveTimes = async () => {
    if (![menuTime, orderTime, cutoff].every(isValidHHmm)) {
      return Alert.alert('Invalid time', 'Use 24h HH:mm format, e.g. 11:30.');
    }
    setSavingTimes(true);
    try {
      await updateSettings(org.id, {
        menuReminderTime: menuTime,
        orderReminderTime: orderTime,
        cutoffTime: cutoff,
        settlementWeekday: settleDay,
      });
      Alert.alert('Saved', 'Reminders will reschedule automatically.');
    } finally {
      setSavingTimes(false);
    }
  };

  const saveUpi = async () => {
    if (!isValidUpiId(upi)) return Alert.alert('Invalid UPI', 'e.g. name@okhdfc');
    if (!isNonEmptyName(payee)) return Alert.alert('Invalid name', 'Enter the payee name.');
    setSavingUpi(true);
    try {
      await updateUpi(org.id, upi.trim(), payee.trim());
      Alert.alert('Saved', 'Your UPI QR is ready on the Pay screen.');
    } finally {
      setSavingUpi(false);
    }
  };

  const shareCode = () =>
    Share.share({
      message: `Join our tiffin group "${org.name}" on Tiffin Manager. Use join code: ${org.joinCode}`,
    });

  return (
    <View style={styles.fill}>
      <GradientHeader title="Settings" subtitle={org.name} gradient="dark" />
      <Screen>
        <Card>
          <Text style={styles.cardTitle}>Invite members</Text>
          <Text style={styles.code}>{org.joinCode}</Text>
          <Button label="Share join code" onPress={shareCode} icon={<Text>🔗</Text>} />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Daily reminder times</Text>
          <Row style={{ gap: spacing.md }}>
            <Field label="Ask menu" value={menuTime} onChangeText={setMenuTime} style={{ flex: 1 }} />
            <Field label="Order by" value={orderTime} onChangeText={setOrderTime} style={{ flex: 1 }} />
            <Field label="Cutoff" value={cutoff} onChangeText={setCutoff} style={{ flex: 1 }} />
          </Row>
          <Text style={styles.label}>Weekly settlement day</Text>
          <Row style={{ flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
            {WEEKDAYS.map((d, i) => (
              <Pressable key={d} onPress={() => setSettleDay(i)} style={[styles.day, settleDay === i && styles.dayActive]}>
                <Text style={[styles.dayText, settleDay === i && styles.dayTextActive]}>{d}</Text>
              </Pressable>
            ))}
          </Row>
          <Button label="Save times" onPress={saveTimes} loading={savingTimes} variant="outline" />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Payment (UPI)</Text>
          <Field label="Your UPI ID" value={upi} onChangeText={setUpi} placeholder="name@okhdfc" autoCapitalize="none" />
          <Field label="Payee name" value={payee} onChangeText={setPayee} placeholder="Your name" />
          <Button label="Save UPI" onPress={saveUpi} loading={savingUpi} variant="outline" gradient="green" />
        </Card>

        {org.upiId ? (
          <Card>
            <Text style={styles.cardTitle}>Your collection QR</Text>
            <Text style={styles.qrHint}>Members scan this to pay you. It's also on their Pay tab.</Text>
            <View style={{ marginTop: spacing.md }}>
              <QRCard payeeVpa={org.upiId} payeeName={org.upiPayeeName ?? profile?.name ?? 'Coordinator'} />
            </View>
          </Card>
        ) : null}

        <Card>
          <Text style={styles.cardTitle}>Manage</Text>
          <NavRow label="💰 Pricing & rate history" onPress={() => nav.navigate('Pricing')} />
          <NavRow label="🏦 Reconcile payments" onPress={() => nav.navigate('Reconcile')} />
          <NavRow label="📅 Holidays & off days" onPress={() => nav.navigate('Holidays')} />
          <NavRow label="🧾 Activity log" onPress={() => nav.navigate('Audit')} />
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

function NavRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.navRow}>
      <Text style={styles.navLabel}>{label}</Text>
      <Text style={styles.navChevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.ink, marginBottom: spacing.sm },
  qrHint: { fontSize: 12, color: colors.muted },
  version: { fontSize: 13, fontWeight: '700', color: colors.muted },
  code: { fontSize: 30, fontWeight: '900', color: colors.primary, letterSpacing: 3, marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: '600', color: colors.body, marginBottom: 6, marginTop: spacing.sm },
  day: { width: 44, paddingVertical: 8, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.bgWarm, borderWidth: 1, borderColor: colors.line },
  dayActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  dayText: { fontWeight: '700', color: colors.body, fontSize: 12 },
  dayTextActive: { color: colors.white },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  navLabel: { fontSize: 15, color: colors.ink, fontWeight: '600' },
  navChevron: { fontSize: 22, color: colors.muted },
});
