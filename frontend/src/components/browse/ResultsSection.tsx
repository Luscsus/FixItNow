import type { ProviderDto } from "@/services/providerService";
import { IconChevron } from "./BrowseIcons";
import { BrowsePagination } from "./BrowsePagination";
import { ProviderCard } from "./ProviderCard";
import { type Segment, SORT_OPTIONS, DROPDOWN } from "./browseConstants";

function SkeletonCard() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "96px 1fr auto",
        gap: 20,
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 20,
        alignItems: "flex-start",
      }}
    >
      <div className="skeleton" style={{ width: 96, height: 96, borderRadius: 14 }} />
      <div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
          <div className="skeleton" style={{ height: 20, width: 140 }} />
          <div className="skeleton" style={{ height: 18, width: 62, borderRadius: 4 }} />
        </div>
        <div className="skeleton" style={{ height: 13, width: 190, borderRadius: 4, marginBottom: 10 }} />
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <div className="skeleton" style={{ height: 22, width: 72, borderRadius: 999 }} />
          <div className="skeleton" style={{ height: 22, width: 56, borderRadius: 999 }} />
        </div>
        <div className="skeleton" style={{ height: 12, width: "88%", borderRadius: 4, marginBottom: 5 }} />
        <div className="skeleton" style={{ height: 12, width: "55%", borderRadius: 4 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", minWidth: 152 }}>
        <div className="skeleton" style={{ height: 20, width: 52, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 18, width: 84, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 32, width: 80, borderRadius: 8 }} />
      </div>
    </div>
  );
}

interface ResultsSectionProps {
  resultsRef: React.RefObject<HTMLElement | null>;
  sortRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  error: string | null;
  sortedResults: ProviderDto[] | null;
  sortBy: string;
  setSortBy: (v: string) => void;
  openSeg: Segment | null;
  toggleSeg: (s: Segment) => void;
  totalElements: number;
  totalPages: number;
  page: number;
  onPageChange: (p: number) => void;
  coords: { lat: number; lon: number } | null;
  selectionMode: boolean;
  routerState: { formState?: unknown } | null;
}

export function ResultsSection({
  resultsRef,
  sortRef,
  isLoading,
  error,
  sortedResults,
  sortBy,
  setSortBy,
  openSeg,
  toggleSeg,
  totalElements,
  totalPages,
  page,
  onPageChange,
  coords,
  selectionMode,
  routerState,
}: Readonly<ResultsSectionProps>) {
  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Best match";

  let countDisplay: React.ReactNode = null;
  if (isLoading) {
    countDisplay = "Searching…";
  } else if (sortedResults !== null) {
    const plural = totalElements === 1 ? "" : "s";
    countDisplay = (
      <>
        <b style={{ color: "var(--text)", fontWeight: 700 }}>{totalElements}</b>{" "}
        provider{plural} found
      </>
    );
  }

  return (
    <section ref={resultsRef}>
      {/* Results header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <span style={{ fontSize: 14, color: "var(--text-muted)" }}>
          {countDisplay}
        </span>
        <span style={{ flex: 1 }} />

        {/* Sort dropdown */}
        <div ref={sortRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => toggleSeg("sort")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px 8px 14px",
              background:
                openSeg === "sort"
                  ? "var(--slate-50, #f8fafc)"
                  : "var(--card, #fff)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              color: "var(--text)",
              transition: "background 0.12s",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                flexShrink: 0,
              }}
            >
              Sort
            </span>
            {sortLabel}
            <span style={{ color: "var(--text-muted)", marginLeft: 2 }}>
              <IconChevron />
            </span>
          </button>

          {openSeg === "sort" && (
            <div
              style={{
                ...DROPDOWN,
                left: "auto",
                right: 0,
                minWidth: 192,
                padding: "4px 0",
              }}
            >
              {SORT_OPTIONS.filter(
                (o) => o.value !== "distance_asc" || coords,
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setSortBy(opt.value);
                    toggleSeg("sort");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "10px 14px",
                    background:
                      sortBy === opt.value
                        ? "var(--slate-50, #f8fafc)"
                        : "transparent",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 13.5,
                    color:
                      sortBy === opt.value
                        ? "var(--navy-700, #1e3a8a)"
                        : "var(--text)",
                    fontWeight: sortBy === opt.value ? 600 : 400,
                    transition: "background 0.08s",
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      flexShrink: 0,
                      color: "var(--navy-700, #1e3a8a)",
                      fontSize: 12,
                    }}
                  >
                    {sortBy === opt.value ? "✓" : ""}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 10,
            color: "#dc2626",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && sortedResults?.length === 0 && (
        <div
          style={{
            padding: "20px 24px",
            background: "var(--slate-50, #f9fafb)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 14,
            color: "var(--text-muted)",
          }}
        >
          No providers match your current filters. Try broadening the radius,
          removing a trade filter, or clearing the experience requirement.
        </div>
      )}

      {/* Provider cards */}
      {!isLoading && sortedResults && sortedResults.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sortedResults.map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              coords={coords}
              selectionMode={selectionMode}
              routerState={routerState}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && sortedResults && sortedResults.length > 0 && (
        <BrowsePagination
          page={page}
          total={totalPages}
          onChange={onPageChange}
        />
      )}
    </section>
  );
}
