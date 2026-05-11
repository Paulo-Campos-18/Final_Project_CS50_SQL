/**
 * Gerador de PIX "Copia e Cola" (BR Code) no padrão EMVCo / BCB.
 * Tudo client-safe: apenas concatena TLVs + CRC16/CCITT-FALSE.
 *
 * Limitação importante: o BRCode é só o "convite" pra pagar. A confirmação
 * automática do recebimento exige integração com PSP (Mercado Pago / Efí /
 * Open Banking). Sem PSP, conferência é manual (extrato bancário).
 *
 * Referência: Manual BR Code v2.4 do Banco Central.
 */

export interface PixPayload {
  /** Chave PIX do recebedor (CPF/CNPJ só dígitos, email, telefone +55..., ou chave aleatória) */
  pixKey: string;
  /** Valor em reais, ex 29.99. Se omitido o pagador digita o valor (estático). */
  amount?: number;
  /** Identificador interno da transação, max 25 alfanuméricos (sem espaço/acento) */
  txid: string;
  /** Nome do recebedor, max 25 chars */
  merchantName: string;
  /** Cidade do recebedor, max 15 chars sem acento */
  merchantCity: string;
  /** Descrição opcional, max 50 chars (mostra no app do pagador) */
  description?: string;
}

const tlv = (tag: string, value: string) => {
  const len = value.length.toString().padStart(2, '0');
  return tag + len + value;
};

/** CRC16/CCITT-FALSE, polinômio 0x1021, init 0xFFFF — exigido pelo BCB. */
function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

const sanitize = (s: string, max: number) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-zA-Z0-9 .,/_-]/g, '')
    .slice(0, max)
    .trim();

const sanitizeTxid = (s: string) =>
  s.replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || 'KEYFORGE';

/**
 * Builds the Pix "Copia e Cola" string. Render it as a QR code on the
 * client (qrcode.react / Google chart / any QR library) — same value.
 */
export function buildPixBRCode(p: PixPayload): { brcode: string; txid: string } {
  const txid = sanitizeTxid(p.txid);
  const name = sanitize(p.merchantName, 25) || 'KEYFORGE';
  const city = sanitize(p.merchantCity, 15) || 'SAO PAULO';

  // 26 — Merchant Account Information (PIX)
  const merchantAccount =
    tlv('00', 'br.gov.bcb.pix') +
    tlv('01', p.pixKey) +
    (p.description ? tlv('02', sanitize(p.description, 50)) : '');

  // 62 — Additional Data Field Template
  const additional = tlv('05', txid);

  let payload =
    tlv('00', '01') +           // payload format
    tlv('01', '12') +           // point of initiation: 12 = dynamic (single use), 11 = static
    tlv('26', merchantAccount) +
    tlv('52', '0000') +         // MCC
    tlv('53', '986') +          // currency BRL
    (p.amount != null ? tlv('54', p.amount.toFixed(2)) : '') +
    tlv('58', 'BR') +
    tlv('59', name) +
    tlv('60', city) +
    tlv('62', additional);

  // CRC is computed over everything PLUS the literal '6304' suffix
  const toHash = payload + '6304';
  const crc = crc16(toHash);
  const brcode = payload + '6304' + crc;
  return { brcode, txid };
}

/**
 * Validador básico — só pra catch typos óbvios na chave do admin.
 * Não substitui validação no DICT/BCB.
 */
export function detectPixKeyType(k: string):
  | 'cpf'
  | 'cnpj'
  | 'email'
  | 'phone'
  | 'random'
  | 'unknown' {
  const onlyDigits = k.replace(/\D/g, '');
  if (/^\d{11}$/.test(onlyDigits) && onlyDigits === k.replace(/[.\-]/g, '')) return 'cpf';
  if (/^\d{14}$/.test(onlyDigits)) return 'cnpj';
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(k)) return 'email';
  if (/^\+55\d{10,11}$/.test(k)) return 'phone';
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(k)) return 'random';
  return 'unknown';
}
