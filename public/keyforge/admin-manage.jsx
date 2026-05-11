// Admin management UIs — generic editable tables for Games, Users, Suppliers, Platforms, Payment methods, Key batches.
// All entities live in window.* arrays seeded from data.jsx; edits mutate in-memory state via React useState
// so the prototype feels like a real admin without needing a backend.
const { useState: useStateAM, useMemo: useMemoAM, useEffect: useEffectAM, useRef: useRefAM } = React;

// ---------- shared form atoms ----------
const Field = ({ label, children, span }) => {
  const { theme } = useApp(); const t = tokens(theme);
  return (
    <label className={`flex flex-col gap-1 ${span === 2 ? "col-span-2" : ""}`}>
      <span className="font-mono text-[10px] tracking-[0.15em]" style={{ color: t.textDim }}>{label}</span>
      {children}
    </label>
  );
};

const TextInput = ({ value, onChange, type = "text", placeholder, disabled }) => {
  const { theme } = useApp(); const t = tokens(theme);
  return (
    <input type={type} value={value ?? ""} placeholder={placeholder} disabled={disabled}
      onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? "" : parseFloat(e.target.value)) : e.target.value)}
      className="rounded-lg px-2.5 py-1.5 font-mono text-[12px] outline-none border transition focus:border-current"
      style={{
        background: theme === "light" ? "oklch(0.98 0.005 75)" : "rgba(255,255,255,0.04)",
        color: t.text, borderColor: t.borderSoft,
      }} />
  );
};

const Select = ({ value, onChange, options }) => {
  const { theme } = useApp(); const t = tokens(theme);
  return (
    <select value={value ?? ""} onChange={(e) => onChange(isNaN(parseInt(e.target.value)) ? e.target.value : parseInt(e.target.value))}
      className="rounded-lg px-2 py-1.5 font-mono text-[12px] outline-none border"
      style={{
        background: theme === "light" ? "oklch(0.98 0.005 75)" : "rgba(255,255,255,0.04)",
        color: t.text, borderColor: t.borderSoft,
      }}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
};

const BtnGhost = ({ children, onClick, danger }) => {
  const { theme } = useApp(); const t = tokens(theme);
  return (
    <button onClick={onClick}
      className="px-2.5 py-1 rounded-md font-mono text-[10px] tracking-wider border transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
      style={{ borderColor: t.borderSoft, color: danger ? t.warn : t.textMuted, background: "transparent" }}>
      {children}
    </button>
  );
};

const BtnPrimary = ({ children, onClick, icon }) => {
  const { theme } = useApp(); const t = tokens(theme);
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] tracking-wider transition"
      style={{ background: t.accent, color: theme === "light" ? "white" : "oklch(0.18 0.02 260)" }}>
      {icon && <Icon name={icon} size={12} />}{children}
    </button>
  );
};

// ---------- Modal ----------
const Modal = ({ open, onClose, title, children, footer }) => {
  const { theme } = useApp(); const t = tokens(theme);
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 10000, background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="rounded-2xl border w-full max-w-[560px] shadow-2xl" onClick={(e) => e.stopPropagation()}
           style={{ background: t.panelBg, borderColor: t.border, color: t.text }}>
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: t.borderSoft }}>
          <div className="font-display text-[15px] font-medium">{title}</div>
          <button onClick={onClose} className="opacity-70 hover:opacity-100"><Icon name="X" size={16} color={t.text} /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
        <div className="px-5 py-3 border-t flex items-center justify-end gap-2" style={{ borderColor: t.borderSoft }}>
          {footer}
        </div>
      </div>
    </div>
  );
};

// ---------- Generic EntityManager ----------
// columns: [{ key, label, render?, align? }]
// fields:  [{ key, label, type: 'text'|'number'|'email'|'select', options?, placeholder?, span? }]
// rows:    state array; setRows updates it
const EntityManager = ({ title, subtitle, icon, rows, setRows, columns, fields, newRow, searchKeys = [], nameLabel = "name" }) => {
  const { theme } = useApp(); const t = tokens(theme);
  const [query, setQuery] = useStateAM("");
  const [editing, setEditing] = useStateAM(null);   // row or null
  const [confirmDel, setConfirmDel] = useStateAM(null);

  const filtered = useMemoAM(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q)));
  }, [rows, query, searchKeys]);

  const openAdd = () => setEditing({ __new: true, ...newRow() });
  const openEdit = (r) => setEditing({ ...r });
  const save = () => {
    if (editing.__new) {
      const id = Math.max(0, ...rows.map((r) => r.id)) + 1;
      // Avoid object-rest destructuring here — when two text/babel scripts
      // both emit it, the @babel/standalone helper `_excluded` collides at
      // global scope. Inline Object.assign + delete keeps the same outcome.
      const clean = Object.assign({}, editing);
      delete clean.__new;
      setRows([...rows, Object.assign({}, clean, { id })]);
    } else {
      setRows(rows.map((r) => r.id === editing.id ? { ...r, ...editing } : r));
    }
    setEditing(null);
  };
  const remove = (r) => { setRows(rows.filter((x) => x.id !== r.id)); setConfirmDel(null); };

  return (
    <div className="rounded-2xl p-5 border" style={{ background: t.panelBg, borderColor: t.borderSoft }}>
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <div className="font-display text-[16px] font-medium flex items-center gap-2" style={{ color: t.text }}>
            {icon && <Icon name={icon} size={16} color={t.accent} />}{title}
          </div>
          {subtitle && <div className="font-mono text-[10px] tracking-wider mt-0.5" style={{ color: t.textDim }}>{subtitle}</div>}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search…"
              className="rounded-lg pl-7 pr-2.5 py-1.5 font-mono text-[11px] outline-none border w-[180px]"
              style={{
                background: theme === "light" ? "oklch(0.98 0.005 75)" : "rgba(255,255,255,0.04)",
                color: t.text, borderColor: t.borderSoft,
              }} />
            <Icon name="Search" size={12} color={t.textDim} />
            <span style={{ position: "absolute", left: 8, top: 8, pointerEvents: "none" }}>
              <Icon name="Search" size={12} color={t.textDim} />
            </span>
          </div>
          <BtnPrimary onClick={openAdd} icon="Plus">Add</BtnPrimary>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="font-mono text-[10px] tracking-[0.15em]"
                style={{ color: t.textDim, background: theme === "light" ? "oklch(0.97 0.005 75)" : "rgba(255,255,255,0.03)" }}>
              {columns.map((c) => (
                <th key={c.key} className={`px-3 py-2.5 ${c.align === "right" ? "text-right" : "text-left"}`}>{c.label}</th>
              ))}
              <th className="px-3 py-2.5 w-[120px]"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="px-3 py-8 text-center font-mono text-[11px]" style={{ color: t.textDim }}>No matching rows.</td></tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-t hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition"
                  style={{ borderColor: t.borderSoft, color: t.text }}>
                {columns.map((c) => (
                  <td key={c.key} className={`px-3 py-2.5 ${c.align === "right" ? "text-right tabular-nums font-mono" : ""}`}>
                    {c.render ? c.render(r) : (r[c.key] ?? "—")}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <BtnGhost onClick={() => openEdit(r)}>edit</BtnGhost>
                    <BtnGhost danger onClick={() => setConfirmDel(r)}>delete</BtnGhost>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 font-mono text-[10px] tabular-nums" style={{ color: t.textDim }}>
        Showing {filtered.length} of {rows.length}.
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.__new ? `New ${title.toLowerCase()}` : `Edit · ${editing?.[nameLabel] ?? "#" + editing?.id}`}
             footer={
               <>
                 <BtnGhost onClick={() => setEditing(null)}>cancel</BtnGhost>
                 <BtnPrimary onClick={save} icon="Check">save</BtnPrimary>
               </>
             }>
        <div className="grid grid-cols-2 gap-3">
          {editing && fields.map((f) => (
            <Field key={f.key} label={f.label} span={f.span}>
              {f.type === "select" ? (
                <Select value={editing[f.key]} onChange={(v) => setEditing({ ...editing, [f.key]: v })} options={f.options} />
              ) : (
                <TextInput type={f.type || "text"} value={editing[f.key]} placeholder={f.placeholder}
                           onChange={(v) => setEditing({ ...editing, [f.key]: v })} />
              )}
            </Field>
          ))}
        </div>
      </Modal>

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Confirm delete"
             footer={
               <>
                 <BtnGhost onClick={() => setConfirmDel(null)}>cancel</BtnGhost>
                 <button onClick={() => remove(confirmDel)}
                   className="px-3 py-1.5 rounded-lg font-mono text-[11px] tracking-wider"
                   style={{ background: t.warn, color: theme === "light" ? "white" : "oklch(0.15 0.02 260)" }}>
                   delete
                 </button>
               </>
             }>
        <div className="font-mono text-[12px]" style={{ color: t.textMuted }}>
          Delete <span style={{ color: t.text }}>{confirmDel?.[nameLabel] ?? "#" + confirmDel?.id}</span>? This action is logged and reversible from system audit.
        </div>
      </Modal>
    </div>
  );
};

// ---------- Tab-specific managers ----------
const GamesManager = ({ rows, setRows }) => {
  const platformOpts = PLATFORMS.map((p) => ({ value: p.id, label: p.name }));
  return (
    <EntityManager
      title="Games" subtitle="catalog.games · CRUD" icon="Gamepad2"
      rows={rows} setRows={setRows} searchKeys={["name", "studio"]} nameLabel="name"
      newRow={() => ({ name: "", studio: "", active_platform_id: 1, price: 0, release_year: 2024 })}
      columns={[
        { key: "name", label: "TITLE", render: (r) => (
          <div>
            <div className="font-display font-medium">{r.name}</div>
            <div className="font-mono text-[10px] opacity-60">{r.studio}</div>
          </div>
        ) },
        { key: "platform", label: "PLATFORM", render: (r) => {
          const p = platformById(r.active_platform_id);
          return <Chip tone={p?.tone} outline>{p?.name}</Chip>;
        } },
        { key: "release_year", label: "YEAR", align: "right" },
        { key: "price", label: "PRICE", align: "right", render: (r) => `$${Number(r.price ?? 0).toFixed(2)}` },
      ]}
      fields={[
        { key: "name", label: "Title", span: 2 },
        { key: "studio", label: "Studio" },
        { key: "active_platform_id", label: "Platform", type: "select", options: platformOpts },
        { key: "release_year", label: "Release year", type: "number" },
        { key: "price", label: "Price (USD)", type: "number" },
      ]}
    />
  );
};

const UsersManager = ({ rows, setRows }) => (
  <EntityManager
    title="Users" subtitle="auth.users · CRUD" icon="Users"
    rows={rows} setRows={setRows} searchKeys={["first_name", "last_name", "nickname", "email"]}
    nameLabel="nickname"
    newRow={() => ({ first_name: "", last_name: "", nickname: "", email: "", amount: 0, created_at: new Date().toISOString().slice(0, 19).replace("T", " ") })}
    columns={[
      { key: "nickname", label: "USER", render: (r) => (
        <div>
          <div className="font-display font-medium">{r.first_name} {r.last_name}</div>
          <div className="font-mono text-[10px] opacity-60">@{r.nickname}</div>
        </div>
      ) },
      { key: "email", label: "EMAIL", render: (r) => <span className="font-mono text-[11px]">{r.email}</span> },
      { key: "created_at", label: "JOINED", render: (r) => <span className="font-mono text-[10px] opacity-70">{r.created_at?.slice(0, 10)}</span> },
      { key: "amount", label: "WALLET", align: "right", render: (r) => `$${Number(r.amount ?? 0).toFixed(2)}` },
    ]}
    fields={[
      { key: "first_name", label: "First name" },
      { key: "last_name", label: "Last name" },
      { key: "nickname", label: "Nickname" },
      { key: "email", label: "Email", type: "email" },
      { key: "amount", label: "Wallet balance", type: "number" },
      { key: "created_at", label: "Joined at" },
    ]}
  />
);

const SuppliersManager = ({ rows, setRows }) => {
  const platformOpts = PLATFORMS.map((p) => ({ value: p.id, label: p.name }));
  return (
    <EntityManager
      title="Suppliers" subtitle="ops.suppliers · CRUD" icon="Truck"
      rows={rows} setRows={setRows} searchKeys={["name", "website", "contact_email"]} nameLabel="name"
      newRow={() => ({ name: "", platform_id: 1, website: "", contact_email: "", deleted: 0 })}
      columns={[
        { key: "name", label: "SUPPLIER", render: (r) => <span className="font-display font-medium">{r.name}</span> },
        { key: "platform", label: "PLATFORM", render: (r) => {
          const p = platformById(r.platform_id);
          return <Chip tone={p?.tone} outline>{p?.name}</Chip>;
        } },
        { key: "website", label: "WEBSITE", render: (r) => <span className="font-mono text-[11px]">{r.website}</span> },
        { key: "contact_email", label: "CONTACT", render: (r) => <span className="font-mono text-[11px]">{r.contact_email}</span> },
      ]}
      fields={[
        { key: "name", label: "Name", span: 2 },
        { key: "platform_id", label: "Platform", type: "select", options: platformOpts },
        { key: "website", label: "Website" },
        { key: "contact_email", label: "Contact email", type: "email", span: 2 },
      ]}
    />
  );
};

const PlatformsManager = ({ rows, setRows }) => (
  <EntityManager
    title="Platforms" subtitle="catalog.platforms · CRUD" icon="Layers"
    rows={rows} setRows={setRows} searchKeys={["name"]} nameLabel="name"
    newRow={() => ({ name: "", tone: "oklch(0.65 0.10 240)", toneLight: "oklch(0.45 0.10 240)" })}
    columns={[
      { key: "id", label: "ID", align: "right" },
      { key: "name", label: "NAME", render: (r) => <span className="font-display font-medium">{r.name}</span> },
      { key: "tone", label: "TONE", render: (r) => (
        <div className="inline-flex items-center gap-2">
          <span className="w-4 h-4 rounded-md border" style={{ background: r.tone, borderColor: "rgba(0,0,0,0.15)" }} />
          <span className="font-mono text-[10px] opacity-70">{r.tone}</span>
        </div>
      ) },
    ]}
    fields={[
      { key: "name", label: "Name", span: 2 },
      { key: "tone", label: "Tone (dark)", placeholder: "oklch(...)" },
      { key: "toneLight", label: "Tone (light)", placeholder: "oklch(...)" },
    ]}
  />
);

const PaymentMethodsManager = ({ rows, setRows }) => (
  <EntityManager
    title="Payment methods" subtitle="billing.payment_methods · CRUD" icon="CreditCard"
    rows={rows} setRows={setRows} searchKeys={["name"]} nameLabel="name"
    newRow={() => ({ name: "" })}
    columns={[
      { key: "id", label: "ID", align: "right" },
      { key: "name", label: "NAME", render: (r) => <span className="font-display font-medium">{r.name}</span> },
    ]}
    fields={[{ key: "name", label: "Name", span: 2 }]}
  />
);

Object.assign(window, {
  CollapsibleSectionAtoms: { Field, TextInput, Select, BtnGhost, BtnPrimary, Modal },
  EntityManager,
  GamesManager, UsersManager, SuppliersManager, PlatformsManager, PaymentMethodsManager,
});
