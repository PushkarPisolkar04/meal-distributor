// Local notification scheduling. These are on-device, device-clock reminders
// handed to the OS scheduler (Android AlarmManager / iOS UNUserNotificationCenter)
// via expo-notifications, so they fire even when the app is fully closed. No
// server, no push credentials, no cost. This is the "notification module" whose
// logic (what/when) lives in src/logic/scheduling.ts.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { OrgSettings, Role, ScheduledReminder } from '@/types';
import { parseHHmm } from '@/logic/datetime';
import { remindersForRole } from '@/logic/scheduling';

// Show alerts even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let handlerReady = false;

export async function ensurePermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  let granted = settings.granted;
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Tiffin reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF5A3C',
    });
  }
  handlerReady = granted;
  return granted;
}

/** Convert our weekday (0=Sun..6=Sat) to Expo's (1=Sun..7=Sat). */
function toExpoWeekday(jsWeekday: number): number {
  return ((jsWeekday % 7) + 7) % 7 + 1;
}

/**
 * Replace all scheduled reminders with the ones derived from settings for this
 * role. Idempotent: safe to call on every app start / settings change.
 */
export async function rescheduleForRole(role: Role, settings: OrgSettings): Promise<void> {
  const granted = handlerReady || (await ensurePermissions());
  if (!granted) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const reminders = remindersForRole(role, settings);
  for (const reminder of reminders) {
    await scheduleReminder(reminder);
  }
}

/** Schedule one reminder: a weekly-repeating notification per active weekday. */
export async function scheduleReminder(reminder: ScheduledReminder): Promise<void> {
  const hm = parseHHmm(reminder.time);
  if (!hm) return;
  for (const weekday of reminder.weekdays) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { kind: reminder.kind },
      },
      // Weekly-repeating trigger (expo-notifications SDK 54).
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: toExpoWeekday(weekday),
        hour: hm.h,
        minute: hm.m,
      },
    });
  }
}

/** One-off nudge, e.g. "please return the tiffin container". */
export async function scheduleContainerReminder(
  memberName: string,
  minutesFromNow = 30,
): Promise<void> {
  const granted = handlerReady || (await ensurePermissions());
  if (!granted) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Container not returned',
      body: `Remind ${memberName} to keep the tiffin container back at its place.`,
      data: { kind: 'container.return' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, minutesFromNow * 60),
      repeats: false,
    },
  });
}

export async function cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function listScheduled(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}
