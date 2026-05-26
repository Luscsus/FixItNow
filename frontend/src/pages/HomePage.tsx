import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LandingSwitch, type LandingView } from "@/components/landing/LandingSwitch";
import { UserLanding } from "@/components/landing/UserLanding";
import { ProviderLanding } from "@/components/landing/ProviderLanding";

const STORAGE_KEY = "fixitnow.landingView";

function readInitialView(searchView: string | null): LandingView {
  if (searchView === "provider" || searchView === "user") return searchView;
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "provider" || stored === "user") return stored;
  }
  return "user";
}

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<LandingView>(() => readInitialView(searchParams.get("view")));
  const prevViewRef = useRef<LandingView>(view);

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

  // Direction of transition (provider sits to the right of user)
  const direction: "forward" | "back" =
    view === "provider" && prevViewRef.current === "user" ? "forward" :
    view === "user" && prevViewRef.current === "provider" ? "back" :
    "forward";

  useEffect(() => { prevViewRef.current = view; }, [view]);

  return (
    <div className="landing-root">
      <LandingSwitch value={view} onChange={setView} />

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
