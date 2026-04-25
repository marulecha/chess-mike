import { describe, it, expect, vi } from 'vitest';
import { generateCode, normalizeCode, isValidCode, ALPHABET, CODE_LEN } from './code';

describe('code', () => {
  it('ALPHABET has no confusable characters', () => {
    expect(ALPHABET).not.toMatch(/[01OIL]/);
    expect(ALPHABET.length).toBeGreaterThan(20);
  });

  it('CODE_LEN is 6', () => {
    expect(CODE_LEN).toBe(6);
  });

  it('generateCode returns CODE_LEN chars from ALPHABET', () => {
    const code = generateCode();
    expect(code).toHaveLength(CODE_LEN);
    for (const c of code) expect(ALPHABET).toContain(c);
  });

  it('generateCode produces different codes (overwhelmingly)', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateCode()));
    expect(codes.size).toBeGreaterThan(40);
  });

  it('normalizeCode upper-cases and strips dashes/whitespace', () => {
    expect(normalizeCode(' k7-mp3x ')).toBe('K7MP3X');
    expect(normalizeCode('K7MP3X')).toBe('K7MP3X');
  });

  it('isValidCode accepts valid codes', () => {
    expect(isValidCode('K7MP3X')).toBe(true);
    expect(isValidCode(generateCode())).toBe(true);
  });

  it('isValidCode rejects bad inputs', () => {
    expect(isValidCode('K7MP3')).toBe(false);     // too short
    expect(isValidCode('K7MP3XX')).toBe(false);   // too long
    expect(isValidCode('K7MP3O')).toBe(false);    // contains O (not in alphabet)
    expect(isValidCode('K7MP31')).toBe(false);    // contains 1
    expect(isValidCode('K7MP3a')).toBe(false);    // lowercase
  });

  it('generateCode uses crypto.getRandomValues when available', () => {
    const spy = vi.spyOn(globalThis.crypto, 'getRandomValues');
    generateCode();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
