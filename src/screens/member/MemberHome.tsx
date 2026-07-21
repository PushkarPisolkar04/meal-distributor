import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Card,
  ChoiceChips,
  CountdownRing,
  GradientHeader,
  Row,
  Screen,
  SuccessOverlay,
  Tag,
} from '@/components';
import { colors, spacing } from '@/theme';
import { useApp } from '@/context/AppContext';
import { useClock, useMenu, useOrders, useSummary } from '@/hooks';
import {
  todayISO,
  formatDayLabel,
  minutesUntilCutoff,
  minutesOfDay,
  isActiveDay,
} from '@/logic/datetime';
import { setOrder } from '@/services/orders';
import type { TiffinChoice } from '@/types';

export function MemberHome() {
  const { org, user, me } = useApp();
  const today = todayISO();
  const now = useClock(20000);
  const menu = useMenu(org?.id, today);
  const orders = useOrders(org?.id, today);
  const summary = useSummary(org?.id, today);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const myOrder = useMemo(() => orders.find((o) => o.uid === user?.uid) ?? null, [orders, user]);
  const savedChoice = myOrder?.choice ?? null;

  // The member's working selection. Starts from what's saved and syncs when the
  // saved value changes (e.g. after confirming, or the default is applied).
  const [pending, setPending] = useState<TiffinChoice | null>(savedChoice);
  useEffect(() => {
    setPending(savedChoice);
  }, [savedChoice]);

  if (!org || !me) return null;

  const cutoff = org.settings.cutoffTime;
  const active = isActiveDay(today, org.settings.activeWeekdays, org.settings.holidays);
  // Locked either by this member's own entry being locked, or the whole day's
  // order having been sent/billed to the vendor.
  const locked = !!myOrder?.locked || !!summary?.sentAt;
  // Members can pick/change freely until the coordinator locks the order.
  // The cutoff time is only a soft nudge (shown in the ring), not a hard block.
  const open = active && !locked;
  const remaining = minutesUntilCutoff(cutoff, now);
  const windowStart = minutesOfDay(org.settings.orderReminderTime) ?? 0;
  const windowEnd = minutesOfDay(cutoff) ?? 720;
  const progress = Math.max(0, Math.min(1, remaining / Math.max(1, windowEnd - windowStart)));

  const dirty = pending != null && pending !== savedChoice;

  const confirmOrder = async () => {
    if (!open || pending == null) return;
    setSaving(true);
    try {
      await setOrder({
        orgId: org.id,
        date: today,
        uid: user!.uid,
        memberName: me.name,
        officeId: me.officeId,
        choice: pending,
      });
      setShowSuccess(true);
    } finally {
      setSaving(false);
    }
  };

  const officeName = org.offices.find((o) => o.id === me.officeId)?.name ?? me.officeId;

  return (
    <View style={styles.fill}>
      <GradientHeader title={`Hi, ${me.name.split(' ')[0]}`} subtitle={`${formatDayLabel(today)} · ${officeName}`}>
        <View style={styles.headerRow}>
          <CountdownRing
            progress={locked || !active ? 0 : progress}
            label={locked ? 'Locked' : !active ? 'Off' : remaining > 0 ? `${remaining}m` : 'Open'}
            sublabel={locked ? 'by admin' : !active ? 'Off day' : remaining > 0 ? `till ${cutoff}` : `past ${cutoff}`}
          />
          <View style={styles.statusWrap}>
            <Text style={styles.statusLabel}>Today you chose</Text>
            <Text style={styles.statusValue}>
              {myOrder ? labelFor(myOrder.choice) : 'Not decided'}
            </Text>
            {myOrder?.locked ? <Tag text="Locked" tone="muted" /> : null}
          </View>
        </View>
      </GradientHeader>

      <Screen>
        <Card>
          <Row>
            <Text style={styles.cardTitle}>Today's menu</Text>
            {menu ? <Tag text="Posted" tone="settled" /> : <Tag text="Awaiting" tone="warn" />}
          </Row>
          <Text style={styles.menuText}>
            {menu ? menu.items : 'The coordinator hasn\'t posted the menu yet.'}
          </Text>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Your order</Text>
          {!active ? (
            <Text style={styles.muted}>No tiffin today (off day / holiday).</Text>
          ) : (
            <>
              <ChoiceChips value={pending} onChange={setPending} disabled={!open || saving} />
              <View style={{ height: spacing.md }} />
              <Button
                label={
                  locked
                    ? 'Locked by coordinator'
                    : pending == null
                    ? 'Pick an option'
                    : dirty
                    ? `Confirm ${labelFor(pending)}`
                    : 'Order confirmed ✓'
                }
                onPress={confirmOrder}
                loading={saving}
                disabled={!open || pending == null || !dirty}
                gradient={dirty ? 'green' : 'primary'}
              />
              <Text style={styles.hint}>
                {locked
                  ? 'The coordinator has locked today\'s order — no more changes.'
                  : dirty
                  ? 'Tap confirm to save your choice.'
                  : `Saved. Change anytime until the coordinator locks it. Default: ${labelFor(me.defaultChoice)}.`}
              </Text>
            </>
          )}
        </Card>

        {myOrder && myOrder.choice !== 'skip' ? (
          <Card>
            <Row>
              <Text style={styles.cardTitle}>Container</Text>
              <Tag
                text={myOrder.containerReturned ? 'Returned' : 'Please return'}
                tone={myOrder.containerReturned ? 'settled' : 'warn'}
              />
            </Row>
            <Text style={styles.hint}>Keep the empty tiffin box back at its place after eating.</Text>
          </Card>
        ) : null}
      </Screen>

      <SuccessOverlay
        visible={showSuccess}
        title="Order placed!"
        subtitle={pending ? labelFor(pending) : undefined}
        onDone={() => setShowSuccess(false)}
      />
    </View>
  );
}

function labelFor(choice: TiffinChoice): string {
  return choice === 'full' ? 'Full 🍱' : choice === 'half' ? 'Half 🥗' : 'Skip 🚫';
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, marginTop: spacing.lg },
  statusWrap: { flex: 1, gap: 4 },
  statusLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
  statusValue: { color: colors.white, fontSize: 22, fontWeight: '800' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  menuText: { fontSize: 15, color: colors.body, marginTop: spacing.sm, lineHeight: 21 },
  muted: { color: colors.muted, marginTop: spacing.sm },
  hint: { fontSize: 12, color: colors.muted, marginTop: spacing.md },
});
