import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import QRCode from 'qrcode';
import { buildPixBrCode } from '@/infra/payments/pixBrCode';
import { rateLimit } from '@/infra/security/rateLimit';

// When STORE_PIX_KEY is set in the environment, all charges go to that key
// and any client-supplied pixKey is ignored. This prevents a malicious caller
// from generating BR Codes that redirect payments to their own bank account.
const STORE_PIX_KEY = process.env.STORE_PIX_KEY?.trim() || '';
const STORE_PIX_NAME = process.env.STORE_PIX_NAME?.trim() || 'KEYFORGE';
const STORE_PIX_CITY = process.env.STORE_PIX_CITY?.trim() || 'CUIABA';

const chargeSchema = z.object({
  // pixKey only honoured in dev when STORE_PIX_KEY is unset. Optional.
  pixKey: z.string().min(11).max(80).optional(),
  amount: z.number().positive().max(50_000),
  txId: z.string().min(1).max(25).regex(/^[A-Za-z0-9]+$/, 'txId só aceita alfanumérico'),
  description: z.string().max(25).optional(),
  merchantName: z.string().max(25).optional(),
  merchantCity: z.string().max(15).optional(),
});

/**
 * Generates a static Pix BR Code (Copia e Cola + QR PNG dataURL) for the
 * given key + amount. Pure code generation — no PSP API call.
 *
 * Use this for the MVP: customer pays from their bank app; admin reconciles
 * by checking statement. For automatic reconciliation, swap for a PSP
 * (Efí, Mercado Pago — see plano_producao.md).
 */
/**
 * GET: lets the admin UI know whether the merchant key is locked in env
 * (production posture) or still has to be supplied by the form (dev/POC).
 */
export async function GET() {
  return NextResponse.json({
    keyLocked: !!STORE_PIX_KEY,
    merchantName: STORE_PIX_NAME,
    merchantCity: STORE_PIX_CITY,
    // Mask the key — never echo the full CPF/CNPJ.
    maskedKey: STORE_PIX_KEY
      ? STORE_PIX_KEY.replace(/\d/g, (d, i) => (i < 3 || i >= STORE_PIX_KEY.length - 2 ? d : '•'))
      : null,
  });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = rateLimit('pix-charge:' + ip, { max: 20, windowMs: 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Muitas cobranças geradas. Tente em ${rl.retryInSeconds}s.` },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const parsed = chargeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 },
      );
    }
    const { pixKey: clientKey, amount, txId, description, merchantName, merchantCity } = parsed.data;

    // Resolve the merchant key: env wins, client only allowed when STORE_PIX_KEY is empty.
    const pixKey = STORE_PIX_KEY || clientKey;
    if (!pixKey) {
      return NextResponse.json(
        { error: 'PIX key não configurada. Defina STORE_PIX_KEY no .env.local.' },
        { status: 500 },
      );
    }

    const copyPaste = buildPixBrCode({
      pixKey,
      amount,
      txId,
      description,
      merchantName: STORE_PIX_KEY ? STORE_PIX_NAME : (merchantName || 'KEYFORGE'),
      merchantCity: STORE_PIX_KEY ? STORE_PIX_CITY : (merchantCity || 'CUIABA'),
    });

    const qrDataUrl = await QRCode.toDataURL(copyPaste, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 320,
      color: { dark: '#000000', light: '#FFFFFF' },
    });

    return NextResponse.json({
      copyPaste,
      qrDataUrl,
      amount,
      txId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      reconciliation: 'manual',
    });
  } catch (err) {
    console.error('PIX charge error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
