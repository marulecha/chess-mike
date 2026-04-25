export const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const CODE_LEN = 6;

export function generateCode(): string {
  const buf = new Uint32Array(CODE_LEN);
  crypto.getRandomValues(buf);
  let out = '';
  for (let i = 0; i < CODE_LEN; i++) {
    out += ALPHABET[buf[i] % ALPHABET.length];
  }
  return out;
}

export function normalizeCode(input: string): string {
  return input.replace(/[-\s]/g, '').toUpperCase();
}

export function isValidCode(s: string): boolean {
  if (s.length !== CODE_LEN) return false;
  for (const c of s) if (!ALPHABET.includes(c)) return false;
  return true;
}

export function formatCode(code: string): string {
  if (code.length !== CODE_LEN) return code;
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}
