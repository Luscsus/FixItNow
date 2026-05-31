import { useState } from "react";
import { Link } from "react-router-dom";

import { useSavedProvidersQuery } from "@/hooks/useSavedProviders";
import { ProviderCard } from "@/components/browse/ProviderCard";
import { Pagination, usePaginatedItems } from "@/components/ui/Pagination";

const PAGE_SIZE = 6;

export function SavedProvidersTab() {
  const { data: providers = [], isLoading } = useSavedProvidersQuery();
  const [page, setPage] = useState(1);
  const { pageItems, totalPages, safePage } = usePaginatedItems(providers, page, PAGE_SIZE);

  return (
    <>
      <div className="panel-title">
        <span className="num">01</span>
        <span className="label">Saved providers</span>
        <span className="rule" />
        <span className="mono muted" style={{ fontSize: 11.5 }}>
          {String(providers.length).padStart(2, "0")} SAVED
        </span>
      </div>

      {isLoading ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: "var(--slate-400)" }}>
          Loading saved providers…
        </div>
      ) : providers.length === 0 ? (
        <div
          className="card card-pad"
          style={{ textAlign: "center", padding: "48px 24px", marginBottom: 32 }}
        >
          <div style={{ fontSize: 15, color: "var(--slate-500)", marginBottom: 12 }}>
            You haven&apos;t saved any providers yet.
          </div>
          <div className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
            Tap the ☆ next to any provider while browsing to save them here for quick access.
          </div>
          <Link to="/browse" className="btn btn-primary btn-sm">
            Browse providers →
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gap: 16, marginBottom: 32 }}>
            {pageItems.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                coords={null}
                selectionMode={false}
                routerState={null}
              />
            ))}
          </div>
          <Pagination page={safePage} total={totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}
