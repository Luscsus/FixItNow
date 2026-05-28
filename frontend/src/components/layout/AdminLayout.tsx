import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth";

const TABS = [
  { to: "/dashboard/admin/providers", label: "Providers" },
  { to: "/dashboard/admin/users", label: "Users" },
  { to: "/dashboard/admin/tickets", label: "Tickets" },
];

export function AdminLayout() {
  const { clearSession } = useAuth();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Admin strip */}
      <div style={{
        background: "var(--amber-500)",
        color: "var(--navy-900)",
        padding: "7px 0",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontWeight: 700,
      }}>
        <div className="admin-strip-inner" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--navy-900)", display: "inline-block" }} />
          <span>Admin console</span>
          <span style={{ flex: 1 }} />
          <button
            onClick={clearSession}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--navy-900)", opacity: 0.7, padding: 0,
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Topbar with tabs */}
      <header style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "saturate(180%) blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div className="admin-topbar-inner" style={{
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "14px 32px",
          display: "flex", alignItems: "center", gap: 28,
        }}>
          <Link to="/dashboard/admin/providers" style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", textDecoration: "none", color: "inherit" }}>
            <span className="brand-mark" aria-hidden="true" />
            <span>FixIt<span className="brand-now">Now</span></span>
          </Link>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            / Admin
          </span>
          <nav className="admin-tabs" style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 12 }}>
          <nav style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 12 }}>
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                style={({ isActive }) => ({
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  padding: "8px 14px",
                  borderRadius: 8,
                  color: isActive ? "var(--navy-900)" : "var(--text-muted)",
                  background: isActive ? "var(--navy-50)" : "transparent",
                  boxShadow: isActive ? "inset 0 -2px 0 var(--amber-500)" : "none",
                  transition: "background 0.12s, color 0.12s",
                })}
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
          <span style={{ flex: 1 }} />
        </div>
      </header>

      <Outlet />
    </div>
  );
}
