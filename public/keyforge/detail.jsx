// Detail page (rich, schema-driven), Checkout overlay, Success/key-reveal screen
const { useState: useStateD, useEffect: useEffectD } = React;
const { LineChart: LC_D, Line: Ln_D, XAxis: XA_D, YAxis: YA_D, Tooltip: TT_D, ResponsiveContainer: RC_D, CartesianGrid: CG_D, ReferenceDot: RD_D, AreaChart: AC_D, Area: Ar_D } = window.Recharts;

const fmtUSD = (v) => `$${Number(v).toFixed(2)}`;

// ---------- Price-history chart ----------
const PriceTooltip = ({ active, payload, log, theme }) => {
  if (!active || !payload || !payload.length) return null;
  const t = tokens(theme);
  const d = payload[0].payload;
  const idx = log.findIndex((p) => p.iso === d.iso);
  const prev = idx > 0 ? log[idx - 1] : null;
  const delta = prev ? d.price - prev.price : 0;
  return (
    <div className="rounded-lg border px-3 py-2.5 font-mono text-[11px] shadow-2xl min-w-[180px]"
         style={{ background: t.panelBg, borderColor: t.border, color: t.text }}>
      <div className="tracking-wider text-[10px] mb-1.5" style={{ color: t.textDim }}>{d.date.toUpperCase()}</div>
      {prev && (
        <div className="flex justify-between gap-3" style={{ color: t.textMuted }}>
          <span>was</span><span className="tabular-nums line-through">{fmtUSD(prev.price)}</span>
        </div>
      )}
      <div className="flex justify-between gap-3"><span>now</span><span className="tabular-nums">{fmtUSD(d.price)}</span></div>
      {prev && delta !== 0 && (
        <div className="flex justify-between gap-3 mt-1 pt-1.5 border-t tabular-nums"
             style={{ borderColor: t.borderSoft, color: delta < 0 ? t.accent : t.warn }}>
          <span>{delta < 0 ? "↓ drop" : "↑ rise"}</span>
          <span>{delta < 0 ? "" : "+"}{fmtUSD(delta)}</span>
        </div>
      )}
    </div>
  );
};

const PriceHistoryChart = ({ rawLog }) => {
  const { theme } = useApp();
  const t = tokens(theme);
  // rawLog rows: {old_price, new_price, changed_at}; build a timeline of prices
  const points = [];
  if (rawLog.length) {
    points.push({ iso: rawLog[0].changed_at.slice(0, 10), price: rawLog[0].old_price });
    for (const r of rawLog) points.push({ iso: r.changed_at.slice(0, 10), price: r.new_price });
  }
  const log = points.map((p) => ({
    ...p,
    date: new Date(p.iso).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
  }));
  if (!log.length) return <div className="h-[260px]" />;
  const min = Math.min(...log.map((p) => p.price));
  const max = Math.max(...log.map((p) => p.price));
  const minPoint = log.find((p) => p.price === min);
  const maxPoint = log.find((p) => p.price === max);

  return (
    <div className="w-full h-[260px]">
      <RC_D width="100%" height="100%">
        <AC_D data={log} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={t.accent} stopOpacity={0.35} />
              <stop offset="100%" stopColor={t.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CG_D stroke={theme === "light" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.05)"} vertical={false} />
          <XA_D dataKey="date" tick={{ fill: t.textDim, fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                axisLine={{ stroke: t.borderSoft }} tickLine={false} />
          <YA_D tick={{ fill: t.textDim, fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${v}`}
                domain={[(d) => Math.floor(d - 5), (d) => Math.ceil(d + 5)]} width={50} />
          <TT_D content={(props) => <PriceTooltip {...props} log={log} theme={theme} />}
                cursor={{ stroke: t.accent, strokeDasharray: "3 3", strokeOpacity: 0.4 }} />
          <Ar_D type="monotone" dataKey="price" stroke={t.accent} strokeWidth={2} fill="url(#priceFill)"
                dot={{ r: 3, fill: t.accent, stroke: t.panelBg, strokeWidth: 2 }}
                activeDot={{ r: 5, fill: t.accent, stroke: theme === "light" ? "white" : "white", strokeWidth: 2 }}
                animationDuration={1400} animationEasing="ease-out" />
          {minPoint && <RD_D x={minPoint.date} y={minPoint.price} r={5} fill={t.accent} stroke="white" strokeWidth={1.5} />}
          {maxPoint && maxPoint.iso !== minPoint?.iso && (
            <RD_D x={maxPoint.date} y={maxPoint.price} r={4} fill={t.warn} stroke="white" strokeWidth={1.5} />
          )}
        </AC_D>
      </RC_D>
    </div>
  );
};

// ---------- Detail page ----------
const Legend = ({ swatch, label }) => {
  const { theme } = useApp(); const t = tokens(theme);
  return (
    <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5">
      <span className="w-2 h-2 rounded-full" style={{ background: swatch }} />
      <span style={{ color: t.textDim, letterSpacing: "0.15em" }}>{label}</span>
    </span>
  );
};

const DetailPage = ({ game, onBack, onBuy, onAddToCart }) => {
  const { theme, currency } = useApp();
  const t = tokens(theme);
  const plat = platformById(game.active_platform_id);
  const platTone = theme === "light" ? plat.toneLight : plat.tone;
  const log = priceLogOf(game.id);
  const msrp = log.length ? log[0].old_price : game.price;
  const allPrices = log.length ? [log[0].old_price, ...log.map((l) => l.new_price)] : [game.price];
  const lowest = Math.min(...allPrices);
  const peak = Math.max(...allPrices);
  const trend = allPrices[allPrices.length - 1] - allPrices[0];
  const rating = GAME_RATING_AGG[game.id];
  const genres = genresOf(game.id);
  const comments = commentsOf(game.id);
  const wishlistCount = wishlistCountOf(game.id);
  const available = availableKeysOf(game.id);
  const sold = soldKeysOf(game.id);
  const batches = KEY_BATCHES.filter((b) => b.game_id === game.id);
  const releaseDate = new Date(game.release_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const [wishlisted, setWishlisted] = useStateD(false);
  const [activeTab, setActiveTab] = useStateD("overview");

  return (
    <motion.div key="detail" initial={false} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="max-w-[1180px] mx-auto px-6 lg:px-10 py-8">
      <button onClick={onBack}
              className="mb-6 inline-flex items-center gap-2 font-mono text-[11px] tracking-wider transition"
              style={{ color: t.textMuted }}>
        <Icon name="ArrowLeft" size={14} /> {window.t("detail.back")}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-8">
        <div>
          {/* hero */}
          <div className="aspect-[16/8] rounded-2xl overflow-hidden border" style={{ borderColor: t.borderSoft }}>
            <CoverArt id={game.cover} image={game.image} title={game.name} platform={plat} big theme={theme} />
          </div>

          {/* meta line */}
          <div className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-2">
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase" style={{ color: t.textDim }}>{game.studio}</div>
            <span style={{ color: t.textDim }}>•</span>
            <span className="font-mono text-[11px] tracking-wide" style={{ color: platTone }}>{plat.name.toUpperCase()}</span>
            <span style={{ color: t.textDim }}>•</span>
            <span className="font-mono text-[11px]" style={{ color: t.textDim }}>Released {releaseDate}</span>
            <span style={{ color: t.textDim }}>•</span>
            <span className="font-mono text-[11px]" style={{ color: t.textDim }}>{available.toLocaleString()} keys in stock</span>
          </div>
          <h1 className="mt-3 font-display text-[42px] leading-[1.05] font-semibold" style={{ textWrap: "balance", color: t.text }}>
            {game.tagline}
          </h1>
          <p className="mt-4 max-w-[60ch] leading-relaxed" style={{ color: t.textMuted }}>{game.description}</p>

          {/* genres */}
          <div className="mt-5 flex flex-wrap gap-2">
            {genres.map((g) => (
              <span key={g} className="px-2.5 py-1 rounded-md font-mono text-[11px] border"
                    style={{ color: t.textMuted, background: theme === "light" ? "oklch(0.96 0.005 260)" : "rgba(255,255,255,0.05)", borderColor: t.borderSoft }}>
                {g}
              </span>
            ))}
          </div>

          {/* stat tiles */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Player rating" value={rating.avg.toFixed(1)} sub={`${(rating.count / 1000).toFixed(1)}k reviews`} accent icon="Star" />
            <Stat label="Lowest ever" value={fmtMoney(lowest, currency)} sub="last 9 months" icon="TrendingDown" />
            <Stat label="Peak price" value={fmtMoney(peak, currency)} sub="MSRP" icon="TrendingUp" />
            <Stat label="Wishlists" value={wishlistCount.toLocaleString()} sub="users tracking" icon="Heart" />
          </div>

          {/* tabs */}
          <div className="mt-8 border-b flex gap-1" style={{ borderColor: t.borderSoft }}>
            {[
              { id: "overview", label: "Overview" },
              { id: "history", label: "Price history" },
              { id: "comments", label: `Comments · ${comments.length}` },
              { id: "stock", label: "Stock & batches" },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className="px-3 py-2.5 font-mono text-[11px] tracking-wider transition relative"
                      style={{ color: activeTab === tab.id ? t.text : t.textDim }}>
                {tab.label.toUpperCase()}
                {activeTab === tab.id && (
                  <motion.span layoutId="tab-underline" className="absolute inset-x-2 bottom-0 h-[2px] rounded-t" style={{ background: t.accent }} />
                )}
              </button>
            ))}
          </div>

          <div className="mt-5">
            {activeTab === "overview" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {game.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 px-3 py-2.5 rounded-lg border"
                       style={{ background: theme === "light" ? "oklch(0.98 0.005 260)" : "rgba(255,255,255,0.03)", borderColor: t.borderSoft }}>
                    <Icon name="Check" size={14} color={t.accent} />
                    <span className="text-[12px]" style={{ color: t.textMuted }}>{f}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "history" && (
              <div className="rounded-2xl p-5 border" style={{ background: t.panelBg, borderColor: t.borderSoft }}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <div className="font-display text-[18px] font-medium" style={{ color: t.text }}>Price history</div>
                    <div className="font-mono text-[11px] mt-0.5" style={{ color: t.textDim }}>From game_price_log · last 9 months · USD</div>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <Legend swatch={t.accent} label="LOWEST" />
                    <Legend swatch={t.warn} label="PEAK" />
                  </div>
                </div>
                <PriceHistoryChart rawLog={log} />
              </div>
            )}

            {activeTab === "comments" && (
              <div className="space-y-3">
                {comments.length === 0 && (
                  <div className="font-mono text-[12px]" style={{ color: t.textDim }}>No comments yet.</div>
                )}
                {comments.map((c) => (
                  <div key={c.id} className="rounded-xl border p-4"
                       style={{ background: t.panelBg, borderColor: t.borderSoft }}>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center font-display text-[11px] font-semibold"
                           style={{ background: "linear-gradient(135deg, oklch(0.85 0.18 165), oklch(0.65 0.16 220))", color: "oklch(0.18 0.02 260)" }}>
                        {c.user?.first_name?.[0]}{c.user?.last_name?.[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-[13px] truncate" style={{ color: t.text }}>
                          {c.user?.first_name} {c.user?.last_name} <span style={{ color: t.textDim }}>@{c.user?.nickname}</span>
                        </div>
                        <div className="font-mono text-[10px]" style={{ color: t.textDim }}>{c.created_at}</div>
                      </div>
                    </div>
                    <p className="text-[13px] leading-relaxed" style={{ color: t.textMuted }}>{c.comment_text}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "stock" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {KEY_STATUS.map((s) => {
                    const row = KEY_INVENTORY.find((k) => k.game_id === game.id && k.status_id === s.id);
                    return (
                      <Stat key={s.id} label={s.status} value={(row?.count ?? 0).toLocaleString()} sub="keys" />
                    );
                  })}
                </div>
                <div className="rounded-xl border overflow-hidden" style={{ background: t.panelBg, borderColor: t.borderSoft }}>
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="font-mono text-[10px] tracking-[0.15em]" style={{ color: t.textDim, background: theme === "light" ? "oklch(0.97 0.005 260)" : "rgba(255,255,255,0.03)" }}>
                        <th className="text-left px-4 py-2.5">SUPPLIER</th>
                        <th className="text-right px-4 py-2.5">UNIT COST</th>
                        <th className="text-right px-4 py-2.5">QTY</th>
                        <th className="text-right px-4 py-2.5">TOTAL</th>
                        <th className="text-left px-4 py-2.5">PURCHASED</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.map((b) => {
                        const sup = SUPPLIERS.find((s) => s.id === b.supplier_id);
                        return (
                          <tr key={b.id} className="border-t" style={{ borderColor: t.borderSoft, color: t.text }}>
                            <td className="px-4 py-2.5">{sup?.name}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-mono" style={{ color: t.textMuted }}>{fmtMoney(b.unit_price, currency)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-mono">{b.quantity.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-mono" style={{ color: t.accent }}>{fmtMoney(b.unit_price * b.quantity, currency)}</td>
                            <td className="px-4 py-2.5 font-mono text-[11px]" style={{ color: t.textDim }}>{b.purchase_date.slice(0, 10)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* purchase panel */}
        <div className="lg:sticky lg:top-6 self-start">
          <div className="rounded-2xl p-5 border" style={{ background: t.panelBg, borderColor: t.border }}>
            <div className="flex items-baseline justify-between">
              <div className="font-mono text-[10px] tracking-[0.2em]" style={{ color: t.textDim }}>CURRENT PRICE</div>
              {msrp > game.price && (
                <div className="px-1.5 py-0.5 rounded-md font-mono text-[10px] font-semibold"
                     style={{ background: t.accentBg, color: t.accent }}>
                  −{Math.round((1 - game.price / msrp) * 100)}%
                </div>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <div className="font-display text-[40px] font-semibold tabular-nums" style={{ color: t.text }}>{fmtMoney(game.price, currency)}</div>
              {msrp > game.price && <div className="font-mono text-sm line-through tabular-nums" style={{ color: t.textDim }}>{fmtMoney(msrp, currency)}</div>}
            </div>
            <div className="mt-1 font-mono text-[11px]" style={{ color: t.textDim }}>
              one-time · digital key · activates on {plat.name}
            </div>

            <button onClick={onBuy}
                    className="mt-5 w-full rounded-xl py-3.5 font-display font-semibold text-[15px] transition relative overflow-hidden group"
                    style={{ background: t.accent, color: theme === "light" ? "white" : "oklch(0.18 0.02 260)" }}>
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Icon name="Key" size={16} strokeWidth={2.25} /> {window.t("detail.purchase")}
              </span>
            </button>

            {onAddToCart && (
              <button onClick={onAddToCart}
                      className="mt-2 w-full rounded-xl py-2.5 font-display font-medium text-[13px] border flex items-center justify-center gap-2 transition"
                      style={{ background: "transparent", borderColor: t.borderSoft, color: t.text }}>
                <Icon name="ShoppingBag" size={14} /> {window.t("cart.addToCart")}
              </button>
            )}

            <button onClick={() => setWishlisted((w) => !w)}
                    className="mt-2 w-full rounded-xl py-2.5 font-display font-medium text-[13px] border flex items-center justify-center gap-2 transition"
                    style={{
                      background: wishlisted ? t.accentBg : "transparent",
                      borderColor: wishlisted ? t.accent : t.borderSoft,
                      color: wishlisted ? t.accent : t.textMuted,
                    }}>
              <Icon name="Heart" size={14} fill={wishlisted ? "currentColor" : "none"} />
              {wishlisted ? "On your wishlist" : "Add to wishlist"}
            </button>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Trustlet icon="ShieldCheck" label="Instant" />
              <Trustlet icon="RotateCcw" label="14-day refund" />
              <Trustlet icon="Lock" label="Region-free" />
            </div>

            <div className="mt-4 pt-4 border-t flex items-center gap-2 font-mono text-[10px]"
                 style={{ borderColor: t.borderSoft, color: t.textDim }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: t.accent }} />
              {available} keys with status <span style={{ color: t.text }}>'Available'</span>
            </div>
          </div>

          {/* sales footprint */}
          <div className="mt-3 rounded-2xl p-4 border" style={{ background: t.panelBg, borderColor: t.borderSoft }}>
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] mb-3" style={{ color: t.textDim }}>
              <Icon name="Activity" size={12} /> SALES FOOTPRINT
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <div className="font-display text-[18px] font-semibold tabular-nums" style={{ color: t.text }}>{sold.toLocaleString()}</div>
                <div className="font-mono text-[10px]" style={{ color: t.textDim }}>keys sold lifetime</div>
              </div>
              <div>
                <div className="font-display text-[18px] font-semibold tabular-nums" style={{ color: t.accent }}>
                  {fmtMoney(sold * game.price, currency)}
                </div>
                <div className="font-mono text-[10px]" style={{ color: t.textDim }}>est. revenue</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ---------- Checkout overlay ----------
const CheckoutOverlay = ({ game, onComplete, onCancel }) => {
  const { theme, currency } = useApp();
  const t = tokens(theme);
  const steps = [
    { label: "Validating payment method", ms: 700 },
    { label: "Reserving key from inventory pool", ms: 700 },
    { label: "Updating key_status → 'Sold'", ms: 800 },
    { label: "Linking key to your order", ms: 600 },
  ];
  const [i, setI] = useStateD(0);
  useEffectD(() => {
    if (i >= steps.length) { onComplete(); return; }
    const tm = setTimeout(() => setI(i + 1), steps[i].ms);
    return () => clearTimeout(tm);
  }, [i]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 backdrop-blur-md flex items-center justify-center p-6"
                style={{ background: theme === "light" ? "oklch(0.20 0.02 260 / 0.45)" : "oklch(0.10 0.02 260 / 0.7)" }}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.97, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 26 }}
                  className="w-full max-w-[440px] rounded-2xl border p-6 shadow-2xl"
                  style={{ background: t.panelBg, borderColor: t.border }}>
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9">
            <motion.div className="absolute inset-0 rounded-full border-2"
                        style={{ borderColor: theme === "light" ? "oklch(0.55 0.18 165 / 0.25)" : "oklch(0.85 0.18 165 / 0.25)", borderTopColor: t.accent }}
                        animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }} />
            <Icon name="Key" size={14} className="absolute inset-0 m-auto" color={t.accent} />
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-[0.22em]" style={{ color: t.textDim }}>PROCESSING</div>
            <div className="font-display text-[16px]" style={{ color: t.text }}>Securing your key…</div>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          {steps.map((s, idx) => {
            const state = idx < i ? "done" : idx === i ? "active" : "pending";
            return (
              <div key={s.label} className="flex items-center gap-2.5 font-mono text-[11px]">
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                     style={{
                       background: state === "done" ? t.accent : state === "active" ? t.accentBg : (theme === "light" ? "oklch(0.94 0.005 260)" : "rgba(255,255,255,0.06)"),
                       border: state === "active" ? `1px solid ${t.accent}` : "1px solid transparent",
                     }}>
                  {state === "done" && <Icon name="Check" size={10} strokeWidth={3} color={theme === "light" ? "white" : "oklch(0.18 0.02 260)"} />}
                  {state === "active" && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: t.accent }} />}
                </div>
                <span style={{
                  color: state === "pending" ? t.textDim : state === "active" ? t.text : t.textMuted,
                  textDecoration: state === "done" ? "line-through" : "none",
                }}>{s.label}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-5 border-t flex items-center justify-between" style={{ borderColor: t.borderSoft }}>
          <div>
            <div className="font-mono text-[10px] tracking-[0.18em]" style={{ color: t.textDim }}>{game.name.toUpperCase()}</div>
            <div className="font-display text-[18px] tabular-nums" style={{ color: t.text }}>{fmtMoney(game.price, currency)}</div>
          </div>
          <button onClick={onCancel} className="font-mono text-[11px]" style={{ color: t.textDim }}>cancel</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ---------- Key reveal scramble ----------
const SCRAMBLE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#@$%&*";
const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const randKey = (prefix) => {
  const seg = (n) => Array.from({ length: n }, () => KEY_ALPHABET[Math.floor(Math.random() * KEY_ALPHABET.length)]).join("");
  return `${prefix}-${seg(5)}-${seg(5)}-${seg(5)}`;
};
const ScrambleKey = ({ finalKey, onDone }) => {
  const { theme } = useApp(); const t = tokens(theme);
  const [display, setDisplay] = useStateD("•••••-•••••-•••••-•••••");
  useEffectD(() => {
    const total = 1700;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const tm = Math.min(1, (now - start) / total);
      const revealCount = Math.floor(tm * finalKey.length);
      let out = "";
      for (let k = 0; k < finalKey.length; k++) {
        const ch = finalKey[k];
        if (ch === "-") { out += "-"; continue; }
        out += k < revealCount ? ch : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
      setDisplay(out);
      if (tm < 1) raf = requestAnimationFrame(tick);
      else { setDisplay(finalKey); onDone && onDone(); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [finalKey]);
  return (
    <div className="font-mono text-[28px] sm:text-[32px] tracking-[0.18em] tabular-nums select-all"
         style={{ color: t.text, textShadow: theme === "light" ? "none" : `0 0 24px ${t.accent}` }}>
      {display}
    </div>
  );
};

// ---------- Success ----------
const SuccessScreen = ({ game, onBackToStore }) => {
  const { theme, currency } = useApp();
  const t = tokens(theme);
  const plat = platformById(game.active_platform_id);
  const [generatedKey] = useStateD(() => randKey(plat.name.toUpperCase().replace(/\s/g, "").slice(0, 6)));
  const [revealed, setRevealed] = useStateD(false);
  const [copied, setCopied] = useStateD(false);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(generatedKey); } catch (_) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <motion.div key="success" initial={false} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="max-w-[820px] mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.1 }}
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: t.accentBg, border: `1px solid ${t.accent}` }}>
          <Icon name="Check" size={18} color={t.accent} strokeWidth={2.5} />
        </motion.div>
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em]" style={{ color: t.textDim }}>TRANSACTION #KF-{Date.now().toString().slice(-8)}</div>
          <div className="font-display text-[22px] mt-0.5" style={{ color: t.text }}>Your key is ready.</div>
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden border"
           style={{
             background: theme === "light"
               ? "linear-gradient(160deg, oklch(0.99 0.005 260), oklch(0.95 0.01 260))"
               : "linear-gradient(160deg, oklch(0.22 0.04 260), oklch(0.16 0.02 260))",
             borderColor: t.border,
           }}>
        <div className="absolute inset-0 opacity-[0.06]"
             style={{ backgroundImage: theme === "light"
               ? "linear-gradient(rgba(0,0,0,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.6) 1px, transparent 1px)"
               : "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
               backgroundSize: "32px 32px" }} />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] tracking-[0.22em]"
                   style={{ color: theme === "light" ? plat.toneLight : plat.tone }}>
                {plat.name.toUpperCase()} ACTIVATION KEY
              </div>
              <div className="mt-1 font-display text-[20px]" style={{ color: t.text }}>{game.name}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] tracking-[0.2em]" style={{ color: t.textDim }}>STATUS</div>
              <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-1 rounded-md"
                   style={{ background: t.accentBg, color: t.accent }}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                <span className="font-mono text-[10px] tracking-wider">SOLD</span>
              </div>
            </div>
          </div>

          <div className="my-6 relative h-px">
            <div className="absolute inset-0 border-t border-dashed" style={{ borderColor: t.borderSoft }} />
          </div>

          <div className="font-mono text-[10px] tracking-[0.22em] mb-3" style={{ color: t.textDim }}>YOUR KEY</div>
          <div className="rounded-xl p-5 sm:p-6 text-center relative overflow-hidden border"
               style={{ background: theme === "light" ? "oklch(0.96 0.005 260)" : "rgba(0,0,0,0.3)", borderColor: t.borderSoft }}>
            <ScrambleKey finalKey={generatedKey} onDone={() => setRevealed(true)} />
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
            <motion.button whileTap={{ scale: 0.98 }} onClick={handleCopy} disabled={!revealed}
                           className="flex-1 rounded-xl py-3 font-display font-medium text-[14px] flex items-center justify-center gap-2 transition relative"
                           style={{
                             background: revealed ? (theme === "light" ? t.text : "white") : (theme === "light" ? "oklch(0.92 0.005 260)" : "rgba(255,255,255,0.10)"),
                             color: revealed ? t.pageBg : t.textDim,
                             cursor: revealed ? "pointer" : "not-allowed",
                           }}>
              {copied ? (
                <span className="inline-flex items-center gap-2" style={{ color: theme === "light" ? "oklch(0.45 0.16 160)" : "oklch(0.45 0.16 160)" }}>
                  <Icon name="Check" size={16} strokeWidth={2.5} /> Copied to clipboard
                </span>
              ) : (
                <span className="inline-flex items-center gap-2"><Icon name="Copy" size={15} /> Copy key</span>
              )}
            </motion.button>

            <button className="flex-1 rounded-xl py-3 font-display font-medium text-[14px] border flex items-center justify-center gap-2"
                    style={{ background: theme === "light" ? "oklch(0.98 0.005 260)" : "rgba(255,255,255,0.04)",
                             borderColor: t.borderSoft, color: t.text }}>
              <Icon name="ExternalLink" size={15} /> Redeem on {plat.name}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Receipt label="Paid" value={fmtMoney(game.price, currency)} />
        <Receipt label="Method" value="Card ••4218" />
        <Receipt label="Email" value="mira@example.com" />
        <Receipt label="Issued" value="May 7, 2026" />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button onClick={onBackToStore} className="font-mono text-[11px] tracking-[0.18em] inline-flex items-center gap-2"
                style={{ color: t.textMuted }}>
          <Icon name="ArrowLeft" size={14} /> {window.t("success.back")}
        </button>
        <div className="font-mono text-[11px]" style={{ color: t.textDim }}>Receipt sent to your inbox.</div>
      </div>
    </motion.div>
  );
};

Object.assign(window, { DetailPage, CheckoutOverlay, SuccessScreen });
