const DOCUMENTS = [
  {
    icon: "LIC", iconBg: "var(--emerald-100)", iconColor: "var(--emerald-700)",
    name: "Plumbing license · CA-0488221",
    meta: "CSLB · class C-36 · expires 12/27",
    status: "ds-ok", statusLabel: "✓ Verified",
  },
  {
    icon: "INS", iconBg: "var(--emerald-100)", iconColor: "var(--emerald-700)",
    name: "General liability · $2M coverage",
    meta: "Hartford · policy GL-948822 · expires 09/26",
    status: "ds-ok", statusLabel: "✓ On file",
  },
  {
    icon: "W-9", iconBg: "var(--emerald-100)", iconColor: "var(--emerald-700)",
    name: "W-9 tax form",
    meta: "Submitted Feb 2024 · EIN ··· 8821",
    status: "ds-ok", statusLabel: "✓ Filed",
  },
  {
    icon: "WC", iconBg: "var(--amber-100)", iconColor: "var(--amber-700)",
    name: "Workers' comp",
    meta: "State Fund · expires in 22 days · 06/05/26",
    status: "ds-warn", statusLabel: "⚠ Renew",
  },
  {
    icon: "BG", iconBg: "var(--slate-100)", iconColor: "var(--slate-600)",
    name: "Background check",
    meta: "Checkr · cleared 02/14/24 · 2yr re-check on file",
    status: "ds-ok", statusLabel: "✓ Cleared",
  },
];

export function CredentialsDocuments() {
  return (
    <>
      <div className="panel-title">
        <span className="num">04</span>
        <span className="label">Credentials &amp; documents</span>
        <span className="rule" />
        <button className="btn btn-secondary btn-sm">+ Upload</button>
      </div>

      <div className="card card-pad">
        {DOCUMENTS.map((d) => (
          <div className="doc-row" key={d.icon}>
            <div className="doc-icon" style={{ background: d.iconBg, color: d.iconColor }}>{d.icon}</div>
            <div>
              <div className="doc-name">{d.name}</div>
              <div className="doc-meta">{d.meta}</div>
            </div>
            <span className={`doc-status ${d.status}`}>{d.statusLabel}</span>
          </div>
        ))}
      </div>
    </>
  );
}
