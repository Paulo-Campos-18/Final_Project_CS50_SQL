// Animated site background — admin-controllable.
// Three styles (drift / mesh / aurora) that can independently react to mouse + scroll.
// Settings live in localStorage and propagate live via a custom event.
const { useEffect: useEffectBG, useRef: useRefBG, useState: useStateBG } = React;

const BG_LS_KEY = "kf-bg-settings";
const BG_DEFAULTS = {
  enabled: true,
  reactToMouse: true,
  reactToScroll: true,
  style: "drift",
  intensity: 0.75,
  layer: "back",
  density: 1.0,
  speed: 1.0,
  customColor: null,
};

const BG_COLOR_SWATCHES = [
  { id: null,          label: "Theme",  swatch: "linear-gradient(135deg, oklch(0.85 0.18 165), oklch(0.48 0.10 160))" },
  { id: "144,230,195", label: "Mint",   swatch: "oklch(0.85 0.14 160)" },
  { id: "110,180,255", label: "Azure",  swatch: "oklch(0.75 0.16 240)" },
  { id: "230,150,255", label: "Orchid", swatch: "oklch(0.78 0.17 310)" },
  { id: "255,180,120", label: "Ember",  swatch: "oklch(0.80 0.14 60)" },
  { id: "255,120,140", label: "Rose",   swatch: "oklch(0.72 0.18 15)" },
];

const readBgSettings = () => {
  try {
    const raw = localStorage.getItem(BG_LS_KEY);
    if (!raw) return { ...BG_DEFAULTS };
    return { ...BG_DEFAULTS, ...JSON.parse(raw) };
  } catch (_) { return { ...BG_DEFAULTS }; }
};
const writeBgSettings = (s) => {
  try { localStorage.setItem(BG_LS_KEY, JSON.stringify(s)); } catch (_) {}
  window.dispatchEvent(new CustomEvent("kf-bg-update", { detail: s }));
};

const useBgSettings = () => {
  const [s, setS] = useStateBG(readBgSettings);
  useEffectBG(() => {
    const onUpdate = (e) => setS(e.detail || readBgSettings());
    window.addEventListener("kf-bg-update", onUpdate);
    return () => window.removeEventListener("kf-bg-update", onUpdate);
  }, []);
  const update = (patch) => {
    const next = { ...readBgSettings(), ...patch };
    setS(next);
    writeBgSettings(next);
  };
  return [s, update];
};

// ---------------- Canvas renderer ----------------
const SiteBackground = () => {
  const { theme } = useApp();
  const [settings] = useBgSettings();
  const canvasRef = useRefBG(null);
  const stateRef = useRefBG({
    mouse: { x: -9999, y: -9999, active: false, smoothX: -9999, smoothY: -9999 },
    scroll: { y: 0, vy: 0, lastY: 0, accumulated: 0 },
    particles: [],
    meshCols: 0,
    meshRows: 0,
    raf: 0,
    lastTime: 0,
  });

  // Mouse + scroll global listeners
  useEffectBG(() => {
    if (!settings.enabled) return;
    const st = stateRef.current;
    const onMove = (e) => {
      st.mouse.x = e.clientX;
      st.mouse.y = e.clientY;
      st.mouse.active = true;
    };
    const onLeave = () => { st.mouse.active = false; };
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      st.scroll.vy = y - st.scroll.lastY;
      st.scroll.lastY = y;
      st.scroll.y = y;
      st.scroll.accumulated += st.scroll.vy;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, [settings.enabled]);

  // (Re)init particles when style changes / mount
  useEffectBG(() => {
    if (!settings.enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const st = stateRef.current;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth, h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    };

    const initParticles = () => {
      const W = window.innerWidth, H = window.innerHeight;
      const density = settings.density || 1;
      if (settings.style === "drift" || settings.style === "constellation") {
        const baseCount = Math.max(40, Math.floor((W * H) / 22000));
        const count = Math.floor(baseCount * density);
        st.particles = Array.from({ length: count }, () => ({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.8 + Math.random() * 2.2,
          vx: (Math.random() - 0.5) * 0.25,
          vy: -0.04 - Math.random() * 0.18,
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.005 + Math.random() * 0.02,
        }));
      } else if (settings.style === "rain") {
        const baseCount = Math.max(60, Math.floor((W * H) / 12000));
        const count = Math.floor(baseCount * density);
        st.particles = Array.from({ length: count }, () => ({
          x: Math.random() * W,
          y: Math.random() * H - H,
          len: 12 + Math.random() * 30,
          vy: 2 + Math.random() * 4,
          alpha: 0.2 + Math.random() * 0.4,
          width: 0.6 + Math.random() * 0.9,
        }));
      } else if (settings.style === "mesh") {
        const spacing = 64;
        const cols = Math.ceil(W / spacing) + 2;
        const rows = Math.ceil(H / spacing) + 2;
        const offX = (W - (cols - 1) * spacing) / 2;
        const offY = (H - (rows - 1) * spacing) / 2;
        const arr = new Array(cols * rows);
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const ox = offX + i * spacing;
            const oy = offY + j * spacing;
            arr[i * rows + j] = { ox, oy, x: ox, y: oy };
          }
        }
        st.particles = arr;
        st.meshCols = cols;
        st.meshRows = rows;
      } else if (settings.style === "aurora") {
        st.particles = Array.from({ length: 7 }, (_, i) => ({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 220 + Math.random() * 260,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.18,
          hue: 145 + i * 12 + Math.random() * 10,
          life: Math.random() * 1000,
        }));
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [settings.enabled, settings.style]);

  // Animation loop
  useEffectBG(() => {
    if (!settings.enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const st = stateRef.current;
    const isLight = theme === "light";
    const accent = settings.customColor || (isLight ? "94, 130, 96" : "144, 230, 195");

    const draw = (now) => {
      const dt = Math.min(50, now - (st.lastTime || now)) / 16.6667;
      st.lastTime = now;
      const W = window.innerWidth;
      const H = window.innerHeight;
      ctx.clearRect(0, 0, W, H);

      // Smooth mouse for nicer feel
      if (st.mouse.active) {
        st.mouse.smoothX += (st.mouse.x - st.mouse.smoothX) * 0.18;
        st.mouse.smoothY += (st.mouse.y - st.mouse.smoothY) * 0.18;
      }
      // Damp scroll velocity over time
      st.scroll.vy *= 0.90;
      if (Math.abs(st.scroll.vy) < 0.01) st.scroll.vy = 0;

      const intensity = settings.intensity;
      const speed = settings.speed || 1;
      const useMouse = settings.reactToMouse && st.mouse.active;
      const useScroll = settings.reactToScroll;

      if (settings.style === "drift" || settings.style === "constellation") {
        for (const p of st.particles) {
          p.x += p.vx * dt * speed;
          p.y += p.vy * dt * speed;
          if (useScroll) p.y += st.scroll.vy * 0.4 * dt;
          if (p.x < -20) p.x = W + 20;
          if (p.x > W + 20) p.x = -20;
          if (p.y < -20) p.y = H + 20;
          if (p.y > H + 20) p.y = -20;

          if (useMouse) {
            const dx = st.mouse.smoothX - p.x;
            const dy = st.mouse.smoothY - p.y;
            const d2 = dx * dx + dy * dy;
            const R = 170;
            if (d2 < R * R) {
              const d = Math.sqrt(d2) || 1;
              const f = (1 - d / R) * 1.6;
              p.x -= (dx / d) * f * dt;
              p.y -= (dy / d) * f * dt;
            }
          }

          p.twinkle += p.twinkleSpeed * dt;
          const tw = 0.45 + Math.sin(p.twinkle) * 0.35;
          const baseA = (isLight ? 0.35 : 0.55) * intensity * tw;
          // soft halo
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 7);
          glow.addColorStop(0, `rgba(${accent}, ${baseA * 0.55})`);
          glow.addColorStop(1, `rgba(${accent}, 0)`);
          ctx.fillStyle = glow;
          ctx.fillRect(p.x - p.r * 7, p.y - p.r * 7, p.r * 14, p.r * 14);
          // core
          ctx.fillStyle = `rgba(${accent}, ${baseA * 1.3})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        if (settings.style === "constellation") {
          const maxD = 130;
          ctx.lineWidth = 1;
          for (let i = 0; i < st.particles.length; i++) {
            const a = st.particles[i];
            for (let j = i + 1; j < st.particles.length; j++) {
              const b = st.particles[j];
              const dx = a.x - b.x, dy = a.y - b.y;
              const d2 = dx * dx + dy * dy;
              if (d2 < maxD * maxD) {
                const al = (1 - Math.sqrt(d2) / maxD) * 0.25 * intensity;
                ctx.strokeStyle = `rgba(${accent}, ${al})`;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
              }
            }
          }
        }
      } else if (settings.style === "rain") {
        ctx.lineCap = "round";
        for (const p of st.particles) {
          p.y += p.vy * dt * speed;
          if (useScroll) p.y += st.scroll.vy * 0.6 * dt;
          if (useMouse) {
            const dx = st.mouse.smoothX - p.x;
            const R = 140;
            if (Math.abs(dx) < R) {
              const f = (1 - Math.abs(dx) / R) * 3;
              p.x -= Math.sign(dx) * f * dt;
            }
          }
          if (p.y > H + 40) { p.y = -p.len; p.x = Math.random() * W; }
          ctx.strokeStyle = `rgba(${accent}, ${p.alpha * intensity})`;
          ctx.lineWidth = p.width;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + p.len);
          ctx.stroke();
        }
      } else if (settings.style === "mesh") {
        const cols = st.meshCols, rows = st.meshRows;
        const scrollOffset = useScroll ? (st.scroll.y * 0.12) % 64 : 0;
        // Compute displaced positions
        for (const p of st.particles) {
          let tx = p.ox;
          let ty = p.oy + scrollOffset;
          if (useMouse) {
            const dx = st.mouse.smoothX - tx;
            const dy = st.mouse.smoothY - ty;
            const d2 = dx * dx + dy * dy;
            const R = 180;
            if (d2 < R * R) {
              const d = Math.sqrt(d2) || 1;
              const f = (1 - d / R) * 42;
              tx -= (dx / d) * f;
              ty -= (dy / d) * f;
            }
          }
          p.x += (tx - p.x) * Math.min(1, 0.18 * dt);
          p.y += (ty - p.y) * Math.min(1, 0.18 * dt);
        }
        // Lines (drawn first, dots on top)
        ctx.strokeStyle = `rgba(${accent}, ${0.10 * intensity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < cols - 1; i++) {
          for (let j = 0; j < rows - 1; j++) {
            const a = st.particles[i * rows + j];
            const b = st.particles[(i + 1) * rows + j];
            const c = st.particles[i * rows + (j + 1)];
            if (!a || !b || !c) continue;
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y);
          }
        }
        ctx.stroke();
        // Dots
        ctx.fillStyle = `rgba(${accent}, ${0.35 * intensity})`;
        for (const p of st.particles) {
          // brighter if near mouse
          let r = 1.3;
          if (useMouse) {
            const dx = st.mouse.smoothX - p.x;
            const dy = st.mouse.smoothY - p.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 14400) r = 1.3 + (1 - Math.sqrt(d2) / 120) * 2.2;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (settings.style === "aurora") {
        ctx.globalCompositeOperation = "lighter";
        for (const p of st.particles) {
          p.life += dt;
          p.x += p.vx * dt * speed;
          p.y += p.vy * dt * speed;
          if (useScroll) p.y -= st.scroll.vy * 0.5 * dt;
          if (useMouse) {
            const dx = st.mouse.smoothX - p.x;
            const dy = st.mouse.smoothY - p.y;
            p.vx += dx * 0.00003 * dt;
            p.vy += dy * 0.00003 * dt;
          }
          // gentle friction + cap
          p.vx *= 0.995; p.vy *= 0.995;
          const sp = Math.hypot(p.vx, p.vy);
          if (sp > 1.4) { p.vx *= 1.4 / sp; p.vy *= 1.4 / sp; }
          // wrap
          if (p.x < -p.r) p.x = W + p.r;
          if (p.x > W + p.r) p.x = -p.r;
          if (p.y < -p.r) p.y = H + p.r;
          if (p.y > H + p.r) p.y = -p.r;

          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          const alpha = (isLight ? 0.10 : 0.18) * intensity;
          grad.addColorStop(0, `hsla(${p.hue}, 70%, ${isLight ? 50 : 60}%, ${alpha})`);
          grad.addColorStop(0.6, `hsla(${p.hue}, 70%, ${isLight ? 50 : 60}%, ${alpha * 0.25})`);
          grad.addColorStop(1, `hsla(${p.hue}, 70%, ${isLight ? 50 : 60}%, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      }

      st.raf = requestAnimationFrame(draw);
    };
    st.raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(st.raf);
  }, [settings.enabled, settings.style, settings.reactToMouse, settings.reactToScroll, settings.intensity, theme]);

  if (!settings.enabled) return null;
  const isFront = settings.layer === "front";
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: isFront ? 9999 : 0,
        opacity: isFront ? 0.6 : 1,
        mixBlendMode: isFront ? (theme === "light" ? "multiply" : "screen") : "normal",
      }}
    />
  );
};

// ---------------- Admin settings card ----------------
const BgToggle = ({ on, onClick, disabled, theme, accent }) => (
  <button onClick={onClick} disabled={disabled} aria-pressed={on}
    className="relative rounded-full transition-all"
    style={{
      width: 38, height: 22,
      background: on ? accent : (theme === "light" ? "oklch(0.82 0.01 75)" : "rgba(255,255,255,0.14)"),
      opacity: disabled ? 0.4 : 1,
      cursor: disabled ? "not-allowed" : "pointer",
    }}>
    <span className="absolute top-0.5 rounded-full transition-all"
      style={{
        width: 18, height: 18,
        left: on ? 18 : 2,
        background: theme === "light" && on ? "oklch(0.97 0.005 75)" : "white",
        boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
      }} />
  </button>
);

const BgRow = ({ label, sub, t, theme, children, first }) => (
  <div className="flex items-center justify-between py-3" style={{ borderTop: first ? "none" : `1px solid ${t.borderSoft}` }}>
    <div className="min-w-0 pr-3">
      <div className="font-display text-[13px]" style={{ color: t.text }}>{label}</div>
      {sub && <div className="font-mono text-[10px] mt-0.5" style={{ color: t.textDim }}>{sub}</div>}
    </div>
    {children}
  </div>
);

const BgStylePreview = ({ id, accent, theme }) => {
  // Tiny inline SVG previews per style
  if (id === "drift") {
    return (
      <svg viewBox="0 0 80 40" className="w-full h-full">
        <circle cx="12" cy="14" r="2.2" fill={accent} opacity="0.9" />
        <circle cx="28" cy="26" r="1.4" fill={accent} opacity="0.6" />
        <circle cx="44" cy="10" r="2.8" fill={accent} opacity="0.85" />
        <circle cx="58" cy="22" r="1.8" fill={accent} opacity="0.7" />
        <circle cx="70" cy="30" r="2.2" fill={accent} opacity="0.55" />
        <circle cx="20" cy="34" r="1.2" fill={accent} opacity="0.5" />
      </svg>
    );
  }
  if (id === "mesh") {
    const dots = [];
    const lines = [];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        const x = 8 + i * 16;
        const y = 8 + j * 12;
        dots.push(<circle key={`d-${i}-${j}`} cx={x} cy={y} r="1.1" fill={accent} opacity="0.75" />);
        if (i < 4) lines.push(<line key={`h-${i}-${j}`} x1={x} y1={y} x2={x + 16} y2={8 + j * 12} stroke={accent} strokeOpacity="0.25" strokeWidth="0.5" />);
        if (j < 2) lines.push(<line key={`v-${i}-${j}`} x1={x} y1={y} x2={x} y2={y + 12} stroke={accent} strokeOpacity="0.25" strokeWidth="0.5" />);
      }
    }
    return (
      <svg viewBox="0 0 80 40" className="w-full h-full">{lines}{dots}</svg>
    );
  }
  // aurora
  return (
    <svg viewBox="0 0 80 40" className="w-full h-full">
      <defs>
        <radialGradient id="aur1" cx="0.3" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={accent} stopOpacity="0.7" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="aur2" cx="0.7" cy="0.4" r="0.5">
          <stop offset="0%" stopColor="hsl(180, 70%, 55%)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="hsl(180, 70%, 55%)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="80" height="40" fill="url(#aur1)" />
      <rect width="80" height="40" fill="url(#aur2)" />
    </svg>
  );
};

const BackgroundFXSettings = () => {
  const { theme } = useApp();
  const t = tokens(theme);
  const [s, update] = useBgSettings();

  const styles = [
    { id: "drift",         label: "Drift",         sub: "Floating motes" },
    { id: "mesh",          label: "Mesh",          sub: "Wire grid" },
    { id: "aurora",        label: "Aurora",        sub: "Glow plumes" },
    { id: "constellation", label: "Constellation", sub: "Dots + lines" },
    { id: "rain",          label: "Rain",          sub: "Streaks" },
  ];

  return (
    <div className="rounded-2xl p-5 border" style={{ background: t.panelBg, borderColor: t.borderSoft }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-display text-[16px] font-medium flex items-center gap-2" style={{ color: t.text }}>
            <Icon name="Sparkles" size={16} color={t.accent} />
            Animated background
          </div>
          <div className="font-mono text-[10px] tracking-wider mt-0.5" style={{ color: t.textDim }}>
            SITE-WIDE FX · STORED IN localStorage
          </div>
        </div>
        <div className="px-2 py-0.5 rounded-md font-mono text-[10px] tracking-[0.2em]"
             style={{ background: s.enabled ? t.accentBg : (theme === "light" ? "oklch(0.85 0.01 75)" : "rgba(255,255,255,0.06)"), color: s.enabled ? t.accent : t.textDim }}>
          {s.enabled ? "LIVE" : "OFF"}
        </div>
      </div>

      <BgRow first label="Enable background FX" sub="Master switch — overrides all reactions below" t={t} theme={theme}>
        <BgToggle on={s.enabled} onClick={() => update({ enabled: !s.enabled })} theme={theme} accent={t.accent} />
      </BgRow>
      <BgRow label="React to mouse" sub="Particles displace / attract toward cursor" t={t} theme={theme}>
        <BgToggle on={s.reactToMouse} onClick={() => update({ reactToMouse: !s.reactToMouse })} disabled={!s.enabled} theme={theme} accent={t.accent} />
      </BgRow>
      <BgRow label="React to scroll" sub="Field accelerates with scroll velocity" t={t} theme={theme}>
        <BgToggle on={s.reactToScroll} onClick={() => update({ reactToScroll: !s.reactToScroll })} disabled={!s.enabled} theme={theme} accent={t.accent} />
      </BgRow>

      <div className="mt-4">
        <div className="font-mono text-[10px] tracking-[0.18em] mb-2" style={{ color: t.textDim }}>LAYER</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "back",  label: "Behind content", sub: "FX sits below cards & text" },
            { id: "front", label: "Above content",  sub: "FX overlays the whole site" },
          ].map((opt) => {
            const on = s.layer === opt.id;
            return (
              <button key={opt.id} onClick={() => update({ layer: opt.id })} disabled={!s.enabled}
                className="rounded-xl border p-3 text-left transition"
                style={{
                  background: on ? t.accentBg : (theme === "light" ? "oklch(0.98 0.005 75)" : "rgba(255,255,255,0.025)"),
                  borderColor: on ? t.accent : t.borderSoft,
                  opacity: !s.enabled ? 0.5 : 1,
                  cursor: !s.enabled ? "not-allowed" : "pointer",
                }}>
                <div className="font-display text-[12px] font-medium" style={{ color: t.text }}>{opt.label}</div>
                <div className="font-mono text-[9px] mt-0.5" style={{ color: t.textDim }}>{opt.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <div className="font-mono text-[10px] tracking-[0.18em] mb-2" style={{ color: t.textDim }}>STYLE</div>
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-2">
          {styles.map((opt) => {
            const on = s.style === opt.id;
            return (
              <button key={opt.id} onClick={() => update({ style: opt.id })} disabled={!s.enabled}
                className="rounded-xl border p-2.5 text-left transition relative overflow-hidden"
                style={{
                  background: on ? t.accentBg : (theme === "light" ? "oklch(0.98 0.005 75)" : "rgba(255,255,255,0.025)"),
                  borderColor: on ? t.accent : t.borderSoft,
                  opacity: !s.enabled ? 0.5 : 1,
                  cursor: !s.enabled ? "not-allowed" : "pointer",
                }}>
                <div className="h-10 rounded-md mb-2 overflow-hidden"
                     style={{ background: theme === "light" ? "oklch(0.94 0.01 75)" : "rgba(0,0,0,0.35)" }}>
                  <BgStylePreview id={opt.id} accent={t.accent} theme={theme} />
                </div>
                <div className="font-display text-[12px] font-medium" style={{ color: t.text }}>{opt.label}</div>
                <div className="font-mono text-[9px]" style={{ color: t.textDim }}>{opt.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <div className="font-mono text-[10px] tracking-[0.18em] mb-2" style={{ color: t.textDim }}>COLOR</div>
        <div className="flex items-center gap-2 flex-wrap">
          {BG_COLOR_SWATCHES.map((c) => {
            const on = (s.customColor || null) === c.id;
            return (
              <button key={String(c.id)} onClick={() => update({ customColor: c.id })} disabled={!s.enabled}
                className="rounded-lg border p-1 flex items-center gap-1.5 transition"
                style={{
                  borderColor: on ? t.accent : t.borderSoft,
                  background: on ? t.accentBg : "transparent",
                  opacity: !s.enabled ? 0.5 : 1,
                  cursor: !s.enabled ? "not-allowed" : "pointer",
                }}>
                <span className="w-5 h-5 rounded-md" style={{ background: c.swatch, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)" }} />
                <span className="font-mono text-[10px] pr-1" style={{ color: t.text }}>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="font-mono text-[10px] tracking-[0.18em]" style={{ color: t.textDim }}>INTENSITY</div>
            <div className="font-mono text-[10px] tabular-nums" style={{ color: t.text }}>{Math.round(s.intensity * 100)}%</div>
          </div>
          <input type="range" min={0.2} max={1.2} step={0.05} value={s.intensity}
            onChange={(e) => update({ intensity: parseFloat(e.target.value) })}
            disabled={!s.enabled} className="w-full"
            style={{ accentColor: t.accent, opacity: !s.enabled ? 0.5 : 1 }} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="font-mono text-[10px] tracking-[0.18em]" style={{ color: t.textDim }}>DENSITY</div>
            <div className="font-mono text-[10px] tabular-nums" style={{ color: t.text }}>{Math.round((s.density ?? 1) * 100)}%</div>
          </div>
          <input type="range" min={0.4} max={1.8} step={0.05} value={s.density ?? 1}
            onChange={(e) => update({ density: parseFloat(e.target.value) })}
            disabled={!s.enabled} className="w-full"
            style={{ accentColor: t.accent, opacity: !s.enabled ? 0.5 : 1 }} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="font-mono text-[10px] tracking-[0.18em]" style={{ color: t.textDim }}>SPEED</div>
            <div className="font-mono text-[10px] tabular-nums" style={{ color: t.text }}>{Math.round((s.speed ?? 1) * 100)}%</div>
          </div>
          <input type="range" min={0.3} max={2.5} step={0.05} value={s.speed ?? 1}
            onChange={(e) => update({ speed: parseFloat(e.target.value) })}
            disabled={!s.enabled} className="w-full"
            style={{ accentColor: t.accent, opacity: !s.enabled ? 0.5 : 1 }} />
        </div>
      </div>

      <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${t.borderSoft}` }}>
        <div className="font-mono text-[10px]" style={{ color: t.textDim }}>
          Move the cursor or scroll to preview live →
        </div>
        <button onClick={() => update({ ...BG_DEFAULTS })}
          className="font-mono text-[10px] px-2 py-1 rounded border transition"
          style={{ color: t.textMuted, borderColor: t.borderSoft, background: "transparent" }}>
          reset
        </button>
      </div>
    </div>
  );
};

Object.assign(window, { SiteBackground, BackgroundFXSettings, useBgSettings });
