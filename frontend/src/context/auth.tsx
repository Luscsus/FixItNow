import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { AuthSession, UserRole } from "@/domain/auth";

type AuthState = {
  accessToken: string;
  refreshToken: string;
  tempToken: string;
  role: UserRole | null;
};

type AuthContextValue = {
  accessToken: string;
  refreshToken: string;
  tempToken: string;
  role: UserRole | null;
  isAuthenticated: boolean;
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
