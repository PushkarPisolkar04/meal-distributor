import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, GradientHeader, Screen } from '@/components';
import { colors, spacing } from '@/theme';
import { useApp } from '@/context/AppContext';
import { useAudit } from '@/hooks';
import type { AuditAction } from '@/types';

const LABEL: Record<AuditAction, string> = {
  'order.override': 'Order changed',
  'order.lock': 'Orders locked',
  'summary.sent': 'Order sent to vendor',
  'ledger.charge': 'Charge added',
  'payment.record': 'Payment recorded',
  'ledger.adjustment': 'Adjustment',
  'pricing.change': 'Pricing changed',
  'member.update': 'Member updated',
  'container.update': 'Container updated',
};

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function AuditScreen() {
  const { org } = useApp();
  const entries = useAudit(org?.id);

  return (
    <View style={styles.fill}>
      <GradientHeader title="Activity log" subtitle="Every change, for trust & fixing mistakes" gradient="dark" />
      <Screen>
        {entries.length === 0 ? (
          <EmptyState emoji="🧾" title="No activity yet" subtitle="Changes like payments and corrections appear here." />
        ) : (
          entries.map((e) => (
            <Card key={e.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.action}>{LABEL[e.action] ?? e.action}</Text>
                <Text style={styles.sub}>
                  by {e.byName} · {timeAgo(e.at)}
                </Text>
                {e.note ? <Text style={styles.note}>{e.note}</Text> : null}
              </View>
            </Card>
          ))
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  row: { marginBottom: spacing.sm },
  action: { fontSize: 15, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  note: { fontSize: 13, color: colors.body, marginTop: 4 },
});
