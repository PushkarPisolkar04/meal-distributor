// Money formatting + UPI helpers. Amounts are plain numbers (rupees).

/** Format an amount with a currency label, no trailing .00 for whole numbers. */
export function formatMoney(amount: number, currency: string = 'Rs'): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const isWhole = Math.abs(rounded % 1) < 0.005;
  const text = isWhole ? String(Math.round(rounded)) : rounded.toFixed(2);
  return `${currency} ${text}`.trim();
}

/**
 * Build a UPI payment intent URI (upi://pay). This is the standard Android/iOS
 * scheme all UPI apps understand, and is used both for the "Pay" button and to
 * generate the QR code. Entirely free — no payment gateway.
 */
export function buildUpiUri(params: {
  payeeVpa: string;
  payeeName: string;
  amount?: number;
  note?: string;
}): string {
  const q = new URLSearchParams();
  q.set('pa', params.payeeVpa);
  q.set('pn', params.payeeName);
  q.set('cu', 'INR');
  if (params.amount && params.amount > 0) q.set('am', params.amount.toFixed(2));
  if (params.note) q.set('tn', params.note);
  return `upi://pay?${q.toString()}`;
}
