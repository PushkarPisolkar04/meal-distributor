import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, GradientHeader, Row, Screen, Tag } from '@/components';
import { colors, radius, spacing } from '@/theme';
import { useApp } from '@/context/AppContext';
import { setRole, updateMember } from '@/services/members';
import { logAudit } from '@/services/audit';
import type { Member } from '@/types';

export function MembersScreen() {
  const { org, user, profile, members } = useApp();
  const [selected, setSelected] = useState<Member | null>(null);

  if (!org) return null;

  const audit = (targetUid: string, after: unknown) =>
    logAudit(org.id, {
      action: 'member.update',
      by: user!.uid,
      byName: profile?.name ?? 'Coordinator',
      targetUid,
      after,
    });

  const sorted = [...members].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <View style={styles.fill}>
      <GradientHeader title="Members" subtitle={`${members.length} people · code ${org.joinCode}`} gradient="violet" />
      <Screen>
        {sorted.map((m) => (
          <Pressable key={m.uid} onPress={() => setSelected(m)}>
            <Card style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{m.name}</Text>
                <Text style={styles.sub}>{org.offices.find((o) => o.id === m.officeId)?.name ?? m.officeId}</Text>
              </View>
              {m.role === 'coordinator' ? <Tag text="Coordinator" tone="advance" /> : null}
              {!m.active ? <Tag text="Inactive" tone="muted" /> : null}
            </Card>
          </Pressable>
        ))}
      </Screen>

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSelected(null)} />
        <View style={styles.sheet}>
          {selected ? (
            <>
              <Text style={styles.sheetTitle}>{selected.name}</Text>
              <Text style={styles.section}>Office</Text>
              <Row style={{ flexWrap: 'wrap', gap: spacing.sm }}>
                {org.offices.map((o) => (
                  <Pressable
                    key={o.id}
                    onPress={async () => {
                      await updateMember(org.id, selected.uid, { officeId: o.id });
                      await audit(selected.uid, { officeId: o.id });
                      setSelected({ ...selected, officeId: o.id });
                    }}
                    style={[styles.chip, selected.officeId === o.id && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, selected.officeId === o.id && styles.chipTextActive]}>{o.name}</Text>
                  </Pressable>
                ))}
              </Row>

              <Text style={styles.section}>Role</Text>
              <Row style={{ gap: spacing.sm }}>
                <Button
                  label="Member"
                  variant={selected.role === 'member' ? 'solid' : 'outline'}
                  onPress={async () => {
                    await setRole(org.id, selected.uid, 'member');
                    await audit(selected.uid, { role: 'member' });
                    setSelected({ ...selected, role: 'member' });
                  }}
                />
                <Button
                  label="Coordinator"
                  gradient="violet"
                  variant={selected.role === 'coordinator' ? 'solid' : 'outline'}
                  onPress={async () => {
                    await setRole(org.id, selected.uid, 'coordinator');
                    await audit(selected.uid, { role: 'coordinator' });
                    setSelected({ ...selected, role: 'coordinator' });
                  }}
                />
              </Row>

              <View style={{ height: spacing.md }} />
              <Button
                label={selected.active ? 'Deactivate member' : 'Reactivate member'}
                variant="ghost"
                gradient={selected.active ? 'sunset' : 'green'}
                onPress={() => {
                  if (selected.uid === user!.uid) {
                    Alert.alert('Not allowed', 'You cannot deactivate yourself.');
                    return;
                  }
                  updateMember(org.id, selected.uid, { active: !selected.active });
                  audit(selected.uid, { active: !selected.active });
                  setSelected(null);
                }}
              />
            </>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.sm },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
  section: { fontSize: 12, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: spacing.lg, marginBottom: spacing.xs },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.bgWarm, borderWidth: 1, borderColor: colors.line },
  chipActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  chipText: { fontWeight: '700', color: colors.body },
  chipTextActive: { color: colors.white },
});
