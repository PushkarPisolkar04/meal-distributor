import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, EmptyState, GradientHeader, Row, Screen, StatPill } from '@/components';
import { colors, radius, spacing } from '@/theme';
import { useApp } from '@/context/AppContext';
import { useLedger, usePayments } from '@/hooks';
import { aggregatePeriod, perMemberSpend, countByDate } from '@/logic/analytics';
import { computeAllBalances } from '@/logic/ledger';
import { formatMoney } from '@/logic/money';
import { todayISO, startOfWeek, addDays, formatDayLabel } from '@/logic/datetime';
import { exportReportPdf } from '@/services/export';

type Period = 'week' | 'month';

function monthRange(iso: string): { from: string; to: string } {
  const [y, m] = iso.split('-').map((n) => parseInt(n, 10));
  const from = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(y as number, m as number, 0).getDate();
  const to = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

export function ReportsScreen() {
  const { org, members } = useApp();
  const ledger = useLedger(org?.id);
  const payments = usePayments(org?.id);
  const [period, setPeriod] = useState<Period>('week');
  const [exporting, setExporting] = useState(false);

  const today = todayISO();
  const range = useMemo(() => {
    if (period === 'week') {
      const from = startOfWeek(today);
      return { from, to: addDays(from, 6), label: 'This week' };
    }
    const r = monthRange(today);
    return { from: r.from, to: r.to, label: 'This month' };
  }, [period, today]);

  if (!org) return null;
  const currency = org.settings.currency;

  const totals = aggregatePeriod(ledger, payments, range.from, range.to);
  const spend = perMemberSpend(ledger, members.map((m) => ({ uid: m.uid, name: m.name })), range.from, range.to);
  const daily = countByDate(ledger, range.from, range.to);
  const maxDay = Math.max(1, ...daily.map((d) => d.count));
  const maxSpend = Math.max(1, ...spend.map((s) => s.total));

  const doExport = async () => {
    setExporting(true);
    try {
      const balances = computeAllBalances(
        members.map((m) => ({ uid: m.uid, name: m.name })),
        ledger,
        payments,
      );
      await exportReportPdf({
        orgName: org.name,
        periodLabel: range.label,
        fromISO: range.from,
        toISO: range.to,
        totals,
        balances,
        currency,
      });
    } catch (e) {
      Alert.alert('Export failed', (e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.fill}>
      <GradientHeader title="Reports" subtitle={`${range.label} · ${formatDayLabel(range.from)}–${formatDayLabel(range.to)}`} gradient="sky">
        <View style={styles.toggle}>
          <Pressable onPress={() => setPeriod('week')} style={[styles.tog, period === 'week' && styles.togActive]}>
            <Text style={[styles.togText, period === 'week' && styles.togTextActive]}>Week</Text>
          </Pressable>
          <Pressable onPress={() => setPeriod('month')} style={[styles.tog, period === 'month' && styles.togActive]}>
            <Text style={[styles.togText, period === 'month' && styles.togTextActive]}>Month</Text>
          </Pressable>
        </View>
        <Row style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <StatPill value={String(totals.tiffinCount)} label="Tiffins" gradient="green" />
          <StatPill value={formatMoney(totals.totalCharged, currency)} label="Charged" gradient="sunset" />
          <StatPill value={formatMoney(totals.totalPaid, currency)} label="Collected" gradient="violet" />
        </Row>
      </GradientHeader>

      <Screen>
        {totals.tiffinCount === 0 ? (
          <EmptyState emoji="📊" title="No data for this period" subtitle="Reports appear once orders are billed." />
        ) : (
          <>
            <Card>
              <Text style={styles.cardTitle}>Tiffins per day</Text>
              <View style={styles.chart}>
                {daily.map((d) => (
                  <View key={d.date} style={styles.barCol}>
                    <View style={[styles.bar, { height: 8 + (d.count / maxDay) * 90 }]} />
                    <Text style={styles.barCount}>{d.count}</Text>
                    <Text style={styles.barDate}>{d.date.slice(8)}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card>
              <Text style={styles.cardTitle}>Spend by member</Text>
              {spend.map((s) => (
                <View key={s.uid} style={styles.spendRow}>
                  <Row>
                    <Text style={styles.spendName}>{s.name}</Text>
                    <Text style={styles.spendAmt}>{formatMoney(s.total, currency)} · {s.count}</Text>
                  </Row>
                  <View style={styles.track}>
                    <View style={[styles.fill2, { width: `${(s.total / maxSpend) * 100}%` }]} />
                  </View>
                </View>
              ))}
            </Card>

            <Button label="Export PDF statement" onPress={doExport} loading={exporting} icon={<Text>📄</Text>} />
          </>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  toggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: radius.pill, padding: 4, marginTop: spacing.lg },
  tog: { flex: 1, paddingVertical: 8, borderRadius: radius.pill, alignItems: 'center' },
  togActive: { backgroundColor: colors.white },
  togText: { fontWeight: '700', color: colors.white },
  togTextActive: { color: colors.blue },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.ink, marginBottom: spacing.md },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, minHeight: 130 },
  barCol: { flex: 1, alignItems: 'center' },
  bar: { width: '70%', backgroundColor: colors.primary, borderRadius: 6 },
  barCount: { fontSize: 11, fontWeight: '700', color: colors.ink, marginTop: 4 },
  barDate: { fontSize: 10, color: colors.muted },
  spendRow: { marginBottom: spacing.md },
  spendName: { fontSize: 14, fontWeight: '700', color: colors.ink },
  spendAmt: { fontSize: 13, fontWeight: '700', color: colors.primary },
  track: { height: 8, backgroundColor: colors.line, borderRadius: 4, marginTop: 6, overflow: 'hidden' },
  fill2: { height: 8, backgroundColor: colors.teal, borderRadius: 4 },
});
