import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-12 text-ink sm:px-8">
      <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-ember/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-0 h-72 w-72 rounded-full bg-tide/15 blur-3xl" />

      <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-12">
        <section className="flex flex-col gap-6">
          <span className="w-fit rounded-full border border-ember/40 bg-ember/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ember">
            Help in minutes
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-ink sm:text-6xl">
            What do you need fixed today?
          </h1>
          <p className="max-w-xl text-base text-ink/70 sm:text-lg">
            Type your issue. We will line up the right contractor.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Describe your issue"
              aria-label="Describe your issue"
            />
            <Button size="lg" className="sm:w-44">
              Get help
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-4 border-t border-mist/60 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold text-ink">For contractors</h2>
            <p className="text-sm text-ink/70">
              Get matched with real jobs.
            </p>
          </div>
          <Button asChild size="lg" variant="outline">
            <Link to="/register">Join the network</Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
