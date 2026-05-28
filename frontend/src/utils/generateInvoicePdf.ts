import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export type InvoiceBankDetails = {
  /** Display name of the account holder (the provider). */
  accountHolder: string;
  /** IBAN, may be formatted with spaces — we normalize internally. */
  iban: string;
  /** Free-text bank name for display. */
  bankName: string;
  /**
   * BIC / SWIFT. Optional — the SEPA EPC QR spec (BCD v002) lets you omit it
   * for transfers within the EEA, and we don't collect it from providers.
   */
  bic?: string;
  /**
   * Recipient street + number (e.g. "Slovenska 1"). Used to populate the UPN
   * QR "Ulica prejemnika" line, which Slovenian bank tariff engines need to
   * classify the counterparty. Omitted from EPC QR (no equivalent field).
   */
  street?: string;
  /**
   * Recipient post code + city (e.g. "2000 Maribor"). Used as UPN QR
   * "Kraj prejemnika".
   */
  city?: string;
};

export type InvoiceData = {
  ticketCode: string;       // e.g. "FIX-0001"
  serviceType: string;
  category: string;
  description: string;
  location: string;
  providerName: string;
  customerName: string;
  amount: number;
  issuedAt?: Date;
  /**
   * Provider's real bank details. When omitted (e.g., a preview before the
   * provider has set them, or legacy data) we fall back to the mock account
   * so the PDF still renders something meaningful.
   */
  bank?: InvoiceBankDetails;
};

// ── Mock bank fallback ────────────────────────────────────────────────────────
// Only used when the caller doesn't pass real bank details (preview / legacy).
const MOCK_BANK: InvoiceBankDetails = {
  accountHolder: 'FixItNow Finance d.o.o.',
  iban:          'SI56 6100 0001 2345 6789',
  bic:           'FXNNSI22',
  bankName:      'Nova Ljubljanska Banka d.d.',
};

function normalizeIban(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}

function formatIban(raw: string): string {
  return normalizeIban(raw).replace(/(.{4})/g, '$1 ').trim();
}

// ── Colour palette ────────────────────────────────────────────────────────────
const NAVY   = [11, 30, 63]    as const;
const AMBER  = [245, 158, 11]  as const;
const SLATE  = [100, 116, 139] as const;
const TEXT   = [15, 23, 42]    as const;
const BORDER = [226, 232, 240] as const;
const BG     = [248, 250, 252] as const;
const GREEN  = [22, 101, 52]   as const;

function fill(doc: jsPDF, c: readonly [number,number,number]) { doc.setFillColor(c[0],c[1],c[2]); }
function draw(doc: jsPDF, c: readonly [number,number,number]) { doc.setDrawColor(c[0],c[1],c[2]); }
function ink (doc: jsPDF, c: readonly [number,number,number]) { doc.setTextColor(c[0],c[1],c[2]); }

// ── Build SEPA EPC QR payload (EPC069-12, BCD v002) ─────────────────────────
//
// The on-wire layout is fixed-position, line-delimited (LF). Every line below
// is mandatory by *position* even when empty:
//
//   1  Service tag           "BCD"           (mandatory)
//   2  Version               "002"           (mandatory)
//   3  Charset               "1" (UTF-8)     (mandatory)
//   4  Identification        "SCT"           (mandatory)
//   5  BIC                                   (optional in v002 for EEA — may be empty)
//   6  Beneficiary name      max 70 chars    (mandatory)
//   7  IBAN                  max 34 chars    (mandatory, no spaces)
//   8  Amount                "EUR" + decimal (optional; 0.01–999999999.99 with dot)
//   9  Purpose               4-letter ISO    (optional; we leave empty)
//  10  Structured ref        ISO 11649 RFxx  (optional; mutually exclusive with #11)
//  11  Unstructured ref      max 140 chars   (optional; we use this)
//  12  B2O info              max 70 chars    (optional; omitted)
//
// Bugs in the previous payload (all rejected by conformant scanners):
//   • "CHAR" on line 9 — that's not a valid ISO 20022 purpose code, it was a
//     confusion with the ChargeBearer field from SEPA payment messages.
//   • ticketCode placed on line 10 (structured) was not in RF-creditor-reference
//     format, and lines 10 and 11 are mutually exclusive.
//   • Non-ASCII chars in the beneficiary name (e.g. "Labaš") fail the SEPA
//     character set check on many bank readers.
function sanitizeForSepa(s: string, max: number): string {
  // Strip diacritics (š → s, č → c, ž → z, etc.), drop anything outside the
  // SEPA basic Latin set, then truncate to the field's max length.
  const stripped = s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9/\-?:().,'+\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.slice(0, max);
}

function sepaPayload(data: InvoiceData, bank: InvoiceBankDetails): string {
  const name = sanitizeForSepa(bank.accountHolder, 70);
  // Combine the ticket code + service type as a single unstructured remittance.
  const remittance = sanitizeForSepa(`${data.ticketCode} ${data.serviceType}`, 140);
  // BCD requires 0.01 ≤ amount ≤ 999999999.99 with a dot decimal separator.
  const amountLine = data.amount > 0 ? `EUR${data.amount.toFixed(2)}` : '';

  return [
    'BCD',                          // 1  Service tag
    '002',                          // 2  Version
    '1',                            // 3  Charset (UTF-8)
    'SCT',                          // 4  Identification
    bank.bic ?? '',                 // 5  BIC (may be empty in v002)
    name,                           // 6  Name (mandatory)
    normalizeIban(bank.iban),       // 7  IBAN (mandatory, no spaces)
    amountLine,                     // 8  Amount
    '',                             // 9  Purpose (empty)
    '',                             // 10 Structured ref (empty; we use unstructured)
    remittance,                     // 11 Unstructured remittance
  ].join('\n');
}

// ── Build UPN QR payload (Slovenian Banks Association standard) ────────────
//
// Slovenian mobile banking apps (NLB Klik, Mobilna banka Go!, A Banka, etc.)
// default to UPN QR for domestic payments and often reject EPC QR. The format
// is 20 lines (LF-separated), with the last line a 3-digit "control sum" that
// equals the byte length of lines 1–19 (content + separators) per the ZBS
// technical standard.
//
// We keep payer fields empty (lines 2–8) — the payer's app fills those in.
// We populate recipient IBAN/name and amount; ticket code + service type go
// into the "namen plačila" field. ASCII only (we sanitize diacritics) so the
// QR encodes losslessly under either UTF-8 or ISO-8859-2.
function upnQrPayload(data: InvoiceData, bank: InvoiceBankDetails): string {
  const recipientName   = sanitizeForSepa(bank.accountHolder, 33);
  const recipientStreet = sanitizeForSepa(bank.street ?? '', 33);
  const recipientCity   = sanitizeForSepa(bank.city ?? '', 33);
  const purpose         = sanitizeForSepa(`${data.ticketCode} ${data.serviceType}`, 42);

  // Recipient reference = `SI99` (model only — non-structured, no free text).
  // NLB tolerates an empty reference; OTP rejects empty with "incorrect
  // recipient reference". `SI99` is the official "no reference" marker per
  // ZBS spec and satisfies OTP's validator without needing free-text content
  // or a mod-11 check digit (the latter would be needed for `SI00`).
  const recipientRef = 'SI99';

  // Amount in cents as an 11-digit zero-padded string ("00000005000" = €50.00).
  const cents = Math.max(0, Math.round(data.amount * 100));
  const amount = String(cents).padStart(11, '0');

  // Lines 1–19. Empty lines for fields we don't populate.
  //
  // Field choices that matter for the bank's tariff engine:
  //   • Koda namena = "SCVE" (Purchase of services). More precise than the
  //     broader GDSV; OTP banka in particular maps SCVE onto its standard
  //     services-payment tariff, whereas GDSV/OTHR can fall back to
  //     "compensation payment → undetermined tariff" on personal accounts.
  //   • Rok plačila = empty. A future due date is interpreted by some apps
  //     as a "scheduled / standing order", which has a different tariff
  //     bracket (often undefined on personal accounts). Leaving it empty
  //     marks the payment as immediate, which is what we actually want.
  //   • Referenca prejemnika = "SI99". NLB tolerates an empty reference, but
  //     OTP banka rejects empty with "incorrect recipient reference". SI99 is
  //     the official "no reference / non-structured" marker per ZBS spec —
  //     no free text needed, no mod-11 check digit (unlike SI00).
  const lines = [
    'UPNQR',                        //  1  Tag
    '',                             //  2  Plačnik IBAN
    '',                             //  3  Polog
    '',                             //  4  Dvig
    '',                             //  5  Plačnik referenca
    '',                             //  6  Plačnik ime
    '',                             //  7  Plačnik ulica
    '',                             //  8  Plačnik kraj
    amount,                         //  9  Znesek (11 digits)
    '',                             // 10  Datum plačila
    '',                             // 11  Nujno (empty = regular priority)
    'SCVE',                         // 12  Koda namena (Purchase of services)
    purpose,                        // 13  Namen plačila (≤42)
    '',                             // 14  Rok plačila (empty = immediate)
    normalizeIban(bank.iban),       // 15  Prejemnik IBAN (no spaces)
    recipientRef,                   // 16  Prejemnik referenca (SI99 + code)
    recipientName,                  // 17  Prejemnik ime
    recipientStreet,                // 18  Prejemnik ulica
    recipientCity,                  // 19  Prejemnik kraj
  ];

  const head = lines.join('\n');
  // Control sum: byte length of everything in lines 1–19 (content + the 18
  // LF separators between them), zero-padded to 3 digits.
  const checksum = String(head.length).padStart(3, '0');
  return `${head}\n${checksum}`;
}

function pickQrPayload(data: InvoiceData, bank: InvoiceBankDetails): string {
  // Slovenian IBANs → UPN QR (what every domestic bank app expects).
  // Everything else → EPC QR (the EU-wide standard).
  const iban = normalizeIban(bank.iban);
  return iban.startsWith('SI') ? upnQrPayload(data, bank) : sepaPayload(data, bank);
}

// ── Main export (async because QRCode.toDataURL is async) ─────────────────────
export async function generateInvoicePdf(data: InvoiceData): Promise<Blob> {
  const doc   = new jsPDF({ unit: 'pt', format: 'a4' });
  const W     = doc.internal.pageSize.getWidth();
  const H     = doc.internal.pageSize.getHeight();
  const mar   = 48;
  const cW    = W - mar * 2;
  const date  = (data.issuedAt ?? new Date()).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const dueDate = new Date((data.issuedAt ?? new Date()).getTime() + 14 * 86_400_000)
    .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Resolve which bank info to render: real (passed by the provider's app)
  // or the mock fallback used for previews / legacy customer downloads.
  const bank: InvoiceBankDetails = data.bank ?? MOCK_BANK;

  // Pre-generate QR code as PNG data-URL
  // Pick the right payment-QR dialect based on the recipient IBAN's country.
  // SI* → UPN QR (Slovenian standard); everything else → EPC QR (EU standard).
  const qrDataUrl = await QRCode.toDataURL(pickQrPayload(data, bank), {
    width: 140, margin: 1, color: { dark: '#0B1E3F', light: '#FFFFFF' },
  });

  // ── Header bar ───────────────────────────────────────────────────────────────
  fill(doc, NAVY);
  doc.rect(0, 0, W, 72, 'F');

  fill(doc, AMBER);
  doc.roundedRect(mar, 20, 32, 32, 4, 4, 'F');
  // Draw a simple wrench-like shape: a small filled circle + rectangle (emoji-free)
  fill(doc, NAVY);
  doc.roundedRect(mar + 7, 28, 18, 6, 2, 2, 'F');
  doc.circle(mar + 10, 38, 4, 'F');

  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); ink(doc, [255,255,255]);
  doc.text('FixIt', mar + 40, 41);
  ink(doc, AMBER);
  doc.text('Now', mar + 40 + doc.getTextWidth('FixIt'), 41);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); ink(doc, [255,255,255]);
  doc.setCharSpace(2);
  doc.text('INVOICE', W - mar, 41, { align: 'right' });
  doc.setCharSpace(0);

  // ── Invoice # + date ─────────────────────────────────────────────────────────
  let y = 104;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); ink(doc, TEXT);
  doc.text(data.ticketCode, mar, y);

  const dateBlockX = W - mar - 150;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); ink(doc, SLATE);
  doc.text('Issued:', dateBlockX, y - 14);
  doc.text('Due:',    dateBlockX, y + 4);
  doc.setFont('helvetica', 'bold'); ink(doc, TEXT);
  doc.text(date,    W - mar, y - 14, { align: 'right' });
  doc.text(dueDate, W - mar, y + 4,  { align: 'right' });

  y += 16;
  draw(doc, BORDER); doc.setLineWidth(0.5);
  doc.line(mar, y, W - mar, y);

  // ── From / To cards ──────────────────────────────────────────────────────────
  y += 24;
  const colW = cW / 2 - 12;

  function infoCard(x: number, label: string, name: string, sub: string) {
    fill(doc, BG); draw(doc, BORDER); doc.setLineWidth(0.5);
    doc.roundedRect(x, y, colW, 68, 4, 4, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); ink(doc, SLATE);
    doc.setCharSpace(1.5); doc.text(label, x + 14, y + 18); doc.setCharSpace(0);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); ink(doc, TEXT);
    doc.text(name, x + 14, y + 36);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); ink(doc, SLATE);
    doc.text(sub, x + 14, y + 52);
  }

  infoCard(mar,            'FROM', data.providerName, 'Service Provider');
  infoCard(mar + colW + 24, 'TO',   data.customerName,  'Customer');

  // ── Service table ─────────────────────────────────────────────────────────────
  y += 92;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); ink(doc, SLATE);
  doc.setCharSpace(1.5); doc.text('SERVICE DETAILS', mar, y); doc.setCharSpace(0);

  y += 10; draw(doc, BORDER); doc.line(mar, y, W - mar, y);

  y += 6;
  fill(doc, BG); doc.rect(mar, y, cW, 26, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); ink(doc, SLATE);
  doc.text('DESCRIPTION', mar + 12, y + 17);
  doc.text('CATEGORY',    mar + cW * 0.55, y + 17);
  doc.text('AMOUNT',      W - mar - 12, y + 17, { align: 'right' });

  y += 26; draw(doc, BORDER); doc.line(mar, y, W - mar, y);

  y += 6;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); ink(doc, TEXT);
  doc.text(data.serviceType, mar + 12, y + 18);
  if (data.location) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); ink(doc, SLATE);
    doc.text(`${data.location}`, mar + 12, y + 32);
  }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); ink(doc, TEXT);
  doc.text(data.category.replace(/_/g, ' '), mar + cW * 0.55, y + 18);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); ink(doc, NAVY);
  doc.text(`$${data.amount.toFixed(2)}`, W - mar - 12, y + 18, { align: 'right' });

  y += 52; draw(doc, BORDER); doc.line(mar, y, W - mar, y);

  if (data.description) {
    y += 16;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); ink(doc, SLATE);
    doc.setCharSpace(1.5); doc.text('WORK DESCRIPTION', mar, y); doc.setCharSpace(0);
    y += 12;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); ink(doc, TEXT);
    const lines = doc.splitTextToSize(data.description, cW) as string[];
    doc.text(lines, mar, y);
    y += lines.length * 14 + 8;
  }

  // ── Total ─────────────────────────────────────────────────────────────────────
  y += 20;
  fill(doc, NAVY); doc.roundedRect(mar, y, cW, 52, 6, 6, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); ink(doc, [255,255,255]);
  doc.text('Total Due', mar + 20, y + 32);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); ink(doc, AMBER);
  doc.text(`$${data.amount.toFixed(2)}`, W - mar - 20, y + 34, { align: 'right' });
  y += 68;

  // ── Payment details + QR ─────────────────────────────────────────────────────
  y += 8;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); ink(doc, SLATE);
  doc.setCharSpace(1.5); doc.text('PAYMENT DETAILS', mar, y); doc.setCharSpace(0);
  y += 10; draw(doc, BORDER); doc.line(mar, y, W - mar, y);
  y += 16;

  // Payment info box (left side)
  const payBoxW = cW - 148;
  fill(doc, BG); draw(doc, BORDER); doc.setLineWidth(0.5);
  doc.roundedRect(mar, y, payBoxW, 148, 4, 4, 'FD');

  // BIC is rendered only when set — we no longer require providers to enter it.
  const rows: [string, string][] = [
    ['Bank',      bank.bankName],
    ['Account',   bank.accountHolder],
    ['IBAN',      formatIban(bank.iban)],
    ...(bank.bic ? ([['BIC/SWIFT', bank.bic]] as [string, string][]) : []),
    ['Reference', data.ticketCode],
    ['Amount',    `€ ${data.amount.toFixed(2)}`],
    ['Due date',  dueDate],
  ];

  let rowY = y + 18;
  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); ink(doc, SLATE);
    doc.text(label, mar + 14, rowY);
    doc.setFont('helvetica', label === 'IBAN' || label === 'Amount' ? 'bold' : 'normal');
    doc.setFontSize(9);
    ink(doc, label === 'Amount' ? NAVY : TEXT);
    doc.text(value, mar + 14 + 68, rowY);
    rowY += 18;
  }

  // QR code box (right side)
  const qrX = mar + payBoxW + 12;
  const qrBoxW = 136;
  fill(doc, [255,255,255]); draw(doc, BORDER);
  doc.roundedRect(qrX, y, qrBoxW, 148, 4, 4, 'FD');

  doc.addImage(qrDataUrl, 'PNG', qrX + 8, y + 8, 120, 120);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); ink(doc, SLATE);
  doc.setCharSpace(0.8);
  doc.text('SCAN TO PAY', qrX + qrBoxW / 2, y + 138, { align: 'center' });
  doc.setCharSpace(0);

  // Caption matches the actual QR dialect we chose above.
  const qrCaption = normalizeIban(bank.iban).startsWith('SI')
    ? 'UPN QR · Slovenian payment'
    : 'EPC SEPA Credit Transfer';
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); ink(doc, SLATE);
  doc.text(qrCaption, qrX + qrBoxW / 2, y + 148, { align: 'center' });

  // ── Paid stamp (green) — only if context says completed ───────────────────────
  // (left here as reference — callers can pass isPaid if needed)

  // ── Footer ────────────────────────────────────────────────────────────────────
  draw(doc, BORDER); doc.setLineWidth(0.5);
  doc.line(mar, H - 48, W - mar, H - 48);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); ink(doc, SLATE);
  doc.text('Thank you for using FixItNow — your trusted maintenance marketplace.', W / 2, H - 32, { align: 'center' });
  doc.text(`Generated on ${date}  ·  ${data.ticketCode}`, W / 2, H - 18, { align: 'center' });

  return doc.output('blob');
}
