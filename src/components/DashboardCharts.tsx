'use client';

import {
  ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from 'recharts';
import { useCurrency } from '@/context/CurrencyContext';

interface RevenuePoint { date: string; revenue: number }
interface InventoryPoint { status: string; count: number }
interface TopGamePoint { name: string; revenue: number }
interface PaymentMixPoint { method: string; count: number; pct: number }

interface DashboardChartsProps {
  revenueSeries: RevenuePoint[];
  inventory: InventoryPoint[];
  topGames: TopGamePoint[];
  paymentMix: PaymentMixPoint[];
}

const ACCENT = 'oklch(0.85 0.18 165)';
const PIE_PALETTE = [
  ACCENT,
  'oklch(0.65 0.16 220)',
  'oklch(0.78 0.16 70)',
  'oklch(0.80 0.18 30)',
];

export default function DashboardCharts({
  revenueSeries,
  inventory,
  topGames,
  paymentMix,
}: DashboardChartsProps) {
  const { format } = useCurrency();

  const tooltipStyle: React.CSSProperties = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 8,
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--text-primary)',
    padding: '8px 10px',
  };

  const totalKeys = inventory.reduce((a, b) => a + b.count, 0);
  const truncate = (s: string, n = 18) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

  return (
    <div className="dash-charts-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '16px',
      marginBottom: '32px',
    }}>
      {/* Revenue area */}
      <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
        <h3>📈 Receita ao longo do tempo</h3>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)',
          letterSpacing: '0.18em', marginBottom: 8,
        }}>
          SUM(transactions.total_price) / dia
        </div>
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueSeries} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACCENT} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border-soft)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                tickFormatter={(d: string) => d.slice(5)}
                axisLine={{ stroke: 'var(--border-soft)' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => format(v).replace(/[a-zA-Z]+/g, '').trim()}
                width={60}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [format(v), 'revenue']}
                labelStyle={{ color: 'var(--text-muted)' }}
              />
              <Area type="monotone" dataKey="revenue" stroke={ACCENT} strokeWidth={2} fill="url(#rev)" animationDuration={900} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inventory donut */}
      <div className="dashboard-card">
        <h3>🔑 Inventário</h3>
        <div style={{ position: 'relative', height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={inventory}
                dataKey="count"
                nameKey="status"
                cx="50%" cy="50%"
                innerRadius={56} outerRadius={88}
                paddingAngle={2}
                animationDuration={800}
              >
                {inventory.map((entry, idx) => (
                  <Cell key={entry.status} fill={PIE_PALETTE[idx % PIE_PALETTE.length]} stroke="var(--bg-card)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600,
              color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums',
            }}>{totalKeys.toLocaleString()}</div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              letterSpacing: '0.18em', color: 'var(--text-muted)',
            }}>TOTAL KEYS</div>
          </div>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 12,
        }}>
          {inventory.map((d, idx) => (
            <div key={d.status} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-mono)', fontSize: 10,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: 2,
                background: PIE_PALETTE[idx % PIE_PALETTE.length],
              }} />
              <span style={{ color: 'var(--text-secondary)' }}>{d.status}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {d.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top games bar */}
      <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
        <h3>🏆 Top jogos por receita</h3>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)',
          letterSpacing: '0.18em', marginBottom: 8,
        }}>
          SUM(order_keys.unit_price) GROUP BY game_id
        </div>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topGames.map((g) => ({ ...g, name: truncate(g.name, 18) }))}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid stroke="var(--border-soft)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                axisLine={false} tickLine={false}
                tickFormatter={(v: number) => format(v).replace(/[a-zA-Z]+/g, '').trim()}
              />
              <YAxis
                type="category" dataKey="name"
                tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'Space Grotesk, sans-serif' }}
                axisLine={false} tickLine={false}
                width={140}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: 'var(--bg-glass-hover)' }}
                formatter={(v: number) => [format(v), 'revenue']}
              />
              <Bar dataKey="revenue" fill={ACCENT} radius={[0, 6, 6, 0]} animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment mix */}
      <div className="dashboard-card">
        <h3>💳 Métodos de pagamento</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          {paymentMix.map((pm) => (
            <div key={pm.method}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 4,
              }}>
                <span style={{ color: 'var(--text-primary)' }}>{pm.method}</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {pm.count.toLocaleString()} · {pm.pct.toFixed(1)}%
                </span>
              </div>
              <div style={{
                height: 6, borderRadius: 999, overflow: 'hidden',
                background: 'var(--bg-glass)',
              }}>
                <div style={{
                  height: '100%', width: `${pm.pct}%`,
                  background: ACCENT,
                  transition: 'width 0.6s ease-out',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
