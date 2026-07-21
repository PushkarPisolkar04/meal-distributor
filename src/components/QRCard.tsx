import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Card } from './Card';
import { colors, spacing } from '@/theme';
import { buildUpiUri, formatMoney } from '@/logic/money';

interface Props {
  payeeVpa: string;
  payeeName: string;
  amount?: number;
  note?: string;
  currency?: string;
}

/** Renders a UPI QR the payer can scan with any UPI app (free, no gateway). */
export function QRCard({ payeeVpa, payeeName, amount, note, currency = 'Rs' }: Props) {
  const uri = buildUpiUri({ payeeVpa, payeeName, amount, note });
  if (!payeeVpa) {
    return (
      <Card style={styles.card}>
        <Text style={styles.vpa}>No UPI ID set yet.</Text>
      </Card>
    );
  }
  return (
    <Card style={styles.card}>
      <Text style={styles.name}>{payeeName}</Text>
      <Text style={styles.vpa}>{payeeVpa}</Text>
      <View style={styles.qrWrap}>
        <QRCode value={uri} size={200} backgroundColor="white" color={colors.ink} />
      </View>
      {amount && amount > 0 ? (
        <Text style={styles.amount}>{formatMoney(amount, currency)}</Text>
      ) : null}
      <Text style={styles.hint}>Scan with any UPI app (GPay, PhonePe, Paytm)</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '800', color: colors.ink },
  vpa: { fontSize: 13, color: colors.muted, marginBottom: spacing.lg },
  qrWrap: { padding: spacing.md, backgroundColor: colors.white, borderRadius: 12 },
  amount: { fontSize: 24, fontWeight: '800', color: colors.primary, marginTop: spacing.lg },
  hint: { fontSize: 12, color: colors.muted, marginTop: spacing.sm },
});
