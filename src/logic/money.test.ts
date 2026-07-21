import { formatMoney, buildUpiUri } from './money';

describe('money', () => {
  test('formatMoney trims .00 for whole numbers', () => {
    expect(formatMoney(90)).toBe('Rs 90');
    expect(formatMoney(90.5)).toBe('Rs 90.50');
    expect(formatMoney(155, 'Rs')).toBe('Rs 155');
    expect(formatMoney(21.666)).toBe('Rs 21.67');
  });

  test('buildUpiUri encodes payee, amount, note', () => {
    const uri = buildUpiUri({ payeeVpa: 'me@upi', payeeName: 'Pushkar', amount: 155, note: 'Tiffin week' });
    expect(uri.startsWith('upi://pay?')).toBe(true);
    expect(uri).toContain('pa=me%40upi');
    expect(uri).toContain('pn=Pushkar');
    expect(uri).toContain('am=155.00');
    expect(uri).toContain('cu=INR');
    expect(uri).toContain('tn=Tiffin+week');
  });

  test('buildUpiUri omits amount when not positive', () => {
    const uri = buildUpiUri({ payeeVpa: 'me@upi', payeeName: 'Pushkar' });
    expect(uri).not.toContain('am=');
  });
});
