// Builds WhatsApp deep links. The app never sends anything automatically; it
// only opens WhatsApp with the message pre-filled so the coordinator taps send.

import type { MemberBalance } from '@/types';
import { formatMoney } from './money';

/** Keep only digits; strip spaces, +, dashes, parentheses. */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

/**
 * wa.me link. When a phone is supplied it opens that chat; otherwise WhatsApp
 * opens the share sheet so the coordinator picks the vendor.
 */
export function buildWhatsAppUrl(message: string, phone?: string): string {
  const text = encodeURIComponent(message);
  const digits = phone ? normalizePhone(phone) : '';
  return digits
    ? `https://wa.me/${digits}?text=${text}`
    : `https://wa.me/?text=${text}`;
}

/** A friendly per-member bill message. */
export function buildBillMessage(
  balance: MemberBalance,
  currency: string,
  opts: { periodLabel?: string; upiId?: string } = {},
): string {
  const lines: string[] = [];
  const period = opts.periodLabel ? ` (${opts.periodLabel})` : '';
  lines.push(`Hi ${balance.memberName}, your tiffin balance${period}:`);
  lines.push(`Charged: ${formatMoney(balance.totalCharged, currency)}`);
  lines.push(`Paid: ${formatMoney(balance.totalPaid, currency)}`);
  if (balance.balance > 0) {
    lines.push(`Due: ${formatMoney(balance.balance, currency)}`);
  } else if (balance.balance < 0) {
    lines.push(`Advance/credit: ${formatMoney(-balance.balance, currency)}`);
  } else {
    lines.push('All settled. Thank you!');
  }
  if (opts.upiId && balance.balance > 0) {
    lines.push(`Pay via UPI: ${opts.upiId}`);
  }
  return lines.join('\n');
}
