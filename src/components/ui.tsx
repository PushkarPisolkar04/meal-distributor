import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing, type GradientName } from '@/theme';

/** Labelled text field. */
export function Field({
  label,
  hint,
  error,
  style,
  ...rest
}: TextInputProps & { label?: string; hint?: string; error?: string; style?: ViewStyle }) {
  return (
    <View style={[{ marginBottom: spacing.lg }, style]}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, error ? { borderColor: colors.red } : null]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

/** Small rounded stat with a gradient background. */
export function StatPill({
  value,
  label,
  gradient = 'primary',
  style,
}: {
  value: string;
  label: string;
  gradient?: GradientName;
  style?: ViewStyle;
}) {
  return (
    <LinearGradient
      colors={gradients[gradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.pill, style]}
    >
      <Text style={styles.pillValue}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </LinearGradient>
  );
}

/** Colored status tag (due / settled / advance etc). */
export function Tag({ text, tone = 'muted' }: { text: string; tone?: 'due' | 'settled' | 'advance' | 'muted' | 'warn' }) {
  const map = {
    due: { bg: '#FEE4E2', fg: colors.red },
    settled: { bg: '#D1FADF', fg: colors.greenDark },
    advance: { bg: '#D1E9FF', fg: colors.blue },
    warn: { bg: '#FEF0C7', fg: colors.amber },
    muted: { bg: colors.line, fg: colors.body },
  }[tone];
  return (
    <View style={[styles.tag, { backgroundColor: map.bg }]}>
      <Text style={[styles.tagText, { color: map.fg }]}>{text}</Text>
    </View>
  );
}

export function EmptyState({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 44 }}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.rowBetween, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.body, marginBottom: 6 },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
  hint: { fontSize: 12, color: colors.muted, marginTop: 4 },
  error: { fontSize: 12, color: colors.red, marginTop: 4 },
  pill: { flex: 1, borderRadius: radius.lg, padding: spacing.lg },
  pillValue: { color: colors.white, fontSize: 26, fontWeight: '800' },
  pillLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600', marginTop: 2 },
  tag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  tagText: { fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl, gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  emptySub: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
