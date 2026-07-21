import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing, type GradientName } from '@/theme';

interface Props {
  label: string;
  onPress?: () => void;
  gradient?: GradientName;
  variant?: 'solid' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  full?: boolean;
}

export function Button({
  label,
  onPress,
  gradient = 'primary',
  variant = 'solid',
  disabled,
  loading,
  icon,
  style,
  full = true,
}: Props) {
  const isDisabled = disabled || loading;
  const scale = React.useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.96, speed: 40, bounciness: 0, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, speed: 40, bounciness: 6, useNativeDriver: true }).start();
  const content = (
    <View style={styles.inner}>
      {loading ? (
        <ActivityIndicator color={variant === 'solid' ? colors.white : colors.primary} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              variant !== 'solid' && { color: colors.primary },
              icon ? { marginLeft: spacing.sm } : null,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </View>
  );

  if (variant === 'solid') {
    return (
      <Animated.View style={[full && { alignSelf: 'stretch' }, { transform: [{ scale }] }]}>
        <Pressable
          onPress={onPress}
          onPressIn={pressIn}
          onPressOut={pressOut}
          disabled={isDisabled}
          style={[isDisabled && { opacity: 0.5 }, style]}
        >
          <LinearGradient
            colors={gradients[gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.solid}
          >
            {content}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[full && { alignSelf: 'stretch' }, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={isDisabled}
        style={[
          styles.base,
          variant === 'outline' && styles.outline,
          variant === 'ghost' && styles.ghost,
          isDisabled && { opacity: 0.5 },
          style,
        ]}
      >
        {content}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
  },
  solid: {
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
  },
  outline: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: 'transparent' },
  ghost: { backgroundColor: colors.bgWarm },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
