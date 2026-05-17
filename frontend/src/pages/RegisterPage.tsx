import { Link } from "react-router-dom";

export function RegisterPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-canvas)", display: "flex", flexDirection: "column" }}>
      {/* Minimal header */}
      <header style={{ padding: "24px 40px" }}>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", textDecoration: "none", color: "inherit" }}>
          <span className="brand-mark" aria-hidden="true" />
          <span>FixIt<span className="brand-now">Now</span></span>
        </Link>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: 640, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p className="crumbs" style={{ marginBottom: 12 }}>Create your account</p>
            <h1 className="h1" style={{ fontSize: 36 }}>How will you use FixItNow?</h1>
            <p className="body muted" style={{ marginTop: 12 }}>Choose your role — you can always add the other later.</p>
          </div>

          <div className="col" style={{ gap: 16 }}>
            {/* User card (dark) */}
            <Link to="/register/user" className="choose-card user-card">
              <span className="recommended-badge">Recommended</span>
              <div className="role-num">01</div>
              <div>
                <div className="role-name">I need things fixed</div>
                <div className="role-desc">Report maintenance issues and get matched with verified local providers.</div>
                <div className="role-tags">
                  <span className="role-tag">Homeowner</span>
                  <span className="role-tag">Tenant</span>
                  <span className="role-tag">Property manager</span>
                </div>
              </div>
              <div className="role-cta">
                Get started
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </div>
            </Link>

            {/* Provider card (light) */}
            <Link to="/register/provider" className="choose-card">
              <div className="role-num">02</div>
              <div>
                <div className="role-name">I'm a provider</div>
                <div className="role-desc">Offer your trade skills, set your own rates, and grow your client base.</div>
                <div className="role-tags">
                  <span className="role-tag">Plumber</span>
                  <span className="role-tag">Electrician</span>
                  <span className="role-tag">HVAC</span>
                  <span className="role-tag">+more</span>
                </div>
              </div>
              <div className="role-cta">
                Apply now
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </div>
            </Link>
          </div>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--navy-700)", fontWeight: 600, textDecoration: "none" }}>
              Sign in →
            </Link>
          </p>

          <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
            By creating an account you agree to our{" "}
            <a href="#" style={{ color: "var(--navy-700)", textDecoration: "none" }}>Terms of Service</a>
            {" "}and{" "}
            <a href="#" style={{ color: "var(--navy-700)", textDecoration: "none" }}>Privacy Policy</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
