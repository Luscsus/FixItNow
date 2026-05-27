import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export type InvoiceBankDetails = {
  /** Display name of the account holder (the provider). */
  accountHolder: string;
  /** IBAN, may be formatted with spaces — we normalize internally. */
  iban: string;
  /** BIC / SWIFT (uppercase). */
  bic: string;
  /** Free-text bank name for display. */
  bankName: string;
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

// ── Build SEPA EPC QR payload ─────────────────────────────────────────────────
function sepaPayload(data: InvoiceData, bank: InvoiceBankDetails): string {
  return [
    'BCD',
    '002',
    '1',
    'SCT',
    bank.bic,
    bank.accountHolder,
    normalizeIban(bank.iban),
    `EUR${data.amount.toFixed(2)}`,
    'CHAR',
    data.ticketCode,
    data.serviceType,
  ].join('\n');
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
  const qrDataUrl = await QRCode.toDataURL(sepaPayload(data, bank), {
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

  const rows: [string, string][] = [
    ['Bank',      bank.bankName],
    ['Account',   bank.accountHolder],
    ['IBAN',      formatIban(bank.iban)],
    ['BIC/SWIFT', bank.bic],
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

  // SEPA label
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); ink(doc, SLATE);
  doc.text('EPC SEPA Credit Transfer', qrX + qrBoxW / 2, y + 148, { align: 'center' });

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
