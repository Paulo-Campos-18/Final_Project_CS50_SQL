// Shared UI primitives: Icon, CoverArt, RatingBar, theme + currency context, Stat, etc.

const { useState, useEffect, useRef, useMemo, useContext, createContext } = React;
const { motion, AnimatePresence, LayoutGroup } = window.FramerMotion || window.Motion;

// ---------- helpers ----------
const cls = (...xs) => xs.filter(Boolean).join(" ");

// ---------- theme + currency context ----------
const AppContext = createContext({ theme: "dark", setTheme: () => {}, currency: "USD", setCurrency: () => {} });
const useApp = () => useContext(AppContext);

// Token getter — used by many components
const tokens = (theme) => theme === "light" ? {
  // Earthy / warm light theme — cream paper, dim ochre, mossy accent
  pageBg:    "oklch(0.91 0.018 75)",
  panelBg:   "oklch(0.94 0.014 75)",
  elevBg:    "oklch(0.88 0.020 75)",
  border:    "oklch(0.78 0.022 70)",
  borderSoft:"oklch(0.84 0.018 72)",
  text:      "oklch(0.24 0.025 60)",
  textMuted: "oklch(0.42 0.025 65)",
  textDim:   "oklch(0.55 0.020 70)",
  accent:    "oklch(0.48 0.10 160)",
  accentBg:  "oklch(0.48 0.10 160 / 0.12)",
  warn:      "oklch(0.50 0.14 38)",
  glowBg:    "radial-gradient(60% 50% at 80% -10%, oklch(0.72 0.06 80 / 0.35), transparent 60%), radial-gradient(50% 40% at 10% 110%, oklch(0.65 0.08 145 / 0.22), transparent 60%)",
  navBg:     "oklch(0.94 0.014 75 / 0.85)",
} : {
  pageBg:    "oklch(0.16 0.02 260)",
  panelBg:   "oklch(0.21 0.02 260)",
  elevBg:    "oklch(0.23 0.02 260)",
  border:    "oklch(1 0 0 / 0.08)",
  borderSoft:"oklch(1 0 0 / 0.05)",
  text:      "oklch(1 0 0)",
  textMuted: "oklch(1 0 0 / 0.55)",
  textDim:   "oklch(1 0 0 / 0.40)",
  accent:    "oklch(0.85 0.18 165)",
  accentBg:  "oklch(0.85 0.18 165 / 0.15)",
  warn:      "oklch(0.80 0.18 30)",
  glowBg:    "radial-gradient(60% 50% at 80% -10%, oklch(0.45 0.18 200 / 0.18), transparent 60%), radial-gradient(50% 40% at 10% 110%, oklch(0.50 0.18 165 / 0.18), transparent 60%)",
  navBg:     "oklch(0.18 0.02 260 / 0.7)",
};

// ---------- icons (lucide UMD shape) ----------
const L = window.lucide;
const camelizeAttr = (k) => k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const renderLucideNode = (node, key) => {
  if (!Array.isArray(node)) return null;
  const [tag, rawAttrs, rawChildren] = node;
  const props = { key };
  if (rawAttrs && typeof rawAttrs === "object") {
    for (const k of Object.keys(rawAttrs)) {
      if (k === "key") continue;
      props[camelizeAttr(k)] = rawAttrs[k];
    }
  }
  const kids = Array.isArray(rawChildren) ? rawChildren.map((c, i) => renderLucideNode(c, i)) : null;
  return React.createElement(tag, props, kids);
};
const Icon = ({ name, size = 16, className = "", strokeWidth = 1.75, color = "currentColor", ...rest }) => {
  const data = L?.[name] || L?.HelpCircle;
  let children = [];
  if (Array.isArray(data) && data.length === 3 && Array.isArray(data[2])) children = data[2];
  else if (Array.isArray(data)) children = data;
  else if (data?.iconNode) children = data.iconNode;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
         fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
         className={className} {...rest}>
      {children.map((c, i) => renderLucideNode(c, i))}
    </svg>
  );
};

// ---------- CoverArt ----------
const CoverArt = ({ id, title, platform, big = false, theme = "dark", image = null, compact = false }) => {
  const c = COVERS[id] || COVERS.monolith;
  const plat = platform;
  const isLight = theme === "light";
  const bg = isLight ? c.bgLight : c.bg;
  const ring = isLight ? c.ringLight : c.ring;
  const platTone = isLight ? plat.toneLight : plat.tone;
  const [imgFailed, setImgFailed] = useState(false);
  // Real photographic cover variant: dim overlay + platform chip + title
  if (image && !imgFailed) {
    return (
      <div className="relative w-full h-full overflow-hidden" style={{ background: "#0b0b10" }}>
        <img src={image} alt={title}
             onError={() => setImgFailed(true)}
             style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
                      objectFit: "cover",
                      filter: isLight ? "saturate(1.05) contrast(1.02)" : "saturate(1.0) contrast(1.0)" }} />
        <div className="absolute inset-0"
             style={{ background: isLight
               ? "linear-gradient(180deg, rgba(255,255,255,0) 30%, rgba(0,0,0,0.55) 100%)"
               : "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.78) 100%)" }} />
        {!compact && (
          <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] font-mono"
                 style={{ color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: platTone }} />
              {plat.name.toUpperCase()}
            </div>
            <div className="font-display font-semibold leading-[1.05]"
                 style={{ fontSize: big ? 38 : 22, textWrap: "balance",
                          color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}>
              {title}
            </div>
          </div>
        )}
        <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-25"
             style={{ background: `repeating-linear-gradient(0deg, transparent 0 3px, rgba(255,255,255,0.06) 3px 4px)` }} />
      </div>
    );
  }
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: bg }}>
      <svg className="absolute inset-0 w-full h-full opacity-[0.18]" aria-hidden="true">
        <defs>
          <pattern id={`grid-${id}-${theme}`} width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke={isLight ? "black" : "white"} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${id}-${theme})`} />
      </svg>
      {c.glyphs.map((g, i) => (
        <div key={i} className="absolute rounded-full blur-2xl"
             style={{ left: `${g.x}%`, top: `${g.y}%`, width: `${g.r}%`, aspectRatio: "1",
                      transform: "translate(-50%,-50%)", background: isLight ? g.cL : g.c }} />
      ))}
      <div className="absolute rounded-full border"
           style={{ left: "50%", top: "46%", transform: "translate(-50%,-50%)",
                    width: big ? "55%" : "62%", aspectRatio: "1",
                    borderColor: ring, borderWidth: big ? 2 : 1.5,
                    boxShadow: `0 0 60px ${ring}` }} />
      <div className="absolute rounded-full"
           style={{ left: "50%", top: "46%", transform: "translate(-50%,-50%)",
                    width: big ? "12%" : "16%", aspectRatio: "1",
                    background: ring, filter: "blur(6px)", opacity: 0.7 }} />
      <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] font-mono" style={{ color: platTone }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: platTone }} />
          {plat.name.toUpperCase()}
        </div>
        <div className="font-display font-semibold leading-[1.05]"
             style={{ fontSize: big ? 38 : 22, textWrap: "balance",
                      color: isLight ? "oklch(0.18 0.02 260)" : "white" }}>
          {title}
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"
           style={{ background: `repeating-linear-gradient(0deg, transparent 0 3px, ${isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)"} 3px 4px)` }} />
    </div>
  );
};

// ---------- Rating bar ----------
const RatingBar = ({ value, animate = true }) => {
  const { theme } = useApp();
  const t = tokens(theme);
  const pct = (value / 10) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="font-mono text-[11px] tabular-nums w-7" style={{ color: t.text }}>{value.toFixed(1)}</div>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: theme === "light" ? "oklch(0.90 0.01 260)" : "rgba(255,255,255,0.10)" }}>
        <motion.div initial={animate ? { width: 0 } : false} animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1], delay: 0.05 }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${t.accent}, oklch(${theme==="light"?"0.55 0.16 145":"0.85 0.16 145"}))` }} />
      </div>
      <div className="font-mono text-[10px]" style={{ color: t.textDim }}>/10</div>
    </div>
  );
};

// ---------- Stat tile ----------
const Stat = ({ label, value, sub, accent, icon }) => {
  const { theme } = useApp();
  const t = tokens(theme);
  return (
    <div className="rounded-xl px-3 py-2.5 border"
         style={{ background: theme === "light" ? "oklch(0.98 0.005 260)" : "rgba(255,255,255,0.025)",
                  borderColor: t.borderSoft }}>
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: t.textDim }}>{label}</div>
        {icon && <Icon name={icon} size={12} color={t.textDim} />}
      </div>
      <div className="font-display text-[20px] font-semibold tabular-nums mt-1"
           style={{ color: accent ? t.accent : t.text }}>
        {value}
      </div>
      {sub && <div className="font-mono text-[10px] mt-0.5" style={{ color: t.textDim }}>{sub}</div>}
    </div>
  );
};

// ---------- Trustlet ----------
const Trustlet = ({ icon, label }) => {
  const { theme } = useApp(); const t = tokens(theme);
  return (
    <div className="flex flex-col items-center gap-1 py-1.5 rounded-lg"
         style={{ background: theme === "light" ? "oklch(0.96 0.005 260)" : "rgba(255,255,255,0.025)" }}>
      <Icon name={icon} size={14} color={t.textMuted} />
      <span className="font-mono text-[10px]" style={{ color: t.textMuted }}>{label}</span>
    </div>
  );
};

// ---------- Receipt cell ----------
const Receipt = ({ label, value }) => {
  const { theme } = useApp(); const t = tokens(theme);
  return (
    <div className="px-3 py-2.5 rounded-xl border"
         style={{ background: theme === "light" ? "oklch(0.98 0.005 260)" : "rgba(255,255,255,0.025)", borderColor: t.borderSoft }}>
      <div className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: t.textDim }}>{label}</div>
      <div className="font-mono text-[12px] mt-1 truncate" style={{ color: t.text }}>{value}</div>
    </div>
  );
};

// Pill / chip
const Chip = ({ children, tone, outline }) => {
  const { theme } = useApp(); const t = tokens(theme);
  return (
    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] tracking-wide border"
          style={{
            color: tone || t.textMuted,
            borderColor: outline ? (tone || t.border) : t.borderSoft,
            background: outline ? "transparent" : (theme === "light" ? "oklch(0.96 0.005 260)" : "rgba(255,255,255,0.06)"),
          }}>
      {children}
    </span>
  );
};

// Expose to global scope
Object.assign(window, {
  Icon, CoverArt, RatingBar, Stat, Trustlet, Receipt, Chip,
  AppContext, useApp, tokens, cls,
});
