import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '@/context/AppContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { AnimatedSplash, UpdateModal } from '@/components';
import { checkForUpdate, type UpdateStatus } from '@/services/appUpdate';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [update, setUpdate] = useState<UpdateStatus | null>(null);
  const [dismissedUpdate, setDismissedUpdate] = useState(false);

  // Check for a newer APK on launch (non-blocking, never throws).
  useEffect(() => {
    checkForUpdate().then(setUpdate).catch(() => undefined);
  }, []);

  const showUpdate = !!update?.available && !dismissedUpdate && splashDone;

  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" />
        <RootNavigator />
        {!splashDone ? <AnimatedSplash onFinish={() => setSplashDone(true)} /> : null}
        <UpdateModal
          visible={showUpdate}
          current={update?.current ?? ''}
          latest={update?.latest}
          onLater={() => setDismissedUpdate(true)}
        />
      </AppProvider>
    </SafeAreaProvider>
  );
}
