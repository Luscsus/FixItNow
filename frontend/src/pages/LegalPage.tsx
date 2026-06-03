import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TERMS, PRIVACY, pickLang, type LegalDoc } from "@/content/legal";

export function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const { t, i18n } = useTranslation();
  const lang = pickLang(i18n.language);
  const doc: LegalDoc = (kind === "terms" ? TERMS : PRIVACY)[lang];

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-canvas)" }}>
      {/* Slim header */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <Link to="/" className="row" style={{ alignItems: "center", gap: 8, textDecoration: "none", color: "var(--text)", fontWeight: 700 }}>
            <span className="brand-mark" aria-hidden="true" />
            <span>FixIt<span style={{ color: "var(--amber-500)" }}>Now</span></span>
          </Link>
          <Link to="/" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>
            {t("legal.backToSite")}
          </Link>
        </div>
      </header>

      <article className="container" style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 96px" }}>
        <h1 className="h1" style={{ marginBottom: 6 }}>{doc.title}</h1>
        <p className="mono" style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 8px" }}>{doc.updated}</p>
        <p
          style={{
            fontSize: 12.5, color: "var(--text-muted)", background: "var(--slate-50)",
            border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px",
            lineHeight: 1.55, margin: "0 0 28px",
          }}
        >
          {doc.disclaimer}
        </p>

        {doc.intro.map((p, i) => (
          <p key={`intro-${i}`} style={{ fontSize: 15, lineHeight: 1.65, color: "var(--text)", margin: "0 0 14px" }}>{p}</p>
        ))}

        {doc.blocks.map((block) => (
          <section key={block.h} style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 10px" }}>{block.h}</h2>
            {block.p?.map((p, i) => (
              <p key={i} style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--text)", margin: "0 0 10px" }}>{p}</p>
            ))}
            {block.ul && (
              <ul style={{ margin: "0 0 10px", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                {block.ul.map((li, i) => (
                  <li key={i} style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--text)" }}>{li}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid var(--border)", display: "flex", gap: 16 }}>
          <Link to="/terms" style={{ color: "var(--navy-700)", fontWeight: 600, textDecoration: "none", fontSize: 14 }}>
            {t("legal.termsTitle")}
          </Link>
          <Link to="/privacy" style={{ color: "var(--navy-700)", fontWeight: 600, textDecoration: "none", fontSize: 14 }}>
            {t("legal.privacyTitle")}
          </Link>
        </div>
      </article>
    </main>
  );
}
