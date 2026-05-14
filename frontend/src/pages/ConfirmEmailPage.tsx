import { Link, useSearchParams } from "react-router-dom";

import { ConfirmEmailCard } from "@/components/confirm-email-card";

export function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  return (
    <div className="min-h-screen px-4 py-10 text-ink sm:px-8">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <header className="grid gap-2">
          <h1 className="text-3xl font-semibold text-ink">Confirm email</h1>
          <p className="text-sm text-ink/70">
            Paste the confirmation token from your inbox.
          </p>
        </header>
        <ConfirmEmailCard initialToken={token} />
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
