/**
 * Generates a Brazilian Pix BR Code ("Copia e Cola" + QR data) per the
 * Banco Central spec (Manual de Padrões para Iniciação do Pix, EMVCo TLV).
 *
 * Pure function — no API call to any bank. The customer scans the QR or
 * pastes the string into their bank app; their bank settles the transfer
 * to whichever institution owns the Pix key.
 *
 * Limitations:
 *  - This produces a *static* charge (`pix estático`): no automatic
 *    reconciliation. We learn the payment happened only by polling the
 *    bank statement (open banking API) or by the merchant looking at it.
 *  - For *dynamic* charges with webhook confirmation use a PSP (Efí,
 *    Mercado Pago, etc.) — covered in plano_producao.md.
 *
 * Reference: https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf
 */

export interface PixCharge {
  /** Pix key (CPF, CNPJ, email, telefone +55..., or random UUID). */
  pixKey: string;
  /** Merchant short name, max 25 ASCII chars. */
  merchantName: string;
  /** Merchant city, max 15 ASCII chars. */
  merchantCity: string;
  /** Amount in BRL, two decimals (e.g. 39.99). Optional → user fills in. */
  amount?: number;
  /** Free-form description shown to the payer (max 25 chars after sanitize). */
  description?: string;
  /** Transaction ID for our reconciliation, 1-25 alphanumeric. */
  txId: string;
}

const PAYLOAD_FORMAT = '01';
const MCC_DEFAULT = '0000';
const CURRENCY_BRL = '986';
const COUNTRY_BR = 'BR';
const GUI_PIX = 'BR.GOV.BCB.PIX';

// Strip diacritics + restrict to ASCII allowed by EMVCo TLV.
function sanitize(value: string, max: number): string {
  const ascii = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 .,\-+\/()]/g, '')
    .trim();
  return ascii.slice(0, max);
}

// EMV TLV field: 2-digit id + 2-digit length + value
function tlv(id: string, value: string): string {
  if (id.length !== 2) throw new Error('id must be 2 chars');
  const len = value.length.toString().padStart(2, '0');
  if (value.length > 99) throw new Error(`value too long for TLV id ${id}`);
  return id + len + value;
}

// CRC16/CCITT-FALSE — polynomial 0x1021, init 0xFFFF, MSB first.
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function buildPixBrCode(charge: PixCharge): string {
  if (!charge.pixKey) throw new Error('pixKey required');
  if (!charge.merchantName) throw new Error('merchantName required');
  if (!charge.merchantCity) throw new Error('merchantCity required');
  if (!charge.txId || charge.txId.length > 25) throw new Error('txId 1-25 chars required');

  const safeKey = charge.pixKey.replace(/\D/g, charge.pixKey.includes('@') ? '' : '');
  // For CPF, leave only digits; for email/phone/uuid pass through.
  const isCpfOrCnpj = /^\d+$/.test(charge.pixKey.replace(/\D/g, '')) && charge.pixKey.replace(/\D/g, '').length <= 14;
  const normalizedKey = isCpfOrCnpj ? charge.pixKey.replace(/\D/g, '') : charge.pixKey;

  // Composite Merchant Account Information (id 26)
  const subKey = tlv('00', GUI_PIX) + tlv('01', normalizedKey);
  const mai = tlv('26', subKey);

  const merchantName = sanitize(charge.merchantName, 25) || 'KEYFORGE';
  const merchantCity = sanitize(charge.merchantCity, 15) || 'CUIABA';
  const description = charge.description ? sanitize(charge.description, 25) : '';

  // Additional data — txId is mandatory inside 62 → 05
  const additional = tlv('05', sanitize(charge.txId, 25))
    + (description ? tlv('02', description) : '');

  const fields = [
    tlv('00', PAYLOAD_FORMAT),
    mai,
    tlv('52', MCC_DEFAULT),
    tlv('53', CURRENCY_BRL),
    charge.amount != null && charge.amount > 0
      ? tlv('54', charge.amount.toFixed(2))
      : '',
    tlv('58', COUNTRY_BR),
    tlv('59', merchantName),
    tlv('60', merchantCity),
    tlv('62', additional),
  ].join('');

  // CRC placeholder included, then computed
  const payloadWithoutCrc = fields + '6304';
  const crc = crc16(payloadWithoutCrc);
  return payloadWithoutCrc + crc;
}
