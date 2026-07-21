import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Field, GradientHeader, Row, Screen, Tag } from '@/components';
import { colors, spacing } from '@/theme';
import { useApp } from '@/context/AppContext';
import { usePricing } from '@/hooks';
import { formatMoney } from '@/logic/money';
import { todayISO, formatDayLabel } from '@/logic/datetime';
import { getRateForDate } from '@/logic/pricing';
import { isValidPrice } from '@/logic/validation';
import { addPriceRecord } from '@/services/orgs';
import { logAudit } from '@/services/audit';

export function PricingScreen() {
  const { org, user, profile } = useApp();
  const pricing = usePricing(org?.id);
  const [half, setHalf] = useState('');
  const [full, setFull] = useState('');
  const [from, setFrom] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!org) return null;
  const currency = org.settings.currency;
  const currentRate = getRateForDate(pricing, todayISO());

  const add = async () => {
    setError(null);
    const h = Number(half);
    const f = Number(full);
    if (!isValidPrice(h) || !isValidPrice(f)) return setError('Enter valid prices.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) return setError('Date must be yyyy-mm-dd.');
    setBusy(true);
    try {
      await addPriceRecord(org.id, { halfPrice: h, fullPrice: f, effectiveFrom: from });
      await logAudit(org.id, {
        action: 'pricing.change',
        by: user!.uid,
        byName: profile?.name ?? 'Coordinator',
        after: { halfPrice: h, fullPrice: f, effectiveFrom: from },
      });
      setHalf('');
      setFull('');
    } catch {
      setError('Could not save. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.fill}>
      <GradientHeader title="Pricing" subtitle="Rates are dated — old orders keep old rates" gradient="sunset" />
      <Screen>
        <Card>
          <Text style={styles.cardTitle}>Current rate</Text>
          {currentRate ? (
            <Text style={styles.current}>
              Half {formatMoney(currentRate.halfPrice, currency)} · Full {formatMoney(currentRate.fullPrice, currency)}
            </Text>
          ) : (
            <Text style={styles.muted}>No rate configured yet.</Text>
          )}
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Add / change rate</Text>
          <Row style={{ gap: spacing.md }}>
            <Field label="Half" value={half} onChangeText={setHalf} keyboardType="numeric" style={{ flex: 1 }} placeholder="65" />
            <Field label="Full" value={full} onChangeText={setFull} keyboardType="numeric" style={{ flex: 1 }} placeholder="90" />
          </Row>
          <Field label="Effective from (yyyy-mm-dd)" value={from} onChangeText={setFrom} placeholder={todayISO()} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="Save rate" onPress={add} loading={busy} />
        </Card>

        <Text style={styles.section}>History</Text>
        {pricing.map((p) => {
          const isCurrent = currentRate && p.effectiveFrom <= todayISO() &&
            p.effectiveFrom === pricing.filter((r) => r.effectiveFrom <= todayISO())[0]?.effectiveFrom;
          return (
            <Card key={p.id} style={styles.histRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.histRate}>
                  Half {formatMoney(p.halfPrice, currency)} · Full {formatMoney(p.fullPrice, currency)}
                </Text>
                <Text style={styles.muted}>From {formatDayLabel(p.effectiveFrom)}</Text>
              </View>
              {isCurrent ? <Tag text="Current" tone="settled" /> : null}
            </Card>
          );
        })}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.ink, marginBottom: spacing.sm },
  current: { fontSize: 18, fontWeight: '800', color: colors.primary },
  muted: { color: colors.muted, marginTop: 2 },
  error: { color: colors.red, marginBottom: spacing.sm, fontWeight: '600' },
  section: { fontSize: 12, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: spacing.lg, marginBottom: spacing.xs },
  histRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  histRate: { fontSize: 15, fontWeight: '700', color: colors.ink },
});
