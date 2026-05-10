// KEYFORGE — Digital game key marketplace prototype
// Single-file React component using Framer Motion + Recharts + lucide-react
// All data is mocked. Original design (no copyrighted UI).

const { useState, useEffect, useRef, useMemo } = React;
const { motion, AnimatePresence, LayoutGroup } = window.FramerMotion || window.Motion;
const {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceDot, Area, AreaChart,
} = window.Recharts;

// ---------- icons (lucide via window UMD — exposes [tag, attrs, children] arrays) ----------
const L = window.lucide;
const camelizeAttr = (k) => k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const renderLucideNode = (node, key) => {
  if (!Array.isArray(node)) return null;
  const [tag, rawAttrs, rawChildren] = node;
  const props = { key };
  if (rawAttrs && typeof rawAttrs === "object") {
    for (const k of Object.keys(rawAttrs)) {
      // skip the "key" attribute lucide bakes in (it's an icon-name field, not a React key)
      if (k === "key") continue;
      props[camelizeAttr(k)] = rawAttrs[k];
    }
  }
  const kids = Array.isArray(rawChildren)
    ? rawChildren.map((c, i) => renderLucideNode(c, i))
    : null;
  return React.createElement(tag, props, kids);
};
const Icon = ({ name, size = 16, className = "", strokeWidth = 1.75, color = "currentColor", ...rest }) => {
  const data = L?.[name] || L?.HelpCircle;
  // lucide UMD entry shape: ["svg", svgAttrs, [ [tag, attrs], ... ]]
  let children = [];
  if (Array.isArray(data) && data.length === 3 && Array.isArray(data[2])) {
    children = data[2];
  } else if (Array.isArray(data)) {
    children = data;
  } else if (data?.iconNode) {
    children = data.iconNode;
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {children.map((c, i) => renderLucideNode(c, i))}
    </svg>
  );
};

// ---------- mock data (modeled on the SQL spec) ----------
// Game ↔ Genres (n:n), Game.platform, Game_price_log (history),
// Keys.status ('Available' | 'Sold'), Game_rating (0-10).

const PLATFORMS = {
  steam:  { id: "steam",  label: "STEAM",   tone: "oklch(0.78 0.10 240)" },
  xbox:   { id: "xbox",   label: "XBOX",    tone: "oklch(0.80 0.16 145)" },
  psn:    { id: "psn",    label: "PSN",     tone: "oklch(0.78 0.12 260)" },
  switch: { id: "switch", label: "SWITCH",  tone: "oklch(0.78 0.18 25)"  },
  epic:   { id: "epic",   label: "EPIC",    tone: "oklch(0.85 0.05 100)" },
};

// Decorative cover "art": each game has a unique abstract pattern (no copyrighted assets).
const COVERS = {
  hollow: {
    bg: "linear-gradient(135deg, oklch(0.30 0.10 290) 0%, oklch(0.18 0.06 250) 100%)",
    glyphs: [
      { x: 18, y: 22, r: 38, c: "oklch(0.85 0.18 165 / 0.18)" },
      { x: 78, y: 70, r: 24, c: "oklch(0.78 0.16 70 / 0.20)" },
    ],
    ring: "oklch(0.85 0.18 165 / 0.55)",
  },
  veil: {
    bg: "linear-gradient(160deg, oklch(0.22 0.05 25) 0%, oklch(0.14 0.03 30) 100%)",
    glyphs: [
      { x: 70, y: 28, r: 30, c: "oklch(0.78 0.16 30 / 0.30)" },
      { x: 30, y: 72, r: 18, c: "oklch(0.88 0.10 70 / 0.22)" },
    ],
    ring: "oklch(0.82 0.16 35 / 0.55)",
  },
  cipher: {
    bg: "linear-gradient(140deg, oklch(0.22 0.06 200) 0%, oklch(0.15 0.04 220) 100%)",
    glyphs: [
      { x: 50, y: 50, r: 44, c: "oklch(0.85 0.14 200 / 0.18)" },
      { x: 22, y: 24, r: 12, c: "oklch(0.85 0.18 165 / 0.30)" },
    ],
    ring: "oklch(0.85 0.16 195 / 0.55)",
  },
  drift: {
    bg: "linear-gradient(150deg, oklch(0.24 0.04 140) 0%, oklch(0.14 0.03 150) 100%)",
    glyphs: [
      { x: 65, y: 35, r: 28, c: "oklch(0.85 0.18 145 / 0.25)" },
      { x: 30, y: 70, r: 20, c: "oklch(0.78 0.10 100 / 0.22)" },
    ],
    ring: "oklch(0.85 0.18 145 / 0.55)",
  },
  monolith: {
    bg: "linear-gradient(135deg, oklch(0.22 0.02 280) 0%, oklch(0.13 0.02 270) 100%)",
    glyphs: [
      { x: 50, y: 50, r: 36, c: "oklch(0.80 0.04 280 / 0.30)" },
      { x: 80, y: 20, r: 10, c: "oklch(0.85 0.18 165 / 0.40)" },
    ],
    ring: "oklch(0.85 0.04 280 / 0.55)",
  },
  ember: {
    bg: "linear-gradient(150deg, oklch(0.24 0.08 50) 0%, oklch(0.14 0.04 40) 100%)",
    glyphs: [
      { x: 32, y: 32, r: 32, c: "oklch(0.85 0.14 60 / 0.22)" },
      { x: 70, y: 70, r: 22, c: "oklch(0.80 0.18 30 / 0.25)" },
    ],
    ring: "oklch(0.85 0.16 55 / 0.55)",
  },
};

// price log helper: months back to now
const buildPriceLog = (points) => {
  const now = new Date(2026, 3, 26); // April 26, 2026
  return points.map((p, i) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - (points.length - 1 - i));
    return {
      date: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      iso: d.toISOString().slice(0, 10),
      price: p,
    };
  });
};

const GAMES = [
  {
    id: "g1",
    title: "Hollow Signal",
    studio: "Northwind Foundry",
    cover: "hollow",
    platform: "steam",
    genres: ["Roguelike", "Atmospheric", "Souls-like"],
    rating: 9.2,
    ratingCount: 14820,
    price: 24.99,
    msrp: 39.99,
    keysAvailable: 412,
    tagline: "A descent into a sound the world forgot.",
    description:
      "A hand-drawn metroidvania set in an abandoned broadcast network. Map the dead frequencies, trade memory for ammunition, and learn what the static is trying to say. Permadeath optional.",
    features: ["Single-player", "Cloud saves", "Controller support", "Achievements"],
    priceLog: buildPriceLog([39.99, 39.99, 34.99, 34.99, 29.99, 29.99, 24.99, 24.99, 24.99]),
  },
  {
    id: "g2",
    title: "Veil of Ash",
    studio: "Halberd Collective",
    cover: "veil",
    platform: "xbox",
    genres: ["Action RPG", "Open World"],
    rating: 8.6,
    ratingCount: 9210,
    price: 49.99,
    msrp: 59.99,
    keysAvailable: 187,
    tagline: "Forge a kingdom on the bones of a burning continent.",
    description:
      "An open-world RPG where every settlement you save fundamentally rewrites the world map. 60+ hours of branching faction warfare, painted in oil and ember.",
    features: ["Online co-op (4)", "60+ hours", "Mod support", "4K HDR"],
    priceLog: buildPriceLog([59.99, 59.99, 59.99, 54.99, 54.99, 49.99, 44.99, 49.99, 49.99]),
  },
  {
    id: "g3",
    title: "Cipher / Bloom",
    studio: "Lattice Studio",
    cover: "cipher",
    platform: "steam",
    genres: ["Puzzle", "Sci-Fi", "Cozy"],
    rating: 8.9,
    ratingCount: 6740,
    price: 14.99,
    msrp: 19.99,
    keysAvailable: 1024,
    tagline: "Decrypt a garden of impossible flowers.",
    description:
      "A meditative cipher-puzzle game. Each bloom is a logic gate; each garden is a proof. Solve quietly, in your own time, without a single hostile entity in sight.",
    features: ["Single-player", "No combat", "Steam Deck verified", "Soundtrack DLC"],
    priceLog: buildPriceLog([19.99, 19.99, 17.99, 17.99, 14.99, 14.99, 12.99, 14.99, 14.99]),
  },
  {
    id: "g4",
    title: "Driftline GP",
    studio: "Pole Position North",
    cover: "drift",
    platform: "psn",
    genres: ["Racing", "Arcade", "Multiplayer"],
    rating: 7.8,
    ratingCount: 22310,
    price: 29.99,
    msrp: 39.99,
    keysAvailable: 0,
    tagline: "Tarmac is a suggestion.",
    description:
      "Sixty rally circuits. Eight weather systems. One physics model that actively wants you to fail. Online ladders reset weekly.",
    features: ["Online (16)", "Cross-play", "Weekly events", "Wheel support"],
    priceLog: buildPriceLog([39.99, 34.99, 34.99, 29.99, 29.99, 27.99, 29.99, 29.99, 29.99]),
  },
  {
    id: "g5",
    title: "Monolith.exe",
    studio: "Quietly Loud",
    cover: "monolith",
    platform: "epic",
    genres: ["Strategy", "City Builder"],
    rating: 8.1,
    ratingCount: 3120,
    price: 34.99,
    msrp: 34.99,
    keysAvailable: 56,
    tagline: "Bureaucracy as combat.",
    description:
      "Run a city built inside a deprecated mainframe. Every citizen is a process. Every blackout is a stack overflow. Schedule wisely.",
    features: ["Single-player", "Modding tools", "Sandbox mode"],
    priceLog: buildPriceLog([34.99, 34.99, 34.99, 32.99, 32.99, 34.99, 34.99, 34.99, 34.99]),
  },
  {
    id: "g6",
    title: "Ember & Iron",
    studio: "Forge Hand",
    cover: "ember",
    platform: "switch",
    genres: ["Crafting", "Cozy", "Sim"],
    rating: 9.0,
    ratingCount: 18004,
    price: 19.99,
    msrp: 24.99,
    keysAvailable: 304,
    tagline: "Heat metal. Make friends. Repeat.",
    description:
      "A blacksmithing sim with a slow-cooked story. Hammer rhythms unlock new alloys, and every regular customer has a quiet crisis you can help with — or not.",
    features: ["Single-player", "Local co-op", "Touch controls"],
    priceLog: buildPriceLog([24.99, 24.99, 22.99, 22.99, 19.99, 19.99, 17.99, 19.99, 19.99]),
  },
];

// ---------- utility ----------
const cls = (...xs) => xs.filter(Boolean).join(" ");
const fmt = (n) => `$${n.toFixed(2)}`;

// generate a mock key string after "purchase"
const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const randKey = (prefix) => {
  const seg = (n) => Array.from({ length: n }, () => KEY_ALPHABET[Math.floor(Math.random() * KEY_ALPHABET.length)]).join("");
  return `${prefix}-${seg(5)}-${seg(5)}-${seg(5)}`;
};

// ---------- cover art component ----------
const CoverArt = ({ id, title, platform, big = false }) => {
  const c = COVERS[id] || COVERS.monolith;
  const plat = PLATFORMS[platform];
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: c.bg }}
      aria-label={`${title} cover art`}
    >
      {/* subtle grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.18]" aria-hidden="true">
        <defs>
          <pattern id={`grid-${id}`} width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${id})`} />
      </svg>
      {/* glyphs */}
      {c.glyphs.map((g, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-2xl"
          style={{
            left: `${g.x}%`, top: `${g.y}%`,
            width: `${g.r}%`, aspectRatio: "1",
            transform: "translate(-50%,-50%)",
            background: g.c,
          }}
        />
      ))}
      {/* ring mark */}
      <div
        className="absolute rounded-full border"
        style={{
          left: "50%", top: "46%", transform: "translate(-50%,-50%)",
          width: big ? "55%" : "62%", aspectRatio: "1",
          borderColor: c.ring,
          borderWidth: big ? 2 : 1.5,
          boxShadow: `0 0 60px ${c.ring}`,
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          left: "50%", top: "46%", transform: "translate(-50%,-50%)",
          width: big ? "12%" : "16%", aspectRatio: "1",
          background: c.ring, filter: "blur(6px)", opacity: 0.7,
        }}
      />
      {/* title block */}
      <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] font-mono" style={{ color: plat?.tone }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: plat?.tone }} />
          {plat?.label}
        </div>
        <div
          className="font-display font-semibold leading-[1.05] text-white"
          style={{ fontSize: big ? 38 : 22, textWrap: "balance" }}
        >
          {title}
        </div>
      </div>
      {/* scanline */}
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"
           style={{ background: "repeating-linear-gradient(0deg, transparent 0 3px, rgba(255,255,255,0.06) 3px 4px)" }} />
    </div>
  );
};

// ---------- rating bar ----------
const RatingBar = ({ value, animate = true }) => {
  const pct = (value / 10) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="font-mono text-[11px] tabular-nums text-white/80 w-7">{value.toFixed(1)}</div>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/10">
        <motion.div
          initial={animate ? { width: 0 } : false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1], delay: 0.05 }}
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, oklch(0.85 0.18 165), oklch(0.85 0.16 145))" }}
        />
      </div>
      <div className="font-mono text-[10px] text-white/40">/10</div>
    </div>
  );
};

// ---------- game card ----------
const GameCard = ({ game, onOpen }) => {
  const [hover, setHover] = useState(false);
  const plat = PLATFORMS[game.platform];
  const soldOut = game.keysAvailable === 0;
  const discount = Math.round((1 - game.price / game.msrp) * 100);

  return (
    <motion.button
      type="button"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      onClick={() => !soldOut && onOpen(game)}
      whileHover={!soldOut ? { scale: 1.025, y: -4 } : {}}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={cls(
        "group relative text-left rounded-2xl overflow-hidden",
        "bg-[oklch(0.21_0.02_260)] border border-white/[0.06]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.85_0.18_165)]",
        soldOut && "opacity-70 cursor-not-allowed"
      )}
      style={{ boxShadow: hover ? "0 24px 60px -20px rgba(0,0,0,0.55), 0 0 0 1px oklch(0.85 0.18 165 / 0.25)" : "0 8px 24px -12px rgba(0,0,0,0.5)" }}
    >
      {/* cover */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <motion.div
          className="absolute inset-0"
          animate={{ scale: hover && !soldOut ? 1.06 : 1 }}
          transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <CoverArt id={game.cover} title={game.title} platform={game.platform} />
        </motion.div>

        {/* discount tag */}
        {discount > 0 && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-md font-mono text-[11px] font-semibold tracking-wide"
               style={{ background: "oklch(0.85 0.18 165)", color: "oklch(0.18 0.02 260)" }}>
            −{discount}%
          </div>
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px] bg-black/50">
            <div className="font-mono text-xs tracking-[0.3em] text-white/80 border border-white/30 px-3 py-1.5 rounded">
              OUT OF KEYS
            </div>
          </div>
        )}

        {/* hover overlay: rating + reveal hint */}
        <AnimatePresence>
          {hover && !soldOut && (
            <motion.div
              key="hov"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-0 top-0 p-3 flex items-start justify-end"
            >
              <motion.div
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ delay: 0.05 }}
                className="px-2 py-1 rounded-md bg-black/55 backdrop-blur-sm border border-white/10 flex items-center gap-1.5"
              >
                <Icon name="Star" size={12} className="text-[oklch(0.85_0.18_70)]" />
                <span className="font-mono text-[11px] text-white">{game.rating.toFixed(1)}</span>
                <span className="font-mono text-[10px] text-white/40">({(game.ratingCount/1000).toFixed(1)}k)</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* meta panel */}
      <div className="p-4 pt-3.5 relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase truncate">
              {game.studio}
            </div>
            <div className="font-display text-[15px] font-medium text-white truncate mt-0.5">
              {game.title}
            </div>
          </div>
          <div className="text-right shrink-0">
            {game.msrp > game.price && (
              <div className="font-mono text-[10px] text-white/35 line-through tabular-nums">{fmt(game.msrp)}</div>
            )}
            <div className="font-display text-[16px] font-semibold tabular-nums" style={{ color: "oklch(0.85 0.18 165)" }}>
              {fmt(game.price)}
            </div>
          </div>
        </div>

        {/* hover meta: genres + platform + rating, staggered */}
        <AnimatePresence initial={false}>
          {hover && !soldOut && (
            <motion.div
              key="meta"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-2.5">
                <RatingBar value={game.rating} />
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } } }}
                  className="flex flex-wrap gap-1.5"
                >
                  <motion.span
                    key="__plat"
                    variants={{ hidden: { y: 14, opacity: 0 }, show: { y: 0, opacity: 1 } }}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    className="px-2 py-0.5 rounded-md font-mono text-[10px] tracking-wide border"
                    style={{ borderColor: plat.tone, color: plat.tone }}
                  >
                    {plat.label}
                  </motion.span>
                  {game.genres.map((g) => (
                    <motion.span
                      key={g}
                      variants={{ hidden: { y: 14, opacity: 0 }, show: { y: 0, opacity: 1 } }}
                      transition={{ type: "spring", stiffness: 320, damping: 22 }}
                      className="px-2 py-0.5 rounded-md font-mono text-[10px] text-white/70 bg-white/[0.06] border border-white/[0.08]"
                    >
                      {g}
                    </motion.span>
                  ))}
                </motion.div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono text-[10px] text-white/40">
                    {game.keysAvailable.toLocaleString()} keys available
                  </span>
                  <span className="font-mono text-[10px] flex items-center gap-1" style={{ color: "oklch(0.85 0.18 165)" }}>
                    View <Icon name="ArrowUpRight" size={11} />
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
};

// ---------- price chart ----------
const PriceTooltip = ({ active, payload, log }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const idx = log.findIndex((p) => p.iso === d.iso);
  const prev = idx > 0 ? log[idx - 1] : null;
  const delta = prev ? d.price - prev.price : 0;
  return (
    <div className="rounded-lg bg-[oklch(0.16_0.02_260)] border border-white/10 px-3 py-2.5 font-mono text-[11px] shadow-2xl min-w-[180px]">
      <div className="text-white/40 tracking-wider text-[10px] mb-1.5">{d.date.toUpperCase()}</div>
      {prev && (
        <div className="flex justify-between gap-3 text-white/55">
          <span>was</span>
          <span className="tabular-nums line-through">{fmt(prev.price)}</span>
        </div>
      )}
      <div className="flex justify-between gap-3 text-white">
        <span>now</span>
        <span className="tabular-nums">{fmt(d.price)}</span>
      </div>
      {prev && delta !== 0 && (
        <div
          className="flex justify-between gap-3 mt-1 pt-1.5 border-t border-white/10 tabular-nums"
          style={{ color: delta < 0 ? "oklch(0.85 0.18 165)" : "oklch(0.80 0.18 30)" }}
        >
          <span>{delta < 0 ? "↓ drop" : "↑ rise"}</span>
          <span>{delta < 0 ? "" : "+"}{fmt(delta)}</span>
        </div>
      )}
    </div>
  );
};

const PriceHistoryChart = ({ log }) => {
  const min = Math.min(...log.map((p) => p.price));
  const max = Math.max(...log.map((p) => p.price));
  const minPoint = log.find((p) => p.price === min);
  const maxPoint = log.find((p) => p.price === max);

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={log} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.85 0.18 165)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="oklch(0.85 0.18 165)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
            domain={[(dataMin) => Math.floor(dataMin - 5), (dataMax) => Math.ceil(dataMax + 5)]}
            width={50}
          />
          <Tooltip content={<PriceTooltip log={log} />} cursor={{ stroke: "oklch(0.85 0.18 165 / 0.35)", strokeDasharray: "3 3" }} />
          <Area
            type="monotone"
            dataKey="price"
            stroke="oklch(0.85 0.18 165)"
            strokeWidth={2}
            fill="url(#priceFill)"
            dot={{ r: 3, fill: "oklch(0.85 0.18 165)", stroke: "oklch(0.18 0.02 260)", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: "oklch(0.85 0.18 165)", stroke: "white", strokeWidth: 2 }}
            animationDuration={1400}
            animationEasing="ease-out"
          />
          {minPoint && (
            <ReferenceDot x={minPoint.date} y={minPoint.price} r={5} fill="oklch(0.85 0.18 165)" stroke="white" strokeWidth={1.5} />
          )}
          {maxPoint && maxPoint.iso !== minPoint?.iso && (
            <ReferenceDot x={maxPoint.date} y={maxPoint.price} r={4} fill="oklch(0.80 0.18 30)" stroke="white" strokeWidth={1.5} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ---------- detail page ----------
const DetailPage = ({ game, onBack, onBuy }) => {
  const plat = PLATFORMS[game.platform];
  const log = game.priceLog;
  const lowest = Math.min(...log.map((p) => p.price));
  const peak = Math.max(...log.map((p) => p.price));
  const trend = log[log.length - 1].price - log[0].price;

  return (
    <motion.div
      key="detail"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
      className="max-w-[1180px] mx-auto px-6 lg:px-10 py-8"
    >
      {/* breadcrumb */}
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-white/55 hover:text-white font-mono text-[11px] tracking-wider transition"
      >
        <Icon name="ArrowLeft" size={14} />
        BACK TO STORE
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-8">
        {/* left column */}
        <div>
          {/* hero cover */}
          <motion.div
            layoutId={`cover-${game.id}`}
            className="aspect-[16/8] rounded-2xl overflow-hidden border border-white/[0.06]"
          >
            <CoverArt id={game.cover} title={game.title} platform={game.platform} big />
          </motion.div>

          {/* tagline + meta */}
          <div className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-2">
            <div className="font-mono text-[11px] tracking-[0.18em] text-white/40 uppercase">{game.studio}</div>
            <span className="text-white/20">•</span>
            <span className="font-mono text-[11px] tracking-wide" style={{ color: plat.tone }}>{plat.label}</span>
            <span className="text-white/20">•</span>
            <span className="font-mono text-[11px] text-white/40">{game.keysAvailable.toLocaleString()} keys in stock</span>
          </div>
          <h1 className="mt-3 font-display text-[42px] leading-[1.05] font-semibold text-white" style={{ textWrap: "balance" }}>
            {game.tagline}
          </h1>
          <p className="mt-4 max-w-[60ch] text-white/65 leading-relaxed">{game.description}</p>

          {/* genres */}
          <div className="mt-5 flex flex-wrap gap-2">
            {game.genres.map((g) => (
              <span key={g} className="px-2.5 py-1 rounded-md font-mono text-[11px] text-white/75 bg-white/[0.05] border border-white/[0.08]">
                {g}
              </span>
            ))}
          </div>

          {/* rating row */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Player rating" value={game.rating.toFixed(1)} sub={`${(game.ratingCount/1000).toFixed(1)}k reviews`} accent />
            <Stat label="Lowest ever" value={fmt(lowest)} sub="last 9 months" />
            <Stat label="Peak price" value={fmt(peak)} sub="MSRP" />
            <Stat label="9mo trend" value={`${trend < 0 ? "−" : "+"}${fmt(Math.abs(trend)).replace("$","$")}`} sub={trend < 0 ? "trending down" : "trending up"} />
          </div>

          {/* price history */}
          <div className="mt-8 rounded-2xl bg-[oklch(0.21_0.02_260)] border border-white/[0.06] p-5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="font-display text-[18px] text-white font-medium">Price history</div>
                <div className="font-mono text-[11px] text-white/40 mt-0.5">From Game_price_log · last 9 months · USD</div>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <Legend swatch="oklch(0.85 0.18 165)" label="LOWEST" />
                <Legend swatch="oklch(0.80 0.18 30)" label="PEAK" />
              </div>
            </div>
            <PriceHistoryChart log={log} />
          </div>

          {/* features */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {game.features.map((f) => (
              <div key={f} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <Icon name="Check" size={14} className="text-[oklch(0.85_0.18_165)]" />
                <span className="text-[12px] text-white/75">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* right column: purchase panel */}
        <div className="lg:sticky lg:top-6 self-start">
          <div className="rounded-2xl bg-[oklch(0.21_0.02_260)] border border-white/[0.08] p-5">
            <div className="flex items-baseline justify-between">
              <div className="font-mono text-[10px] tracking-[0.2em] text-white/40">CURRENT PRICE</div>
              {game.msrp > game.price && (
                <div className="px-1.5 py-0.5 rounded-md font-mono text-[10px] font-semibold"
                     style={{ background: "oklch(0.85 0.18 165 / 0.18)", color: "oklch(0.85 0.18 165)" }}>
                  −{Math.round((1 - game.price / game.msrp) * 100)}%
                </div>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <div className="font-display text-[40px] font-semibold tabular-nums text-white">{fmt(game.price)}</div>
              {game.msrp > game.price && <div className="font-mono text-sm text-white/35 line-through tabular-nums">{fmt(game.msrp)}</div>}
            </div>
            <div className="mt-1 font-mono text-[11px] text-white/45">
              one-time · digital key · activates on {plat.label.toLowerCase()}
            </div>

            <button
              onClick={onBuy}
              className="mt-5 w-full rounded-xl py-3.5 font-display font-semibold text-[15px] transition relative overflow-hidden group"
              style={{ background: "oklch(0.85 0.18 165)", color: "oklch(0.18 0.02 260)" }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Icon name="Key" size={16} strokeWidth={2.25} />
                Buy digital key
              </span>
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)", transform: "translateX(-100%)", animation: "shimmer 1.6s linear infinite" }}/>
            </button>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Trustlet icon="ShieldCheck" label="Instant" />
              <Trustlet icon="RotateCcw" label="14-day refund" />
              <Trustlet icon="Lock" label="Region-free" />
            </div>

            <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-2 font-mono text-[10px] text-white/45">
              <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "oklch(0.85 0.18 165)" }} />
              {game.keysAvailable} keys with status <span className="text-white/70">'Available'</span>
            </div>
          </div>

          {/* secondary card */}
          <div className="mt-3 rounded-2xl bg-[oklch(0.21_0.02_260)] border border-white/[0.06] p-4">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-white/40 mb-3">
              <Icon name="Activity" size={12} /> WATCHERS
            </div>
            <p className="text-[12px] text-white/60 leading-relaxed">
              <span className="text-white">428 buyers</span> are tracking this title. We'll alert you if the price drops below <span className="font-mono text-white">{fmt(lowest)}</span>.
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes shimmer { 0% { transform: translateX(-100%);} 100% { transform: translateX(100%);} }`}</style>
    </motion.div>
  );
};

const Stat = ({ label, value, sub, accent }) => (
  <div className="rounded-xl bg-white/[0.025] border border-white/[0.05] px-3 py-2.5">
    <div className="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">{label}</div>
    <div className="font-display text-[20px] font-semibold tabular-nums mt-1" style={{ color: accent ? "oklch(0.85 0.18 165)" : "white" }}>
      {value}
    </div>
    <div className="font-mono text-[10px] text-white/40 mt-0.5">{sub}</div>
  </div>
);

const Legend = ({ swatch, label }) => (
  <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5">
    <span className="w-2 h-2 rounded-full" style={{ background: swatch }} />
    <span className="text-white/45 tracking-[0.15em]">{label}</span>
  </span>
);

const Trustlet = ({ icon, label }) => (
  <div className="flex flex-col items-center gap-1 py-1.5 rounded-lg bg-white/[0.025]">
    <Icon name={icon} size={14} className="text-white/65" />
    <span className="font-mono text-[10px] text-white/55">{label}</span>
  </div>
);

// ---------- key reveal (decryption) ----------
const SCRAMBLE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#@$%&*";
const ScrambleKey = ({ finalKey, onDone }) => {
  const [display, setDisplay] = useState("•••••-•••••-•••••-•••••");
  useEffect(() => {
    const total = 1700; // ms
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / total);
      // reveal characters left-to-right based on t
      const revealCount = Math.floor(t * finalKey.length);
      let out = "";
      for (let i = 0; i < finalKey.length; i++) {
        const ch = finalKey[i];
        if (ch === "-") { out += "-"; continue; }
        if (i < revealCount) out += ch;
        else out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }
      setDisplay(out);
      if (t < 1) raf = requestAnimationFrame(tick);
      else { setDisplay(finalKey); onDone && onDone(); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [finalKey]);
  return (
    <div className="font-mono text-[28px] sm:text-[32px] tracking-[0.18em] tabular-nums text-white select-all"
         style={{ textShadow: "0 0 24px oklch(0.85 0.18 165 / 0.45)" }}>
      {display}
    </div>
  );
};

// ---------- success screen ----------
const SuccessScreen = ({ game, onBackToStore }) => {
  const [generatedKey] = useState(() => randKey(PLATFORMS[game.platform].label));
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const plat = PLATFORMS[game.platform];

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(generatedKey); } catch (_) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <motion.div
      key="success"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
      className="max-w-[820px] mx-auto px-6 py-12"
    >
      {/* receipt header */}
      <div className="flex items-center gap-3 mb-8">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.1 }}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "oklch(0.85 0.18 165 / 0.15)", border: "1px solid oklch(0.85 0.18 165 / 0.4)" }}
        >
          <Icon name="Check" size={18} className="text-[oklch(0.85_0.18_165)]" strokeWidth={2.5} />
        </motion.div>
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-white/45">TRANSACTION #KF-{Date.now().toString().slice(-8)}</div>
          <div className="font-display text-[22px] text-white font-medium mt-0.5">Your key is ready.</div>
        </div>
      </div>

      {/* key card */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.08]"
           style={{ background: "linear-gradient(160deg, oklch(0.22 0.04 260), oklch(0.16 0.02 260))" }}>
        {/* watermark grid */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] tracking-[0.22em]" style={{ color: plat.tone }}>
                {plat.label} ACTIVATION KEY
              </div>
              <div className="mt-1 font-display text-[20px] text-white font-medium">{game.title}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] tracking-[0.2em] text-white/40">STATUS</div>
              <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-1 rounded-md"
                   style={{ background: "oklch(0.85 0.18 165 / 0.15)", color: "oklch(0.85 0.18 165)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                <span className="font-mono text-[10px] tracking-wider">SOLD</span>
              </div>
            </div>
          </div>

          {/* perforation */}
          <div className="my-6 relative h-px">
            <div className="absolute inset-0 border-t border-dashed border-white/15" />
            <div className="absolute -left-3 -top-2 w-4 h-4 rounded-full bg-[oklch(0.18_0.02_260)] border-r border-white/[0.08]" />
            <div className="absolute -right-3 -top-2 w-4 h-4 rounded-full bg-[oklch(0.18_0.02_260)] border-l border-white/[0.08]" />
          </div>

          {/* the key */}
          <div className="font-mono text-[10px] tracking-[0.22em] text-white/45 mb-3">YOUR KEY</div>
          <div className="rounded-xl bg-black/30 border border-white/[0.06] p-5 sm:p-6 text-center relative overflow-hidden">
            <ScrambleKey finalKey={generatedKey} onDone={() => setRevealed(true)} />
            {/* shimmer line during reveal */}
            <AnimatePresence>
              {!revealed && (
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.6, ease: "linear" }}
                  className="absolute inset-y-0 w-1/3"
                  style={{ background: "linear-gradient(90deg, transparent, oklch(0.85 0.18 165 / 0.25), transparent)" }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* actions */}
          <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleCopy}
              disabled={!revealed}
              className={cls(
                "flex-1 rounded-xl py-3 font-display font-medium text-[14px] flex items-center justify-center gap-2 transition relative",
                revealed ? "bg-white text-[oklch(0.18_0.02_260)] hover:bg-white/90" : "bg-white/10 text-white/40 cursor-not-allowed"
              )}
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span
                    key="copied"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: [0.6, 1.15, 1], opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5, times: [0, 0.5, 1] }}
                    className="inline-flex items-center gap-2"
                    style={{ color: "oklch(0.45 0.16 160)" }}
                  >
                    <Icon name="Check" size={16} strokeWidth={2.5} /> Copied to clipboard
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="inline-flex items-center gap-2"
                  >
                    <Icon name="Copy" size={15} /> Copy key
                  </motion.span>
                )}
              </AnimatePresence>
              {/* pulse ring on copy */}
              <AnimatePresence>
                {copied && (
                  <motion.span
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ scale: 1.25, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{ boxShadow: "0 0 0 2px oklch(0.85 0.18 165)" }}
                  />
                )}
              </AnimatePresence>
            </motion.button>

            <button className="flex-1 rounded-xl py-3 font-display font-medium text-[14px] bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.07] transition flex items-center justify-center gap-2">
              <Icon name="ExternalLink" size={15} /> Redeem on {plat.label.charAt(0) + plat.label.slice(1).toLowerCase()}
            </button>
          </div>
        </div>
      </div>

      {/* receipt details */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Receipt label="Paid" value={fmt(game.price)} />
        <Receipt label="Method" value="Card ••4218" />
        <Receipt label="Email" value="you@inbox.io" />
        <Receipt label="Issued" value="Apr 26, 2026" />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button onClick={onBackToStore} className="font-mono text-[11px] tracking-[0.18em] text-white/55 hover:text-white inline-flex items-center gap-2">
          <Icon name="ArrowLeft" size={14} /> BACK TO STORE
        </button>
        <div className="font-mono text-[11px] text-white/35">
          Receipt sent to your inbox.
        </div>
      </div>
    </motion.div>
  );
};

const Receipt = ({ label, value }) => (
  <div className="px-3 py-2.5 rounded-xl bg-white/[0.025] border border-white/[0.05]">
    <div className="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">{label}</div>
    <div className="font-mono text-[12px] text-white mt-1 truncate">{value}</div>
  </div>
);

// ---------- checkout overlay ----------
const CheckoutOverlay = ({ game, onComplete, onCancel }) => {
  const steps = [
    { label: "Validating payment method", ms: 700 },
    { label: "Reserving key from inventory pool", ms: 700 },
    { label: "Updating Key_status → 'Sold'", ms: 800 },
    { label: "Linking key to your account", ms: 600 },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    if (i >= steps.length) { onComplete(); return; }
    const t = setTimeout(() => setI(i + 1), steps[i].ms);
    return () => clearTimeout(t);
  }, [i]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-40 backdrop-blur-md bg-[oklch(0.10_0.02_260_/_0.7)] flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="w-full max-w-[440px] rounded-2xl bg-[oklch(0.21_0.02_260)] border border-white/[0.08] p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9">
            <motion.div
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: "oklch(0.85 0.18 165 / 0.25)", borderTopColor: "oklch(0.85 0.18 165)" }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
            />
            <Icon name="Key" size={14} className="absolute inset-0 m-auto text-[oklch(0.85_0.18_165)]" />
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-[0.22em] text-white/45">PROCESSING</div>
            <div className="font-display text-[16px] text-white">Securing your key…</div>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          {steps.map((s, idx) => {
            const state = idx < i ? "done" : idx === i ? "active" : "pending";
            return (
              <div key={s.label} className="flex items-center gap-2.5 font-mono text-[11px]">
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                     style={{
                       background: state === "done" ? "oklch(0.85 0.18 165)" : state === "active" ? "oklch(0.85 0.18 165 / 0.18)" : "rgba(255,255,255,0.06)",
                       border: state === "active" ? "1px solid oklch(0.85 0.18 165)" : "1px solid transparent",
                     }}>
                  {state === "done" && <Icon name="Check" size={10} strokeWidth={3} className="text-[oklch(0.18_0.02_260)]" />}
                  {state === "active" && <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.85_0.18_165)] animate-pulse" />}
                </div>
                <span className={cls(
                  state === "pending" && "text-white/30",
                  state === "active" && "text-white",
                  state === "done" && "text-white/60 line-through decoration-white/20"
                )}>{s.label}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-5 border-t border-white/[0.06] flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] tracking-[0.18em] text-white/40">{game.title.toUpperCase()}</div>
            <div className="font-display text-[18px] text-white tabular-nums">{fmt(game.price)}</div>
          </div>
          <button onClick={onCancel} className="font-mono text-[11px] text-white/40 hover:text-white/70">cancel</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ---------- store page (vitrine) ----------
const Vitrine = ({ onOpen }) => {
  const [filter, setFilter] = useState("All");
  const platforms = ["All", ...Object.values(PLATFORMS).map((p) => p.label)];
  const filtered = useMemo(
    () => filter === "All" ? GAMES : GAMES.filter((g) => PLATFORMS[g.platform].label === filter),
    [filter]
  );

  return (
    <motion.div
      key="vitrine"
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-[1280px] mx-auto px-6 lg:px-10 py-8"
    >
      {/* hero strip */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="font-mono text-[11px] tracking-[0.22em] text-white/40">DIGITAL KEYS · WEEK 17 / 2026</div>
          <h1 className="mt-2 font-display text-[44px] leading-[1.05] font-semibold text-white" style={{ textWrap: "balance" }}>
            Stocked. Sealed.<br/>
            <span style={{ color: "oklch(0.85 0.18 165)" }}>Yours in a click.</span>
          </h1>
          <p className="mt-3 max-w-[52ch] text-white/55">
            A boutique key vault. Hover any title to inspect its genres, platform, and live player rating —
            then watch the price history before you commit.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] font-mono text-[11px] text-white/65">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "oklch(0.85 0.18 165)" }} />
          1,983 chaves prontas
        </div>
      </div>

      {/* filters */}
      <div className="mb-6 flex items-center gap-2 flex-wrap">
        {platforms.map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={cls(
              "px-3 py-1.5 rounded-lg font-mono text-[11px] tracking-wider transition border",
              filter === p
                ? "bg-white text-[oklch(0.18_0.02_260)] border-white"
                : "bg-transparent text-white/55 border-white/[0.08] hover:text-white hover:border-white/20"
            )}
          >
            {p}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 font-mono text-[11px] text-white/40">
          <Icon name="ArrowDownUp" size={12} /> sorted by relevance
        </div>
      </div>

      {/* grid */}
      <LayoutGroup>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((g) => (
            <GameCard key={g.id} game={g} onOpen={onOpen} />
          ))}
        </div>
      </LayoutGroup>

      {/* footer hint */}
      <div className="mt-10 text-center font-mono text-[11px] text-white/30">
        Hover · click · purchase. Three interactions, one ritual.
      </div>
    </motion.div>
  );
};

// ---------- top nav ----------
const TopNav = ({ view }) => (
  <header className="sticky top-0 z-30 backdrop-blur-xl bg-[oklch(0.18_0.02_260_/_0.7)] border-b border-white/[0.05]">
    <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "oklch(0.85 0.18 165)" }}>
          <Icon name="Key" size={14} className="text-[oklch(0.18_0.02_260)]" strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-display font-semibold text-white text-[15px] leading-none tracking-tight">KEYFORGE</div>
          <div className="font-mono text-[9px] text-white/35 tracking-[0.2em] mt-0.5">DIGITAL KEY VAULT</div>
        </div>
      </div>
      <nav className="hidden md:flex items-center gap-6 font-mono text-[11px] tracking-[0.16em] text-white/55">
        <a className="text-white">STORE</a>
        <a className="hover:text-white">DEALS</a>
        <a className="hover:text-white">LIBRARY</a>
        <a className="hover:text-white">SUPPORT</a>
      </nav>
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/65 hover:text-white text-[12px]">
          <Icon name="Search" size={13} /> <span className="hidden sm:inline">search</span>
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[oklch(0.85_0.18_165)] to-[oklch(0.65_0.16_220)]" />
      </div>
    </div>
  </header>
);

// ---------- root ----------
const App = () => {
  const [view, setView] = useState("vitrine"); // vitrine | detail | success
  const [activeGame, setActiveGame] = useState(null);
  const [checkout, setCheckout] = useState(false);

  const open = (g) => { setActiveGame(g); setView("detail"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const back = () => { setView("vitrine"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const buy = () => setCheckout(true);
  const completed = () => { setCheckout(false); setView("success"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const cancel = () => setCheckout(false);
  const reset = () => { setView("vitrine"); setActiveGame(null); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="min-h-screen bg-[oklch(0.16_0.02_260)] text-white" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-60"
           style={{ background: "radial-gradient(60% 50% at 80% -10%, oklch(0.45 0.18 200 / 0.18), transparent 60%), radial-gradient(50% 40% at 10% 110%, oklch(0.50 0.18 165 / 0.18), transparent 60%)" }} />
      <TopNav view={view} />
      <main data-screen-label={
        view === "vitrine" ? "01 Store" : view === "detail" ? "02 Detail" : "03 Success"
      }>
        <AnimatePresence mode="wait">
          {view === "vitrine" ? (
            <Vitrine key="v" onOpen={open} />
          ) : view === "detail" && activeGame ? (
            <DetailPage key="d" game={activeGame} onBack={back} onBuy={buy} />
          ) : view === "success" && activeGame ? (
            <SuccessScreen key="s" game={activeGame} onBackToStore={reset} />
          ) : null}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {checkout && activeGame && (
          <CheckoutOverlay game={activeGame} onComplete={completed} onCancel={cancel} />
        )}
      </AnimatePresence>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
