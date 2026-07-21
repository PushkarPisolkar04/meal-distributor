import React, { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Card,
  ChoiceChips,
  CountdownRing,
  EmptyState,
  Field,
  GradientHeader,
  Row,
  Screen,
  StatPill,
  SuccessOverlay,
  Tag,
} from '@/components';
import { colors, spacing, radius } from '@/theme';
import { useApp } from '@/context/AppContext';
import { useClock, useMenu, useOrders, usePricing, useSummary } from '@/hooks';
import {
  consolidate,
  pendingMembers,
} from '@/logic/consolidation';
import {
  todayISO,
  formatDayLabel,
  minutesUntilCutoff,
  minutesOfDay,
  isBeforeCutoff,
  isActiveDay,
} from '@/logic/datetime';
import { buildChargesForDay } from '@/logic/ledger';
import { buildWhatsAppUrl } from '@/logic/whatsapp';
import type { TiffinChoice } from '@/types';
import { setMenu } from '@/services/menus';
import { lockOrders, setContainerReturned, setOrder } from '@/services/orders';
import { writeCharges } from '@/services/ledger';
import { saveSummarySent } from '@/services/summaries';
import { logAudit } from '@/services/audit';
import { scheduleContainerReminder } from '@/services/notifications';

export function CoordinatorDashboard() {
  const { org, user, profile, me, members } = useApp();
  const today = todayISO();
  const now = useClock(20000);
  const menu = useMenu(org?.id, today);
  const orders = useOrders(org?.id, today);
  const pricing = usePricing(org?.id);
  const summary = useSummary(org?.id, today);

  const [menuText, setMenuText] = useState('');
  const [savingMenu, setSavingMenu] = useState(false);
  const [busy, setBusy] = useState(false);

  const activeMembers = useMemo(() => members.filter((m) => m.active), [members]);
  const consolidated = useMemo(
    () => (org ? consolidate(orders, org.offices, today, formatDayLabel(today)) : null),
    [orders, org, today],
  );
  const pendingUids = useMemo(
    () => pendingMembers(activeMembers.map((m) => m.uid), orders),
    [activeMembers, orders],
  );
  const locked = orders.length > 0 && orders.every((o) => o.locked);

  const myOrder = useMemo(() => orders.find((o) => o.uid === user?.uid) ?? null, [orders, user]);
  const dayActive = org ? isActiveDay(today, org.settings.activeWeekdays, org.settings.holidays) : false;
  const myEditable = dayActive && !myOrder?.locked && !summary?.sentAt;
  const [savingMine, setSavingMine] = useState(false);
  const [showBilled, setShowBilled] = useState(false);

  if (!org) return null;

  const chooseMine = async (choice: TiffinChoice) => {
    if (!me || !myEditable) return;
    setSavingMine(true);
    try {
      await setOrder({
        orgId: org.id,
        date: today,
        uid: me.uid,
        memberName: me.name,
        officeId: me.officeId,
        choice,
      });
    } finally {
      setSavingMine(false);
    }
  };

  const cutoff = org.settings.cutoffTime;
  const open = isBeforeCutoff(cutoff, now);
  const remaining = minutesUntilCutoff(cutoff, now);
  const windowStart = minutesOfDay(org.settings.menuReminderTime) ?? 0;
  const windowEnd = minutesOfDay(cutoff) ?? 720;
  const windowLen = Math.max(1, windowEnd - windowStart);
  const progress = Math.max(0, Math.min(1, remaining / windowLen));

  const saveMenu = async () => {
    if (!menuText.trim()) return;
    setSavingMenu(true);
    try {
      await setMenu(org.id, today, menuText.trim(), user!.uid);
      setMenuText('');
    } finally {
      setSavingMenu(false);
    }
  };

  const sendOnWhatsApp = async () => {
    if (!consolidated) return;
    const url = buildWhatsAppUrl(consolidated.vendorMessage);
    const ok = await Linking.canOpenURL(url);
    if (ok) Linking.openURL(url);
    else Alert.alert('WhatsApp not available', consolidated.vendorMessage);
  };

  const lockAndBill = async () => {
    if (!consolidated) return;
    Alert.alert(
      'Lock & bill this order?',
      'Members can no longer change today. Charges will be added to each person\'s ledger at current rates.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              const drafts = buildChargesForDay(
                orders
                  .filter((o) => o.choice !== 'skip')
                  .map((o) => ({ uid: o.uid, memberName: o.memberName, choice: o.choice })),
                pricing,
                today,
              );
              await writeCharges(org.id, drafts, user!.uid);
              await lockOrders(org.id, today);
              await saveSummarySent(org.id, consolidated);
              await logAudit(org.id, {
                action: 'summary.sent',
                by: user!.uid,
                byName: profile?.name ?? 'Coordinator',
                after: { total: consolidated.totalTiffins, date: today },
                note: consolidated.vendorMessage,
              });
              setShowBilled(true);
            } catch (e) {
              Alert.alert('Could not bill', (e as Error).message);
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const toggleContainer = async (uid: string, current: boolean, name: string) => {
    await setContainerReturned(org.id, today, uid, !current);
    if (current) {
      // Was returned, now marked NOT returned -> offer a reminder.
      await scheduleContainerReminder(name);
    }
  };

  const recipients = orders.filter((o) => o.choice !== 'skip');

  return (
    <View style={styles.fill}>
      <GradientHeader
        title={org.name}
        subtitle={formatDayLabel(today)}
        right={
          <View style={styles.codePill}>
            <Text style={styles.codeLabel}>CODE</Text>
            <Text style={styles.codeValue}>{org.joinCode}</Text>
          </View>
        }
      >
        <View style={styles.headerRow}>
          <CountdownRing
            progress={progress}
            label={open ? `${remaining}m` : 'Closed'}
            sublabel={open ? `till ${cutoff}` : `cutoff ${cutoff}`}
          />
          <View style={styles.statCol}>
            <StatPill value={String(consolidated?.totalTiffins ?? 0)} label="Total tiffins" gradient="green" />
            <View style={{ height: spacing.sm }} />
            <Row style={{ gap: spacing.sm }}>
              <StatPill value={String(consolidated?.totalFull ?? 0)} label="Full" gradient="sunset" />
              <StatPill value={String(consolidated?.totalHalf ?? 0)} label="Half" gradient="violet" />
            </Row>
          </View>
        </View>
      </GradientHeader>

      <Screen>
        {/* Menu */}
        <Card>
          <Row>
            <Text style={styles.cardTitle}>Today's menu</Text>
            {menu ? <Tag text="Posted" tone="settled" /> : <Tag text="Not posted" tone="warn" />}
          </Row>
          {menu ? <Text style={styles.menuText}>{menu.items}</Text> : null}
          <Field
            placeholder={menu ? 'Update menu…' : 'e.g. Paneer, Dal, 4 Roti, Rice, Salad'}
            value={menuText}
            onChangeText={setMenuText}
            multiline
            style={{ marginTop: spacing.md, marginBottom: spacing.sm }}
          />
          <Button
            label={menu ? 'Update menu' : 'Post menu'}
            onPress={saveMenu}
            loading={savingMenu}
            variant="outline"
          />
        </Card>

        {/* Coordinator's own order — the admin eats too */}
        <Card>
          <Row>
            <Text style={styles.cardTitle}>Your order</Text>
            {myOrder?.locked ? <Tag text="Locked" tone="muted" /> : null}
          </Row>
          {dayActive ? (
            <>
              <View style={{ marginTop: spacing.md }}>
                <ChoiceChips value={myOrder?.choice ?? null} onChange={chooseMine} disabled={!myEditable || savingMine} />
              </View>
              <Text style={styles.hint}>You're a member too — pick your tiffin for today.</Text>
            </>
          ) : (
            <Text style={styles.muted}>No tiffin today (off day / holiday).</Text>
          )}
        </Card>

        {/* Per office counts */}
        <Card>
          <Text style={styles.cardTitle}>Order by office</Text>
          {consolidated && consolidated.totalTiffins > 0 ? (
            consolidated.perOffice
              .filter((o) => o.total > 0)
              .map((o) => (
                <Row key={o.officeId} style={styles.officeRow}>
                  <Text style={styles.officeName}>{o.officeName}</Text>
                  <Text style={styles.officeCount}>
                    {o.total} · {o.full}F {o.half}H
                  </Text>
                </Row>
              ))
          ) : (
            <Text style={styles.muted}>No tiffins ordered yet.</Text>
          )}
          <View style={styles.msgBox}>
            <Text style={styles.msgLabel}>Vendor message</Text>
            <Text style={styles.msgText}>{consolidated?.vendorMessage}</Text>
          </View>
          <Button label="Send order on WhatsApp" onPress={sendOnWhatsApp} icon={<Text>📲</Text>} />
          <View style={{ height: spacing.sm }} />
          <Button
            label={locked ? 'Order locked & billed' : 'Lock & bill order'}
            onPress={lockAndBill}
            loading={busy}
            disabled={locked || (consolidated?.totalTiffins ?? 0) === 0}
            variant="ghost"
            gradient="green"
          />
          {summary?.sentAt ? <Text style={styles.sentHint}>Recorded for {today}.</Text> : null}
        </Card>

        {/* Pending */}
        <Card>
          <Row>
            <Text style={styles.cardTitle}>Waiting to respond</Text>
            <Tag text={`${pendingUids.length}`} tone={pendingUids.length ? 'warn' : 'settled'} />
          </Row>
          {pendingUids.length === 0 ? (
            <Text style={styles.muted}>Everyone has responded. 🎉</Text>
          ) : (
            activeMembers
              .filter((m) => pendingUids.includes(m.uid))
              .map((m) => (
                <Text key={m.uid} style={styles.pendingName}>
                  • {m.name}
                </Text>
              ))
          )}
        </Card>

        {/* Container tracking */}
        <Card>
          <Text style={styles.cardTitle}>Tiffin containers</Text>
          {recipients.length === 0 ? (
            <EmptyState emoji="🍽️" title="No tiffins today" subtitle="Container tracking appears after orders." />
          ) : (
            recipients.map((o) => (
              <Pressable
                key={o.uid}
                onPress={() => toggleContainer(o.uid, o.containerReturned, o.memberName)}
                style={styles.containerRow}
              >
                <Text style={styles.containerName}>{o.memberName}</Text>
                <Tag
                  text={o.containerReturned ? 'Returned' : 'Pending'}
                  tone={o.containerReturned ? 'settled' : 'warn'}
                />
              </Pressable>
            ))
          )}
          <Text style={styles.hint}>Tap a name to toggle. Marking "pending" sets a reminder.</Text>
        </Card>
      </Screen>

      <SuccessOverlay
        visible={showBilled}
        title="Order billed!"
        subtitle={`${consolidated?.totalTiffins ?? 0} tiffins locked & charged`}
        onDone={() => setShowBilled(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  codePill: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 6 },
  codeLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '700' },
  codeValue: { color: colors.white, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.lg },
  statCol: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  menuText: { fontSize: 15, color: colors.body, marginTop: spacing.sm, lineHeight: 21 },
  officeRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.line },
  officeName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  officeCount: { fontSize: 14, fontWeight: '700', color: colors.primary },
  muted: { color: colors.muted, marginTop: spacing.sm },
  msgBox: { backgroundColor: colors.bgWarm, borderRadius: radius.md, padding: spacing.md, marginVertical: spacing.md },
  msgLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  msgText: { fontSize: 14, color: colors.ink, marginTop: 4, fontWeight: '600' },
  sentHint: { fontSize: 12, color: colors.greenDark, marginTop: spacing.sm, textAlign: 'center' },
  pendingName: { fontSize: 15, color: colors.body, marginTop: 6 },
  containerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  containerName: { fontSize: 15, fontWeight: '600', color: colors.ink },
  hint: { fontSize: 12, color: colors.muted, marginTop: spacing.md },
});
