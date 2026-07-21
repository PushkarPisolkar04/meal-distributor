import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '@/theme';
import { TiffinLogo } from './TiffinLogo';

/** Animated startup splash: the logo springs + pulses, the name slides up,
 *  then the whole thing fades out and hands control to the app. */
export function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const screenFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(slide, { toValue: 0, duration: 320, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      ]),
      Animated.delay(650),
      Animated.timing(screenFade, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.wrap, { opacity: screenFade }]}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
          <View style={styles.logoBadge}>
            <TiffinLogo size={92} variant="white" />
          </View>
        </Animated.View>
        <Animated.Text style={[styles.brand, { opacity: textOpacity, transform: [{ translateY: slide }] }]}>Tiffin Manager</Animated.Text>
        <Animated.Text style={[styles.tag, { opacity: textOpacity }]}>Order • Track • Settle</Animated.Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { zIndex: 1000, elevation: 1000 },
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoBadge: {
    width: 132,
    height: 132,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { color: colors.white, fontSize: 32, fontWeight: '900', marginTop: 20 },
  tag: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600', marginTop: 6, letterSpacing: 1 },
});
