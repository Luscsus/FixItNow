import { Link, useSearchParams } from "react-router-dom";

import { ConfirmEmailCard } from "@/components/confirm-email-card";

export function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-canvas)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Brand */}
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", marginBottom: 32, textDecoration: "none", color: "inherit" }}>
          <span className="brand-mark" aria-hidden="true" />
          <span>FixIt<span className="brand-now">Now</span></span>
        </Link>

        {/* Header */}
        <div className="col" style={{ gap: 6, marginBottom: 24 }}>
          <p className="crumbs">Account setup</p>
          <h1 className="h1">Confirm your email</h1>
          <p className="body muted" style={{ marginTop: 4 }}>
            Click the link in your inbox or paste the token below to activate your account.
          </p>
        </div>

        <ConfirmEmailCard initialToken={token} />

        <div style={{ marginTop: 24 }}>
          <Link
            to="/login"
            style={{ fontSize: 13.5, color: "var(--text-muted)", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
