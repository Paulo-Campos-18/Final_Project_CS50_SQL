// Deals + Library pages
const { useState: useStateP, useMemo: useMemoP } = React;

// ---------- Deals page ----------
const DealsPage = ({ onOpen }) => {
  const { theme, currency } = useApp();
  const t = tokens(theme);

  // compute discount per game
  const deals = useMemoP(() => GAMES.map((g) => {
    const log = priceLogOf(g.id);
    const msrp = log.length ? log[0].old_price : g.price;
    const discount = Math.round((1 - g.price / msrp) * 100);
    const available = availableKeysOf(g.id);
    return { game: g, msrp, discount, available };
  }).sort((a, b) => b.discount - a.discount), []);

  const top = deals[0];
  const rest = deals.slice(1).filter((d) => d.discount > 0 || d.available > 0);

  return (
    <motion.div key="deals" initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="max-w-[1280px] mx-auto px-6 lg:px-10 py-8">
      <div className="mb-8">
        <div className="font-mono text-[11px] tracking-[0.22em]" style={{ color: t.textDim }}>{window.t("deals.eyebrow")}</div>
        <h1 className="mt-2 font-display text-[44px] leading-[1.05] font-semibold" style={{ color: t.text }}>
          {window.t("deals.h1a")} <span style={{ color: t.accent }}>{window.t("deals.h1b")}</span>
        </h1>
        <p className="mt-3 max-w-[60ch]" style={{ color: t.textMuted }}>
          {window.t("deals.ledePre")} <span className="font-mono text-[12px]" style={{ color: t.text }}>game_price_log</span>.
        </p>
      </div>

      {/* hero deal */}
      {top && top.discount > 0 && (
        <button onClick={() => onOpen(top.game)}
                className="block w-full text-left rounded-3xl overflow-hidden border mb-6 group"
                style={{ borderColor: t.border, background: t.panelBg }}>
          <div className="grid md:grid-cols-[460px_1fr] gap-0">
            <div className="aspect-[4/3] md:aspect-auto md:h-[320px] overflow-hidden">
              <CoverArt id={top.game.cover} image={top.game.image} title={top.game.name} platform={platformById(top.game.active_platform_id)} big theme={theme} />
            </div>
            <div className="p-7 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 rounded-md font-mono text-[11px] font-semibold"
                     style={{ background: t.accent, color: theme === "light" ? "white" : "oklch(0.18 0.02 260)" }}>
                  −{top.discount}%
                </div>
                <div className="font-mono text-[10px] tracking-[0.22em]" style={{ color: t.textDim }}>{window.t("deals.bestThisWeek")}</div>
              </div>
              <div className="mt-4 font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: t.textDim }}>{top.game.studio}</div>
              <h2 className="mt-1 font-display text-[36px] font-semibold leading-[1.05]" style={{ color: t.text }}>{top.game.name}</h2>
              <p className="mt-3 max-w-[44ch]" style={{ color: t.textMuted }}>{top.game.tagline}</p>
              <div className="mt-5 flex items-baseline gap-3">
                <div className="font-display text-[40px] font-semibold tabular-nums" style={{ color: t.accent }}>{fmtMoney(top.game.price, currency)}</div>
                <div className="font-mono text-sm line-through tabular-nums" style={{ color: t.textDim }}>{fmtMoney(top.msrp, currency)}</div>
              </div>
              <div className="mt-2 font-mono text-[11px]" style={{ color: t.textDim }}>
                {window.t("deals.endsSunday", { n: top.available.toLocaleString() })}
              </div>
            </div>
          </div>
        </button>
      )}

      {/* grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {rest.map((d) => <GameCard key={d.game.id} game={d.game} onOpen={onOpen} />)}
      </div>
    </motion.div>
  );
};

// ---------- Library page ----------
const LibraryPage = ({ onOpen }) => {
  const { theme, currency } = useApp();
  const t = tokens(theme);

  // mock owned: pretend user 1 owns a handful of titles from the catalog
  const owned = [2, 3, 6, 14, 19].map((id) => GAMES.find((g) => g.id === id)).filter(Boolean);
  const wishlist = WISHLIST.filter((w) => w.user_id === 1).map((w) => GAMES.find((g) => g.id === w.game_id)).filter(Boolean);

  return (
    <motion.div key="library" initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="max-w-[1280px] mx-auto px-6 lg:px-10 py-8">
      <div className="mb-8">
        <div className="font-mono text-[11px] tracking-[0.22em]" style={{ color: t.textDim }}>{window.t("library.eyebrow")}</div>
        <h1 className="mt-2 font-display text-[44px] leading-[1.05] font-semibold" style={{ color: t.text }}>
          {window.t("library.h1a")} <span style={{ color: t.accent }}>{window.t("library.h1b")}</span>
        </h1>
        <p className="mt-3 max-w-[60ch]" style={{ color: t.textMuted }}>
          {window.t("library.lede")}
        </p>
      </div>

      {/* owned */}
      <div className="mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="font-display text-[20px] font-medium" style={{ color: t.text }}>{window.t("library.yourKeys")}</div>
            <div className="font-mono text-[10px] tracking-wider mt-0.5" style={{ color: t.textDim }}>
              {window.t("library.yourKeysSub", { n: owned.length })}
            </div>
          </div>
          <div className="font-mono text-[10px] tracking-[0.18em]" style={{ color: t.textDim }}>{window.t("library.sortAcq")}</div>
        </div>

        <div className="space-y-2">
          {owned.map((g, i) => {
            const plat = platformById(g.active_platform_id);
            const platTone = theme === "light" ? plat.toneLight : plat.tone;
            return (
              <div key={g.id} className="rounded-2xl border overflow-hidden flex items-center gap-4 p-3"
                   style={{ background: t.panelBg, borderColor: t.borderSoft }}>
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                  <CoverArt id={g.cover} image={g.image} title={g.name} platform={plat} theme={theme} compact />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[10px] tracking-wide" style={{ color: platTone }}>{plat.name.toUpperCase()}</span>
                    <span style={{ color: t.textDim }}>·</span>
                    <span className="font-mono text-[10px]" style={{ color: t.textDim }}>{g.studio}</span>
                  </div>
                  <div className="font-display text-[16px] font-medium truncate" style={{ color: t.text }}>{g.name}</div>
                  <div className="mt-1 flex items-center gap-3 font-mono text-[10px]" style={{ color: t.textDim }}>
                    <span>{window.t("library.acquired", { date: ["Apr 28","Mar 14","Feb 02"][i] })}</span>
                    <span>·</span>
                    <span style={{ color: t.accent }}>{window.t("library.activated")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => onOpen(g)}
                          className="px-3 py-2 rounded-lg font-mono text-[11px] border"
                          style={{ borderColor: t.borderSoft, color: t.textMuted }}>
                    {window.t("library.details")}
                  </button>
                  <button className="px-3 py-2 rounded-lg font-mono text-[11px] flex items-center gap-1.5"
                          style={{ background: t.accent, color: theme === "light" ? "white" : "oklch(0.18 0.02 260)" }}>
                    <Icon name="Play" size={11} strokeWidth={2.5} /> {window.t("library.launch")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* wishlist */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="font-display text-[20px] font-medium" style={{ color: t.text }}>{window.t("library.wishlist")}</div>
            <div className="font-mono text-[10px] tracking-wider mt-0.5" style={{ color: t.textDim }}>
              {window.t("library.wishlistSub", { n: wishlist.length })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {wishlist.map((g) => <GameCard key={g.id} game={g} onOpen={onOpen} />)}
        </div>
      </div>
    </motion.div>
  );
};

Object.assign(window, { DealsPage, LibraryPage });
