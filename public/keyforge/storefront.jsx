// Storefront views: TopNav, Vitrine, GameCard
const { useState: useStateSF, useEffect: useEffectSF, useMemo: useMemoSF } = React;

// Reads the Next.js AuthContext payload that lives in localStorage under
// "keyvault-auth". The KEYFORGE SPA itself is anonymous; admin gating just
// looks for {role:"admin"} on that record.
const readKeyvaultAuth = () => {
  try {
    const raw = typeof window !== "undefined" && localStorage.getItem("keyvault-auth");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

// ---------- Top nav ----------
const TopNav = ({ view, route, onNavigate, onCartClick }) => {
  const { theme, setTheme, currency, setCurrency, language, setLanguage } = useApp();
  const tk = tokens(theme);
  const [profileOpen, setProfileOpen] = useStateSF(false);
  const [authedUser, setAuthedUser] = useStateSF(null);
  const profileRef = React.useRef(null);

  useEffectSF(() => {
    setAuthedUser(readKeyvaultAuth());
    const onStorage = (e) => { if (e.key === "keyvault-auth") setAuthedUser(readKeyvaultAuth()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isAdmin = authedUser?.role === "admin";

  useEffectSF(() => {
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    if (profileOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [profileOpen]);

  const navItems = [
    { key: "store", label: t("nav.store") },
    { key: "deals", label: t("nav.deals") },
    { key: "library", label: t("nav.library") },
  ];

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl border-b"
            style={{ background: tk.navBg, borderColor: tk.borderSoft }}>
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-14 flex items-center justify-between">
        <button onClick={() => onNavigate({ route: "store" })} className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: tk.accent }}>
            <Icon name="Key" size={14} color={theme === "light" ? "white" : "oklch(0.18 0.02 260)"} strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <div className="font-display font-semibold text-[15px] leading-none tracking-tight" style={{ color: tk.text }}>KEYFORGE</div>
            <div className="font-mono text-[9px] tracking-[0.2em] mt-0.5" style={{ color: tk.textDim }}>DIGITAL KEY VAULT</div>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-6 font-mono text-[11px] tracking-[0.16em]">
          {navItems.map((it) => (
            <button key={it.key} onClick={() => onNavigate({ route: it.key })}
                    style={{ color: route === it.key ? tk.text : tk.textMuted }}>{it.label}</button>
          ))}
          {isAdmin && (
            <button onClick={() => { window.location.href = "/admin"; }}
                    style={{ color: route === "admin" ? tk.accent : tk.textMuted }}>
              {t("nav.admin")}
            </button>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border transition"
                  style={{ background: theme === "light" ? tk.elevBg : "rgba(255,255,255,0.04)", borderColor: tk.borderSoft }}
                  title={theme === "light" ? t("nav.themeToDark") : t("nav.themeToLight")}>
            <Icon name={theme === "light" ? "Moon" : "Sun"} size={14} color={tk.textMuted} />
          </button>

          <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px]"
                  style={{ background: theme === "light" ? tk.elevBg : "rgba(255,255,255,0.04)", borderColor: tk.borderSoft, color: tk.textMuted }}>
            <Icon name="Search" size={13} /> {t("nav.search")}
          </button>

          {onCartClick && <CartButton onClick={onCartClick} />}

          <div className="relative" ref={profileRef}>
            <button onClick={() => setProfileOpen((o) => !o)}
                    className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition relative"
                    style={{ background: "linear-gradient(135deg, oklch(0.85 0.18 165), oklch(0.65 0.16 220))",
                             borderColor: profileOpen ? tk.accent : "transparent" }}>
              <span className="font-display font-semibold text-[12px]" style={{ color: "oklch(0.18 0.02 260)" }}>M</span>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full font-mono text-[7px] flex items-center justify-center font-bold"
                    style={{ background: tk.panelBg, color: tk.text, border: `1px solid ${tk.border}` }}>
                {CURRENCIES[currency].symbol}
              </span>
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
                  className="absolute right-0 top-full mt-2 w-72 rounded-2xl border shadow-2xl overflow-hidden"
                  style={{ background: tk.panelBg, borderColor: tk.border, boxShadow: theme === "light" ? "0 24px 60px -20px rgba(0,0,0,0.18)" : "0 24px 60px -20px rgba(0,0,0,0.6)" }}
                >
                  <div className="p-4 border-b" style={{ borderColor: tk.borderSoft }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                           style={{ background: "linear-gradient(135deg, oklch(0.85 0.18 165), oklch(0.65 0.16 220))" }}>
                        <span className="font-display font-semibold text-[14px]" style={{ color: "oklch(0.18 0.02 260)" }}>M</span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-[14px] font-medium truncate" style={{ color: tk.text }}>Mira Okafor</div>
                        <div className="font-mono text-[10px] tracking-wider truncate" style={{ color: tk.textDim }}>@miraflux · {fmtMoney(142.50, currency)} {t("profile.wallet")}</div>
                      </div>
                    </div>
                  </div>

                  {/* language selector */}
                  <div className="p-3 pb-2">
                    <div className="font-mono text-[10px] tracking-[0.18em] mb-2 px-1" style={{ color: tk.textDim }}>{t("profile.language")}</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.values(LANGUAGES).map((L) => {
                        const active = language === L.code;
                        return (
                          <button key={L.code} onClick={() => setLanguage(L.code)}
                                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg border transition text-left"
                                  style={{
                                    background: active ? tk.accentBg : (theme === "light" ? tk.elevBg : "rgba(255,255,255,0.03)"),
                                    borderColor: active ? tk.accent : tk.borderSoft,
                                  }}>
                            <span className="text-[16px] leading-none">{L.flag}</span>
                            <div className="min-w-0 flex-1">
                              <div className="font-mono text-[11px] font-semibold leading-tight" style={{ color: active ? tk.accent : tk.text }}>{L.short}</div>
                              <div className="font-mono text-[9px] leading-tight truncate" style={{ color: tk.textDim }}>{L.label}</div>
                            </div>
                            {active && <Icon name="Check" size={12} color={tk.accent} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* currency selector */}
                  <div className="p-3 pt-2">
                    <div className="font-mono text-[10px] tracking-[0.18em] mb-2 px-1" style={{ color: tk.textDim }}>{t("profile.currency")}</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.values(CURRENCIES).map((c) => {
                        const active = currency === c.code;
                        return (
                          <button key={c.code} onClick={() => { setCurrency(c.code); }}
                                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg border transition text-left"
                                  style={{
                                    background: active ? tk.accentBg : (theme === "light" ? tk.elevBg : "rgba(255,255,255,0.03)"),
                                    borderColor: active ? tk.accent : tk.borderSoft,
                                  }}>
                            <span className="text-[16px] leading-none">{c.flag}</span>
                            <div className="min-w-0">
                              <div className="font-mono text-[11px] font-semibold leading-tight" style={{ color: active ? tk.accent : tk.text }}>{c.code}</div>
                              <div className="font-mono text-[9px] leading-tight truncate" style={{ color: tk.textDim }}>{c.symbol} · {c.rate.toFixed(2)}</div>
                            </div>
                            {active && <Icon name="Check" size={12} color={tk.accent} className="ml-auto" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-2 border-t" style={{ borderColor: tk.borderSoft }}>
                    {[
                      { icon: "User",     label: t("profile.account") },
                      { icon: "Heart",    label: t("profile.wishlist"), count: WISHLIST.filter((w) => w.user_id === 1).length },
                      { icon: "Library",  label: t("profile.library") },
                      { icon: "Receipt",  label: t("profile.orders") },
                      ...(isAdmin
                        ? [{ icon: "ShieldCheck", label: t("profile.admin"), action: () => { window.location.href = "/admin"; } }]
                        : []),
                    ].map((m) => (
                      <button key={m.label}
                              onClick={() => { setProfileOpen(false); m.action && m.action(); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left"
                              style={{ color: tk.text }}
                              onMouseEnter={(e) => e.currentTarget.style.background = theme === "light" ? tk.elevBg : "rgba(255,255,255,0.05)"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <Icon name={m.icon} size={14} color={tk.textMuted} />
                        <span className="font-display text-[13px]">{m.label}</span>
                        {m.count != null && (
                          <span className="ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded"
                                style={{ background: tk.accentBg, color: tk.accent }}>
                            {m.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="p-2 border-t" style={{ borderColor: tk.borderSoft }}>
                    <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left" style={{ color: tk.warn }}>
                      <Icon name="LogOut" size={14} />
                      <span className="font-display text-[13px]">{t("profile.signout")}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

// ---------- GameCard ----------
const GameCard = ({ game, onOpen, dense = false }) => {
  const { theme, currency } = useApp();
  const tk = tokens(theme);
  const [hover, setHover] = useStateSF(false);
  const cardRef = React.useRef(null);
  const [popRect, setPopRect] = useStateSF(null);
  useEffectSF(() => {
    if (!hover || !dense || !cardRef.current) { setPopRect(null); return; }
    const update = () => {
      const r = cardRef.current?.getBoundingClientRect();
      if (r) setPopRect({ left: r.left, top: r.bottom - 8, width: r.width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [hover, dense]);
  const plat = platformById(game.active_platform_id);
  const platTone = theme === "light" ? plat.toneLight : plat.tone;
  const available = availableKeysOf(game.id);
  const soldOut = available === 0;
  const rating = GAME_RATING_AGG[game.id];
  const genres = genresOf(game.id);
  const log = priceLogOf(game.id);
  const msrp = log.length ? log[0].old_price : game.price;
  const discount = Math.round((1 - game.price / msrp) * 100);

  const card = (
    <motion.button
      ref={cardRef}
      type="button"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)} onBlur={() => setHover(false)}
      onClick={() => !soldOut && onOpen(game)}
      whileHover={!soldOut ? { scale: 1.025, y: -4 } : {}}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={cls("group relative text-left rounded-2xl border w-full flex flex-col",
        "focus:outline-none", soldOut && "opacity-70 cursor-not-allowed")}
      style={{
        background: tk.panelBg,
        borderColor: hover ? tk.accent : tk.borderSoft,
        boxShadow: hover
          ? (theme === "light" ? "0 24px 60px -20px rgba(0,0,0,0.20)" : "0 24px 60px -20px rgba(0,0,0,0.55)")
          : (theme === "light" ? "0 8px 24px -16px rgba(0,0,0,0.12)" : "0 8px 24px -12px rgba(0,0,0,0.5)"),
      }}
    >
      <div className="relative aspect-[4/5] overflow-hidden shrink-0 rounded-t-2xl">
        <motion.div className="absolute inset-0" animate={{ scale: hover && !soldOut ? 1.06 : 1 }} transition={{ duration: 0.6 }}>
          <CoverArt id={game.cover} image={game.image} title={game.name} platform={plat} theme={theme} compact={dense} />
        </motion.div>

        {discount > 0 && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-md font-mono text-[11px] font-semibold tracking-wide"
               style={{ background: tk.accent, color: theme === "light" ? "white" : "oklch(0.18 0.02 260)" }}>
            −{discount}%
          </div>
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px] bg-black/50">
            <div className="font-mono text-xs tracking-[0.3em] text-white/80 border border-white/30 px-3 py-1.5 rounded">{t("card.soldOut")}</div>
          </div>
        )}

        <AnimatePresence>
          {hover && !soldOut && (
            <motion.div key="hov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-x-0 top-0 p-3 flex items-start justify-end">
              <motion.div initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}
                          className="px-2 py-1 rounded-md backdrop-blur-sm border flex items-center gap-1.5"
                          style={{ background: "rgba(0,0,0,0.55)", borderColor: "rgba(255,255,255,0.10)" }}>
                <Icon name="Star" size={12} color="oklch(0.85 0.18 70)" />
                <span className="font-mono text-[11px] text-white">{rating.avg.toFixed(1)}</span>
                <span className="font-mono text-[10px] text-white/40">({(rating.count/1000).toFixed(1)}k)</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={cls("relative flex-1", dense ? "p-2.5" : "p-4 pt-3.5")}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-mono text-[9px] tracking-[0.18em] uppercase truncate" style={{ color: tk.textDim }}>{game.studio}</div>
            <div className={cls("font-display font-medium truncate mt-0.5", dense ? "text-[13px]" : "text-[15px]")} style={{ color: tk.text }}>{game.name}</div>
          </div>
          <div className="text-right shrink-0">
            {msrp > game.price && (
              <div className="font-mono text-[9px] line-through tabular-nums" style={{ color: tk.textDim }}>{fmtMoney(msrp, currency)}</div>
            )}
            <div className={cls("font-display font-semibold tabular-nums", dense ? "text-[14px]" : "text-[16px]")} style={{ color: tk.accent }}>
              {fmtMoney(game.price, currency)}
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {hover && !soldOut && !dense && (
            <motion.div key="meta" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32 }}
                        className="overflow-hidden">
              <div className="pt-3 space-y-2.5">
                <RatingBar value={rating.avg} />
                <motion.div initial="hidden" animate="show"
                            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } } }}
                            className="flex flex-wrap gap-1.5">
                  <motion.span key="__plat"
                               variants={{ hidden: { y: 14, opacity: 0 }, show: { y: 0, opacity: 1 } }}
                               className="px-2 py-0.5 rounded-md font-mono text-[10px] tracking-wide border"
                               style={{ borderColor: platTone, color: platTone }}>
                    {plat.name.toUpperCase()}
                  </motion.span>
                  {genres.map((g) => (
                    <motion.span key={g} variants={{ hidden: { y: 14, opacity: 0 }, show: { y: 0, opacity: 1 } }}
                                 className="px-2 py-0.5 rounded-md font-mono text-[10px] border"
                                 style={{ color: tk.textMuted, background: theme === "light" ? tk.elevBg : "rgba(255,255,255,0.06)", borderColor: tk.borderSoft }}>
                      {g}
                    </motion.span>
                  ))}
                </motion.div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono text-[10px]" style={{ color: tk.textDim }}>{t("card.keysAvailable", { n: available.toLocaleString() })}</span>
                  <span className="font-mono text-[10px] flex items-center gap-1" style={{ color: tk.accent }}>
                    {t("card.view")} <Icon name="ArrowUpRight" size={11} />
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.button>
  );

  // Dense hover popover — rendered via portal so it escapes the row's overflow-x-auto clipping
  const popover = (hover && !soldOut && dense && popRect && typeof ReactDOM !== "undefined") ? ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div key="dense-pop"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.18 }}
                  className="fixed z-[60] rounded-xl border p-3 pointer-events-none"
                  style={{ left: popRect.left + 8, top: popRect.top, width: popRect.width - 16,
                           background: tk.panelBg, borderColor: tk.accent,
                           boxShadow: theme === "light" ? "0 16px 36px -16px rgba(0,0,0,0.28)" : "0 16px 36px -10px rgba(0,0,0,0.65)" }}>
        <RatingBar value={rating.avg} animate={false} />
        <div className="flex flex-wrap gap-1 mt-2">
          <span className="px-1.5 py-0.5 rounded font-mono text-[9px] tracking-wide border"
                style={{ borderColor: platTone, color: platTone }}>
            {plat.name.toUpperCase()}
          </span>
          {genres.slice(0, 3).map((g) => (
            <span key={g} className="px-1.5 py-0.5 rounded font-mono text-[9px] border"
                  style={{ color: tk.textMuted, background: theme === "light" ? tk.elevBg : "rgba(255,255,255,0.06)", borderColor: tk.borderSoft }}>{g}</span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 mt-2 border-t" style={{ borderColor: tk.borderSoft }}>
          <span className="font-mono text-[10px]" style={{ color: tk.textDim }}>{t("card.keysAvailable", { n: available.toLocaleString() })}</span>
          <span className="font-mono text-[10px] flex items-center gap-1" style={{ color: tk.accent }}>
            {t("card.view")} <Icon name="ArrowUpRight" size={11} />
          </span>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null;

  return (<>{card}{popover}</>);
};

// ---------- Horizontal row of cards (4 per visible row, scroll for more) ----------
const GameRow = ({ title, subtitle, games, onOpen }) => {
  const { theme } = useApp();
  const tk = tokens(theme);
  const scrollRef = React.useRef(null);
  const [canL, setCanL] = useStateSF(false);
  const [canR, setCanR] = useStateSF(true);

  const update = () => {
    const el = scrollRef.current; if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };
  useEffectSF(() => { update(); }, [games.length]);

  const scroll = (dir) => {
    const el = scrollRef.current; if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <div className="mb-10">
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="font-display text-[20px] font-medium" style={{ color: tk.text }}>{title}</div>
          {subtitle && <div className="font-mono text-[10px] tracking-wider mt-0.5" style={{ color: tk.textDim }}>{subtitle}</div>}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => scroll(-1)} disabled={!canL}
                  className="w-8 h-8 rounded-lg border flex items-center justify-center transition disabled:opacity-30"
                  style={{ background: tk.panelBg, borderColor: tk.borderSoft, color: tk.textMuted }}>
            <Icon name="ChevronLeft" size={14} />
          </button>
          <button onClick={() => scroll(1)} disabled={!canR}
                  className="w-8 h-8 rounded-lg border flex items-center justify-center transition disabled:opacity-30"
                  style={{ background: tk.panelBg, borderColor: tk.borderSoft, color: tk.textMuted }}>
            <Icon name="ChevronRight" size={14} />
          </button>
        </div>
      </div>
      <div ref={scrollRef} onScroll={update}
           className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x items-stretch"
           style={{ scrollbarWidth: "none" }}>
        <style>{`.row-scroll::-webkit-scrollbar { display: none }`}</style>
        {games.map((g) => (
          <div key={g.id} className="snap-start shrink-0 flex"
               style={{ width: "calc((100% - 3 * 1rem) / 4)", minWidth: 220 }}>
            <GameCard game={g} onOpen={onOpen} dense />
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- Game list row (horizontal) ----------
const GameListItem = ({ game, onOpen }) => {
  const { theme, currency } = useApp();
  const tk = tokens(theme);
  const plat = platformById(game.active_platform_id);
  const platTone = theme === "light" ? plat.toneLight : plat.tone;
  const available = availableKeysOf(game.id);
  const soldOut = available === 0;
  const rating = GAME_RATING_AGG[game.id];
  const genres = genresOf(game.id);
  const log = priceLogOf(game.id);
  const msrp = log.length ? log[0].old_price : game.price;
  const discount = Math.round((1 - game.price / msrp) * 100);

  return (
    <motion.button
      type="button"
      onClick={() => !soldOut && onOpen(game)}
      whileHover={!soldOut ? { x: 4 } : {}}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className={cls("w-full text-left rounded-2xl border overflow-hidden flex items-stretch gap-4 p-3",
        soldOut && "opacity-70 cursor-not-allowed")}
      style={{ background: tk.panelBg, borderColor: tk.borderSoft,
               boxShadow: theme === "light" ? "0 6px 18px -14px rgba(0,0,0,0.15)" : "0 6px 18px -10px rgba(0,0,0,0.4)" }}>
      <div className="w-[120px] aspect-[4/5] rounded-xl overflow-hidden shrink-0 relative">
        <CoverArt id={game.cover} image={game.image} title={game.name} platform={plat} theme={theme} compact />
        {discount > 0 && (
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded font-mono text-[9px] font-semibold"
               style={{ background: tk.accent, color: theme === "light" ? "white" : "oklch(0.18 0.02 260)" }}>
            −{discount}%
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 flex flex-col justify-between py-1">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono text-[10px] tracking-wide" style={{ color: platTone }}>{plat.name.toUpperCase()}</span>
            <span style={{ color: tk.textDim }}>·</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: tk.textDim }}>{game.studio}</span>
          </div>
          <div className="font-display text-[18px] font-medium leading-tight truncate" style={{ color: tk.text }}>{game.name}</div>
          <p className="text-[12px] mt-1 line-clamp-2 leading-snug" style={{ color: tk.textMuted }}>{game.tagline || game.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <div className="flex items-center gap-1" style={{ color: tk.text }}>
            <Icon name="Star" size={11} color="oklch(0.85 0.18 70)" />
            <span className="font-mono text-[11px] tabular-nums">{rating.avg.toFixed(1)}</span>
            <span className="font-mono text-[10px]" style={{ color: tk.textDim }}>({(rating.count/1000).toFixed(1)}k)</span>
          </div>
          <span style={{ color: tk.textDim }}>·</span>
          <span className="font-mono text-[10px]" style={{ color: tk.textDim }}>{available.toLocaleString()} keys</span>
          {genres.slice(0, 2).map((g) => (
            <span key={g} className="px-1.5 py-0.5 rounded font-mono text-[9px] border"
                  style={{ color: tk.textMuted, borderColor: tk.borderSoft }}>{g}</span>
          ))}
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-end justify-between py-1 pr-2">
        <div className="text-right">
          {msrp > game.price && (
            <div className="font-mono text-[10px] line-through tabular-nums" style={{ color: tk.textDim }}>{fmtMoney(msrp, currency)}</div>
          )}
          <div className="font-display text-[20px] font-semibold tabular-nums" style={{ color: tk.accent }}>{fmtMoney(game.price, currency)}</div>
        </div>
        <span className="font-mono text-[10px] flex items-center gap-1" style={{ color: tk.accent }}>
          {t("card.view")} <Icon name="ArrowUpRight" size={11} />
        </span>
      </div>
    </motion.button>
  );
};

const GameListGroup = ({ title, subtitle, games, onOpen }) => {
  const { theme } = useApp(); const tk = tokens(theme);
  return (
    <div className="mb-8">
      <div className="mb-3">
        <div className="font-display text-[20px] font-medium" style={{ color: tk.text }}>{title}</div>
        {subtitle && <div className="font-mono text-[10px] tracking-wider mt-0.5" style={{ color: tk.textDim }}>{subtitle}</div>}
      </div>
      <div className="flex flex-col gap-2.5">
        {games.map((g) => <GameListItem key={g.id} game={g} onOpen={onOpen} />)}
      </div>
    </div>
  );
};

// ---------- Vitrine (store) ----------
const Vitrine = ({ onOpen }) => {
  const { theme } = useApp();
  const tk = tokens(theme);
  const [filter, setFilter] = useStateSF("All");
  const [layout, setLayout] = useStateSF(() => localStorage.getItem("kf-layout") || "grid");
  useEffectSF(() => { localStorage.setItem("kf-layout", layout); }, [layout]);
  const platformOpts = ["All", ...PLATFORMS.map((p) => p.name)];
  const filtered = useMemoSF(() =>
    filter === "All" ? GAMES : GAMES.filter((g) => platformById(g.active_platform_id).name === filter),
    [filter]
  );
  const totalAvailable = KEY_INVENTORY.filter((k) => k.status_id === 1).reduce((a, b) => a + b.count, 0);

  // Build category rows when not filtered; otherwise show one big row
  const rows = useMemoSF(() => {
    if (filter !== "All") return [{ title: filter, sub: `${filtered.length} titles`, list: filtered }];
    const byGenre = (genreName, list) => list.filter((g) => genresOf(g.id).map(s => s.toLowerCase()).includes(genreName.toLowerCase())).slice(0, 12);
    const featured = [...GAMES].sort((a, b) => (GAME_RATING_AGG[b.id]?.avg || 0) - (GAME_RATING_AGG[a.id]?.avg || 0)).slice(0, 10);
    const onSale = GAMES.map((g) => {
      const log = priceLogOf(g.id);
      const msrp = log.length ? log[0].old_price : g.price;
      return { g, d: 1 - g.price / msrp };
    }).filter((x) => x.d > 0).sort((a, b) => b.d - a.d).slice(0, 12).map((x) => x.g);
    const action = byGenre("action", GAMES);
    const rpg = byGenre("rpg", GAMES);
    const indie = byGenre("indie", GAMES);
    const strategy = byGenre("strategy", GAMES);
    return [
      { title: "Em destaque", titleEn: "Featured", sub: "melhores avaliados", list: featured },
      { title: "Em promoção", titleEn: "On sale", sub: "Maior queda vs. preço de pico", list: onSale },
      { title: "Ação", titleEn: "Action", sub: "jogos de ação", list: action },
      { title: "RPG", titleEn: "RPG", sub: "RPG", list: rpg },
      { title: "Indie", titleEn: "Indie", sub: "indie", list: indie },
      { title: "Estratégia", titleEn: "Strategy", sub: "estratégia", list: strategy },
    ].filter((r) => r.list.length > 0);
  }, [filter, filtered]);

  const lang = useApp().language;

  return (
    <motion.div key="vitrine" initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="max-w-[1280px] mx-auto px-6 lg:px-10 py-8">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="font-mono text-[11px] tracking-[0.22em]" style={{ color: tk.textDim }}>{t("vitrine.eyebrow")}</div>
          <h1 className="mt-2 font-display text-[44px] leading-[1.05] font-semibold" style={{ textWrap: "balance", color: tk.text }}>
            {t("vitrine.h1a")}<br/>
            <span style={{ color: tk.accent }}>{t("vitrine.h1b")}</span>
          </h1>
          <p className="mt-3 max-w-[52ch]" style={{ color: tk.textMuted }}>
            {t("vitrine.lede")}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border font-mono text-[11px]"
             style={{ background: theme === "light" ? tk.elevBg : "rgba(255,255,255,0.04)",
                      borderColor: tk.borderSoft, color: tk.textMuted }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: tk.accent }} />
          {t("vitrine.keysLive", { n: totalAvailable.toLocaleString() })}
        </div>
      </div>

      <div className="mb-8 flex items-center gap-2 flex-wrap">
        {platformOpts.map((p) => {
          const label = p === "All" ? t("vitrine.filterAll") : p;
          return (
            <button key={p} onClick={() => setFilter(p)}
                    className="px-3 py-1.5 rounded-lg font-mono text-[11px] tracking-wider transition border"
                    style={{
                      background: filter === p ? tk.text : "transparent",
                      color: filter === p ? tk.pageBg : tk.textMuted,
                      borderColor: filter === p ? tk.text : tk.borderSoft,
                    }}>
              {label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 p-0.5 rounded-lg border" style={{ borderColor: tk.borderSoft, background: theme === "light" ? tk.elevBg : "rgba(255,255,255,0.04)" }}>
            <button onClick={() => setLayout("grid")}
                    className="px-2.5 py-1 rounded-md font-mono text-[10px] tracking-wider flex items-center gap-1.5 transition"
                    style={{ background: layout === "grid" ? tk.accent : "transparent",
                             color: layout === "grid" ? (theme === "light" ? "white" : "oklch(0.18 0.02 260)") : tk.textMuted }}>
              <Icon name="LayoutGrid" size={11} /> {t("vitrine.viewGrid")}
            </button>
            <button onClick={() => setLayout("list")}
                    className="px-2.5 py-1 rounded-md font-mono text-[10px] tracking-wider flex items-center gap-1.5 transition"
                    style={{ background: layout === "list" ? tk.accent : "transparent",
                             color: layout === "list" ? (theme === "light" ? "white" : "oklch(0.18 0.02 260)") : tk.textMuted }}>
              <Icon name="List" size={11} /> {t("vitrine.viewList")}
            </button>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]" style={{ color: tk.textDim }}>
            <Icon name="ArrowDownUp" size={12} /> {t("vitrine.sortBy")}
          </div>
        </div>
      </div>

      <LayoutGroup>
        {layout === "grid" ? rows.map((r) => (
          <GameRow key={r.title} title={lang === "pt-BR" ? r.title : (r.titleEn || r.title)} subtitle={r.sub}
                   games={r.list} onOpen={onOpen} />
        )) : rows.map((r) => (
          <GameListGroup key={r.title} title={lang === "pt-BR" ? r.title : (r.titleEn || r.title)} subtitle={r.sub}
                         games={r.list} onOpen={onOpen} />
        ))}
      </LayoutGroup>

      <div className="mt-10 text-center font-mono text-[11px]" style={{ color: tk.textDim }}>
        {t("vitrine.footer")}
      </div>
    </motion.div>
  );
};

Object.assign(window, { TopNav, GameCard, GameRow, GameListItem, GameListGroup, Vitrine });
