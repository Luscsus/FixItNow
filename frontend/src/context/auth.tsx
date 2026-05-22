import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
  useEffect,
} from "react";

import type { AuthSession, UserRole } from "@/domain/auth";
import { jwtUserInfo } from "@/lib/jwt";
import { setAuthRefreshHandler } from "@/services/httpClient";
import { refreshToken as refreshTokenApi } from "@/services/authService";

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
  setSession: (session: AuthSession) => void;
  setTempToken: (tempToken: string) => void;
  clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const storageKey = "frontend.auth.session";

function readStoredSession(): AuthState {
  const fallback: AuthState = {
    accessToken: "",
    refreshToken: "",
    tempToken: "",
    role: null,
  };

  const raw = window.localStorage.getItem(storageKey);
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

function persistSession(state: AuthState) {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => readStoredSession());

  // Set up token refresh handler when component mounts
  useEffect(() => {
    const handleTokenRefresh = async (): Promise<string | null> => {
      if (!state.refreshToken) {
        // Clear session if no refresh token available
        const nextState: AuthState = {
          accessToken: "",
          refreshToken: "",
          tempToken: "",
          role: null,
        };
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
        // If refresh fails, clear the session
        console.error("Token refresh failed:", error);
        const nextState: AuthState = {
          accessToken: "",
          refreshToken: "",
          tempToken: "",
          role: null,
        };
        setState(nextState);
        persistSession(nextState);
        return null;
      }
    };

    // Set up refresh handler that returns the new token
    setAuthRefreshHandler(handleTokenRefresh);
  }, [state.refreshToken]);

  const value = useMemo<AuthContextValue>(() => {
    const setSession = (session: AuthSession) => {
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
      persistSession(nextState);
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
    };
  }, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
