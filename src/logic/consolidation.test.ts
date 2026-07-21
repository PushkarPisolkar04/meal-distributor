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

  test('vendor message matches the example format', () => {
    const summary = consolidate(
      [
        entry('a', 'teerth', 'full'),
        entry('b', 'teerth', 'half'),
        entry('c', 'sbc', 'full'),
      ],
      offices,
      '2026-07-20',
      '20 Jul',
    );
    expect(summary.totalTiffins).toBe(3);
    expect(summary.totalFull).toBe(2);
    expect(summary.totalHalf).toBe(1);
    expect(summary.vendorMessage).toBe(
      'Tiffin order 20 Jul: Teerth 2 (1F, 1H), SBC 1 (1F). Total 3.',
    );
  });

  test('empty order produces a no-order message', () => {
    const summary = consolidate([entry('a', 'sbc', 'skip')], offices, '2026-07-20', '20 Jul');
    expect(summary.totalTiffins).toBe(0);
    expect(buildVendorMessage(summary, '20 Jul')).toBe('No tiffin order for 20 Jul today.');
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
