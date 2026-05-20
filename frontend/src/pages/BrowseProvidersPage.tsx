import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAllProvidersQuery } from "@/hooks/useAllProvidersQuery";
import { useProviderSearchQuery } from "@/hooks/useProviderSearchQuery";
import { useDebounce } from "@/hooks/useDebounce";
import type { ProviderDto } from "@/services/providerService";

/* ─── Icons ──────────────────────────────────────────────────────── */
const svg = (d: string, s = 13) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
);
function IconSearch({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>;
}
function IconChevron({ size = 11 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>;
}
function IconPin({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>;
}
function IconDrop({ size = 13 }: { size?: number }) {
  return svg(`<path d="M12 2C6 8 4 12 4 15a8 8 0 0016 0c0-3-2-7-8-13z"/>`, size);
}
function IconBolt({ size = 13 }: { size?: number }) {
  return svg(`<path d="M13 2L4.09 12.26A2 2 0 005.62 15.5h4.72L9 22l9.53-10.26A2 2 0 0016.9 8.5h-4.72L13 2z"/>`, size);
}
function IconSpark({ size = 13 }: { size?: number }) {
  return svg(`<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>`, size);
}
function IconWrench({ size = 13 }: { size?: number }) {
  return svg(`<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>`, size);
}
function IconCmd({ size = 13 }: { size?: number }) {
  return svg(`<path d="M18 3a3 3 0 00-3 3v12a3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3H6a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3 3 3 0 003 3h12a3 3 0 003-3 3 3 0 00-3-3z"/>`, size);
}
function IconHammer({ size = 13 }: { size?: number }) {
  return svg(`<path d="M15 12l-8.5 8.5a2.12 2.12 0 01-3-3L12 9"/><path d="M17.64 15L22 10.64"/><path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 00-3.94-1.64H9l.92.82A6.18 6.18 0 0112 8.4v1.56l2 2h2.47l2.26 1.91"/>`, size);
}
function IconKey({ size = 13 }: { size?: number }) {
  return svg(`<circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/>`, size);
}

/* ─── Types ──────────────────────────────────────────────────────── */
type Segment = "category" | "location" | "experience" | "budget" | "sort";

/* ─── Constants ──────────────────────────────────────────────────── */
const PAGE_SIZE = 8;

const ALL_CATEGORIES = [
  { key: "PLUMBING",   label: "Plumbing",      Icon: IconDrop    },
  { key: "ELECTRICAL", label: "Electrical",    Icon: IconBolt    },
  { key: "HVAC",       label: "HVAC",          Icon: IconSpark   },
  { key: "HARDWARE",   label: "Hardware",      Icon: IconWrench  },
  { key: "IT",         label: "IT / Software", Icon: IconCmd     },
  { key: "CARPENTRY",  label: "Carpentry",     Icon: IconHammer  },
  { key: "LOCKSMITH",  label: "Locksmith",     Icon: IconKey     },
];

const CATEGORY_LABEL: Record<string, string> = {
  PLUMBING: "Plumbing", ELECTRICAL: "Electrical", HVAC: "HVAC",
  HARDWARE: "Hardware", IT: "IT / Software", CARPENTRY: "Carpentry", LOCKSMITH: "Locksmith",
};

const EXP_PRESETS = [
  { label: "Any",    value: 0  },
  { label: "1+ yr",  value: 1  },
  { label: "3+ yr",  value: 3  },
  { label: "5+ yr",  value: 5  },
  { label: "10+ yr", value: 10 },
];

const BUDGET_PRESETS = [
  { label: "Any",       min: "",    max: ""    },
  { label: "< $50",     min: "1",   max: "49"  },
  { label: "$50–$100",  min: "50",  max: "100" },
  { label: "$100–$150", min: "100", max: "150" },
  { label: "$150+",     min: "150", max: ""    },
];

const SORT_OPTIONS = [
  { value: "default",      label: "Best match"        },
  { value: "price_asc",    label: "Lowest price"      },
  { value: "price_desc",   label: "Highest price"     },
  { value: "exp_desc",     label: "Most experienced"  },
  { value: "distance_asc", label: "Closest first"     },
];

const AVATAR_PALETTE = [
  { bg: "#0B1E3F", color: "#F59E0B" },
  { bg: "#065F46", color: "#fff"    },
  { bg: "#1E3A8A", color: "#fff"    },
  { bg: "#6D28D9", color: "#fff"    },
  { bg: "#B45309", color: "#fff"    },
  { bg: "#374151", color: "#fff"    },
];

/* ─── Helpers ────────────────────────────────────────────────────── */
function avatarColor(id: string) {
  const h = [...id].reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}
function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

/* ─── Shared style objects ───────────────────────────────────────── */
const DROPDOWN: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 10px)",
  left: 0,
  background: "var(--card, #fff)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.05)",
  zIndex: 200,
};

const FILTER_HEAD: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "var(--text-muted)",
};

const RANGE_ROW: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontFamily: "var(--font-mono)",
  fontSize: 11.5,
  color: "var(--text-muted)",
  marginTop: 6,
};

/* ─── Pill button ────────────────────────────────────────────────── */
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "5px 13px",
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: active ? 600 : 400,
        border: `1.5px solid ${active ? "var(--navy-700, #1e3a8a)" : "var(--border)"}`,
        background: active ? "var(--navy-900, #0b1e3f)" : "transparent",
        color: active ? "#fff" : "var(--text)",
        cursor: "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
        transition: "all 0.12s",
      }}
    >
      {children}
    </button>
  );
}

/* ─── Pagination ─────────────────────────────────────────────────── */
function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;

  const pages: (number | "…")[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) pages.push(i);
    if (page < total - 2) pages.push("…");
    pages.push(total);
  }

  const base: React.CSSProperties = {
    minWidth: 36, height: 36, padding: "0 10px",
    borderRadius: 8, border: "1px solid var(--border)",
    background: "var(--card, #fff)", color: "var(--text)",
    fontSize: 13.5, fontWeight: 500, cursor: "pointer",
    fontFamily: "inherit", display: "inline-flex",
    alignItems: "center", justifyContent: "center",
    transition: "all 0.1s",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 32 }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        style={{ ...base, opacity: page === 1 ? 0.35 : 1, cursor: page === 1 ? "default" : "pointer", gap: 6, paddingLeft: 12 }}>
        ← Prev
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} style={{ padding: "0 4px", color: "var(--text-muted)", fontSize: 13, userSelect: "none" }}>…</span>
        ) : (
          <button key={p} onClick={() => onChange(p as number)}
            style={{ ...base, background: p === page ? "var(--navy-900, #0b1e3f)" : "var(--card, #fff)", color: p === page ? "#fff" : "var(--text)", borderColor: p === page ? "var(--navy-900, #0b1e3f)" : "var(--border)", fontWeight: p === page ? 700 : 500 }}>
            {p}
          </button>
        )
      )}

      <button onClick={() => onChange(page + 1)} disabled={page === total}
        style={{ ...base, opacity: page === total ? 0.35 : 1, cursor: page === total ? "default" : "pointer", gap: 6, paddingRight: 12 }}>
        Next →
      </button>
    </div>
  );
}

/* ─── Segment sub-components (defined outside to avoid S6478) ───────── */
function SegLabel({ name, dot }: { name: string; dot?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>
      {name}
      {dot && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--navy-700, #1e3a8a)", display: "inline-block", flexShrink: 0 }} />}
    </div>
  );
}
function SegVal({ text, placeholder, badge }: { text: string; placeholder?: boolean; badge?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
      <span style={{ fontSize: 14, fontWeight: placeholder ? 400 : 500, color: placeholder ? "var(--text-muted)" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
        {text}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
        {badge != null && badge > 0 && (
          <span style={{ background: "var(--navy-900, #0b1e3f)", color: "#fff", borderRadius: 999, padding: "1px 6px", fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
            {badge}
          </span>
        )}
        <IconChevron />
      </span>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export function BrowseProvidersPage() {
  const [searchParams] = useSearchParams();

  /* Initialise from URL query params (e.g. when navigating from homepage) */
  const urlInit = useRef({
    cats:   searchParams.getAll("categories"),
    minP:   searchParams.get("minPrice")  ?? "",
    maxP:   searchParams.get("maxPrice")  ?? "",
    radius: Number(searchParams.get("radiusKm") ?? "25"),
  });

  /* ── Search state ── */
  const [selectedCategories, setSelectedCategories] = useState<string[]>(urlInit.current.cats);
  const [radiusKm, setRadiusKm]   = useState(urlInit.current.radius);
  const [minPrice, setMinPrice]   = useState(urlInit.current.minP);
  const [maxPrice, setMaxPrice]   = useState(urlInit.current.maxP);
  const [minExp, setMinExp]       = useState(0);
  const [coords, setCoords]       = useState<{ lat: number; lon: number } | null>(null);

  /* ── UI state ── */
  const [sortBy, setSortBy]     = useState("default");
  const [openSeg, setOpenSeg]   = useState<Segment | null>(null);
  const [hoverSeg, setHoverSeg] = useState<Segment | null>(null);
  const [page, setPage]         = useState(1);

  /* ── Query-driven results ── */
  const searchQueryParams = {
    categories: selectedCategories,
    minPrice,
    maxPrice,
    minYearsOfExperience: minExp,
    latitude:  coords?.lat ?? 0,
    longitude: coords?.lon ?? 0,
    radiusKm:  coords ? radiusKm : 20020,
    page:      page - 1,
    size:      PAGE_SIZE,
  };

  const debouncedSearchParams = useDebounce(searchQueryParams, 400);
  const { data: searchData, isLoading, error: searchError } = useProviderSearchQuery(debouncedSearchParams);
  const { data: allProviders = [] } = useAllProvidersQuery();

  const results       = searchData?.content ?? null;
  const totalPages    = searchData?.totalPages ?? 0;
  const totalElements = searchData?.totalElements ?? 0;
  const error         = searchError instanceof Error ? searchError.message : searchError ? String(searchError) : null;

  /* refs for click-outside */
  const barRef     = useRef<HTMLFormElement>(null);
  const sortRef    = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

  /* ── Derived data ── */
  const categoryCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    allProviders.forEach((p) => p.categories.forEach((c) => { map[c] = (map[c] ?? 0) + 1; }));
    return map;
  }, [allProviders]);

  const sortedResults = useMemo((): ProviderDto[] | null => {
    if (!results) return null;
    const arr = [...results];
    if (sortBy === "price_asc")    return arr.sort((a, b) => a.pricePerHour - b.pricePerHour);
    if (sortBy === "price_desc")   return arr.sort((a, b) => b.pricePerHour - a.pricePerHour);
    if (sortBy === "exp_desc")     return arr.sort((a, b) => b.yearsOfExperience - a.yearsOfExperience);
    if (sortBy === "distance_asc") return arr.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    return arr;
  }, [results, sortBy]);

  /* reset sort option if GPS lost and closest was selected */
  useEffect(() => {
    if (!coords && sortBy === "distance_asc") setSortBy("default");
  }, [coords, sortBy]);

  /* GPS detection */
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},
    );
  }, []);

  /* click-outside → close dropdowns */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!barRef.current?.contains(t) && !sortRef.current?.contains(t)) setOpenSeg(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Handlers ── */
  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key],
    );
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOpenSeg(null);
    setPage(1);
  };

  const handleReset = () => {
    setSelectedCategories([]);
    setRadiusKm(25);
    setMinPrice("");
    setMaxPrice("");
    setMinExp(0);
    setPage(1);
  };

  const toggleSeg = (s: Segment) => setOpenSeg((prev) => (prev === s ? null : s));

  const handlePageChange = (p: number) => {
    setPage(p);
    if (resultsRef.current) {
      const top = resultsRef.current.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  /* ── Display strings ── */
  const catLabel = selectedCategories.length === 0
    ? "All trades"
    : selectedCategories.map((c) => CATEGORY_LABEL[c] ?? c).join(", ");

  const budgetLabel = minPrice || maxPrice
    ? `$${minPrice || "0"}–$${maxPrice || "∞"}/hr`
    : "Any budget";

  const expLabel   = minExp > 0 ? `${minExp}+ years` : "Any";
  const locLabel   = coords ? `GPS · ${radiusKm} km radius` : "No location";
  const sortLabel  = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Best match";

  /* Helper: segment bg based on open/hover state */
  const segBg = (s: Segment) =>
    openSeg === s || hoverSeg === s
      ? "var(--slate-50, #f8fafc)"
      : "transparent";

  /* Helper: has active filter? */
  const hasFilter = {
    category:   selectedCategories.length > 0,
    location:   !!coords,
    experience: minExp > 0,
    budget:     !!(minPrice || maxPrice),
  };

  /* ── Shared segment props ── */
  const segProps = (s: Segment) => ({
    onClick: () => toggleSeg(s),
    onMouseEnter: () => setHoverSeg(s),
    onMouseLeave: () => setHoverSeg(null),
    style: {
      padding: "11px 16px",
      borderRadius: 10,
      cursor: "pointer",
      background: segBg(s),
      transition: "background 0.12s",
      userSelect: "none" as const,
    },
  });

  /* ═══════════════════════════════════════════════════════ RENDER */
  return (
    <div style={{ background: "var(--bg-canvas)", minHeight: "100vh" }}>
      <main className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24, fontSize: 12.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
          <Link to="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <span style={{ color: "var(--text)" }}>Browse providers</span>
        </div>

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <span className="eyebrow">Discover</span>
          <h1 style={{ margin: "10px 0 0", fontSize: "clamp(26px,4vw,40px)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            Find someone who can{" "}
            <span style={{ textDecoration: "underline", textDecorationColor: "var(--amber-500)", textDecorationThickness: 3, textUnderlineOffset: 4 }}>
              show up today.
            </span>
          </h1>
          <p style={{ marginTop: 10, fontSize: 15, color: "var(--text-muted)", maxWidth: 600 }}>
            {allProviders.length > 0 ? allProviders.length.toLocaleString() : "…"} vetted providers.
            Use the filters below to narrow by trade, distance, experience, or budget.
          </p>
        </div>

        {/* ══ Hero search bar ══════════════════════════════════════════ */}
        <form
          ref={barRef}
          onSubmit={handleSearch}
          style={{
            background: "var(--card, #fff)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 6,
            display: "flex",
            gap: 0,
            boxShadow: "var(--shadow-md)",
            marginBottom: 28,
            alignItems: "stretch",
          }}
        >
          {/* ── Category ── */}
          <div style={{ position: "relative", flex: "1.3 1 0", minWidth: 0 }}>
            <div {...segProps("category")}>
              <SegLabel name="Category" dot={hasFilter.category} />
              <SegVal text={catLabel} placeholder={!hasFilter.category} badge={selectedCategories.length > 0 ? selectedCategories.length : undefined} />
            </div>

            {openSeg === "category" && (
              <div style={{ ...DROPDOWN, minWidth: 268, padding: "4px 0" }}>
                <div style={{ padding: "10px 16px 10px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Select trades</span>
                  {selectedCategories.length > 0 && (
                    <button type="button" onClick={() => { setSelectedCategories([]); setPage(1); }}
                      style={{ fontSize: 12, color: "var(--navy-700, #1e3a8a)", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500, fontFamily: "inherit" }}>
                      Clear all
                    </button>
                  )}
                </div>
                {ALL_CATEGORIES.map(({ key, label, Icon }) => {
                  const active = selectedCategories.includes(key);
                  return (
                    <div key={key} onClick={() => toggleCategory(key)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", cursor: "pointer", background: active ? "var(--slate-50, #f8fafc)" : "transparent", transition: "background 0.1s" }}>
                      <div style={{ width: 17, height: 17, borderRadius: 4, border: `1.5px solid ${active ? "var(--navy-700, #1e3a8a)" : "var(--border)"}`, background: active ? "var(--navy-900, #0b1e3f)" : "transparent", display: "grid", placeItems: "center", flexShrink: 0, transition: "all 0.1s" }}>
                        {active && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                      </div>
                      <Icon size={13} />
                      <span style={{ flex: 1, fontSize: 13.5, color: "var(--text)" }}>{label}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>{categoryCountMap[key] ?? 0}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ width: 1, background: "var(--border)", margin: "14px 0", flexShrink: 0 }} />

          {/* ── Location ── */}
          <div style={{ position: "relative", flex: "1 1 0", minWidth: 0 }}>
            <div {...segProps("location")}>
              <SegLabel name="Location" dot={hasFilter.location} />
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <IconPin size={12} />
                <SegVal text={locLabel} placeholder={!coords} />
              </div>
            </div>

            {openSeg === "location" && (
              <div style={{ ...DROPDOWN, minWidth: 288, padding: 18 }}>
                {coords ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "block", flexShrink: 0 }} />
                      <span style={{ fontSize: 13.5, fontWeight: 600 }}>GPS location detected</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: 18 }}>
                      {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
                    </div>
                    <div style={{ ...FILTER_HEAD, marginBottom: 8 }}>Search radius</div>
                    <input type="range" min={5} max={100} value={radiusKm}
                      onChange={(e) => setRadiusKm(Number(e.target.value))}
                      onMouseUp={() => setPage(1)}
                      style={{ width: "100%", accentColor: "var(--navy-700, #1e3a8a)" }} />
                    <div style={RANGE_ROW}>
                      <span>5 km</span>
                      <span style={{ color: "var(--text)", fontWeight: 600 }}>{radiusKm} km</span>
                      <span>100 km</span>
                    </div>
                  </>
                ) : (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 16 }}>📍</span>
                      <span style={{ fontWeight: 600, fontSize: 13.5 }}>No location detected</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55 }}>
                      Showing all providers regardless of distance. Enable GPS in your browser for distance-based filtering and sorting.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ width: 1, background: "var(--border)", margin: "14px 0", flexShrink: 0 }} />

          {/* ── Experience ── */}
          <div style={{ position: "relative", flex: "1 1 0", minWidth: 0 }}>
            <div {...segProps("experience")}>
              <SegLabel name="Experience" dot={hasFilter.experience} />
              <SegVal text={expLabel} placeholder={!hasFilter.experience} />
            </div>

            {openSeg === "experience" && (
              <div style={{ ...DROPDOWN, minWidth: 264, padding: 18 }}>
                <div style={{ ...FILTER_HEAD, marginBottom: 12 }}>Minimum experience</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
                  {EXP_PRESETS.map(({ label, value }) => (
                    <Pill key={value} active={minExp === value} onClick={() => {
                      setMinExp(value);
                      setPage(1);
                      setOpenSeg(null);
                    }}>
                      {label}
                    </Pill>
                  ))}
                </div>
                <div style={{ ...FILTER_HEAD, marginBottom: 8 }}>Custom</div>
                <input type="range" min={0} max={20} value={minExp}
                  onChange={(e) => setMinExp(Number(e.target.value))}
                  onMouseUp={() => setPage(1)}
                  style={{ width: "100%", accentColor: "var(--navy-700, #1e3a8a)" }} />
                <div style={RANGE_ROW}>
                  <span>0 yr</span>
                  <span style={{ color: "var(--text)", fontWeight: 600 }}>{minExp > 0 ? `${minExp}+ yr` : "Any"}</span>
                  <span>20 yr</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ width: 1, background: "var(--border)", margin: "14px 0", flexShrink: 0 }} />

          {/* ── Budget ── */}
          <div style={{ position: "relative", flex: "1 1 0", minWidth: 0 }}>
            <div {...segProps("budget")}>
              <SegLabel name="Budget" dot={hasFilter.budget} />
              <SegVal text={budgetLabel} placeholder={!hasFilter.budget} />
            </div>

            {openSeg === "budget" && (
              <div style={{ ...DROPDOWN, minWidth: 288, padding: 18, right: 6, left: "auto" }}>
                <div style={{ ...FILTER_HEAD, marginBottom: 12 }}>Budget per hour</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
                  {BUDGET_PRESETS.map((p) => {
                    const active = minPrice === p.min && maxPrice === p.max;
                    return (
                      <Pill key={p.label} active={active} onClick={() => {
                        setMinPrice(p.min); setMaxPrice(p.max);
                        setPage(1);
                        setOpenSeg(null);
                      }}>
                        {p.label}
                      </Pill>
                    );
                  })}
                </div>
                <div style={{ ...FILTER_HEAD, marginBottom: 10 }}>Custom range</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {(["Min $", "Max $"] as const).map((ph, i) => (
                    <input key={ph} type="number" min={0} placeholder={ph}
                      value={i === 0 ? minPrice : maxPrice}
                      onChange={(e) => i === 0 ? setMinPrice(e.target.value) : setMaxPrice(e.target.value)}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, background: "transparent", color: "var(--text)", fontFamily: "inherit", outline: "none" }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search button */}
          <div style={{ padding: 6, display: "flex", alignItems: "center" }}>
            <button type="submit" className="btn btn-primary" style={{ padding: "10px 20px", gap: 8, whiteSpace: "nowrap" }} disabled={isLoading}>
              <IconSearch size={16} />
              <span style={{ fontSize: 13.5 }}>Search</span>
            </button>
          </div>
        </form>

        {/* ══ Body: sidebar + results ═══════════════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "232px 1fr", gap: 32, alignItems: "flex-start" }}>

          {/* ── Sidebar ───────────────────────────────────────────── */}
          <aside>
            <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Refine</span>
              <button type="button" onClick={handleReset}
                style={{ background: "none", border: "none", fontSize: 12, color: "var(--navy-700, #1e3a8a)", cursor: "pointer", fontWeight: 500, padding: 0, fontFamily: "inherit" }}>
                Reset all
              </button>
            </div>

            {/* Trade */}
            <div style={{ marginBottom: 26 }}>
              <h4 style={FILTER_HEAD}>Trade</h4>
              {ALL_CATEGORIES.map(({ key, label, Icon }) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 0", fontSize: 13.5, cursor: "pointer" }}>
                  <input type="checkbox" checked={selectedCategories.includes(key)} onChange={() => toggleCategory(key)}
                    style={{ accentColor: "var(--navy-700, #1e3a8a)", width: 14, height: 14, flexShrink: 0 }} />
                  <Icon size={12} />
                  <span style={{ flex: 1, color: "var(--text)" }}>{label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>{categoryCountMap[key] ?? 0}</span>
                </label>
              ))}
            </div>

            {/* Distance */}
            {coords && (
              <div style={{ marginBottom: 26 }}>
                <h4 style={FILTER_HEAD}>Distance</h4>
                <input type="range" min={5} max={100} value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  onMouseUp={() => setPage(1)}
                  style={{ width: "100%", accentColor: "var(--navy-700, #1e3a8a)" }} />
                <div style={RANGE_ROW}>
                  <span>5 km</span>
                  <span style={{ color: "var(--text)", fontWeight: 600 }}>{radiusKm} km</span>
                  <span>100 km</span>
                </div>
              </div>
            )}

            {/* Experience */}
            <div style={{ marginBottom: 26 }}>
              <h4 style={FILTER_HEAD}>Min experience</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                {EXP_PRESETS.map(({ label, value }) => (
                  <Pill key={value} active={minExp === value} onClick={() => { setMinExp(value); setPage(1); }}>
                    {label}
                  </Pill>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div style={{ marginBottom: 26 }}>
              <h4 style={FILTER_HEAD}>Budget /hr</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                {BUDGET_PRESETS.map((p) => {
                  const active = minPrice === p.min && maxPrice === p.max;
                  return (
                    <Pill key={p.label} active={active} onClick={() => { setMinPrice(p.min); setMaxPrice(p.max); setPage(1); }}>
                      {p.label}
                    </Pill>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {(["Min $", "Max $"] as const).map((ph, i) => (
                  <input key={ph} type="number" min={0} placeholder={ph}
                    value={i === 0 ? minPrice : maxPrice}
                    onChange={(e) => i === 0 ? setMinPrice(e.target.value) : setMaxPrice(e.target.value)}
                    style={{ width: "100%", padding: "7px 9px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 12.5, background: "var(--card, #fff)", color: "var(--text)", fontFamily: "inherit", outline: "none" }} />
                ))}
              </div>
            </div>
          </aside>

          {/* ── Results ───────────────────────────────────────────── */}
          <section ref={resultsRef}>
            {/* Results header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <span style={{ fontSize: 14, color: "var(--text-muted)" }}>
                {isLoading ? "Searching…" : results !== null ? (
                  <><b style={{ color: "var(--text)", fontWeight: 700 }}>{totalElements}</b> provider{totalElements !== 1 ? "s" : ""} found</>
                ) : null}
              </span>
              <span style={{ flex: 1 }} />

              {/* Custom sort dropdown */}
              <div ref={sortRef} style={{ position: "relative" }}>
                <button type="button" onClick={() => toggleSeg("sort")}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "8px 12px 8px 14px",
                    background: openSeg === "sort" ? "var(--slate-50, #f8fafc)" : "var(--card, #fff)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 13.5,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    color: "var(--text)",
                    transition: "background 0.12s",
                    whiteSpace: "nowrap",
                  }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", flexShrink: 0 }}>Sort</span>
                  {sortLabel}
                  <span style={{ color: "var(--text-muted)", marginLeft: 2 }}><IconChevron /></span>
                </button>

                {openSeg === "sort" && (
                  <div style={{ ...DROPDOWN, left: "auto", right: 0, minWidth: 192, padding: "4px 0" }}>
                    {SORT_OPTIONS.filter((o) => o.value !== "distance_asc" || coords).map((opt) => (
                      <button key={opt.value} type="button"
                        onClick={() => { setSortBy(opt.value); setOpenSeg(null); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          width: "100%", padding: "10px 14px",
                          background: sortBy === opt.value ? "var(--slate-50, #f8fafc)" : "transparent",
                          border: "none", textAlign: "left", cursor: "pointer",
                          fontFamily: "inherit", fontSize: 13.5,
                          color: sortBy === opt.value ? "var(--navy-700, #1e3a8a)" : "var(--text)",
                          fontWeight: sortBy === opt.value ? 600 : 400,
                          transition: "background 0.08s",
                        }}>
                        <span style={{ width: 14, flexShrink: 0, color: "var(--navy-700, #1e3a8a)", fontSize: 12 }}>
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
              <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            {/* Loading skeletons */}
            {isLoading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ height: 136, borderRadius: 12, border: "1px solid var(--border)", background: "var(--slate-50, #f8fafc)", opacity: 0.7 }} />
                ))}
              </div>
            )}

            {/* Empty */}
            {!isLoading && sortedResults?.length === 0 && (
              <div style={{ padding: "20px 24px", background: "var(--slate-50, #f9fafb)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 14, color: "var(--text-muted)" }}>
                No providers match your current filters. Try broadening the radius, removing a trade filter, or clearing the experience requirement.
              </div>
            )}

            {/* Provider cards */}
            {!isLoading && sortedResults && sortedResults.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sortedResults.map((p) => {
                  const av = avatarColor(p.id);
                  const init = initials(p.firstName, p.lastName);
                  const showDist = p.distanceKm != null && p.distanceKm < 19000;
                  return (
                    <div key={p.id}
                      style={{ display: "grid", gridTemplateColumns: "96px 1fr auto", gap: 20, background: "var(--card, #fff)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, alignItems: "flex-start", transition: "border-color 0.12s, transform 0.12s, box-shadow 0.12s", cursor: "pointer" }}
                      onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = "var(--border-strong, #94a3b8)"; el.style.transform = "translateY(-1px)"; el.style.boxShadow = "var(--shadow-md)"; }}
                      onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = "var(--border)"; el.style.transform = "none"; el.style.boxShadow = "none"; }}
                    >
                      {/* Avatar */}
                      <div style={{ width: 96, height: 96, borderRadius: 14, background: av.bg, color: av.color, display: "grid", placeItems: "center", fontSize: 30, fontWeight: 700, letterSpacing: "-0.01em", flexShrink: 0, userSelect: "none" }}>
                        {init}
                      </div>

                      {/* Content */}
                      <div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>{p.firstName} {p.lastName}</h3>
                          <span style={{ display: "inline-flex", alignItems: "center", fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--emerald-700, #047857)", letterSpacing: "0.06em", textTransform: "uppercase", background: "var(--emerald-100, #d1fae5)", padding: "2px 7px", borderRadius: 4 }}>
                            ✓ Verified
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
                          {p.yearsOfExperience} yr exp{p.serviceRadiusKm ? ` · serves within ${p.serviceRadiusKm} km` : ""}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                          {p.categories.map((cat) => (
                            <span key={cat} style={{ fontSize: 11.5, fontWeight: 500, padding: "3px 9px", background: "var(--slate-100)", color: "var(--text)", borderRadius: 999 }}>
                              {CATEGORY_LABEL[cat] ?? cat}
                            </span>
                          ))}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 12, fontSize: 13, color: "var(--text-muted)", flexWrap: "wrap" }}>
                          <span><b style={{ color: "var(--text)", fontWeight: 600 }}>{p.yearsOfExperience} yr</b> experience</span>
                          {showDist && <span>· <b style={{ color: "var(--text)", fontWeight: 600 }}>{p.distanceKm!.toFixed(1)} km</b> away</span>}
                        </div>
                        {p.bio && (
                          <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.45, marginTop: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as React.CSSProperties}>
                            {p.bio}
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", minWidth: 152, flexShrink: 0 }}>
                        <span style={{ fontSize: 11.5, fontFamily: "var(--font-mono)", color: "var(--emerald-700, #047857)", background: "var(--emerald-100, #d1fae5)", padding: "3px 8px", borderRadius: 4, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                          Active
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", fontWeight: 500 }}>
                          from <b>${p.pricePerHour}</b><small style={{ color: "var(--text-muted)", fontWeight: 400 }}> /hr</small>
                        </span>
                        <button className="btn btn-primary btn-sm">Book →</button>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, padding: "4px 8px" }}>Message</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && sortedResults && sortedResults.length > 0 && (
              <Pagination page={page} total={totalPages} onChange={handlePageChange} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
