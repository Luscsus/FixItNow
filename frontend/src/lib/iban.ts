/**
 * IBAN validation — format + ISO 13616 mod-97 checksum.
 * Mirror of the backend `IbanValidator` so we can give immediate UI feedback
 * before the server round-trip.
 */

// Required IBAN length per country code (SEPA zone + commonly-seen others).
const LENGTHS: Record<string, number> = {
  AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22,
  BH: 22, BR: 29, BY: 28, CH: 21, CR: 22, CY: 28, CZ: 24, DE: 22,
  DK: 18, DO: 28, EE: 20, EG: 29, ES: 24, FI: 18, FO: 18, FR: 27,
  GB: 22, GE: 22, GI: 23, GL: 18, GR: 27, GT: 28, HR: 21, HU: 28,
  IE: 22, IL: 23, IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28,
  LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MD: 24, ME: 22, MK: 19,
  MR: 27, MT: 31, MU: 30, NL: 18, NO: 15, PK: 24, PL: 28, PS: 29,
  PT: 25, QA: 29, RO: 24, RS: 22, SA: 24, SE: 24, SI: 19, SK: 24,
  SM: 27, TN: 24, TR: 26, UA: 29, VG: 24, XK: 20,
};

export function normalizeIban(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.replace(/\s+/g, "").toUpperCase();
}

/** Format an IBAN with a space every 4 chars (for display in inputs). */
export function formatIban(raw: string | null | undefined): string {
  const s = normalizeIban(raw);
  return s.replace(/(.{4})/g, "$1 ").trim();
}

export function isValidIban(raw: string | null | undefined): boolean {
  const s = normalizeIban(raw);
  if (s.length < 4) return false;
  if (!/^[A-Z0-9]+$/.test(s)) return false;

  const country = s.slice(0, 2);
  const expected = LENGTHS[country];
  if (!expected || s.length !== expected) return false;

  // Move first 4 chars to the end, convert letters to digits (A=10 … Z=35),
  // then check that the resulting integer ≡ 1 (mod 97).
  const rearranged = s.slice(4) + s.slice(0, 4);
  let numeric = "";
  for (const ch of rearranged) {
    numeric += /[0-9]/.test(ch)
      ? ch
      : (ch.charCodeAt(0) - "A".charCodeAt(0) + 10).toString();
  }

  // BigInt-friendly mod-97 since IBAN numerics easily overflow Number.
  // Process the digits in chunks to avoid creating a huge BigInt for short
  // input — but BigInt() is fine for any IBAN length.
  return BigInt(numeric) % 97n === 1n;
}
