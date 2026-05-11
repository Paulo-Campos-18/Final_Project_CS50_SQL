// Root app: wires together storefront + detail + admin + cart with theme/currency context.
const { useState: useStateR, useEffect: useEffectR, useMemo: useMemoR } = React;

const AppInner = () => {
  const { theme, currency } = useApp();
  const tk = tokens(theme);
  const cart = useCart();

  const [route, setRoute] = useStateR("store");
  const [view, setView] = useStateR({ name: "vitrine", game: null });
  const [authedUser, setAuthedUserR] = useStateR(() => {
    try {
      const raw = localStorage.getItem("keyvault-auth");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [flow, setFlow] = useStateR(() => {
    const u = (() => {
      try { return JSON.parse(localStorage.getItem("keyvault-auth") || "null"); } catch { return null; }
    })();
    return {
      email: u?.email || "",
      name: u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "",
      method: 1, card: { number: "", name: "", expiry: "", cvc: "" },
      cpf: "", paypalEmail: "", newsletter: false,
    };
  });
  const [purchased, setPurchased] = useStateR(null); // items snapshot for success page
  const [toast, setToastMsg] = useStateR(null);

  // Email coming from /api/auth/login isn't in the safeUser shape. Pull it from
  // the original /api/auth/login response. The SPA stored only nickname/role.
  // For now, derive a display email from nickname if not present.
  useEffectR(() => {
    const onStorage = (e) => {
      if (e.key === "keyvault-auth") {
        try { setAuthedUserR(JSON.parse(e.newValue || "null")); } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    clearTimeout(window.__kfToastTm);
    window.__kfToastTm = setTimeout(() => setToastMsg(null), 2200);
  };

  useEffectR(() => {
    document.documentElement.style.background = tk.pageBg;
    document.body.style.background = tk.pageBg;
    document.body.style.color = tk.text;
  }, [theme]);

  const onOpen = (game) => { setView({ name: "detail", game }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const onBack = () => { setView({ name: "vitrine", game: null }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const onAddToCart = (game) => { cart.add(game, 1); showToast(t("cart.added") + " · " + game.name); };
  const onBuyNow = (game) => { cart.add(game, 1); goToCart(); };

  const goToCart = () => { setView({ name: "cart" }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const goToCheckout = () => {
    // Authenticated users skip the email step (we already know who they are);
    // anonymous users must sign in first — we redirect to the Next.js /login.
    if (!authedUser) {
      window.location.href = "/login?next=" + encodeURIComponent("/keyforge/index.html");
      return;
    }
    setView({ name: "checkout", step: "payment" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  // Step order depends on whether we collect email or not.
  const stepOrder = () => authedUser ? ["payment", "details", "review"] : ["email", "payment", "details", "review"];
  const stepNext = (cur) => {
    const order = stepOrder();
    const i = order.indexOf(cur);
    if (i < order.length - 1) setView({ name: "checkout", step: order[i + 1] });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const stepBack = (cur) => {
    const order = stepOrder();
    const i = order.indexOf(cur);
    if (i > 0) setView({ name: "checkout", step: order[i - 1] });
    else goToCart();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const stepJump = (k) => { setView({ name: "checkout", step: k }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const onConfirm = () => { setPurchased(cart.items); setView({ name: "processing" }); };
  const onProcessed = () => { cart.clear(); setView({ name: "cart-success" }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const onBackToStore = () => { setRoute("store"); setView({ name: "vitrine", game: null }); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const navigate = ({ route: r }) => {
    if (r === "cart") { goToCart(); return; }
    setRoute(r);
    setView({ name: "vitrine", game: null });
  };

  return (
    <div className="min-h-screen" style={{ background: tk.pageBg, color: tk.text, backgroundImage: tk.glowBg }}>
      <TopNav route={view.name === "cart" || view.name === "checkout" ? "cart" : route} onNavigate={navigate} onCartClick={goToCart} />
      <AnimatePresence mode="wait">
        {view.name === "cart" ? (
          <CartPage key="cart" onContinue={onBackToStore} onCheckout={goToCheckout} onOpenGame={onOpen} />
        ) : view.name === "checkout" && view.step === "email" ? (
          <StepEmail key="step-email" flow={flow} setFlow={setFlow} items={cart.items} currency={currency}
                     onNext={() => stepNext("email")} onBack={() => stepBack("email")} onJump={stepJump} />
        ) : view.name === "checkout" && view.step === "payment" ? (
          <StepPayment key="step-payment" flow={flow} setFlow={setFlow} items={cart.items} currency={currency}
                       onNext={() => stepNext("payment")} onBack={() => stepBack("payment")} onJump={stepJump} />
        ) : view.name === "checkout" && view.step === "details" ? (
          <StepDetails key="step-details" flow={flow} setFlow={setFlow} items={cart.items} currency={currency}
                       onNext={() => stepNext("details")} onBack={() => stepBack("details")} onJump={stepJump} />
        ) : view.name === "checkout" && view.step === "review" ? (
          <StepReview key="step-review" flow={flow} items={cart.items} currency={currency}
                      onConfirm={onConfirm} onBack={() => stepBack("review")} onJump={stepJump} />
        ) : view.name === "cart-success" && purchased ? (
          <CartSuccessScreen key="cart-success" items={purchased} flow={flow} onBackToStore={onBackToStore} />
        ) : route === "admin" ? (
          <AdminDashboard key="admin" onOpenGame={(g) => { setRoute("store"); setView({ name: "detail", game: g }); }} />
        ) : route === "deals" && view.name === "vitrine" ? (
          <DealsPage key="deals" onOpen={onOpen} />
        ) : route === "library" && view.name === "vitrine" ? (
          <LibraryPage key="library" onOpen={onOpen} />
        ) : view.name === "vitrine" ? (
          <Vitrine key="vitrine" onOpen={onOpen} />
        ) : view.name === "detail" ? (
          <DetailPage key="detail" game={view.game} onBack={onBack} onBuy={() => onBuyNow(view.game)} onAddToCart={() => onAddToCart(view.game)} />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {view.name === "processing" && (
          <CheckoutOverlay key="processing" game={purchased && purchased[0] ? purchased[0].game : { name: "Order", price: 0 }} onComplete={onProcessed} onCancel={() => setView({ name: "checkout", step: "review" })} />
        )}
      </AnimatePresence>
      <CartToast message={toast} />
    </div>
  );
};

const App = () => {
  const [theme, setTheme] = useStateR(() => localStorage.getItem("kf-theme") || "dark");
  const [currency, setCurrency] = useStateR(() => localStorage.getItem("kf-currency") || "USD");
  const [language, setLanguageState] = useStateR(() => localStorage.getItem("kf-lang") || "pt-BR");

  window.__lang = language;
  const setLanguage = (l) => { window.__lang = l; setLanguageState(l); };

  useEffectR(() => { localStorage.setItem("kf-theme", theme); }, [theme]);
  useEffectR(() => { localStorage.setItem("kf-currency", currency); }, [currency]);
  useEffectR(() => { localStorage.setItem("kf-lang", language); window.__lang = language; }, [language]);

  const ctx = useMemoR(() => ({ theme, setTheme, currency, setCurrency, language, setLanguage }), [theme, currency, language]);

  return (
    <AppContext.Provider value={ctx}>
      <CartProvider>
        <AppInner />
      </CartProvider>
    </AppContext.Provider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
