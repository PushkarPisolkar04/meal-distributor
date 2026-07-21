import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing } from '@/theme';
import type { TiffinChoice } from '@/types';

const OPTIONS: { key: TiffinChoice; label: string; emoji: string; grad: keyof typeof gradients }[] = [
  { key: 'full', label: 'Full', emoji: '🍱', grad: 'primary' },
  { key: 'half', label: 'Half', emoji: '🥗', grad: 'sunset' },
  { key: 'skip', label: 'Skip', emoji: '🚫', grad: 'dark' },
];

interface Props {
  value: TiffinChoice | null;
  onChange: (choice: TiffinChoice) => void;
  disabled?: boolean;
}

/** The big one-tap Full / Half / Skip selector for daily ordering. */
export function ChoiceChips({ value, onChange, disabled }: Props) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => {
        const active = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            disabled={disabled}
            onPress={() => onChange(opt.key)}
            style={[styles.chipWrap, disabled && { opacity: 0.6 }]}
          >
            {active ? (
              <LinearGradient
                colors={gradients[opt.grad]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.chip}
              >
                <Text style={styles.emoji}>{opt.emoji}</Text>
                <Text style={[styles.label, { color: colors.white }]}>{opt.label}</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.chip, styles.inactive]}>
                <Text style={styles.emoji}>{opt.emoji}</Text>
                <Text style={styles.label}>{opt.label}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  chipWrap: { flex: 1 },
  chip: {
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactive: { backgroundColor: colors.bgWarm, borderWidth: 1, borderColor: colors.line },
  emoji: { fontSize: 26, marginBottom: 4 },
  label: { fontSize: 15, fontWeight: '700', color: colors.ink },
});
