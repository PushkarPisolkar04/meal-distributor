import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, GradientHeader, Row, Screen, StatPill, Tag } from '@/components';
import { colors, spacing } from '@/theme';
import { useApp } from '@/context/AppContext';
import { usePayments } from '@/hooks';
import { formatMoney } from '@/logic/money';
import { formatDayLabel } from '@/logic/datetime';
import { setReconciled } from '@/services/payments';

export function ReconcileScreen() {
  const { org, members } = useApp();
  const payments = usePayments(org?.id);
  const nameByUid = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m) => map.set(m.uid, m.name));
    return map;
  }, [members]);

  if (!org) return null;
  const currency = org.settings.currency;
  const unreconciled = payments.filter((p) => !p.reconciled);
  const reconciledTotal = payments.filter((p) => p.reconciled).reduce((s, p) => s + p.amount, 0);
  const pendingTotal = unreconciled.reduce((s, p) => s + p.amount, 0);

  return (
    <View style={styles.fill}>
      <GradientHeader title="Reconcile" subtitle="Tick payments you see in your bank/UPI" gradient="sky">
        <Row style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          <StatPill value={formatMoney(pendingTotal, currency)} label="To verify" gradient="sunset" />
          <StatPill value={formatMoney(reconciledTotal, currency)} label="Verified" gradient="green" />
        </Row>
      </GradientHeader>
      <Screen>
        {payments.length === 0 ? (
          <EmptyState emoji="🏦" title="No payments yet" subtitle="Recorded payments show up here to match against your statement." />
        ) : (
          payments.map((p) => (
            <Pressable key={p.id} onPress={() => setReconciled(org.id, p.id, !p.reconciled)}>
              <Card style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{nameByUid.get(p.uid) ?? 'Member'}</Text>
                  <Text style={styles.sub}>
                    {formatDayLabel(p.date)} · {p.method.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.amount}>{formatMoney(p.amount, currency)}</Text>
                <View style={{ width: spacing.md }} />
                <Tag text={p.reconciled ? 'Verified' : 'Tap to verify'} tone={p.reconciled ? 'settled' : 'warn'} />
              </Card>
            </Pressable>
          ))
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  name: { fontSize: 15, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '800', color: colors.ink },
});
