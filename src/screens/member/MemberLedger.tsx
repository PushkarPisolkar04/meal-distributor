import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, GradientHeader, Row, Screen, StatPill, Tag } from '@/components';
import { colors, spacing } from '@/theme';
import { useApp } from '@/context/AppContext';
import { useLedger, usePayments } from '@/hooks';
import { computeMemberBalance, signedAmount } from '@/logic/ledger';
import { formatMoney } from '@/logic/money';
import { formatDayLabel } from '@/logic/datetime';
import type { LedgerEntry, Payment } from '@/types';

type Row = { id: string; date: string; label: string; amount: number; kind: string };

export function MemberLedger() {
  const { org, user, me } = useApp();
  const ledger = useLedger(org?.id);
  const payments = usePayments(org?.id);

  const mine = useMemo(() => ledger.filter((e) => e.uid === user?.uid), [ledger, user]);
  const myPays = useMemo(() => payments.filter((p) => p.uid === user?.uid), [payments, user]);

  if (!org || !me || !user) return null;
  const currency = org.settings.currency;
  const bal = computeMemberBalance(user.uid, me.name, mine, myPays);

  const rows: Row[] = [
    ...mine.map((e: LedgerEntry) => ({
      id: e.id,
      date: e.date,
      label: e.note ?? (e.kind === 'charge' ? 'Tiffin' : 'Adjustment'),
      amount: signedAmount(e),
      kind: e.kind,
    })),
    ...myPays.map((p: Payment) => ({
      id: p.id,
      date: p.date,
      label: `Payment (${p.method})`,
      amount: -p.amount,
      kind: 'payment',
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <View style={styles.fill}>
      <GradientHeader
        title="My balance"
        subtitle="Everything you've ordered and paid"
        gradient={bal.balance > 0 ? 'sunset' : 'green'}
      >
        <Row style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          <StatPill
            value={bal.balance >= 0 ? formatMoney(bal.balance, currency) : `${formatMoney(-bal.balance, currency)}`}
            label={bal.balance > 0 ? 'You owe' : bal.balance < 0 ? 'In credit' : 'All settled'}
            gradient="violet"
          />
          <StatPill value={formatMoney(bal.totalCharged, currency)} label="Total ordered" gradient="sky" />
        </Row>
      </GradientHeader>

      <Screen>
        {rows.length === 0 ? (
          <EmptyState emoji="🧾" title="Nothing yet" subtitle="Your tiffin charges and payments will show here." />
        ) : (
          rows.map((r) => (
            <Card key={r.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{r.label}</Text>
                <Text style={styles.date}>{formatDayLabel(r.date)}</Text>
              </View>
              <Text style={[styles.amount, r.amount < 0 ? styles.credit : styles.debit]}>
                {r.amount < 0 ? '−' : '+'}
                {formatMoney(Math.abs(r.amount), currency)}
              </Text>
            </Card>
          ))
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  label: { fontSize: 15, fontWeight: '700', color: colors.ink },
  date: { fontSize: 12, color: colors.muted, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '800' },
  debit: { color: colors.ink },
  credit: { color: colors.greenDark },
});
