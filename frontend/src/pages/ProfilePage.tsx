import { ResetPasswordCard } from "@/components/auth/ResetPasswordCard";
import { TwoFactorDisableCard } from "@/components/two-factor/TwoFactorDisableCard";
import { TwoFactorEnableCard } from "@/components/two-factor/TwoFactorEnableCard";
import { TwoFactorSetupCard } from "@/components/two-factor/TwoFactorSetupCard";

export function ProfilePage() {
  return (
    <div className="min-h-screen px-4 py-10 text-ink sm:px-8">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="grid gap-2">
          <p className="text-sm uppercase tracking-[0.35em] text-ink/60">
            Profile
          </p>
          <h1 className="text-3xl font-semibold text-ink">Security settings</h1>
          <p className="text-sm text-ink/70">
            Reset password and manage two-factor authentication.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <ResetPasswordCard />
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-semibold text-ink">Two-factor auth</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <TwoFactorSetupCard />
            <TwoFactorEnableCard />
            <TwoFactorDisableCard />
          </div>
        </section>
      </main>
    </div>
  );
}
