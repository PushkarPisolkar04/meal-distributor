import { parseVersion, compareVersions, isNewerVersion } from './version';

describe('version compare', () => {
  test('parseVersion handles junk', () => {
    expect(parseVersion('1.2.3')).toEqual([1, 2, 3]);
    expect(parseVersion('1.0')).toEqual([1, 0]);
    expect(parseVersion('')).toEqual([0]);
  });

  test('compareVersions', () => {
    expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
    expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
    expect(compareVersions('1.2.0', '1.2.0')).toBe(0);
    expect(compareVersions('1.10.0', '1.9.0')).toBe(1); // numeric, not lexical
    expect(compareVersions('2.0', '1.9.9')).toBe(1);
  });

  test('isNewerVersion', () => {
    expect(isNewerVersion('1.0.1', '1.0.0')).toBe(true);
    expect(isNewerVersion('1.0.0', '1.0.0')).toBe(false);
    expect(isNewerVersion('1.0.0', '1.0.1')).toBe(false);
  });
});
