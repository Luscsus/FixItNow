import { Link } from "react-router-dom";

import { ForgotPasswordCard } from "@/components/auth/ForgotPasswordCard";

export function ForgotPasswordPage() {
  return (
    <div className="min-h-screen px-4 py-10 text-ink sm:px-8">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <header className="grid gap-2">
          <h1 className="text-3xl font-semibold text-ink">Forgot password</h1>
          <p className="text-sm text-ink/70">
            Request a reset link for your account.
          </p>
        </header>
        <ForgotPasswordCard />
        <div className="flex flex-wrap gap-4 text-sm text-ink/70">
          <Link className="underline underline-offset-4" to="/login">
            Back to login
          </Link>
        </div>
      </main>
    </div>
  );
}
