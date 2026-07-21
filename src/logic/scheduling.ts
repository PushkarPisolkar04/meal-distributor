// Builds the list of local, device-clock reminders for a given role from org
// settings. The notification service (Expo layer) consumes these and hands them
// to the OS scheduler so they fire even when the app is closed.

import type { OrgSettings, Role, ScheduledReminder } from '@/types';

/**
 * Reminders for a coordinator: send the menu message, cutoff warning, and the
 * weekly settlement nudge.
 */
export function coordinatorReminders(settings: OrgSettings): ScheduledReminder[] {
  const days = settings.activeWeekdays;
  return [
    {
      kind: 'coordinator.menu',
      title: 'Ask the vendor for today\'s menu',
      body: 'Send the "Menu?" message so people can decide.',
      time: settings.menuReminderTime,
      weekdays: days,
    },
    {
      kind: 'coordinator.cutoff',
      title: 'Tiffin cutoff coming up',
      body: 'Review counts and send the order to the vendor on WhatsApp.',
      time: shiftBack(settings.cutoffTime, 10),
      weekdays: days,
    },
    {
      kind: 'coordinator.settlement',
      title: 'Weekly settlement',
      body: 'Review totals, collect payments and clear balances.',
      time: settings.cutoffTime,
      weekdays: [settings.settlementWeekday],
    },
  ];
}

/** Reminders for a member: place the order, and a last-chance nudge. */
export function memberReminders(settings: OrgSettings): ScheduledReminder[] {
  const days = settings.activeWeekdays;
  return [
    {
      kind: 'member.order',
      title: 'Order your tiffin',
      body: 'Half, Full or Skip for today? Tap to choose.',
      time: settings.orderReminderTime,
      weekdays: days,
    },
    {
      kind: 'member.orderMissing',
      title: 'Last chance to order',
      body: `Cutoff is at ${settings.cutoffTime}. Choose before it locks.`,
      time: shiftBack(settings.cutoffTime, 20),
      weekdays: days,
    },
  ];
}

export function remindersForRole(role: Role, settings: OrgSettings): ScheduledReminder[] {
  return role === 'coordinator'
    ? coordinatorReminders(settings)
    : memberReminders(settings);
}

/** Shift an "HH:mm" time earlier by `mins`, clamped to 00:00. Pure helper. */
export function shiftBack(time: string, mins: number): string {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
  if (!match) return time;
  const total = parseInt(match[1] as string, 10) * 60 + parseInt(match[2] as string, 10);
  const shifted = Math.max(0, total - mins);
  const h = Math.floor(shifted / 60);
  const m = shifted % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
