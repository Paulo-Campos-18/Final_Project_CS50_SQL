import QRCode from 'qrcode';
import { buildPixBRCode, detectPixKeyType } from '@/infra/payments/pixBRCode';
import PixCopyButton from './PixCopyButton';

interface SearchParams {
  amount?: string;
  key?: string;
  name?: string;
  city?: string;
  desc?: string;
}

export default async function PixDemoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // Defaults focados em demonstração — em produção isso vem do admin settings + da order
  const pixKey = params.key || '12345678909'; // CPF dummy
  const amount = Math.max(0.01, Math.min(99999.99, Number(params.amount) || 29.99));
  const merchantName = params.name || 'KEYFORGE LTDA';
  const merchantCity = params.city || 'CUIABA';
  const description = params.desc || 'Chave Digital KEYFORGE';
  const orderRef = 'KF' + Date.now().toString(36).toUpperCase();

  const keyType = detectPixKeyType(pixKey);
  const { brcode, txid } = buildPixBRCode({
    pixKey,
    amount,
    txid: orderRef,
    merchantName,
    merchantCity,
    description,
  });

  // SVG QR string — renderizamos como dangerouslySet, é só shapes, sem JS.
  const qrSvg = await QRCode.toString(brcode, {
    type: 'svg',
    margin: 1,
    width: 280,
    color: { dark: '#0f1517', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });

  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <main style={{ minHeight: 'calc(100vh - var(--nav-height))' }}>
      <section className="section" style={{ paddingTop: 56 }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-color)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                letterSpacing: '0.22em',
                color: 'var(--accent-primary)',
                marginBottom: '14px',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)' }} />
              PIX · DEMO
            </div>
            <h1 className="section-title" style={{ fontFamily: 'var(--font-display)', marginBottom: 6 }}>
              Pague com PIX
            </h1>
            <p className="section-subtitle">
              Aponte a câmera do seu banco ou copie o código abaixo.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '320px 1fr',
              gap: 24,
              padding: 24,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'white',
                padding: 12,
                borderRadius: 'var(--radius-md)',
              }}
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
              <Row label="Valor" value={fmt.format(amount)} highlight />
              <Row label="Recebedor" value={merchantName} />
              <Row label="Cidade" value={merchantCity} />
              <Row label="Chave PIX" value={`${pixKey} (${keyType})`} mono />
              <Row label="ID transação" value={txid} mono />

              <div
                style={{
                  marginTop: 6,
                  padding: 12,
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  wordBreak: 'break-all',
                  lineHeight: 1.4,
                }}
              >
                {brcode}
              </div>

              <PixCopyButton brcode={brcode} />
            </div>
          </div>

          <div
            style={{
              marginTop: 18,
              padding: 14,
              background: 'oklch(0.78 0.16 70 / 0.10)',
              border: '1px solid oklch(0.78 0.16 70 / 0.40)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-tertiary)',
              fontSize: '0.85rem',
              lineHeight: 1.5,
            }}
          >
            <strong>⚠️ Limitação do POC:</strong> este BRCode é válido (gera-se com a chave + valor +
            txid + nome + cidade, padrão BCB), mas <strong>não temos confirmação automática do
            pagamento</strong> ainda. Pra automatizar isso precisa de um PSP — MercadoPago,
            Efí ou Open Banking. Hoje a conferência seria manual via extrato. Detalhes no plano de
            produção (Sprint 2 → MercadoPago webhook).
          </div>

          <div
            style={{
              marginTop: 12,
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}
          >
            <strong>Testar com outros valores:</strong>{' '}
            <code>?amount=49.99</code> · <code>?key=seu-email@dominio.com</code> ·{' '}
            <code>?key=+5565999999999</code> · <code>?name=Minha Loja&amp;city=Sao Paulo</code>
          </div>
        </div>
      </section>
    </main>
  );
}

function Row({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          letterSpacing: '0.18em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-display)',
          fontSize: highlight ? '1.6rem' : mono ? '0.82rem' : '0.95rem',
          fontWeight: highlight ? 600 : 500,
          color: highlight ? 'var(--accent-primary)' : 'var(--text-primary)',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </span>
    </div>
  );
}
