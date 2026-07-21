import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, spacing } from '@/theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentStyle?: ViewStyle;
}

/** Standard screen body below a GradientHeader: warm background + scroll. */
export function Screen({ children, scroll = true, onRefresh, refreshing, contentStyle }: Props) {
  if (!scroll) {
    return <View style={[styles.flex, styles.pad, contentStyle]}>{children}</View>;
  }
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.pad, contentStyle]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
});
