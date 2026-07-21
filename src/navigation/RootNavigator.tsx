import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '@/theme';
import { useApp } from '@/context/AppContext';
import { TiffinLogo } from '@/components/TiffinLogo';

import { AuthScreen } from '@/screens/auth/AuthScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';

import { CoordinatorDashboard } from '@/screens/coordinator/CoordinatorDashboard';
import { LedgerScreen } from '@/screens/coordinator/LedgerScreen';
import { MembersScreen } from '@/screens/coordinator/MembersScreen';
import { ReportsScreen } from '@/screens/coordinator/ReportsScreen';
import { SettingsScreen } from '@/screens/coordinator/SettingsScreen';
import { PricingScreen } from '@/screens/coordinator/PricingScreen';
import { ReconcileScreen } from '@/screens/coordinator/ReconcileScreen';
import { AuditScreen } from '@/screens/coordinator/AuditScreen';
import { HolidaysScreen } from '@/screens/coordinator/HolidaysScreen';

import { MemberHome } from '@/screens/member/MemberHome';
import { MemberLedger } from '@/screens/member/MemberLedger';
import { MemberPay } from '@/screens/member/MemberPay';
import { MemberSettings } from '@/screens/member/MemberSettings';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function tabIcon(icon: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
  );
}

const tabBarOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.muted,
  tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 6, borderTopColor: colors.line },
  tabBarLabelStyle: { fontSize: 11, fontWeight: '700' as const },
};

function CoordinatorTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen name="Home" component={CoordinatorDashboard} options={{ tabBarIcon: tabIcon('🍱') }} />
      <Tab.Screen name="Ledger" component={LedgerScreen} options={{ tabBarIcon: tabIcon('📒') }} />
      <Tab.Screen name="Members" component={MembersScreen} options={{ tabBarIcon: tabIcon('👥') }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ tabBarIcon: tabIcon('📊') }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: tabIcon('⚙️') }} />
    </Tab.Navigator>
  );
}

function CoordinatorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={CoordinatorTabs} />
      <Stack.Screen name="Pricing" component={PricingScreen} />
      <Stack.Screen name="Reconcile" component={ReconcileScreen} />
      <Stack.Screen name="Holidays" component={HolidaysScreen} />
      <Stack.Screen name="Audit" component={AuditScreen} />
    </Stack.Navigator>
  );
}

function MemberTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen name="Home" component={MemberHome} options={{ tabBarIcon: tabIcon('🍱') }} />
      <Tab.Screen name="Balance" component={MemberLedger} options={{ tabBarIcon: tabIcon('📒') }} />
      <Tab.Screen name="Pay" component={MemberPay} options={{ tabBarIcon: tabIcon('💳') }} />
      <Tab.Screen name="Profile" component={MemberSettings} options={{ tabBarIcon: tabIcon('👤') }} />
    </Tab.Navigator>
  );
}

function Loading() {
  return (
    <View style={styles.center}>
      <TiffinLogo size={72} variant="badge" />
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

export function RootNavigator() {
  const { initializing, user, profile, org, me, role } = useApp();

  // Still booting, or signed in but the profile hasn't loaded yet.
  if (initializing || (user && !profile)) return <Loading />;

  let content: React.ReactNode;
  if (!user) {
    content = <AuthScreen />;
  } else if (profile && profile.orgIds.length === 0) {
    // Genuinely has no group yet -> onboarding.
    content = <OnboardingScreen />;
  } else if (!org || !me || !role) {
    // Has a group but its data is still streaming in -> don't flash onboarding.
    content = <Loading />;
  } else if (role === 'coordinator') {
    content = <CoordinatorStack />;
  } else {
    content = <MemberTabs />;
  }

  return <NavigationContainer>{content}</NavigationContainer>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, gap: 16 },
  logo: { fontSize: 56 },
});
