import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Card,
  EmptyState,
  Field,
  GradientHeader,
  Row,
  Screen,
  StatPill,
  Tag,
} from '@/components';
import { colors, radius, spacing } from '@/theme';
import { useApp } from '@/context/AppContext';
import { useLedger, usePayments } from '@/hooks';
import { computeAllBalances, totalOutstanding } from '@/logic/ledger';
import { formatMoney } from '@/logic/money';
import { buildBillMessage, buildWhatsAppUrl } from '@/logic/whatsapp';
import { todayISO } from '@/logic/datetime';
import { isValidPrice } from '@/logic/validation';
import { recordPayment } from '@/services/payments';
import { addAdjustment } from '@/services/ledger';
import { logAudit } from '@/services/audit';
import type { MemberBalance } from '@/types';

export function LedgerScreen() {
  const { org, user, profile, members } = useApp();
  const ledger = useLedger(org?.id);
  const payments = usePayments(org?.id);
  const [selected, setSelected] = useState<MemberBalance | null>(null);

  const allBalances = useMemo(
    () => computeAllBalances(members.map((m) => ({ uid: m.uid, name: m.name })), ledger, payments),
    [members, ledger, payments],
  );
  // The coordinator collects from others and pays the vendor total — they don't
  // owe themselves. Split their own line out of the collection list.
  const myBalance = allBalances.find((b) => b.uid === user?.uid) ?? null;
  const balances = allBalances.filter((b) => b.uid !== user?.uid);
  const outstanding = totalOutstanding(balances);
  const currency = org?.settings.currency ?? 'Rs';

  if (!org) return null;

  const sendBill = (bal: MemberBalance) => {
    const msg = buildBillMessage(bal, currency, { upiId: org.upiId });
    const url = buildWhatsAppUrl(msg);
    Linking.openURL(url).catch(() => Alert.alert('Bill', msg));
  };

  const due = balances.filter((b) => b.balance > 0).sort((a, b) => b.balance - a.balance);
  const others = balances.filter((b) => b.balance <= 0);

  return (
    <View style={styles.fill}>
      <GradientHeader title="Ledger" subtitle="Balances, payments & carry-over" gradient="green">
        <Row style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          <StatPill value={formatMoney(outstanding, currency)} label="Outstanding" gradient="sunset" />
          <StatPill value={String(due.length)} label="People due" gradient="violet" />
        </Row>
      </GradientHeader>

      <Screen>
        {myBalance && myBalance.totalCharged > 0 ? (
          <Card style={styles.selfCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.selfLabel}>Your own tiffins</Text>
              <Text style={styles.selfHint}>Part of the total you pay the vendor — not collected.</Text>
            </View>
            <Text style={styles.selfAmount}>{formatMoney(myBalance.totalCharged, currency)}</Text>
          </Card>
        ) : null}

        {balances.length === 0 ? (
          <EmptyState emoji="📒" title="Nobody to collect from yet" subtitle="Member balances appear after you lock & bill an order." />
        ) : (
          <>
            {due.length > 0 ? <Text style={styles.section}>Due to you</Text> : null}
            {due.map((b) => (
              <BalanceRow key={b.uid} bal={b} currency={currency} onPress={() => setSelected(b)} />
            ))}
            {others.length > 0 ? <Text style={styles.section}>Settled / advance</Text> : null}
            {others.map((b) => (
              <BalanceRow key={b.uid} bal={b} currency={currency} onPress={() => setSelected(b)} />
            ))}
          </>
        )}
      </Screen>

      <MemberActionModal
        bal={selected}
        currency={currency}
        onClose={() => setSelected(null)}
        onSendBill={sendBill}
        onRecordPayment={async (amount, method) => {
          await recordPayment(org.id, {
            uid: selected!.uid,
            amount,
            date: todayISO(),
            method,
            recordedBy: user!.uid,
          });
          await logAudit(org.id, {
            action: 'payment.record',
            by: user!.uid,
            byName: profile?.name ?? 'Coordinator',
            targetUid: selected!.uid,
            after: { amount, method },
          });
          setSelected(null);
        }}
        onAdjust={async (amount, direction, note) => {
          await addAdjustment(org.id, {
            uid: selected!.uid,
            amount,
            direction,
            date: todayISO(),
            note,
            createdBy: user!.uid,
          });
          await logAudit(org.id, {
            action: 'ledger.adjustment',
            by: user!.uid,
            byName: profile?.name ?? 'Coordinator',
            targetUid: selected!.uid,
            after: { amount, direction, note },
          });
          setSelected(null);
        }}
      />
    </View>
  );
}

function BalanceRow({
  bal,
  currency,
  onPress,
}: {
  bal: MemberBalance;
  currency: string;
  onPress: () => void;
}) {
  const tone = bal.status === 'due' ? 'due' : bal.status === 'advance' ? 'advance' : 'settled';
  const label =
    bal.status === 'advance' ? `${formatMoney(-bal.balance, currency)} adv` : formatMoney(bal.balance, currency);
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.balCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{bal.memberName}</Text>
          <Text style={styles.sub}>
            Charged {formatMoney(bal.totalCharged, currency)} · Paid {formatMoney(bal.totalPaid, currency)}
          </Text>
        </View>
        <Tag text={label} tone={tone} />
      </Card>
    </Pressable>
  );
}

function MemberActionModal({
  bal,
  currency,
  onClose,
  onSendBill,
  onRecordPayment,
  onAdjust,
}: {
  bal: MemberBalance | null;
  currency: string;
  onClose: () => void;
  onSendBill: (b: MemberBalance) => void;
  onRecordPayment: (amount: number, method: 'upi' | 'cash') => Promise<void>;
  onAdjust: (amount: number, direction: '+' | '-', note: string) => Promise<void>;
}) {
  const [payAmount, setPayAmount] = useState('');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjNote, setAdjNote] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setPayAmount('');
    setAdjAmount('');
    setAdjNote('');
  };

  // Clear inputs whenever a different member's sheet is opened.
  useEffect(() => {
    reset();
  }, [bal?.uid]);

  const pay = async (method: 'upi' | 'cash') => {
    const amt = Number(payAmount);
    if (!isValidPrice(amt)) return;
    setBusy(true);
    try {
      await onRecordPayment(amt, method);
      reset();
    } finally {
      setBusy(false);
    }
  };

  const adjust = async (direction: '+' | '-') => {
    const amt = Number(adjAmount);
    if (!isValidPrice(amt)) return;
    setBusy(true);
    try {
      await onAdjust(amt, direction, adjNote.trim() || 'Manual adjustment');
      reset();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={!!bal} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        {bal ? (
          <>
            <Row>
              <Text style={styles.sheetTitle}>{bal.memberName}</Text>
              <Tag
                text={bal.balance > 0 ? `${formatMoney(bal.balance, currency)} due` : 'Settled'}
                tone={bal.balance > 0 ? 'due' : 'settled'}
              />
            </Row>

            <Text style={styles.section}>Record a payment</Text>
            <Field placeholder="Amount received" value={payAmount} onChangeText={setPayAmount} keyboardType="numeric" />
            <Row style={{ gap: spacing.sm }}>
              <Button label="UPI" onPress={() => pay('upi')} loading={busy} variant="outline" />
              <Button label="Cash" onPress={() => pay('cash')} loading={busy} variant="outline" gradient="green" />
            </Row>

            <Text style={styles.section}>Fix a mistake (adjustment)</Text>
            <Field placeholder="Amount" value={adjAmount} onChangeText={setAdjAmount} keyboardType="numeric" />
            <Field placeholder="Reason (e.g. wrong tiffin added)" value={adjNote} onChangeText={setAdjNote} />
            <Row style={{ gap: spacing.sm }}>
              <Button label="Add to due (+)" onPress={() => adjust('+')} loading={busy} variant="ghost" />
              <Button label="Reduce due (-)" onPress={() => adjust('-')} loading={busy} variant="ghost" gradient="green" />
            </Row>

            <View style={{ height: spacing.md }} />
            <Button label="Send bill on WhatsApp" onPress={() => onSendBill(bal)} icon={<Text>📲</Text>} />
          </>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  selfCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgWarm },
  selfLabel: { fontSize: 15, fontWeight: '800', color: colors.ink },
  selfHint: { fontSize: 12, color: colors.muted, marginTop: 2 },
  selfAmount: { fontSize: 18, fontWeight: '800', color: colors.body },
  section: { fontSize: 12, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: spacing.lg, marginBottom: spacing.xs },
  balCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.sm },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
});
