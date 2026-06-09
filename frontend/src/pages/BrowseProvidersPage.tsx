import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSEO } from "@/hooks/useSEO";
import { useActiveCategoriesQuery } from "@/hooks/useActiveCategoriesQuery";
import { useAllProvidersQuery } from "@/hooks/useAllProvidersQuery";
import { useProviderSearchQuery } from "@/hooks/useProviderSearchQuery";
import { useDebounce } from "@/hooks/useDebounce";
import type { ProviderDto } from "@/services/providerService";
import { SearchBar } from "@/components/browse/SearchBar";
import { IconSearch } from "@/components/browse/BrowseIcons";
import { FilterSidebar } from "@/components/browse/FilterSidebar";
import { ResultsSection } from "@/components/browse/ResultsSection";
import { ProvidersMap } from "@/components/browse/ProvidersMap";
import { PAGE_SIZE, type Segment } from "@/components/browse/browseConstants";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { BottomSheet } from "@/components/ui/BottomSheet";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function BrowseProvidersPage() {
  useSEO({
    title: "Browse Service Providers",
    description: "Search and filter trusted local service providers near you. Find plumbers, electricians, handymen and more on FixItNow.",
    canonical: "/browse",
  });

  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const routerState = routerLocation.state as { formState?: { category?: string } } | null;
  const selectionMode = routerState?.formState != null;

  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const fromUrl = searchParams.getAll("categories");
    if (fromUrl.length > 0) return fromUrl;
    const cat = routerState?.formState?.category;
    return cat ? [cat] : [];
  });
  const [query, setQuery]           = useState(() => searchParams.get("q") ?? "");
  const [radiusKm, setRadiusKm]     = useState(() => Number(searchParams.get("radiusKm") ?? "25"));
  const [minPrice, setMinPrice]     = useState(() => searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice]     = useState(() => searchParams.get("maxPrice") ?? "");
  const [minExp, setMinExp]         = useState(0);
  const [coords, setCoords]         = useState<{ lat: number; lon: number } | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [geoSettled] = useState(true);

  /* ── UI state ── */
  const [sortBy, setSortBy] = useState("default");
  const [openSeg, setOpenSeg] = useState<Segment | null>(null);
  const [hoverSeg, setHoverSeg] = useState<Segment | null>(null);
  const [page, setPage] = useState(1);
  const [mapOpen, setMapOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { isMobile }                = useBreakpoint();

  const barRef     = useRef<HTMLFormElement>(null);
  const sortRef    = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

  const activeCoords = locationEnabled ? coords : null;
  const searchQueryParams = {
    query, categories: selectedCategories, minPrice, maxPrice,
    minYearsOfExperience: minExp,
    latitude: activeCoords?.lat ?? null, longitude: activeCoords?.lon ?? null,
    radiusKm: activeCoords ? radiusKm : null,
    page: page - 1, size: PAGE_SIZE,
  };

  const debouncedSearchParams = useDebounce(searchQueryParams, 400);
  const { data: searchData, isLoading, error: searchError } = useProviderSearchQuery(debouncedSearchParams, geoSettled);
  const { data: allProviders = [] }    = useAllProvidersQuery();
  const { data: activeCategories = [] } = useActiveCategoriesQuery();

  const effectiveLoading = !geoSettled || isLoading;
  const results       = searchData?.content ?? null;
  const totalPages    = searchData?.totalPages ?? 0;
  const totalElements = searchData?.totalElements ?? 0;
  const error = searchError instanceof Error ? searchError.message : searchError ? String(searchError) : null;

  const categoryCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    allProviders.forEach((p) => p.categories.forEach((c) => { map[c] = (map[c] ?? 0) + 1; }));
    return map;
  }, [allProviders]);

  const mapProviders = useMemo((): ProviderDto[] => {
    let providers = allProviders;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      providers = providers.filter((p) => {
        // Match name or trade only (mirrors the backend search) — bio is excluded
        // so a short fragment doesn't match nearly every provider via their bio.
        const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.toLowerCase();
        const cats = (p.categories ?? []).join(" ").toLowerCase();
        return name.includes(q) || cats.includes(q);
      });
    }
    if (selectedCategories.length > 0)
      providers = providers.filter((p) => p.categories.some((c) => selectedCategories.includes(c)));
    if (minPrice) providers = providers.filter((p) => p.pricePerHour >= Number(minPrice));
    if (maxPrice) providers = providers.filter((p) => p.pricePerHour <= Number(maxPrice));
    if (minExp > 0) providers = providers.filter((p) => p.yearsOfExperience >= minExp);
    if (locationEnabled && coords)
      providers = providers.filter((p) => {
        if (p.locationLat == null || p.locationLon == null) return false;
        return haversineKm(coords.lat, coords.lon, p.locationLat, p.locationLon) <= radiusKm;
      });
    return providers;
  }, [allProviders, query, selectedCategories, minPrice, maxPrice, minExp, locationEnabled, coords, radiusKm]);

  // When GPS is lost, treat "nearest first" as "best match" without mutating state
  const effectiveSortBy = !coords && sortBy === "distance_asc" ? "default" : sortBy;

  const sortedResults = useMemo((): ProviderDto[] | null => {
    if (!results) return null;
    const arr = [...results];
    if (effectiveSortBy === "price_asc")    return arr.sort((a, b) => a.pricePerHour - b.pricePerHour);
    if (effectiveSortBy === "price_desc")   return arr.sort((a, b) => b.pricePerHour - a.pricePerHour);
    if (effectiveSortBy === "exp_desc")     return arr.sort((a, b) => b.yearsOfExperience - a.yearsOfExperience);
    if (effectiveSortBy === "distance_asc") return arr.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    return arr;
  }, [results, effectiveSortBy]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t2 = e.target as Node;
      if (!barRef.current?.contains(t2) && !sortRef.current?.contains(t2)) setOpenSeg(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) => prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]);
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setOpenSeg(null); setPage(1); };

  const handleLocationToggle = (enabled: boolean) => {
    setLocationEnabled(enabled);
    setPage(1);
    if (enabled && !coords && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {},
        { timeout: 10_000 },
      );
    }
  };

  const handleReset = () => {
    setQuery(""); setSelectedCategories([]); setRadiusKm(25); setMinPrice(""); setMaxPrice(""); setMinExp(0);
    setLocationEnabled(false); setPage(1);
  };

  const toggleSeg = (s: Segment) => setOpenSeg((prev) => (prev === s ? null : s));

  const handlePageChange = (p: number) => {
    setPage(p);
    if (resultsRef.current) {
      const top = resultsRef.current.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div style={{ background: "var(--bg-canvas)", minHeight: "100vh" }}>
      <main className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24, fontSize: 12.5, color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
          <Link to="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>{t("browse.home")}</Link>
          <span>/</span>
          {selectionMode && (
            <>
              <Link to="/tickets/new" state={routerState} style={{ color: "var(--text-muted)", textDecoration: "none" }}>
                {t("browse.newTicket")}
              </Link>
              <span>/</span>
            </>
          )}
          <span style={{ color: "var(--text)" }}>{t("browse.browseProviders")}</span>
        </div>

        {/* Selection mode banner */}
        {selectionMode && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 18px", background: "var(--navy-900, #0b1e3f)", color: "#fff", borderRadius: 10, marginBottom: 24, fontSize: 13.5 }}>
            <span>
              <b>{t("browse.selectingProvider")}</b> — {t("browse.selectButtonHint")}
            </span>
            <button type="button" onClick={() => navigate("/tickets/new", { state: routerState })} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", borderRadius: 7, padding: "6px 14px", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>
              {t("browse.cancel")}
            </button>
          </div>
        )}

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <span className="eyebrow">{t("browse.discover")}</span>
          <h1 style={{ margin: "10px 0 0", fontSize: "clamp(26px,4vw,40px)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            {t("browse.findSomeone")}{" "}
            <span style={{ textDecoration: "underline", textDecorationColor: "var(--amber-500)", textDecorationThickness: 3, textUnderlineOffset: 4 }}>
              {t("browse.showUpToday")}
            </span>
          </h1>
          <p style={{ marginTop: 10, fontSize: 15, color: "var(--text-muted)", maxWidth: 600 }}>
            {t("browse.providersAvailable", { count: totalElements > 0 ? totalElements.toLocaleString() : "…" })}
          </p>
        </div>

        <div className="browse-searchbar-wrap" style={{ position: "relative", zIndex: 10 }}>
          <SearchBar
            query={query} setQuery={setQuery}
            barRef={barRef} selectedCategories={selectedCategories} toggleCategory={toggleCategory}
            clearCategories={() => { setSelectedCategories([]); setPage(1); }}
            radiusKm={radiusKm} setRadiusKm={setRadiusKm} minPrice={minPrice} setMinPrice={setMinPrice}
            maxPrice={maxPrice} setMaxPrice={setMaxPrice} minExp={minExp} setMinExp={setMinExp}
            setPage={setPage} coords={coords} locationEnabled={locationEnabled} setLocationEnabled={handleLocationToggle}
            isLoading={effectiveLoading} categories={activeCategories} categoryCountMap={categoryCountMap}
            openSeg={openSeg} setOpenSeg={setOpenSeg} hoverSeg={hoverSeg} setHoverSeg={setHoverSeg}
            onSearch={handleSearch}
          />
        </div>

        {/* Mobile-only search input (the desktop SearchBar is hidden < 768px) */}
        {isMobile && (
          <div style={{ position: "relative", marginBottom: 12 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: query ? "var(--text)" : "var(--text-muted)", pointerEvents: "none", display: "inline-flex" }}>
              <IconSearch size={18} />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder={t("searchBar.searchPlaceholder")}
              aria-label={t("searchBar.searchPlaceholder")}
              enterKeyHint="search"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "13px 40px 13px 42px", borderRadius: 10,
                border: "1px solid var(--border)", background: "var(--card)",
                /* 16px keeps iOS from auto-zooming the viewport on focus */
                fontSize: 16, color: "var(--text)", fontFamily: "inherit", outline: "none",
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setPage(1); }}
                aria-label={t("searchBar.clearSearch")}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", color: "var(--text-muted)", fontSize: 22, lineHeight: 1, cursor: "pointer", padding: "4px 8px" }}
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Filters / map toggle bar */}
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {isMobile && (
            <button type="button" onClick={() => setFiltersOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 16px", background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
              </svg>
              {t("browse.filters")}
              {(selectedCategories.length > 0 || minPrice || maxPrice || minExp > 0) && (
                <span style={{ background: "var(--amber-500)", color: "var(--navy-900)", borderRadius: 999, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>
                  {selectedCategories.length + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (minExp > 0 ? 1 : 0)}
                </span>
              )}
            </button>
          )}
          <button type="button" onClick={() => setMapOpen((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 16px", background: mapOpen ? "var(--navy-700, #1e3a8a)" : "var(--card, #fff)", color: mapOpen ? "#fff" : "var(--text)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s, color 0.15s" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
              <line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" />
            </svg>
            {mapOpen ? t("browse.hideMap") : t("browse.showOnMap")}
          </button>
          {mapOpen && (
            <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
              {t("browse.providersShown", { count: mapProviders.filter((p) => p.locationLat != null).length })}
            </span>
          )}
        </div>

        {mapOpen && (
          <div style={{ position: "relative", zIndex: 1, height: isMobile ? 280 : 440, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <ProvidersMap providers={mapProviders} userCoords={coords} />
          </div>
        )}

        {isMobile && (
          <BottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title={t("browse.filters")} desktopAsModal={false}>
            <FilterSidebar
              selectedCategories={selectedCategories} toggleCategory={toggleCategory}
              radiusKm={radiusKm} setRadiusKm={setRadiusKm} minPrice={minPrice} setMinPrice={setMinPrice}
              maxPrice={maxPrice} setMaxPrice={setMaxPrice} minExp={minExp} setMinExp={setMinExp}
              setPage={setPage} coords={coords} locationEnabled={locationEnabled}
              setLocationEnabled={handleLocationToggle} categories={activeCategories}
              categoryCountMap={categoryCountMap} onReset={handleReset}
            />
          </BottomSheet>
        )}

        <div className="browse-layout" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "232px 1fr", gap: 32, alignItems: "flex-start" }}>
          {!isMobile && (
            <FilterSidebar
              selectedCategories={selectedCategories} toggleCategory={toggleCategory}
              radiusKm={radiusKm} setRadiusKm={setRadiusKm} minPrice={minPrice} setMinPrice={setMinPrice}
              maxPrice={maxPrice} setMaxPrice={setMaxPrice} minExp={minExp} setMinExp={setMinExp}
              setPage={setPage} coords={coords} locationEnabled={locationEnabled}
              setLocationEnabled={handleLocationToggle} categories={activeCategories}
              categoryCountMap={categoryCountMap} onReset={handleReset}
            />
          )}

          <ResultsSection
            resultsRef={resultsRef} sortRef={sortRef} isLoading={effectiveLoading} error={error}
            sortedResults={sortedResults} sortBy={effectiveSortBy} setSortBy={setSortBy}
            openSeg={openSeg} toggleSeg={toggleSeg} totalElements={totalElements}
            totalPages={totalPages} page={page} onPageChange={handlePageChange}
            coords={coords} selectionMode={selectionMode} routerState={routerState}
          />
        </div>
      </main>
    </div>
  );
}
