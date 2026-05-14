import { Link, useNavigate } from "react-router-dom";

import { LoginCard } from "@/components/auth/LoginCard";
import { useAuth } from "@/context/auth";
import type { AuthSession } from "@/domain/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const { setSession, setTempToken } = useAuth();

  const handleAuthenticated = (session: AuthSession) => {
    setSession(session);
    navigate("/profile");
  };

  const handleRequiresTwoFactor = (tempToken: string) => {
    setTempToken(tempToken);
    navigate("/two-factor");
  };

  return (
    <div className="min-h-screen px-4 py-10 text-ink sm:px-8">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <header className="grid gap-2">
          <h1 className="text-3xl font-semibold text-ink">Login</h1>
          <p className="text-sm text-ink/70">
            Enter your credentials to continue.
          </p>
        </header>
        <LoginCard
          onAuthenticated={handleAuthenticated}
          onRequiresTwoFactor={handleRequiresTwoFactor}
        />
        <div className="flex flex-wrap gap-4 text-sm text-ink/70">
          <Link className="underline underline-offset-4" to="/forgot-password">
            Forgot password?
          </Link>
          <Link className="underline underline-offset-4" to="/register">
            Create an account
          </Link>
        </div>
      </main>
    </div>
  );
}
