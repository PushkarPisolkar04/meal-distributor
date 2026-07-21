import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing } from '@/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props {
  visible: boolean;
  title: string;
  subtitle?: string;
  onDone?: () => void;
  holdMs?: number;
}

/** Full-screen success burst: gradient circle springs in, a check "draws"
 *  itself, then it fades out — the food-delivery "order placed" moment. */
export function SuccessOverlay({ visible, title, subtitle, onDone, holdMs = 1100 }: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const dash = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0);
    dash.setValue(40);
    opacity.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]),
      Animated.timing(dash, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.delay(holdMs),
      Animated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start(() => onDone?.());
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <LinearGradient colors={gradients.green} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.circle}>
            <Svg width={96} height={96} viewBox="0 0 52 52">
              <AnimatedPath
                d="M14 27 l8 8 l16 -18"
                fill="none"
                stroke="white"
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={40}
                strokeDashoffset={dash}
              />
            </Svg>
          </LinearGradient>
        </Animated.View>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,24,40,0.55)',
    gap: spacing.lg,
  },
  circle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.white, fontSize: 24, fontWeight: '900' },
  subtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '600' },
});
