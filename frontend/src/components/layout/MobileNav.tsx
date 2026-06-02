import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth";
import { useNotifications } from "@/hooks/useNotifications";
import type { UserRole } from "@/domain/auth";

function dashboardHref(role: UserRole | null, isAuthenticated: boolean): string {
  if (!isAuthenticated) return "/login";
  if (role === "PROVIDER") return "/dashboard/provider";
  if (role === "ADMIN") return "/dashboard/admin";
  return "/dashboard/user";
}

function IconTickets() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3 8-8" />
      <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
    </svg>
  );
}
function IconProviders() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
function IconInbox() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
function IconProfile() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2V9.5z" />
    </svg>
  );
}

interface MobileNavProps {
  readonly hidden?: boolean;
}

export function MobileNav({ hidden = false }: MobileNavProps) {
  const { t } = useTranslation();
  const { isAuthenticated, role } = useAuth();
  const { notifications } = useNotifications();
  const unread = notifications.filter((n) => !n.read && n.type === "NEW_MESSAGE").length;

  if (hidden) return null;

  const items = isAuthenticated
    ? [
        { label: t("nav.tickets"),   href: dashboardHref(role, true), icon: <IconTickets /> },
        { label: t("nav.providers"), href: "/browse",                 icon: <IconProviders /> },
        { label: t("nav.inbox"),     href: "/chat",                   icon: <IconInbox />, badge: unread },
        { label: t("nav.profile"),   href: "/profile",                icon: <IconProfile /> },
      ]
    : [
        { label: t("nav.home"),      href: "/",         icon: <IconHome /> },
        { label: t("nav.providers"), href: "/browse",   icon: <IconProviders /> },
        { label: t("nav.logIn"),     href: "/login",    icon: <IconProfile /> },
        { label: t("nav.signUp"),    href: "/register", icon: <IconTickets /> },
      ];

  return (
    <nav className="mobile-nav safe-bottom mobile-only" aria-label="Primary">
      {items.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.href === "/"}
          className={({ isActive }) => `mobile-nav-item${isActive ? " is-active" : ""}`}
        >
          <span className="mobile-nav-icon">
            {item.icon}
            {"badge" in item && item.badge ? (
              <span className="mobile-nav-badge">{item.badge > 99 ? "99+" : item.badge}</span>
            ) : null}
          </span>
          <span className="mobile-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
