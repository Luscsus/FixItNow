import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { UserRole } from "@/domain/auth";

function dashboardHref(role: UserRole | null, isAuthenticated: boolean): string {
  if (!isAuthenticated) return "/login";
  if (role === "PROVIDER") return "/dashboard/provider";
  if (role === "ADMIN") return "/dashboard/admin";
  return "/dashboard/user";
}

const NAV_DOT_INACTIVE = "#94A3B8"; // slate-400
const NAV_DOT_ACTIVE   = "#F59E0B"; // amber-500 (app accent)

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function AppLayout() {
  const { isAuthenticated, clearSession, role, userInfo } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const profilePictureUrl = currentUser?.profilePictureUrl;
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { label: "Tickets",   href: dashboardHref(role, isAuthenticated) },
    { label: "Providers", href: "/browse" },
    { label: "Inbox",     href: "/chat" },
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSignOut() {
    setDropdownOpen(false);
    clearSession();
    navigate("/");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-canvas)", color: "var(--text)" }}>
      <header style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "rgba(250, 250, 247, 0.95)",
        backdropFilter: "saturate(180%) blur(12px)",
        WebkitBackdropFilter: "saturate(180%) blur(12px)",
        borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto",
          padding: "0 32px",
          height: 60,
          display: "flex", alignItems: "center", gap: 0,
        }}>

          {/* Brand */}
          <Link
            to="/"
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em",
              textDecoration: "none", color: "inherit",
              marginRight: 24, flexShrink: 0,
            }}
          >
            <span className="brand-mark" aria-hidden="true" />
            <span>FixIt<span className="brand-now">Now</span></span>
          </Link>

          {/* Nav links */}
          <nav style={{ display: "flex", gap: 2 }}>
            {navLinks.map(({ label, href }) => (
              <NavLink key={label} to={href}>
                {({ isActive }) => (
                  <span
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 7,
                      padding: "6px 14px",
                      borderRadius: 8,
                      fontSize: 13.5, fontWeight: 500,
                      color: isActive ? "var(--text)" : "var(--text-muted)",
                      background: isActive ? "rgba(15,23,42,0.06)" : "transparent",
                      transition: "background 0.12s, color 0.12s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(15,23,42,0.05)";
                      (e.currentTarget as HTMLElement).style.color = "var(--text)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = isActive ? "rgba(15,23,42,0.06)" : "transparent";
                      (e.currentTarget as HTMLElement).style.color = isActive ? "var(--text)" : "var(--text-muted)";
                    }}
                  >
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: isActive ? NAV_DOT_ACTIVE : NAV_DOT_INACTIVE,
                      display: "inline-block", flexShrink: 0,
                      transition: "background 0.12s",
                    }} />
                    {label}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <span style={{ flex: 1 }} />

          {/* Right side actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>

            {/* Notification bell */}
            <button
              title="Notifications"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 36, height: 36, borderRadius: 8,
                background: "transparent", border: "none",
                color: "var(--text-muted)", cursor: "pointer",
                transition: "background 0.12s, color 0.12s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(15,23,42,0.06)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
            >
              <BellIcon />
            </button>

            {/* New ticket button — CUSTOMER only */}
            {isAuthenticated && role === "CUSTOMER" && (
              <NavLink
                to="/tickets/new"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 14px",
                  borderRadius: 8,
                  fontSize: 13.5, fontWeight: 600,
                  background: "var(--navy-700)", color: "#fff",
                  textDecoration: "none",
                  transition: "opacity 0.12s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              >
                <PlusIcon /> New ticket
              </NavLink>
            )}

            {/* Auth area */}
            {!isAuthenticated ? (
              <>
                <NavLink
                  to="/login"
                  style={{
                    padding: "7px 14px", borderRadius: 8,
                    fontSize: 13.5, fontWeight: 500,
                    color: "var(--text-muted)", textDecoration: "none",
                    transition: "background 0.12s, color 0.12s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(15,23,42,0.05)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
                >
                  Log in
                </NavLink>
                <NavLink to="/register" className="btn btn-primary btn-sm">
                  Sign up
                </NavLink>
              </>
            ) : (
              /* Profile avatar + dropdown */
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "4px 8px 4px 4px",
                    borderRadius: 100,
                    background: dropdownOpen ? "rgba(15,23,42,0.08)" : "transparent",
                    border: "none", cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => { if (!dropdownOpen) (e.currentTarget as HTMLElement).style.background = "rgba(15,23,42,0.06)"; }}
                  onMouseLeave={(e) => { if (!dropdownOpen) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {/* Avatar circle */}
                  {profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
                      alt={userInfo.fullName}
                      style={{
                        width: 32, height: 32, borderRadius: "50%",
                        objectFit: "cover", flexShrink: 0,
                        display: "block",
                      }}
                    />
                  ) : (
                    <span style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: "var(--navy-700)",
                      color: "#fff",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, letterSpacing: "0.02em",
                      flexShrink: 0,
                    }}>
                      {userInfo.initials || "?"}
                    </span>
                  )}
                  <ChevronDown />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0,
                    minWidth: 160,
                    background: "#fff",
                    border: "1px solid rgba(15,23,42,0.1)",
                    borderRadius: 10,
                    boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                    overflow: "hidden",
                    zIndex: 50,
                  }}>
                    {/* User info header */}
                    <div style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid rgba(15,23,42,0.07)",
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{userInfo.fullName}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{userInfo.email}</div>
                    </div>

                    <div style={{ padding: "6px" }}>
                      <NavLink
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        style={{
                          display: "block", padding: "8px 12px",
                          borderRadius: 6, fontSize: 13.5, fontWeight: 500,
                          color: "var(--text)", textDecoration: "none",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(15,23,42,0.05)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        Profile
                      </NavLink>
                      <button
                        onClick={handleSignOut}
                        style={{
                          display: "block", width: "100%", textAlign: "left",
                          padding: "8px 12px", borderRadius: 6,
                          fontSize: 13.5, fontWeight: 500,
                          color: "#ef4444", background: "transparent",
                          border: "none", cursor: "pointer",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.06)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  );
}
