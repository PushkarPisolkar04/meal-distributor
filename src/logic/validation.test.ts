import {
  isValidEmail,
  isValidPassword,
  isValidHHmm,
  isValidAmount,
  isValidPrice,
  isValidJoinCode,
  generateJoinCode,
  isValidUpiId,
  sanitizeName,
  isNonEmptyName,
} from './validation';

describe('validation', () => {
  test('email', () => {
    expect(isValidEmail('a@b.com')).toBe(true);
    expect(isValidEmail('bad')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
  });

  test('password min length', () => {
    expect(isValidPassword('123456')).toBe(true);
    expect(isValidPassword('123')).toBe(false);
  });

  test('HH:mm', () => {
    expect(isValidHHmm('11:30')).toBe(true);
    expect(isValidHHmm('24:00')).toBe(false);
  });

  test('amount and price', () => {
    expect(isValidAmount(0)).toBe(true);
    expect(isValidAmount(90.5)).toBe(true);
    expect(isValidAmount(90.555)).toBe(false);
    expect(isValidAmount(-5)).toBe(false);
    expect(isValidPrice(0)).toBe(false);
    expect(isValidPrice(65)).toBe(true);
  });

  test('join code validity and generation', () => {
    expect(isValidJoinCode('ABC234')).toBe(true);
    expect(isValidJoinCode('abc')).toBe(false);
    // deterministic generator via fixed rand
    let i = 0;
    const seq = [0, 0.1, 0.2, 0.3, 0.4, 0.5];
    const code = generateJoinCode(() => seq[i++ % seq.length]!);
    expect(code).toHaveLength(6);
    expect(isValidJoinCode(code)).toBe(true);
  });

  test('upi id', () => {
    expect(isValidUpiId('name@okhdfc')).toBe(true);
    expect(isValidUpiId('bad')).toBe(false);
  });

  test('sanitizeName + isNonEmptyName', () => {
    expect(sanitizeName('  Amit   Kumar ')).toBe('Amit Kumar');
    expect(sanitizeName('x'.repeat(100)).length).toBe(40);
    expect(isNonEmptyName('A')).toBe(false);
    expect(isNonEmptyName('Amit')).toBe(true);
  });
});
