import React from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from './Button';
import { colors, gradients, radius, spacing } from '@/theme';
import type { LatestVersion } from '@/services/appUpdate';

interface Props {
  visible: boolean;
  current: string;
  latest: LatestVersion | undefined;
  onLater: () => void;
}

/** Production-style "Update available" prompt for the self-distributed APK. */
export function UpdateModal({ visible, current, latest, onLater }: Props) {
  if (!latest) return null;
  const mandatory = !!latest.mandatory;

  const update = () => {
    Linking.openURL(latest.apkUrl).catch(() => undefined);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={mandatory ? undefined : onLater}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.badge}>
            <Text style={styles.badgeEmoji}>🚀</Text>
          </LinearGradient>
          <Text style={styles.title}>Update available</Text>
          <Text style={styles.version}>
            v{current} → v{latest.version}
          </Text>
          {latest.notes ? <Text style={styles.notes}>{latest.notes}</Text> : null}

          <View style={{ height: spacing.lg }} />
          <Button label="Update now" onPress={update} icon={<Text>⬇️</Text>} />
          {!mandatory ? (
            <Pressable onPress={onLater} style={styles.later}>
              <Text style={styles.laterText}>Later</Text>
            </Pressable>
          ) : (
            <Text style={styles.mandatory}>This update is required to continue.</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: { width: '100%', maxWidth: 360, backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center' },
  badge: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  badgeEmoji: { fontSize: 30 },
  title: { fontSize: 22, fontWeight: '900', color: colors.ink },
  version: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: 4 },
  notes: { fontSize: 14, color: colors.body, marginTop: spacing.md, textAlign: 'center', lineHeight: 20 },
  later: { marginTop: spacing.md, padding: spacing.sm },
  laterText: { color: colors.muted, fontWeight: '700', fontSize: 15 },
  mandatory: { color: colors.muted, fontSize: 12, marginTop: spacing.md, textAlign: 'center' },
});
