import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth";
import type { UserRole } from "@/domain/auth";

function dashboardHref(role: UserRole | null, isAuthenticated: boolean): string {
  if (!isAuthenticated) return "/login";
  if (role === "PROVIDER") return "/dashboard/provider";
  if (role === "ADMIN") return "/dashboard/admin";
  return "/dashboard/user";
}

export function AppLayout() {
  const { isAuthenticated, clearSession, role } = useAuth();

  const NAV_LINKS = [
    { label: "How it works",    href: "/#how"  },
    { label: "Find a provider", href: "/browse" },
    { label: "Pricing",         href: "#"       },
    { label: "Dashboard",       href: dashboardHref(role, isAuthenticated) },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-canvas)", color: "var(--text)" }}>
      {/* Marketing top bar */}
      <header style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "rgba(250, 250, 247, 0.9)",
        backdropFilter: "saturate(180%) blur(12px)",
        WebkitBackdropFilter: "saturate(180%) blur(12px)",
        borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto",
          padding: "16px 32px",
          display: "flex", alignItems: "center", gap: 28,
        }}>
          {/* Brand */}
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", textDecoration: "none", color: "inherit" }}>
            <span className="brand-mark" aria-hidden="true" />
            <span>FixIt<span className="brand-now">Now</span></span>
          </Link>

          {/* Center nav */}
          <nav style={{ display: "flex", gap: 4, marginLeft: 8 }}>
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                to={href}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  transition: "background 0.12s, color 0.12s",
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "rgba(15,23,42,0.05)"; (e.target as HTMLElement).style.color = "var(--text)"; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "transparent"; (e.target as HTMLElement).style.color = "var(--text-muted)"; }}
              >
                {label}
              </Link>
            ))}
          </nav>

          <span style={{ flex: 1 }} />

          {/* Auth */}
          {!isAuthenticated && (
            <>
              <NavLink
                to="/login"
                style={{ padding: "8px 12px", borderRadius: 8, fontSize: 13.5, fontWeight: 500, color: "var(--text-muted)", textDecoration: "none" }}
              >
                Log in
              </NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm">
                Sign up <span style={{ fontSize: 13 }}>→</span>
              </NavLink>
            </>
          )}
          {isAuthenticated && (
            <>
              <NavLink
                to="/profile"
                style={{ padding: "8px 12px", borderRadius: 8, fontSize: 13.5, fontWeight: 500, color: "var(--text-muted)", textDecoration: "none" }}
              >
                Profile
              </NavLink>
              <button
                onClick={clearSession}
                style={{ padding: "8px 12px", borderRadius: 8, fontSize: 13.5, fontWeight: 500, background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </header>

      <Outlet />
    </div>
  );
}
