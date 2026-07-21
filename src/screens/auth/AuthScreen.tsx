import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Field } from '@/components';
import { TiffinLogo } from '@/components/TiffinLogo';
import { colors, gradients, spacing } from '@/theme';
import { signIn, signUp } from '@/services/auth';
import { isValidEmail, isValidPassword, isNonEmptyName } from '@/logic/validation';

export function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (mode === 'signup' && !isNonEmptyName(name)) return setError('Enter your name.');
    if (!isValidEmail(email)) return setError('Enter a valid email.');
    if (!isValidPassword(password)) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      if (mode === 'signup') await signUp(name, email, password);
      else await signIn(email, password);
      // Auth listener in AppProvider takes over navigation.
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={gradients.primary} style={styles.fill}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={[styles.hero, { paddingTop: insets.top + 40 }]}>
          <View style={styles.logoBadge}>
            <TiffinLogo size={56} variant="white" />
          </View>
          <Text style={styles.brand}>Tiffin Manager</Text>
          <Text style={styles.tagline}>Daily tiffin orders, bills and payments — sorted.</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create account'}</Text>
          {mode === 'signup' ? (
            <Field label="Your name" value={name} onChangeText={setName} placeholder="e.g. Pushkar" autoCapitalize="words" />
          ) : null}
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label={mode === 'login' ? 'Log in' : 'Sign up'} onPress={submit} loading={loading} />
          <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} style={styles.switch}>
            <Text style={styles.switchText}>
              {mode === 'login' ? "New here? Create an account" : 'Already have an account? Log in'}
            </Text>
          </Pressable>
        </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function friendlyAuthError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  if (code.includes('email-already-in-use')) return 'That email is already registered. Try logging in.';
  if (code.includes('invalid-credential') || code.includes('wrong-password')) return 'Wrong email or password.';
  if (code.includes('user-not-found')) return 'No account with that email.';
  if (code.includes('network')) return 'Network error. Check your connection.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Try again later.';
  return 'Something went wrong. Please try again.';
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingBottom: spacing.xxl },
  hero: { alignItems: 'center', paddingBottom: spacing.xxl },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  brand: { color: colors.white, fontSize: 30, fontWeight: '900', marginTop: spacing.sm },
  tagline: { color: 'rgba(255,255,255,0.92)', fontSize: 14, marginTop: 6, textAlign: 'center', paddingHorizontal: spacing.xl },
  card: { marginHorizontal: spacing.xl, marginTop: spacing.md },
  title: { fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: spacing.lg },
  error: { color: colors.red, marginBottom: spacing.md, fontWeight: '600' },
  switch: { marginTop: spacing.lg, alignItems: 'center' },
  switchText: { color: colors.primary, fontWeight: '700' },
});
