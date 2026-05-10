// Admin dashboard: KPIs, sales over time, top games, inventory donut, recent orders, suppliers
const { useState: useStateA, useMemo: useMemoA } = React;
const { LineChart: LCa, Line: Lna, XAxis: XAa, YAxis: YAa, Tooltip: TTa, ResponsiveContainer: RCa, CartesianGrid: CGa, BarChart: BCa, Bar: Ba, PieChart: PCa, Pie: Pa, Cell: Ca, AreaChart: ACa, Area: Ara } = window.Recharts;

const fmtUSD2 = (v) => `$${Number(v).toFixed(2)}`;

const KPI = ({ label, value, delta, sub, accent, icon }) => {
  const { theme } = useApp(); const t = tokens(theme);
  const positive = delta >= 0;
  return (
    <div className="rounded-2xl p-5 border" style={{ background: t.panelBg, borderColor: t.borderSoft }}>
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: t.textDim }}>{label}</div>
        {icon && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
               style={{ background: t.accentBg }}>
            <Icon name={icon} size={14} color={t.accent} />
          </div>
        )}
      </div>
      <div className="mt-3 font-display text-[28px] font-semibold tabular-nums" style={{ color: accent ? t.accent : t.text }}>{value}</div>
      <div className="mt-1 flex items-baseline gap-2">
        {delta != null && (
          <span className="font-mono text-[11px] tabular-nums px-1.5 py-0.5 rounded"
                style={{ background: positive ? t.accentBg : "oklch(0.80 0.18 30 / 0.15)", color: positive ? t.accent : t.warn }}>
            {positive ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {sub && <span className="font-mono text-[11px]" style={{ color: t.textDim }}>{sub}</span>}
      </div>
    </div>
  );
};

const Panel = ({ title, subtitle, children, action }) => {
  const { theme } = useApp(); const t = tokens(theme);
  return (
    <div className="rounded-2xl p-5 border" style={{ background: t.panelBg, borderColor: t.borderSoft }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-display text-[16px] font-medium" style={{ color: t.text }}>{title}</div>
          {subtitle && <div className="font-mono text-[10px] tracking-wider mt-0.5" style={{ color: t.textDim }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
};

const AdminDashboard = ({ onOpenGame }) => {
  const { theme, currency } = useApp();
  const t = tokens(theme);
  const [range, setRange] = useStateA("90d");
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const series = DAILY_REVENUE.slice(-days).map((d) => ({ ...d, label: d.date.slice(5) }));

  // KPIs
  const totalRevenue = series.reduce((a, b) => a + b.revenue, 0);
  const completedTx = TRANSACTIONS.filter((t) => t.status === "completed");
  const last30Tx = completedTx.filter((tx) => tx.transaction_datetime.slice(0,10) >= series[Math.max(0,series.length-30)]?.date);
  const totalOrders = ORDERS.filter((o) => series.some((s) => s.date === o.purchase_datetime.slice(0,10))).length;
  const totalKeys = ORDER_KEYS.filter((ok) => {
    const ord = ORDERS.find((o) => o.id === ok.order_id);
    return ord && series.some((s) => s.date === ord.purchase_datetime.slice(0,10));
  }).length;
  const aov = totalOrders ? totalRevenue / totalOrders : 0;

  // top games (slice & re-rank inside range — using full TOP_GAMES_REVENUE for simplicity)
  const top = TOP_GAMES_REVENUE.slice(0, 6).map((g) => ({ ...g, name: g.name.length > 14 ? g.name.slice(0, 14) + "…" : g.name }));

  // inventory donut
  const invColors = { Available: t.accent, Sold: theme === "light" ? "oklch(0.55 0.10 260)" : "oklch(0.70 0.10 260)", Reserved: t.warn, Expired: theme === "light" ? "oklch(0.70 0.02 260)" : "oklch(0.45 0.02 260)" };

  // recent orders
  const recentOrders = [...ORDERS].sort((a, b) => b.purchase_datetime.localeCompare(a.purchase_datetime)).slice(0, 8);

  // supplier volume
  const supplierVolume = SUPPLIERS.map((s) => {
    const batches = KEY_BATCHES.filter((b) => b.supplier_id === s.id);
    const qty = batches.reduce((a, b) => a + b.quantity, 0);
    const cost = batches.reduce((a, b) => a + b.quantity * b.unit_price, 0);
    return { ...s, qty, cost, batches: batches.length };
  }).sort((a, b) => b.cost - a.cost);

  // payment method breakdown
  const pmBreakdown = PAYMENT_METHODS.map((pm) => {
    const cnt = completedTx.filter((tx) => tx.payment_method_id === pm.id).length;
    return { name: pm.name, value: cnt };
  });

  return (
    <motion.div key="admin" initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="max-w-[1280px] mx-auto px-6 lg:px-10 py-8">
      {/* header */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded-md font-mono text-[10px] tracking-[0.2em]"
                 style={{ background: t.accentBg, color: t.accent }}>
              ADMIN
            </div>
            <div className="font-mono text-[11px] tracking-[0.22em]" style={{ color: t.textDim }}>OPERATIONS · {range.toUpperCase()}</div>
          </div>
          <h1 className="mt-2 font-display text-[36px] leading-[1.1] font-semibold" style={{ color: t.text }}>
            Sales & inventory control
          </h1>
          <p className="mt-2 max-w-[60ch]" style={{ color: t.textMuted }}>
            Visão ao vivo de <span className="font-mono text-[12px]" style={{ color: t.text }}>vendas</span>,{" "}
            <span className="font-mono text-[12px]" style={{ color: t.text }}>pedidos</span>,{" "}
            <span className="font-mono text-[12px]" style={{ color: t.text }}>chaves</span> e{" "}
            <span className="font-mono text-[12px]" style={{ color: t.text }}>fornecedores</span>.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl p-1 border"
             style={{ background: t.panelBg, borderColor: t.borderSoft }}>
          {["7d", "30d", "90d"].map((r) => (
            <button key={r} onClick={() => setRange(r)}
                    className="px-3 py-1.5 rounded-lg font-mono text-[11px] transition"
                    style={{
                      background: range === r ? t.accent : "transparent",
                      color: range === r ? (theme === "light" ? "white" : "oklch(0.18 0.02 260)") : t.textMuted,
                    }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPI label="Revenue" value={fmtMoney(totalRevenue, currency)} delta={12.4} sub="vs prev period" icon="DollarSign" accent />
        <KPI label="Orders" value={totalOrders.toLocaleString()} delta={6.1} sub="completed" icon="ShoppingBag" />
        <KPI label="Keys sold" value={totalKeys.toLocaleString()} delta={9.7} sub="vendidas" icon="Key" />
        <KPI label="AOV" value={fmtMoney(aov, currency)} delta={-1.8} sub="avg order value" icon="Receipt" />
      </div>

      {/* charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        <div className="lg:col-span-2">
          <Panel title="Revenue over time" subtitle={`receita por dia · últimos ${days} dias`}>
            <div className="h-[280px]">
              <RCa width="100%" height="100%">
                <ACa data={series} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={t.accent} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={t.accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CGa stroke={theme === "light" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)"} vertical={false} />
                  <XAa dataKey="label" tick={{ fill: t.textDim, fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                       axisLine={{ stroke: t.borderSoft }} tickLine={false}
                       interval={Math.max(0, Math.floor(series.length / 8))} />
                  <YAa tick={{ fill: t.textDim, fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                       axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`} width={50} />
                  <TTa contentStyle={{ background: t.panelBg, border: `1px solid ${t.border}`, borderRadius: 8, fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: t.text }}
                       formatter={(v) => [fmtUSD2(v), "revenue"]} labelStyle={{ color: t.textDim }} />
                  <Ara type="monotone" dataKey="revenue" stroke={t.accent} strokeWidth={2} fill="url(#adminRev)"
                       animationDuration={1000} />
                </ACa>
              </RCa>
            </div>
          </Panel>
        </div>
        <div>
          <Panel title="Inventory by status" subtitle="agrupado por status">
            <div className="h-[200px] relative">
              <RCa width="100%" height="100%">
                <PCa>
                  <Pa data={INVENTORY_TOTALS} dataKey="count" nameKey="status" cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80} paddingAngle={2} animationDuration={900}>
                    {INVENTORY_TOTALS.map((d) => (
                      <Ca key={d.status} fill={invColors[d.status]} stroke={t.panelBg} strokeWidth={2} />
                    ))}
                  </Pa>
                  <TTa contentStyle={{ background: t.panelBg, border: `1px solid ${t.border}`, borderRadius: 8, fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: t.text }} />
                </PCa>
              </RCa>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="font-display text-[22px] font-semibold tabular-nums" style={{ color: t.text }}>
                  {INVENTORY_TOTALS.reduce((a, b) => a + b.count, 0).toLocaleString()}
                </div>
                <div className="font-mono text-[9px] tracking-[0.18em]" style={{ color: t.textDim }}>TOTAL KEYS</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {INVENTORY_TOTALS.map((d) => (
                <div key={d.status} className="flex items-center gap-1.5 font-mono text-[10px]">
                  <span className="w-2 h-2 rounded-sm" style={{ background: invColors[d.status] }} />
                  <span style={{ color: t.textMuted }}>{d.status}</span>
                  <span className="ml-auto tabular-nums" style={{ color: t.text }}>{d.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        <div className="lg:col-span-2">
          <Panel title="Top games by revenue" subtitle="receita por jogo · agregada">
            <div className="h-[280px]">
              <RCa width="100%" height="100%">
                <BCa data={top} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CGa stroke={theme === "light" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)"} horizontal={false} />
                  <XAa type="number" tick={{ fill: t.textDim, fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                       axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <YAa type="category" dataKey="name" tick={{ fill: t.textMuted, fontSize: 11, fontFamily: "Space Grotesk, sans-serif" }}
                       axisLine={false} tickLine={false} width={130} />
                  <TTa contentStyle={{ background: t.panelBg, border: `1px solid ${t.border}`, borderRadius: 8, fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: t.text }}
                       formatter={(v) => [fmtUSD2(v), "revenue"]} cursor={{ fill: theme === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)" }} />
                  <Ba dataKey="revenue" fill={t.accent} radius={[0, 6, 6, 0]} animationDuration={900} />
                </BCa>
              </RCa>
            </div>
          </Panel>
        </div>
        <div>
          <Panel title="Payment method mix" subtitle="por método">
            <div className="space-y-2 mt-2">
              {pmBreakdown.map((pm) => {
                const total = pmBreakdown.reduce((a, b) => a + b.value, 0);
                const pct = total ? (pm.value / total) * 100 : 0;
                return (
                  <div key={pm.name}>
                    <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                      <span style={{ color: t.text }}>{pm.name}</span>
                      <span className="tabular-nums" style={{ color: t.textDim }}>{pm.value.toLocaleString()} · {pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden"
                         style={{ background: theme === "light" ? "oklch(0.92 0.005 260)" : "rgba(255,255,255,0.08)" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                  className="h-full rounded-full"
                                  style={{ background: t.accent }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>

      {/* per-game inventory table */}
      <div className="mb-6">
        <Panel title="Stock per game" subtitle="estoque ativo por jogo">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="font-mono text-[10px] tracking-[0.15em]"
                    style={{ color: t.textDim, background: theme === "light" ? "oklch(0.97 0.005 260)" : "rgba(255,255,255,0.03)" }}>
                  <th className="text-left px-3 py-2.5">GAME</th>
                  <th className="text-left px-3 py-2.5">PLATFORM</th>
                  <th className="text-right px-3 py-2.5">AVAILABLE</th>
                  <th className="text-right px-3 py-2.5">SOLD</th>
                  <th className="text-right px-3 py-2.5">RESERVED</th>
                  <th className="text-right px-3 py-2.5">EXPIRED</th>
                  <th className="text-left px-3 py-2.5 w-[180px]">SELL-THROUGH</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {GAMES.map((g) => {
                  const plat = platformById(g.active_platform_id);
                  const av = KEY_INVENTORY.find((k) => k.game_id === g.id && k.status_id === 1)?.count || 0;
                  const sl = KEY_INVENTORY.find((k) => k.game_id === g.id && k.status_id === 2)?.count || 0;
                  const re = KEY_INVENTORY.find((k) => k.game_id === g.id && k.status_id === 3)?.count || 0;
                  const ex = KEY_INVENTORY.find((k) => k.game_id === g.id && k.status_id === 4)?.count || 0;
                  const total = av + sl + re + ex;
                  const pct = total ? (sl / total) * 100 : 0;
                  const lowStock = av < 100;
                  return (
                    <tr key={g.id} className="border-t hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition"
                        style={{ borderColor: t.borderSoft, color: t.text }}>
                      <td className="px-3 py-2.5">
                        <div className="font-display font-medium">{g.name}</div>
                        <div className="font-mono text-[10px]" style={{ color: t.textDim }}>{g.studio}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Chip tone={theme === "light" ? plat.toneLight : plat.tone} outline>{plat.name}</Chip>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-mono">
                        <span style={{ color: lowStock ? t.warn : t.text }}>
                          {av.toLocaleString()}
                          {lowStock && <span className="ml-1" title="Low stock">⚠</span>}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-mono" style={{ color: t.textMuted }}>{sl.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-mono" style={{ color: t.textMuted }}>{re.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-mono" style={{ color: t.textDim }}>{ex.toLocaleString()}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                               style={{ background: theme === "light" ? "oklch(0.92 0.005 260)" : "rgba(255,255,255,0.08)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: t.accent }} />
                          </div>
                          <span className="font-mono text-[10px] tabular-nums w-10 text-right" style={{ color: t.textMuted }}>{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button onClick={() => onOpenGame(g)} className="font-mono text-[10px] inline-flex items-center gap-1"
                                style={{ color: t.accent }}>
                          inspect <Icon name="ArrowUpRight" size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* recent orders + suppliers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Panel title="Recent orders" subtitle="últimos pedidos confirmados">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="font-mono text-[10px] tracking-[0.15em]"
                    style={{ color: t.textDim, background: theme === "light" ? "oklch(0.97 0.005 260)" : "rgba(255,255,255,0.03)" }}>
                  <th className="text-left px-3 py-2.5">ORDER</th>
                  <th className="text-left px-3 py-2.5">USER</th>
                  <th className="text-left px-3 py-2.5">DATE</th>
                  <th className="text-left px-3 py-2.5">STATUS</th>
                  <th className="text-right px-3 py-2.5">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => {
                  const u = userById(o.user_id);
                  const tx = TRANSACTIONS.find((tx) => tx.order_id === o.id);
                  const ok = tx?.status === "completed";
                  return (
                    <tr key={o.id} className="border-t" style={{ borderColor: t.borderSoft, color: t.text }}>
                      <td className="px-3 py-2.5 font-mono text-[11px]">#{String(o.id).padStart(5, "0")}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-display text-[12px]">{u?.first_name} {u?.last_name?.[0]}.</div>
                        <div className="font-mono text-[10px]" style={{ color: t.textDim }}>@{u?.nickname}</div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[10px]" style={{ color: t.textMuted }}>{o.purchase_datetime.slice(5, 16)}</td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded font-mono text-[10px]"
                              style={{ background: ok ? t.accentBg : "oklch(0.80 0.18 30 / 0.15)", color: ok ? t.accent : t.warn }}>
                          <span className="w-1 h-1 rounded-full bg-current" />{ok ? "completed" : "refunded"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums" style={{ color: t.text }}>{fmtMoney(tx?.total_price || 0, currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Suppliers" subtitle="volume por fornecedor">
          <div className="space-y-2">
            {supplierVolume.map((s) => {
              const plat = platformById(s.platform_id);
              return (
                <div key={s.id} className="rounded-xl border p-3 flex items-center gap-3"
                     style={{ background: theme === "light" ? "oklch(0.98 0.005 260)" : "rgba(255,255,255,0.025)", borderColor: t.borderSoft }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center font-display font-semibold"
                       style={{ background: t.accentBg, color: t.accent }}>
                    {s.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[13px] truncate" style={{ color: t.text }}>{s.name}</div>
                    <div className="font-mono text-[10px] truncate" style={{ color: t.textDim }}>
                      {plat.name} · {s.batches} batches · {s.qty.toLocaleString()} keys
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-[14px] font-semibold tabular-nums" style={{ color: t.text }}>{fmtMoney(s.cost, currency)}</div>
                    <div className="font-mono text-[10px]" style={{ color: t.textDim }}>procurement</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="mt-10 text-center font-mono text-[11px]" style={{ color: t.textDim }}>
        Agregado a partir do banco operacional.
      </div>
    </motion.div>
  );
};

Object.assign(window, { AdminDashboard });
