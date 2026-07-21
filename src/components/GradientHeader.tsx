import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, radius, spacing, type GradientName } from '@/theme';

interface Props {
  title: string;
  subtitle?: string;
  gradient?: GradientName;
  right?: React.ReactNode;
  children?: React.ReactNode;
  style?: ViewStyle;
}

/** Rounded gradient header used at the top of every screen. */
export function GradientHeader({
  title,
  subtitle,
  gradient = 'primary',
  right,
  children,
  style,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={gradients[gradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, { paddingTop: insets.top + spacing.md }, style]}
    >
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { color: colors.white, fontSize: 24, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 2, fontWeight: '500' },
});
