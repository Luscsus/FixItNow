import { Link, useNavigate } from "react-router-dom";

import { TwoFactorVerifyCard } from "@/components/two-factor/TwoFactorVerifyCard";
import { useAuth } from "@/context/auth";
import type { AuthSession } from "@/domain/auth";

export function TwoFactorVerifyPage() {
  const navigate = useNavigate();
  const { tempToken, setSession } = useAuth();

  const handleAuthenticated = (session: AuthSession) => {
    setSession(session);
    if (session.role === "ADMIN") {
      navigate("/dashboard/admin/providers");
    } else {
      navigate("/profile");
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 text-ink sm:px-8">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <header className="grid gap-2">
          <h1 className="text-3xl font-semibold text-ink">Two-factor</h1>
          <p className="text-sm text-ink/70">
            Enter the code from your authenticator app.
          </p>
        </header>
        <TwoFactorVerifyCard
          initialTempToken={tempToken}
          onAuthenticated={handleAuthenticated}
        />
        <Link
          className="text-sm text-ink/70 underline underline-offset-4"
          to="/login"
        >
          Back to login
        </Link>
      </main>
    </div>
  );
}
