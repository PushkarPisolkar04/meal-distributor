import { coordinatorReminders, memberReminders, remindersForRole, shiftBack } from './scheduling';
import type { OrgSettings } from '@/types';

const settings: OrgSettings = {
  menuReminderTime: '10:00',
  orderReminderTime: '10:30',
  cutoffTime: '11:30',
  settlementWeekday: 5, // Friday
  activeWeekdays: [1, 2, 3, 4, 5],
  holidays: [],
  currency: 'Rs',
};

describe('scheduling', () => {
  test('shiftBack subtracts minutes and clamps', () => {
    expect(shiftBack('11:30', 10)).toBe('11:20');
    expect(shiftBack('11:30', 20)).toBe('11:10');
    expect(shiftBack('00:05', 30)).toBe('00:00');
    expect(shiftBack('bad', 10)).toBe('bad');
  });

  test('coordinator reminders include menu, cutoff, settlement', () => {
    const r = coordinatorReminders(settings);
    const kinds = r.map((x) => x.kind);
    expect(kinds).toContain('coordinator.menu');
    expect(kinds).toContain('coordinator.cutoff');
    expect(kinds).toContain('coordinator.settlement');
    const cutoff = r.find((x) => x.kind === 'coordinator.cutoff');
    expect(cutoff?.time).toBe('11:20');
    const settle = r.find((x) => x.kind === 'coordinator.settlement');
    expect(settle?.weekdays).toEqual([5]);
  });

  test('member reminders: order + last chance before cutoff', () => {
    const r = memberReminders(settings);
    expect(r.find((x) => x.kind === 'member.order')?.time).toBe('10:30');
    expect(r.find((x) => x.kind === 'member.orderMissing')?.time).toBe('11:10');
    r.forEach((x) => expect(x.weekdays).toEqual([1, 2, 3, 4, 5]));
  });

  test('remindersForRole dispatches by role', () => {
    expect(remindersForRole('coordinator', settings)).toHaveLength(3);
    expect(remindersForRole('member', settings)).toHaveLength(2);
  });
});
