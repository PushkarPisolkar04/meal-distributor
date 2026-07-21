import { countByOffice, buildVendorMessage, consolidate, pendingMembers } from './consolidation';
import type { Office, OrderEntry } from '@/types';

const offices: Office[] = [
  { id: 'teerth', name: 'Teerth' },
  { id: 'sbc', name: 'SBC' },
];

function entry(uid: string, officeId: string, choice: OrderEntry['choice']): OrderEntry {
  return {
    uid,
    memberName: uid,
    officeId,
    choice,
    locked: false,
    containerReturned: false,
    updatedAt: 0,
  };
}

describe('consolidation', () => {
  test('counts half/full per office, ignores skip', () => {
    const entries = [
      entry('a', 'teerth', 'full'),
      entry('b', 'teerth', 'half'),
      entry('c', 'sbc', 'full'),
      entry('d', 'sbc', 'skip'),
    ];
    const counts = countByOffice(entries, offices);
    expect(counts).toEqual([
      { officeId: 'teerth', officeName: 'Teerth', half: 1, full: 1, total: 2 },
      { officeId: 'sbc', officeName: 'SBC', half: 0, full: 1, total: 1 },
    ]);
  });

  test('vendor message: date header, per-office lines, half default / full marked', () => {
    const summary = consolidate(
      [
        entry('a', 'teerth', 'full'),
        entry('b', 'teerth', 'half'),
        entry('c', 'sbc', 'full'),
      ],
      offices,
      '2026-07-20',
      '20 Jul',
      'Pushkar',
    );
    expect(summary.totalTiffins).toBe(3);
    expect(summary.vendorMessage).toBe(
      '20 Jul\n1 Tiffin Pushkar Teerth, 1 Full Tiffin Pushkar Teerth\n1 Full Tiffin Pushkar SBC',
    );
  });

  test('vendor message pluralizes and omits name when not given', () => {
    const summary = consolidate(
      [entry('a', 'sbc', 'half'), entry('b', 'sbc', 'half'), entry('c', 'teerth', 'half')],
      offices,
      '2026-07-21',
      '21 Jul',
    );
    // offices order is [teerth, sbc]
    expect(summary.vendorMessage).toBe('21 Jul\n1 Tiffin Teerth\n2 Tiffins SBC');
  });

  test('empty order produces a no-order message', () => {
    const summary = consolidate([entry('a', 'sbc', 'skip')], offices, '2026-07-20', '20 Jul');
    expect(summary.totalTiffins).toBe(0);
    expect(buildVendorMessage(summary, '20 Jul')).toBe('20 Jul: No tiffin order today.');
  });

  test('orders for an unknown office are not dropped', () => {
    const counts = countByOffice([entry('x', 'ghost', 'full')], offices);
    const ghost = counts.find((c) => c.officeId === 'ghost');
    expect(ghost?.total).toBe(1);
  });

  test('pendingMembers = members without an entry', () => {
    const entries = [entry('a', 'sbc', 'full')];
    expect(pendingMembers(['a', 'b', 'c'], entries)).toEqual(['b', 'c']);
  });
});
