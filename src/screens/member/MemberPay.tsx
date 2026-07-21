import React, { useMemo } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { Button, Card, EmptyState, GradientHeader, QRCard, Screen } from '@/components';
import { colors, spacing } from '@/theme';
import { useApp } from '@/context/AppContext';
import { useLedger, usePayments } from '@/hooks';
import { computeMemberBalance } from '@/logic/ledger';
import { buildUpiUri, formatMoney } from '@/logic/money';

export function MemberPay() {
  const { org, user, me } = useApp();
  const ledger = useLedger(org?.id);
  const payments = usePayments(org?.id);

  const mine = useMemo(() => ledger.filter((e) => e.uid === user?.uid), [ledger, user]);
  const myPays = useMemo(() => payments.filter((p) => p.uid === user?.uid), [payments, user]);

  if (!org || !me || !user) return null;
  const currency = org.settings.currency;
  const bal = computeMemberBalance(user.uid, me.name, mine, myPays);
  const due = Math.max(0, bal.balance);

  const payInApp = () => {
    if (!org.upiId) return;
    const uri = buildUpiUri({
      payeeVpa: org.upiId,
      payeeName: org.upiPayeeName ?? 'Coordinator',
      amount: due > 0 ? due : undefined,
      note: `Tiffin - ${me.name}`,
    });
    Linking.openURL(uri).catch(() =>
      Alert.alert('No UPI app', 'Could not open a UPI app. Scan the QR instead.'),
    );
  };

  return (
    <View style={styles.fill}>
      <GradientHeader title="Pay" subtitle="Clear your tiffin dues" gradient="green" />
      <Screen>
        <Card style={{ alignItems: 'center' }}>
          <Text style={styles.dueLabel}>{due > 0 ? 'Amount due' : 'You are all settled'}</Text>
          <Text style={styles.dueValue}>{formatMoney(due, currency)}</Text>
        </Card>

        {org.upiId ? (
          <>
            <QRCard
              payeeVpa={org.upiId}
              payeeName={org.upiPayeeName ?? 'Coordinator'}
              amount={due > 0 ? due : undefined}
              note={`Tiffin - ${me.name}`}
              currency={currency}
            />
            <Button label="Pay in UPI app" onPress={payInApp} icon={<Text>⚡</Text>} />
            <Text style={styles.hint}>
              After paying, your coordinator marks it received. Balance updates then.
            </Text>
          </>
        ) : (
          <EmptyState
            emoji="🏦"
            title="No UPI set up yet"
            subtitle="Ask your coordinator to add their UPI ID in Settings."
          />
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  dueLabel: { fontSize: 14, color: colors.muted, fontWeight: '600' },
  dueValue: { fontSize: 40, fontWeight: '900', color: colors.primary, marginTop: 4 },
  hint: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: spacing.sm },
});
