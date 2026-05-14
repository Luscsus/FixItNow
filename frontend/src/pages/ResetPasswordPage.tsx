import { Link } from "react-router-dom";

import { ResetPasswordCard } from "@/components/auth/ResetPasswordCard";

export function ResetPasswordPage() {
  return (
    <div className="min-h-screen px-4 py-10 text-ink sm:px-8">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <header className="grid gap-2">
          <h1 className="text-3xl font-semibold text-ink">Reset password</h1>
          <p className="text-sm text-ink/70">
            Set a new password using the token from your email.
          </p>
        </header>
        <ResetPasswordCard />
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
