// Cart context + Cart page + multi-step checkout flow + multi-key success screen
const { useState: useStateC, useEffect: useEffectC, useMemo: useMemoC, useContext: useContextC, createContext: createContextC, useRef: useRefC } = React;

// ---------- Cart context ----------
const CartContext = createContextC(null);
const useCart = () => useContextC(CartContext);

const CART_STORAGE_KEY = "kf-cart-v1";

const CartProvider = ({ children }) => {
  const [items, setItems] = useStateC(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  });

  useEffectC(() => {
    try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const add = (game, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.game.id === game.id);
      if (existing) return prev.map((it) => it.game.id === game.id ? { ...it, qty: Math.min(it.qty + qty, 9) } : it);
      return [...prev, { game, qty }];
    });
  };
  const remove = (gameId) => setItems((prev) => prev.filter((it) => it.game.id !== gameId));
  const setQty = (gameId, qty) => setItems((prev) => prev.map((it) => it.game.id === gameId ? { ...it, qty: Math.max(1, Math.min(9, qty)) } : it));
  const clear = () => setItems([]);

  const count = items.reduce((s, it) => s + it.qty, 0);
  const subtotal = items.reduce((s, it) => s + it.game.price * it.qty, 0);

  const ctx = useMemoC(() => ({ items, add, remove, setQty, clear, count, subtotal }), [items]);
  return <CartContext.Provider value={ctx}>{children}</CartContext.Provider>;
};

// ---------- helpers ----------
const FEE_PCT = 0.029;
const computeTotals = (items, currency) => {
  const subtotal = items.reduce((s, it) => s + it.game.price * it.qty, 0);
  const fee = +(subtotal * FEE_PCT).toFixed(2);
  const total = +(subtotal + fee).toFixed(2);
  return { subtotal, fee, total };
};

// shared "Added to cart" toast
const useToast = () => {
  const [toast, setToast] = useStateC(null);
  const show = (msg) => {
    setToast(msg);
    clearTimeout(window.__kfToastTm);
    window.__kfToastTm = setTimeout(() => setToast(null), 2200);
  };
  return [toast, show];
};

// ---------- Cart page ----------
const CartPage = ({ onContinue, onCheckout, onOpenGame }) => {
  const { theme, currency } = useApp();
  const tk = tokens(theme);
  const { items, remove, setQty, count, subtotal } = useCart();
  const { fee, total } = computeTotals(items, currency);
  const empty = items.length === 0;

  return (
    <motion.div key="cart" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="max-w-[1280px] mx-auto px-6 lg:px-10 py-10">
      <div className="mb-8">
        <div className="font-mono text-[11px] tracking-[0.22em]" style={{ color: tk.textDim }}>{t("cart.eyebrow")}</div>
        <h1 className="mt-2 font-display text-[44px] leading-[1.05] font-semibold" style={{ color: tk.text }}>
          {t("cart.h1a")} <span style={{ color: tk.accent }}>{t("cart.h1b")}</span>
        </h1>
        <p className="mt-3 max-w-[60ch]" style={{ color: tk.textMuted }}>
          {empty ? t("cart.emptyLede") : t("cart.lede", { n: count })}
        </p>
      </div>

      {empty ? (
        <div className="rounded-2xl border p-10 flex flex-col items-center text-center"
             style={{ background: tk.panelBg, borderColor: tk.borderSoft }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
               style={{ background: tk.accentBg, border: `1px solid ${tk.accent}` }}>
            <Icon name="ShoppingBag" size={22} color={tk.accent} />
          </div>
          <div className="font-display text-[20px]" style={{ color: tk.text }}>{t("cart.emptyTitle")}</div>
          <div className="mt-1 font-mono text-[11px] max-w-[40ch]" style={{ color: tk.textDim }}>{t("cart.emptySub")}</div>
          <button onClick={onContinue}
                  className="mt-6 rounded-xl px-5 py-2.5 font-display font-medium text-[14px]"
                  style={{ background: tk.accent, color: theme === "light" ? "white" : "oklch(0.18 0.02 260)" }}>
            {t("cart.browse")}
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* line items */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: tk.panelBg, borderColor: tk.borderSoft }}>
            <div className="px-5 py-3 border-b grid grid-cols-[1fr_auto_auto_auto] gap-4 font-mono text-[10px] tracking-[0.18em]"
                 style={{ borderColor: tk.borderSoft, color: tk.textDim }}>
              <div>{t("cart.colItem")}</div>
              <div className="hidden sm:block w-24 text-center">{t("cart.colQty")}</div>
              <div className="w-20 text-right">{t("cart.colPrice")}</div>
              <div className="w-6"></div>
            </div>
            {items.map((it, idx) => {
              const plat = platformById(it.game.active_platform_id);
              const platTone = theme === "light" ? plat.toneLight : plat.tone;
              return (
                <div key={it.game.id} className="px-5 py-4 grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center"
                     style={{ borderTop: idx > 0 ? `1px solid ${tk.borderSoft}` : "none" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <button onClick={() => onOpenGame(it.game)}
                            className="w-14 h-[70px] rounded-md overflow-hidden shrink-0 border"
                            style={{ borderColor: tk.borderSoft }}>
                      <CoverArt id={it.game.cover} image={it.game.image} title={it.game.name} platform={plat} theme={theme} compact />
                    </button>
                    <div className="min-w-0">
                      <div className="font-mono text-[9px] tracking-[0.18em] uppercase truncate" style={{ color: tk.textDim }}>{it.game.studio}</div>
                      <button onClick={() => onOpenGame(it.game)}
                              className="font-display font-medium text-[15px] truncate text-left block max-w-full"
                              style={{ color: tk.text }}>{it.game.name}</button>
                      <div className="mt-1 inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded font-mono text-[9px] tracking-wide border"
                           style={{ borderColor: platTone, color: platTone }}>
                        {plat.name.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 rounded-lg border px-1 py-1 w-24 justify-center"
                       style={{ borderColor: tk.borderSoft }}>
                    <button onClick={() => setQty(it.game.id, it.qty - 1)} disabled={it.qty <= 1}
                            className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30"
                            style={{ color: tk.textMuted }}>
                      <Icon name="Minus" size={12} />
                    </button>
                    <span className="font-mono tabular-nums text-[13px] w-5 text-center" style={{ color: tk.text }}>{it.qty}</span>
                    <button onClick={() => setQty(it.game.id, it.qty + 1)} disabled={it.qty >= 9}
                            className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30"
                            style={{ color: tk.textMuted }}>
                      <Icon name="Plus" size={12} />
                    </button>
                  </div>
                  <div className="text-right w-20">
                    <div className="font-display font-semibold tabular-nums text-[15px]" style={{ color: tk.text }}>
                      {fmtMoney(it.game.price * it.qty, currency)}
                    </div>
                    {it.qty > 1 && (
                      <div className="font-mono text-[10px] tabular-nums" style={{ color: tk.textDim }}>
                        {it.qty} × {fmtMoney(it.game.price, currency)}
                      </div>
                    )}
                  </div>
                  <button onClick={() => remove(it.game.id)}
                          className="w-6 h-6 rounded flex items-center justify-center"
                          style={{ color: tk.textDim }} title={t("cart.remove")}>
                    <Icon name="X" size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* totals card */}
          <aside className="lg:sticky lg:top-20 self-start rounded-2xl border p-5"
                 style={{ background: tk.panelBg, borderColor: tk.border }}>
            <div className="font-mono text-[10px] tracking-[0.22em]" style={{ color: tk.textDim }}>{t("cart.summary")}</div>

            <div className="mt-4 space-y-2">
              <Row label={t("checkout.subtotal")} value={fmtMoney(subtotal, currency)} dim={tk.textMuted} text={tk.text} />
              <Row label={t("checkout.platformFee")} value={fmtMoney(fee, currency)} dim={tk.textMuted} text={tk.text} hint={t("cart.feePct", { p: (FEE_PCT*100).toFixed(1) })} />
            </div>

            <div className="mt-4 pt-4 border-t flex items-baseline justify-between" style={{ borderColor: tk.borderSoft }}>
              <div className="font-mono text-[11px] tracking-[0.18em]" style={{ color: tk.textDim }}>{t("checkout.total").toUpperCase()}</div>
              <div className="font-display font-semibold text-[24px] tabular-nums" style={{ color: tk.text }}>{fmtMoney(total, currency)}</div>
            </div>

            <button onClick={onCheckout}
                    className="mt-5 w-full rounded-xl py-3.5 font-display font-semibold text-[15px] flex items-center justify-center gap-2"
                    style={{ background: tk.accent, color: theme === "light" ? "white" : "oklch(0.18 0.02 260)" }}>
              <Icon name="ArrowRight" size={16} strokeWidth={2.25} /> {t("cart.toCheckout")}
            </button>
            <button onClick={onContinue}
                    className="mt-2 w-full rounded-xl py-2.5 font-display text-[13px] border"
                    style={{ borderColor: tk.borderSoft, color: tk.textMuted }}>
              {t("cart.keepShopping")}
            </button>

            <div className="mt-5 pt-4 border-t grid grid-cols-3 gap-2 text-center" style={{ borderColor: tk.borderSoft }}>
              <Trustlet2 icon="ShieldCheck" label={t("cart.trust1")} tk={tk} />
              <Trustlet2 icon="Zap" label={t("cart.trust2")} tk={tk} />
              <Trustlet2 icon="RotateCcw" label={t("cart.trust3")} tk={tk} />
            </div>
          </aside>
        </div>
      )}
    </motion.div>
  );
};

const Row = ({ label, value, dim, text, hint }) => (
  <div className="flex items-baseline justify-between font-mono text-[12px]">
    <div>
      <span style={{ color: dim }}>{label}</span>
      {hint && <span className="ml-1.5 text-[10px]" style={{ color: dim, opacity: 0.7 }}>{hint}</span>}
    </div>
    <span className="tabular-nums" style={{ color: text }}>{value}</span>
  </div>
);

const Trustlet2 = ({ icon, label, tk }) => (
  <div className="flex flex-col items-center gap-1">
    <Icon name={icon} size={13} color={tk.textMuted} />
    <div className="font-mono text-[9px] tracking-wide" style={{ color: tk.textDim }}>{label}</div>
  </div>
);

// ---------- Stepper header (shared by all checkout pages) ----------
const STEPS = [
  { key: "email",    label: "checkout.stepEmail" },
  { key: "payment",  label: "checkout.stepPayment" },
  { key: "details",  label: "checkout.stepDetails" },
  { key: "review",   label: "checkout.stepReview" },
];

const Stepper = ({ active, onJump }) => {
  const { theme } = useApp();
  const tk = tokens(theme);
  const activeIdx = STEPS.findIndex((s) => s.key === active);
  return (
    <div className="flex items-center gap-2 mb-8 overflow-x-auto">
      {STEPS.map((s, i) => {
        const state = i < activeIdx ? "done" : i === activeIdx ? "active" : "pending";
        const clickable = i < activeIdx;
        return (
          <React.Fragment key={s.key}>
            <button onClick={() => clickable && onJump(s.key)} disabled={!clickable}
                    className="flex items-center gap-2 shrink-0">
              <span className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-semibold"
                    style={{
                      background: state === "active" ? tk.accent : state === "done" ? tk.accentBg : (theme === "light" ? "oklch(0.94 0.005 260)" : "rgba(255,255,255,0.06)"),
                      color: state === "active" ? (theme === "light" ? "white" : "oklch(0.18 0.02 260)") : state === "done" ? tk.accent : tk.textDim,
                      border: state === "done" ? `1px solid ${tk.accent}` : "1px solid transparent",
                    }}>
                {state === "done" ? <Icon name="Check" size={11} strokeWidth={3} color={tk.accent} /> : i + 1}
              </span>
              <span className="font-mono text-[10px] tracking-[0.18em] hidden sm:block"
                    style={{ color: state === "active" ? tk.text : state === "done" ? tk.textMuted : tk.textDim }}>
                {t(s.label)}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span className="w-6 sm:w-10 h-px" style={{ background: i < activeIdx ? tk.accent : tk.borderSoft }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ---------- Mini summary (right side of checkout pages) ----------
const MiniSummary = ({ items, currency }) => {
  const { theme } = useApp();
  const tk = tokens(theme);
  const { subtotal, fee, total } = computeTotals(items, currency);
  return (
    <aside className="rounded-2xl border p-5 lg:sticky lg:top-20 self-start"
           style={{ background: tk.panelBg, borderColor: tk.border }}>
      <div className="font-mono text-[10px] tracking-[0.22em] mb-3" style={{ color: tk.textDim }}>{t("cart.summary")}</div>
      <div className="space-y-3 max-h-[260px] overflow-auto pr-1">
        {items.map((it) => {
          const plat = platformById(it.game.active_platform_id);
          return (
            <div key={it.game.id} className="flex items-center gap-3">
              <div className="w-10 h-12 rounded shrink-0 overflow-hidden border" style={{ borderColor: tk.borderSoft }}>
                <CoverArt id={it.game.cover} image={it.game.image} title={it.game.name} platform={plat} theme={theme} compact />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-[13px] truncate" style={{ color: tk.text }}>{it.game.name}</div>
                <div className="font-mono text-[10px]" style={{ color: tk.textDim }}>{plat.name} · ×{it.qty}</div>
              </div>
              <div className="font-mono text-[12px] tabular-nums" style={{ color: tk.text }}>{fmtMoney(it.game.price * it.qty, currency)}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t space-y-1.5" style={{ borderColor: tk.borderSoft }}>
        <Row label={t("checkout.subtotal")} value={fmtMoney(subtotal, currency)} dim={tk.textMuted} text={tk.text} />
        <Row label={t("checkout.platformFee")} value={fmtMoney(fee, currency)} dim={tk.textMuted} text={tk.text} />
        <div className="pt-2 mt-2 border-t flex items-baseline justify-between" style={{ borderColor: tk.borderSoft }}>
          <div className="font-mono text-[11px] tracking-[0.18em]" style={{ color: tk.textDim }}>{t("checkout.total").toUpperCase()}</div>
          <div className="font-display font-semibold text-[20px] tabular-nums" style={{ color: tk.text }}>{fmtMoney(total, currency)}</div>
        </div>
      </div>
    </aside>
  );
};

// ---------- Step shell ----------
const StepShell = ({ stepKey, onJump, title, subtitle, children, items, currency }) => {
  const { theme } = useApp();
  const tk = tokens(theme);
  return (
    <motion.div key={"step-" + stepKey} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="max-w-[1280px] mx-auto px-6 lg:px-10 py-10">
      <div className="mb-2">
        <div className="font-mono text-[11px] tracking-[0.22em]" style={{ color: tk.textDim }}>{t("checkout.eyebrow")}</div>
      </div>
      <Stepper active={stepKey} onJump={onJump} />
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="rounded-2xl border p-6 sm:p-8" style={{ background: tk.panelBg, borderColor: tk.border }}>
          <h2 className="font-display text-[26px] font-semibold leading-tight" style={{ color: tk.text }}>{title}</h2>
          {subtitle && <p className="mt-2 font-mono text-[12px]" style={{ color: tk.textDim }}>{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        <MiniSummary items={items} currency={currency} />
      </div>
    </motion.div>
  );
};

// ---------- Step 1 — Email / contact ----------
const StepEmail = ({ flow, setFlow, onNext, onBack, onJump, items, currency }) => {
  const { theme } = useApp();
  const tk = tokens(theme);
  const [touched, setTouched] = useStateC(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(flow.email || "");
  return (
    <StepShell stepKey="email" onJump={onJump} items={items} currency={currency}
               title={t("checkout.emailTitle")} subtitle={t("checkout.emailSub")}>
      <label className="block">
        <span className="font-mono text-[10px] tracking-[0.18em]" style={{ color: tk.textDim }}>{t("checkout.email")}</span>
        <input type="email" value={flow.email || ""} onChange={(e) => setFlow({ ...flow, email: e.target.value })}
               onBlur={() => setTouched(true)}
               placeholder="you@email.com"
               className="mt-1.5 w-full px-4 py-3 rounded-xl border font-mono text-[14px] outline-none transition"
               style={{
                 background: theme === "light" ? "oklch(0.99 0.005 260)" : "rgba(255,255,255,0.04)",
                 borderColor: touched && !valid ? "oklch(0.65 0.20 25)" : tk.borderSoft,
                 color: tk.text,
               }} />
        {touched && !valid && (
          <div className="mt-1.5 font-mono text-[10px]" style={{ color: "oklch(0.65 0.20 25)" }}>{t("checkout.emailInvalid")}</div>
        )}
      </label>

      <label className="mt-4 block">
        <span className="font-mono text-[10px] tracking-[0.18em]" style={{ color: tk.textDim }}>{t("checkout.fullName")}</span>
        <input type="text" value={flow.name || ""} onChange={(e) => setFlow({ ...flow, name: e.target.value })}
               placeholder="Mira Flux"
               className="mt-1.5 w-full px-4 py-3 rounded-xl border font-mono text-[14px] outline-none"
               style={{
                 background: theme === "light" ? "oklch(0.99 0.005 260)" : "rgba(255,255,255,0.04)",
                 borderColor: tk.borderSoft, color: tk.text,
               }} />
      </label>

      <label className="mt-4 inline-flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={!!flow.newsletter} onChange={(e) => setFlow({ ...flow, newsletter: e.target.checked })}
               className="w-4 h-4 accent-current" style={{ accentColor: tk.accent }} />
        <span className="font-mono text-[11px]" style={{ color: tk.textMuted }}>{t("checkout.newsletter")}</span>
      </label>

      <FooterNav onBack={onBack} backLabel={t("cart.backToCart")} onNext={() => valid && onNext()} nextDisabled={!valid} nextLabel={t("checkout.continue")} />
    </StepShell>
  );
};

// ---------- Step 2 — Payment method ----------
const StepPayment = ({ flow, setFlow, onNext, onBack, onJump, items, currency }) => {
  const { theme } = useApp();
  const tk = tokens(theme);
  const opts = [
    { id: 1, name: "Credit Card", desc: t("checkout.pmCardDesc"), icon: "CreditCard" },
    { id: 2, name: "PIX",         desc: t("checkout.pmPixDesc"),  icon: "Zap" },
    { id: 3, name: "PayPal",      desc: t("checkout.pmPpDesc"),   icon: "Wallet" },
    { id: 4, name: "Boleto",      desc: t("checkout.pmBoletoDesc"), icon: "FileText" },
  ];
  const sel = flow.method || 1;
  return (
    <StepShell stepKey="payment" onJump={onJump} items={items} currency={currency}
               title={t("checkout.paymentTitle")} subtitle={t("checkout.paymentSub")}>
      <div className="grid sm:grid-cols-2 gap-3">
        {opts.map((o) => {
          const active = sel === o.id;
          return (
            <button key={o.id} onClick={() => setFlow({ ...flow, method: o.id })}
                    className="text-left p-4 rounded-xl border transition flex items-start gap-3"
                    style={{
                      background: active ? tk.accentBg : (theme === "light" ? "oklch(0.99 0.005 260)" : "rgba(255,255,255,0.04)"),
                      borderColor: active ? tk.accent : tk.borderSoft,
                    }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                   style={{ background: active ? tk.accent : (theme === "light" ? "oklch(0.94 0.005 260)" : "rgba(255,255,255,0.07)"),
                            color: active ? (theme === "light" ? "white" : "oklch(0.18 0.02 260)") : tk.textMuted }}>
                <Icon name={o.icon} size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-medium text-[14px]" style={{ color: tk.text }}>{o.name}</div>
                <div className="font-mono text-[10px] mt-0.5" style={{ color: tk.textDim }}>{o.desc}</div>
              </div>
              <div className="w-4 h-4 rounded-full border-2 mt-1 shrink-0"
                   style={{ borderColor: active ? tk.accent : tk.borderSoft, background: active ? tk.accent : "transparent" }} />
            </button>
          );
        })}
      </div>
      <FooterNav onBack={onBack} backLabel={t("checkout.back")} onNext={onNext} nextLabel={t("checkout.continue")} />
    </StepShell>
  );
};

// ---------- Step 3 — Details (per method) ----------
const StepDetails = ({ flow, setFlow, onNext, onBack, onJump, items, currency }) => {
  const { theme } = useApp();
  const tk = tokens(theme);
  const m = flow.method || 1;

  const card = flow.card || { number: "", name: "", expiry: "", cvc: "" };
  const setCard = (patch) => setFlow({ ...flow, card: { ...card, ...patch } });

  const fmtCardNum = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  const fmtExp = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d;
  };

  let valid = false;
  if (m === 1) valid = (card.number || "").replace(/\s/g, "").length === 16 && (card.name || "").trim().length > 2 && /^\d{2}\/\d{2}$/.test(card.expiry || "") && (card.cvc || "").length >= 3;
  else if (m === 2) valid = !!flow.cpf && flow.cpf.replace(/\D/g, "").length === 11;
  else if (m === 3) valid = !!flow.paypalEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(flow.paypalEmail);
  else if (m === 4) valid = !!flow.cpf && flow.cpf.replace(/\D/g, "").length === 11;

  const inputCls = "mt-1.5 w-full px-4 py-3 rounded-xl border font-mono text-[14px] outline-none";
  const inputStyle = {
    background: theme === "light" ? "oklch(0.99 0.005 260)" : "rgba(255,255,255,0.04)",
    borderColor: tk.borderSoft, color: tk.text,
  };

  return (
    <StepShell stepKey="details" onJump={onJump} items={items} currency={currency}
               title={t("checkout.detailsTitle")} subtitle={t("checkout.detailsSub")}>
      {m === 1 && (
        <div className="space-y-4">
          {/* card preview */}
          <div className="rounded-2xl p-5 relative overflow-hidden"
               style={{ background: theme === "light"
                 ? "linear-gradient(135deg, oklch(0.30 0.05 260), oklch(0.45 0.08 220))"
                 : "linear-gradient(135deg, oklch(0.30 0.06 260), oklch(0.40 0.10 220))",
                 color: "white" }}>
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] tracking-[0.18em] opacity-70">DEBIT / CREDIT</div>
              <Icon name="Wifi" size={16} className="rotate-90 opacity-70" />
            </div>
            <div className="mt-8 font-mono text-[18px] tracking-[0.18em] tabular-nums">
              {(card.number || "•••• •••• •••• ••••").padEnd(19, "•").replace(/(.{4})(?=.)/g, "$1 ").trim()}
            </div>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <div className="font-mono text-[9px] opacity-60 tracking-[0.18em]">CARDHOLDER</div>
                <div className="font-display text-[13px] truncate uppercase">{card.name || "—"}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[9px] opacity-60 tracking-[0.18em]">EXP</div>
                <div className="font-mono text-[13px] tabular-nums">{card.expiry || "MM/YY"}</div>
              </div>
            </div>
          </div>

          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.18em]" style={{ color: tk.textDim }}>{t("checkout.cardNumber")}</span>
            <input value={card.number} onChange={(e) => setCard({ number: fmtCardNum(e.target.value) })}
                   placeholder="4242 4242 4242 4242" className={inputCls} style={inputStyle} inputMode="numeric" />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.18em]" style={{ color: tk.textDim }}>{t("checkout.cardName")}</span>
            <input value={card.name} onChange={(e) => setCard({ name: e.target.value })}
                   placeholder="Mira Flux" className={inputCls} style={inputStyle} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="font-mono text-[10px] tracking-[0.18em]" style={{ color: tk.textDim }}>{t("checkout.cardExp")}</span>
              <input value={card.expiry} onChange={(e) => setCard({ expiry: fmtExp(e.target.value) })}
                     placeholder="MM/YY" className={inputCls} style={inputStyle} inputMode="numeric" />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] tracking-[0.18em]" style={{ color: tk.textDim }}>{t("checkout.cardCvc")}</span>
              <input value={card.cvc} onChange={(e) => setCard({ cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                     placeholder="123" className={inputCls} style={inputStyle} inputMode="numeric" />
            </label>
          </div>
        </div>
      )}

      {m === 2 && (
        <div className="space-y-5">
          <div className="rounded-xl border p-4 flex items-start gap-3"
               style={{ background: tk.accentBg, borderColor: tk.accent }}>
            <Icon name="Zap" size={16} color={tk.accent} />
            <div className="flex-1 font-mono text-[11px]" style={{ color: tk.text }}>{t("checkout.pixHelp")}</div>
          </div>
          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.18em]" style={{ color: tk.textDim }}>CPF</span>
            <input value={flow.cpf || ""} onChange={(e) => setFlow({ ...flow, cpf: e.target.value })}
                   placeholder="123.456.789-00" className={inputCls} style={inputStyle} inputMode="numeric" />
          </label>
          <div className="rounded-xl border p-4 flex flex-col items-center"
               style={{ background: theme === "light" ? "oklch(0.99 0.005 260)" : "rgba(255,255,255,0.04)", borderColor: tk.borderSoft }}>
            <div className="w-32 h-32 rounded grid grid-cols-12 grid-rows-12 gap-px p-2"
                 style={{ background: tk.text }}>
              {/* fake QR pattern */}
              {Array.from({ length: 144 }).map((_, i) => (
                <div key={i} style={{ background: ((i * 7 + (i % 11)) % 3) ? "transparent" : tk.panelBg }} />
              ))}
            </div>
            <div className="mt-3 font-mono text-[10px]" style={{ color: tk.textDim }}>{t("checkout.scanQr")}</div>
          </div>
        </div>
      )}

      {m === 3 && (
        <div className="space-y-4">
          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.18em]" style={{ color: tk.textDim }}>{t("checkout.paypalEmail")}</span>
            <input type="email" value={flow.paypalEmail || ""} onChange={(e) => setFlow({ ...flow, paypalEmail: e.target.value })}
                   placeholder="you@paypal.com" className={inputCls} style={inputStyle} />
          </label>
          <div className="rounded-xl border p-4 font-mono text-[11px] flex items-start gap-2"
               style={{ background: theme === "light" ? "oklch(0.99 0.005 260)" : "rgba(255,255,255,0.04)",
                        borderColor: tk.borderSoft, color: tk.textMuted }}>
            <Icon name="ExternalLink" size={14} /> {t("checkout.paypalRedirect")}
          </div>
        </div>
      )}

      {m === 4 && (
        <div className="space-y-4">
          <div className="rounded-xl border p-4 flex items-start gap-3"
               style={{ background: theme === "light" ? "oklch(0.99 0.005 260)" : "rgba(255,255,255,0.04)", borderColor: tk.borderSoft }}>
            <Icon name="FileText" size={16} color={tk.textMuted} />
            <div className="flex-1 font-mono text-[11px]" style={{ color: tk.textMuted }}>{t("checkout.boletoHelp")}</div>
          </div>
          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.18em]" style={{ color: tk.textDim }}>CPF</span>
            <input value={flow.cpf || ""} onChange={(e) => setFlow({ ...flow, cpf: e.target.value })}
                   placeholder="123.456.789-00" className={inputCls} style={inputStyle} inputMode="numeric" />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.18em]" style={{ color: tk.textDim }}>{t("checkout.fullName")}</span>
            <input value={flow.name || ""} onChange={(e) => setFlow({ ...flow, name: e.target.value })}
                   placeholder="Mira Flux" className={inputCls} style={inputStyle} />
          </label>
        </div>
      )}

      <FooterNav onBack={onBack} backLabel={t("checkout.back")} onNext={() => valid && onNext()} nextDisabled={!valid} nextLabel={t("checkout.continue")} />
    </StepShell>
  );
};

// ---------- Step 4 — Review ----------
const StepReview = ({ flow, onBack, onConfirm, onJump, items, currency }) => {
  const { theme } = useApp();
  const tk = tokens(theme);
  const methodName = ({ 1: "Credit Card", 2: "PIX", 3: "PayPal", 4: "Boleto" })[flow.method || 1];
  const methodDesc = (() => {
    if (flow.method === 1 && flow.card?.number) return `•••• ${flow.card.number.replace(/\s/g, "").slice(-4)}`;
    if (flow.method === 2) return flow.cpf || "—";
    if (flow.method === 3) return flow.paypalEmail || "—";
    if (flow.method === 4) return flow.cpf || "—";
    return "—";
  })();

  return (
    <StepShell stepKey="review" onJump={onJump} items={items} currency={currency}
               title={t("checkout.reviewTitle")} subtitle={t("checkout.reviewSub")}>
      <div className="space-y-3">
        <ReviewBlock title={t("checkout.email")} value={flow.email} editKey="email" onJump={onJump} tk={tk} />
        <ReviewBlock title={t("checkout.fullName")} value={flow.name || "—"} editKey="email" onJump={onJump} tk={tk} />
        <ReviewBlock title={t("checkout.payMethod")} value={`${methodName} · ${methodDesc}`} editKey="payment" onJump={onJump} tk={tk} />
      </div>

      <div className="mt-6 rounded-xl border p-4 flex items-start gap-3"
           style={{ background: tk.accentBg, borderColor: tk.accent }}>
        <Icon name="Lock" size={14} color={tk.accent} />
        <div className="font-mono text-[11px]" style={{ color: tk.text }}>{t("checkout.secured")}</div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button onClick={onBack}
                className="px-5 py-3 rounded-xl border font-display text-[14px]"
                style={{ borderColor: tk.borderSoft, color: tk.textMuted }}>{t("checkout.back")}</button>
        <button onClick={onConfirm}
                className="flex-1 rounded-xl py-3 font-display font-semibold text-[15px] flex items-center justify-center gap-2"
                style={{ background: tk.accent, color: theme === "light" ? "white" : "oklch(0.18 0.02 260)" }}>
          <Icon name="Lock" size={15} strokeWidth={2.25} /> {t("checkout.confirmAndPay")}
        </button>
      </div>
    </StepShell>
  );
};

const ReviewBlock = ({ title, value, editKey, onJump, tk }) => (
  <div className="flex items-center justify-between gap-4 p-4 rounded-xl border"
       style={{ background: "transparent", borderColor: tk.borderSoft }}>
    <div className="min-w-0">
      <div className="font-mono text-[10px] tracking-[0.18em]" style={{ color: tk.textDim }}>{title}</div>
      <div className="mt-1 font-display text-[14px] truncate" style={{ color: tk.text }}>{value}</div>
    </div>
    <button onClick={() => onJump(editKey)} className="font-mono text-[11px]" style={{ color: tk.accent }}>
      {t("checkout.edit")}
    </button>
  </div>
);

const FooterNav = ({ onBack, backLabel, onNext, nextLabel, nextDisabled }) => {
  const { theme } = useApp(); const tk = tokens(theme);
  return (
    <div className="mt-8 flex flex-col sm:flex-row gap-3">
      <button onClick={onBack}
              className="px-5 py-3 rounded-xl border font-display text-[14px]"
              style={{ borderColor: tk.borderSoft, color: tk.textMuted }}>{backLabel}</button>
      <button onClick={onNext} disabled={nextDisabled}
              className="flex-1 rounded-xl py-3 font-display font-semibold text-[15px] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: tk.accent, color: theme === "light" ? "white" : "oklch(0.18 0.02 260)" }}>
        {nextLabel} <Icon name="ArrowRight" size={15} strokeWidth={2.25} />
      </button>
    </div>
  );
};

// ---------- Multi-key success ----------
const KEY_ALPHABET2 = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const randKey2 = (prefix) => {
  const seg = (n) => Array.from({ length: n }, () => KEY_ALPHABET2[Math.floor(Math.random() * KEY_ALPHABET2.length)]).join("");
  return `${prefix}-${seg(5)}-${seg(5)}-${seg(5)}`;
};

const CartSuccessScreen = ({ items, flow, onBackToStore }) => {
  const { theme, currency } = useApp();
  const tk = tokens(theme);
  const generated = useMemoC(() => items.flatMap((it) => Array.from({ length: it.qty }, () => {
    const plat = platformById(it.game.active_platform_id);
    const prefix = plat.name.toUpperCase().replace(/\s/g, "").slice(0, 6);
    return { game: it.game, plat, key: randKey2(prefix) };
  })), []);
  const totals = computeTotals(items, currency);
  const orderId = useMemoC(() => `KF-${Date.now().toString().slice(-8)}`, []);

  return (
    <motion.div key="cart-success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="max-w-[920px] mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.1 }}
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: tk.accentBg, border: `1px solid ${tk.accent}` }}>
          <Icon name="Check" size={18} color={tk.accent} strokeWidth={2.5} />
        </motion.div>
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em]" style={{ color: tk.textDim }}>{t("success.orderId")}{orderId}</div>
          <div className="font-display text-[22px] mt-0.5" style={{ color: tk.text }}>
            {generated.length === 1 ? t("success.title") : t("cartSuccess.title", { n: generated.length })}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {generated.map((g, i) => (
          <KeyCard key={i} game={g.game} plat={g.plat} keyStr={g.key} tk={tk} theme={theme} />
        ))}
      </div>

      <div className="mt-6 rounded-2xl border p-5" style={{ background: tk.panelBg, borderColor: tk.borderSoft }}>
        <div className="font-mono text-[10px] tracking-[0.22em] mb-3" style={{ color: tk.textDim }}>{t("success.receipt")}</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
          <ReceiptCell label={t("success.method")} value={({1:"Card",2:"PIX",3:"PayPal",4:"Boleto"})[flow.method||1]} tk={tk} />
          <ReceiptCell label={t("checkout.email")} value={flow.email || "—"} tk={tk} />
          <ReceiptCell label={t("checkout.subtotal")} value={fmtMoney(totals.subtotal, currency)} tk={tk} />
          <ReceiptCell label={t("checkout.total")} value={fmtMoney(totals.total, currency)} tk={tk} accent />
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button onClick={onBackToStore} className="font-mono text-[11px] tracking-[0.18em] inline-flex items-center gap-2"
                style={{ color: tk.textMuted }}>
          <Icon name="ArrowLeft" size={14} /> {t("success.back")}
        </button>
        <div className="font-mono text-[11px]" style={{ color: tk.textDim }}>{t("cartSuccess.emailed", { email: flow.email })}</div>
      </div>
    </motion.div>
  );
};

const ReceiptCell = ({ label, value, tk, accent }) => (
  <div className="rounded-xl px-3 py-2 border" style={{ borderColor: tk.borderSoft }}>
    <div className="text-[9px] tracking-[0.2em]" style={{ color: tk.textDim }}>{label}</div>
    <div className="mt-0.5 font-display text-[13px] tabular-nums truncate" style={{ color: accent ? tk.accent : tk.text }}>{value}</div>
  </div>
);

const KeyCard = ({ game, plat, keyStr, tk, theme }) => {
  const [copied, setCopied] = useStateC(false);
  const [revealed, setRevealed] = useStateC(false);
  const platTone = theme === "light" ? plat.toneLight : plat.tone;
  const copy = async () => {
    try { await navigator.clipboard.writeText(keyStr); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="rounded-2xl border overflow-hidden flex flex-col sm:flex-row"
         style={{ background: tk.panelBg, borderColor: tk.borderSoft }}>
      <div className="w-full sm:w-32 sm:h-auto h-32 shrink-0 border-b sm:border-b-0 sm:border-r" style={{ borderColor: tk.borderSoft }}>
        <CoverArt id={game.cover} image={game.image} title={game.name} platform={plat} theme={theme} compact />
      </div>
      <div className="flex-1 p-4 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[9px] tracking-[0.18em]" style={{ color: platTone }}>{plat.name.toUpperCase()} · ACTIVATION KEY</div>
            <div className="font-display font-medium text-[16px] truncate" style={{ color: tk.text }}>{game.name}</div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded shrink-0"
               style={{ background: tk.accentBg, color: tk.accent }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            <span className="font-mono text-[9px] tracking-wider">SOLD</span>
          </div>
        </div>
        <button onClick={() => setRevealed(true)}
                className="mt-3 rounded-lg p-3 text-center border font-mono text-[16px] tracking-[0.18em] tabular-nums select-all relative overflow-hidden"
                style={{ background: theme === "light" ? "oklch(0.96 0.005 260)" : "rgba(0,0,0,0.3)", borderColor: tk.borderSoft, color: tk.text,
                         filter: revealed ? "none" : "blur(6px)", letterSpacing: "0.18em" }}>
          {keyStr}
        </button>
        {!revealed && (
          <div className="mt-1 font-mono text-[9px] tracking-wide" style={{ color: tk.textDim }}>{t("cartSuccess.tapReveal")}</div>
        )}
        <div className="mt-3 flex gap-2">
          <button onClick={copy} disabled={!revealed}
                  className="flex-1 rounded-lg py-2 font-display text-[12px] flex items-center justify-center gap-1.5 disabled:opacity-40"
                  style={{ background: revealed ? tk.text : (theme === "light" ? "oklch(0.92 0.005 260)" : "rgba(255,255,255,0.10)"),
                           color: revealed ? tk.pageBg : tk.textDim }}>
            {copied ? <><Icon name="Check" size={12} strokeWidth={3} /> {t("success.copied")}</> : <><Icon name="Copy" size={12} /> {t("success.copy")}</>}
          </button>
          <button className="flex-1 rounded-lg py-2 font-display text-[12px] border flex items-center justify-center gap-1.5"
                  style={{ borderColor: tk.borderSoft, color: tk.text }}>
            <Icon name="ExternalLink" size={12} /> {t("success.activate", { plat: plat.name })}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Cart icon button (used in TopNav) ----------
const CartButton = ({ onClick }) => {
  const { theme } = useApp();
  const tk = tokens(theme);
  const cart = useCart();
  const count = cart?.count || 0;
  return (
    <button onClick={onClick}
            className="relative w-8 h-8 rounded-lg flex items-center justify-center border transition"
            style={{ background: theme === "light" ? tk.elevBg : "rgba(255,255,255,0.04)", borderColor: tk.borderSoft, color: tk.textMuted }}
            title={t("cart.title")}>
      <Icon name="ShoppingBag" size={14} />
      <AnimatePresence>
        {count > 0 && (
          <motion.span key="badge" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                       className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center font-mono text-[9px] font-bold"
                       style={{ background: tk.accent, color: theme === "light" ? "white" : "oklch(0.18 0.02 260)" }}>
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

// ---------- Toast ----------
const CartToast = ({ message }) => {
  const { theme } = useApp();
  const tk = tokens(theme);
  return (
    <AnimatePresence>
      {message && (
        <motion.div key="toast" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-xl border shadow-xl flex items-center gap-2"
                    style={{ background: tk.panelBg, borderColor: tk.accent, color: tk.text,
                             boxShadow: theme === "light" ? "0 12px 32px -12px rgba(0,0,0,0.25)" : "0 12px 32px -10px rgba(0,0,0,0.6)" }}>
          <Icon name="Check" size={14} color={tk.accent} strokeWidth={2.5} />
          <span className="font-mono text-[12px]">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

Object.assign(window, {
  CartProvider, useCart, CartContext,
  CartPage, StepEmail, StepPayment, StepDetails, StepReview,
  CartSuccessScreen, CartButton, CartToast, computeTotals, useToast,
});
