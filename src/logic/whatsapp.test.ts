import { normalizePhone, buildWhatsAppUrl, buildBillMessage } from './whatsapp';
import type { MemberBalance } from '@/types';

describe('whatsapp', () => {
  test('normalizePhone strips non-digits', () => {
    expect(normalizePhone('+91 98765-43210')).toBe('919876543210');
  });

  test('buildWhatsAppUrl with and without phone', () => {
    expect(buildWhatsAppUrl('Hi', '+91 98765 43210')).toBe(
      'https://wa.me/919876543210?text=Hi',
    );
    expect(buildWhatsAppUrl('Hi there')).toBe('https://wa.me/?text=Hi%20there');
  });

  test('bill message for a due balance includes UPI', () => {
    const bal: MemberBalance = {
      uid: 'a', memberName: 'Amit', totalCharged: 245, totalPaid: 90, balance: 155, status: 'due',
    };
    const msg = buildBillMessage(bal, 'Rs', { periodLabel: 'Wk 20 Jul', upiId: 'me@upi' });
    expect(msg).toContain('Amit');
    expect(msg).toContain('Due: Rs 155');
    expect(msg).toContain('Pay via UPI: me@upi');
  });

  test('bill message for settled balance', () => {
    const bal: MemberBalance = {
      uid: 'a', memberName: 'Amit', totalCharged: 90, totalPaid: 90, balance: 0, status: 'settled',
    };
    expect(buildBillMessage(bal, 'Rs')).toContain('All settled');
  });
});
