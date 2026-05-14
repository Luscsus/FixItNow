import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";

const linkBase =
  "rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-mist/60";

export function AppLayout() {
  const { isAuthenticated, clearSession } = useAuth();

  return (
    <div className="min-h-screen bg-transparent text-ink">
      <nav className="sticky top-0 z-10 border-b border-mist/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-8">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="inline-flex h-2 w-2 rounded-full bg-tide" />
            Auth UI
          </div>
          <div className="flex items-center gap-2">
            {!isAuthenticated && (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? "bg-mist/60" : ""}`
                  }
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? "bg-mist/60" : ""}`
                  }
                >
                  Register
                </NavLink>
              </>
            )}
            {isAuthenticated && (
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? "bg-mist/60" : ""}`
                }
              >
                Profile
              </NavLink>
            )}
            {isAuthenticated && (
              <Button variant="ghost" onClick={clearSession}>
                Sign out
              </Button>
            )}
          </div>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
