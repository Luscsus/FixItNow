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

// ── Slovenian bank register: account-prefix → { bank name, BIC } ──────────────
// A Slovenian IBAN is `SI` + 2 check digits + a 15-digit BBAN whose first five
// digits identify the bank/branch. The bank itself is the leading two digits
// (plus a few 5-digit prefixes reserved for e-money providers). Source: Bank of
// Slovenia identification-code register / UPN BIC list (current as of 2026).
type BankInfo = { bankName: string; bic: string };

const SI_BANKS_2: Record<string, BankInfo> = {
  "02": { bankName: "Nova Ljubljanska banka d.d.", bic: "LJBASI2X" },
  "03": { bankName: "OTP banka d.d.", bic: "KBMASI2X" },
  "04": { bankName: "OTP banka d.d.", bic: "KBMASI2X" },
  "05": { bankName: "OTP banka d.d.", bic: "KBMASI2X" },
  "07": { bankName: "Gorenjska banka d.d.", bic: "GORESI2X" },
  "10": { bankName: "Banka Intesa Sanpaolo d.d.", bic: "BAKOSI2X" },
  "19": { bankName: "Deželna banka Slovenije d.d.", bic: "SZKBSI2X" },
  "29": { bankName: "UniCredit Banka Slovenije d.d.", bic: "BACXSI22" },
  "30": { bankName: "Nova Ljubljanska banka d.d.", bic: "LJBASI2X" },
  "33": { bankName: "Addiko Bank d.d.", bic: "HAABSI22" },
  "34": { bankName: "Banka Sparkasse d.d.", bic: "KSPKSI22" },
  "35": { bankName: "BKS Bank AG", bic: "BFKKSI22" },
  "38": { bankName: "SID banka d.d.", bic: "SIDRSI22" },
  "60": { bankName: "Hranilnica LON d.d.", bic: "HLONSI22" },
  "61": { bankName: "Delavska hranilnica d.d.", bic: "HDELSI22" },
  "64": { bankName: "Primorska hranilnica Vipava d.d.", bic: "HKVISI22" },
};

const SI_BANKS_5: Record<string, BankInfo> = {
  "91002": { bankName: "PayWiser d.o.o.", bic: "PWSRSI22" },
};

/**
 * Derives the bank name and BIC from an IBAN, for Slovenian (SI) accounts only.
 * Returns null for non-SI IBANs, too-short input, or an unrecognized bank code
 * (so the caller can leave the fields for manual entry).
 */
export function bankFromIban(raw: string | null | undefined): { bankName: string; bic: string } | null {
  const s = normalizeIban(raw);
  if (!s.startsWith("SI") || s.length < 9) return null;
  const five = s.slice(4, 9);
  if (SI_BANKS_5[five]) return SI_BANKS_5[five];
  const two = s.slice(4, 6);
  return SI_BANKS_2[two] ?? null;
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
