import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
  useEffect,
} from "react";

import type { AuthSession, UserRole } from "@/domain/auth";
import { jwtUserInfo } from "@/lib/jwt";
import { setAuthRefreshHandler, ApiError } from "@/services/httpClient";
import { refreshToken as refreshTokenApi } from "@/services/authService";
import { queryClient } from "@/config/queryClient";

type AuthState = {
  accessToken: string;
  refreshToken: string;
  tempToken: string;
  role: UserRole | null;
};

export type UserInfo = {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
};

type AuthContextValue = {
  accessToken: string;
  refreshToken: string;
  tempToken: string;
  role: UserRole | null;
  isAuthenticated: boolean;
  userInfo: UserInfo;
  /**
   * Save a session. Pass `persistent: true` (Remember Me) to keep the session
   * in localStorage across browser restarts, or `false` to keep it in
   * sessionStorage so it clears when the tab/window closes. Omit to preserve
   * the previously stored preference — useful for follow-up flows like 2FA
   * that shouldn't override the user's original choice.
   */
  setSession: (session: AuthSession, persistent?: boolean) => void;
  setTempToken: (tempToken: string) => void;
  clearSession: () => void;
  /**
   * Exchange the stored refresh token for a fresh access token. Returns the new
   * access token on success, or null if no refresh token is stored or the refresh
   * call fails. Updates the context state as a side-effect.
   */
  refreshSession: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const storageKey = "frontend.auth.session";
// Sentinel value in localStorage that records whether the most recent login
// chose "remember me". When false we mirror the session into sessionStorage
// instead, so it gets wiped on browser close.
const persistentFlagKey = "frontend.auth.persistent";

function readStoredSession(): AuthState {
  const fallback: AuthState = {
    accessToken: "",
    refreshToken: "",
    tempToken: "",
    role: null,
  };

  // sessionStorage takes precedence (non-persistent login active in this tab).
  // If that's empty, fall back to localStorage (persistent login).
  const raw =
    window.sessionStorage.getItem(storageKey) ??
    window.localStorage.getItem(storageKey);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthState>;
    return {
      accessToken: parsed.accessToken ?? "",
      refreshToken: parsed.refreshToken ?? "",
      tempToken: parsed.tempToken ?? "",
      role: parsed.role ?? null,
    };
  } catch {
    return fallback;
  }
}

function isPersistent(): boolean {
  // Default to true (Remember me) if the flag was never set — keeps existing
  // sessions working after this change rolls out.
  const v = window.localStorage.getItem(persistentFlagKey);
  return v == null ? true : v === "true";
}

function persistSession(state: AuthState) {
  const data = JSON.stringify(state);
  if (isPersistent()) {
    window.localStorage.setItem(storageKey, data);
    window.sessionStorage.removeItem(storageKey);
  } else {
    window.sessionStorage.setItem(storageKey, data);
    window.localStorage.removeItem(storageKey);
  }
}

function setPersistent(persistent: boolean) {
  window.localStorage.setItem(persistentFlagKey, persistent ? "true" : "false");
}

function clearAllStorage() {
  window.localStorage.removeItem(storageKey);
  window.sessionStorage.removeItem(storageKey);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => readStoredSession());

  // Shared refresh implementation, used both by the httpClient interceptor (on 403)
  // and exposed via the context for callers that need a fresh token on demand
  // (e.g. the WebSocket hook before opening a connection).
  const refreshSession = useCallback(async (): Promise<string | null> => {
    if (!state.refreshToken) {
      const nextState: AuthState = { accessToken: "", refreshToken: "", tempToken: "", role: null };
      setState(nextState);
      persistSession(nextState);
      return null;
    }
    try {
      const newSession = await refreshTokenApi({ refreshToken: state.refreshToken });
      const nextState: AuthState = {
        accessToken: newSession.accessToken,
        refreshToken: newSession.refreshToken,
        tempToken: "",
        role: newSession.role as UserRole,
      };
      setState(nextState);
      persistSession(nextState);
      return newSession.accessToken;
    } catch (error) {
      console.error("Token refresh failed:", error);
      // Only clear the stored session when the refresh token is genuinely
      // rejected (401/403). For transient failures — network blip, backend
      // restarting, 5xx — keep the session so "remember me" survives and the
      // next request can retry. Wiping on any error logged users out whenever
      // the backend was briefly unreachable, which looked like "remember me
      // doesn't work".
      const status = error instanceof ApiError ? error.status : null;
      if (status === 401 || status === 403) {
        const nextState: AuthState = { accessToken: "", refreshToken: "", tempToken: "", role: null };
        setState(nextState);
        persistSession(nextState);
      }
      return null;
    }
  }, [state.refreshToken]);

  // Register the same function with the httpClient for 403-retry behaviour
  useEffect(() => {
    setAuthRefreshHandler(refreshSession);
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(() => {
    const setSession = (session: AuthSession, persistent?: boolean) => {
      // Only update the preference if the caller explicitly passed it. Callers
      // who don't pass it (e.g. the 2FA page completing a login) should keep
      // whatever the user originally selected on the login form.
      if (persistent !== undefined) {
        setPersistent(persistent);
      }
      const nextState: AuthState = {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        tempToken: "",
        role: session.role,
      };
      setState(nextState);
      persistSession(nextState);
    };

    const setTempToken = (tempToken: string) => {
      const nextState: AuthState = {
        ...state,
        tempToken,
      };
      setState(nextState);
      persistSession(nextState);
    };

    const clearSession = () => {
      const nextState: AuthState = {
        accessToken: "",
        refreshToken: "",
        tempToken: "",
        role: null,
      };
      setState(nextState);
      clearAllStorage();
      // Drop the persistence flag too so the next login starts clean.
      window.localStorage.removeItem(persistentFlagKey);
      // Clear all cached query data so the next user doesn't see stale data
      // from the previous session.
      queryClient.clear();
    };

    return {
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      tempToken: state.tempToken,
      role: state.role,
      isAuthenticated: state.accessToken !== "",
      userInfo: state.accessToken ? jwtUserInfo(state.accessToken) : { email: "", firstName: "", lastName: "", fullName: "", initials: "" },
      setSession,
      setTempToken,
      clearSession,
      refreshSession,
    };
  }, [state, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
