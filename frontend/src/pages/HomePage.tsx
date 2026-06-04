import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LandingSwitch, type LandingView } from "@/components/landing/LandingSwitch";
import { UserLanding } from "@/components/landing/UserLanding";
import { ProviderLanding } from "@/components/landing/ProviderLanding";
import { useSEO } from "@/hooks/useSEO";

const STORAGE_KEY = "fixitnow.landingView";

function readInitialView(searchView: string | null): LandingView {
  if (searchView === "provider" || searchView === "user") return searchView;
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "provider" || stored === "user") return stored;
  }
  return "user";
}

function computeDirection(from: LandingView, to: LandingView): "forward" | "back" {
  if (to === "provider" && from === "user") return "forward";
  if (to === "user" && from === "provider") return "back";
  return "forward";
}

export function HomePage() {
  useSEO({
    canonical: "/",
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<LandingView>(() => readInitialView(searchParams.get("view")));
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  // Sync URL + storage when view changes
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, view);
    const current = searchParams.get("view");
    if (view === "user" && current) {
      const next = new URLSearchParams(searchParams);
      next.delete("view");
      setSearchParams(next, { replace: true });
    } else if (view === "provider" && current !== "provider") {
      const next = new URLSearchParams(searchParams);
      next.set("view", "provider");
      setSearchParams(next, { replace: true });
    }
  }, [view, searchParams, setSearchParams]);

  function handleViewChange(newView: LandingView) {
    setDirection(computeDirection(view, newView));
    setView(newView);
  }

  return (
    <div className="landing-root">
      <LandingSwitch value={view} onChange={handleViewChange} />

      <div className="landing-stage">
        <div
          key={view}
          className={`landing-pane landing-pane-enter landing-pane-${direction}`}
        >
          {view === "user" ? <UserLanding /> : <ProviderLanding />}
        </div>
      </div>
    </div>
  );
}
