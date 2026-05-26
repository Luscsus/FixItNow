import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useActiveCategoriesQuery } from "@/hooks/useActiveCategoriesQuery";
import { useAllProvidersQuery } from "@/hooks/useAllProvidersQuery";
import { useProviderSearchQuery } from "@/hooks/useProviderSearchQuery";
import { useDebounce } from "@/hooks/useDebounce";
import type { ProviderDto } from "@/services/providerService";
import { SearchBar } from "@/components/browse/SearchBar";
import { FilterSidebar } from "@/components/browse/FilterSidebar";
import { ResultsSection } from "@/components/browse/ResultsSection";
import { ProvidersMap } from "@/components/browse/ProvidersMap";
import { PAGE_SIZE, type Segment } from "@/components/browse/browseConstants";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function BrowseProvidersPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const routerState = routerLocation.state as { formState?: unknown } | null;
  const selectionMode = routerState?.formState != null;

  /* ── Search state ── */
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => searchParams.getAll("categories"));
  const [radiusKm, setRadiusKm] = useState(() => Number(searchParams.get("radiusKm") ?? "25"));
  const [minPrice, setMinPrice] = useState(() => searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get("maxPrice") ?? "");
  const [minExp, setMinExp] = useState(0);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [geoSettled] = useState(true);

  /* ── UI state ── */
  const [sortBy, setSortBy] = useState("default");
  const [openSeg, setOpenSeg] = useState<Segment | null>(null);
  const [hoverSeg, setHoverSeg] = useState<Segment | null>(null);
  const [page, setPage] = useState(1);
  const [mapOpen, setMapOpen] = useState(false);

  /* ── Refs ── */
  const barRef = useRef<HTMLFormElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

  /* ── Query ── */
  const activeCoords = locationEnabled ? coords : null;
  const searchQueryParams = {
    categories: selectedCategories,
    minPrice,
    maxPrice,
    minYearsOfExperience: minExp,
    latitude: activeCoords?.lat ?? null,
    longitude: activeCoords?.lon ?? null,
    radiusKm: activeCoords ? radiusKm : null,
    page: page - 1,
    size: PAGE_SIZE,
  };

  const debouncedSearchParams = useDebounce(searchQueryParams, 400);
  const {
    data: searchData,
    isLoading,
    error: searchError,
  } = useProviderSearchQuery(debouncedSearchParams, geoSettled);

  const { data: allProviders = [] } = useAllProvidersQuery();
  const { data: activeCategories = [] } = useActiveCategoriesQuery();
  const effectiveLoading = !geoSettled || isLoading;
  const results = searchData?.content ?? null;
  const totalPages = searchData?.totalPages ?? 0;
  const totalElements = searchData?.totalElements ?? 0;
  const error =
    searchError instanceof Error
      ? searchError.message
      : searchError
        ? String(searchError)
        : null;

  /* ── Derived data ── */
  const categoryCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    allProviders.forEach((p) =>
      p.categories.forEach((c) => {
        map[c] = (map[c] ?? 0) + 1;
      }),
    );
    return map;
  }, [allProviders]);

  const mapProviders = useMemo((): ProviderDto[] => {
    let providers = allProviders;
    if (selectedCategories.length > 0)
      providers = providers.filter((p) =>
        p.categories.some((c) => selectedCategories.includes(c)),
      );
    if (minPrice) providers = providers.filter((p) => p.pricePerHour >= Number(minPrice));
    if (maxPrice) providers = providers.filter((p) => p.pricePerHour <= Number(maxPrice));
    if (minExp > 0) providers = providers.filter((p) => p.yearsOfExperience >= minExp);
    if (locationEnabled && coords)
      providers = providers.filter((p) => {
        if (p.locationLat == null || p.locationLon == null) return false;
        return haversineKm(coords.lat, coords.lon, p.locationLat, p.locationLon) <= radiusKm;
      });
    return providers;
  }, [allProviders, selectedCategories, minPrice, maxPrice, minExp, locationEnabled, coords, radiusKm]);

  const sortedResults = useMemo((): ProviderDto[] | null => {
    if (!results) return null;
    const arr = [...results];
    if (sortBy === "price_asc")
      return arr.sort((a, b) => a.pricePerHour - b.pricePerHour);
    if (sortBy === "price_desc")
      return arr.sort((a, b) => b.pricePerHour - a.pricePerHour);
    if (sortBy === "exp_desc")
      return arr.sort((a, b) => b.yearsOfExperience - a.yearsOfExperience);
    if (sortBy === "distance_asc")
      return arr.sort(
        (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
      );
    return arr;
  }, [results, sortBy]);

  /* ── Effects ── */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!coords && sortBy === "distance_asc") setSortBy("default");
  }, [coords, sortBy]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!barRef.current?.contains(t) && !sortRef.current?.contains(t))
        setOpenSeg(null);
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

  const handleLocationToggle = (enabled: boolean) => {
    setLocationEnabled(enabled);
    setPage(1);
    // Only request permission when the user explicitly turns the toggle on
    // and we don't already have coords.
    if (enabled && !coords && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {},
        { timeout: 10_000 },
      );
    }
  };

  const handleReset = () => {
    setSelectedCategories([]);
    setRadiusKm(25);
    setMinPrice("");
    setMaxPrice("");
    setMinExp(0);
    setLocationEnabled(false);
    setPage(1);
  };

  const toggleSeg = (s: Segment) =>
    setOpenSeg((prev) => (prev === s ? null : s));

  const handlePageChange = (p: number) => {
    setPage(p);
    if (resultsRef.current) {
      const top =
        resultsRef.current.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  /* ═══════════════════════════════════════════════════════ RENDER */
  return (
    <div style={{ background: "var(--bg-canvas)", minHeight: "100vh" }}>
      <main className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {/* Breadcrumb */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 24,
            fontSize: 12.5,
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
          }}
        >
          <Link
            to="/"
            style={{ color: "var(--text-muted)", textDecoration: "none" }}
          >
            Home
          </Link>
          <span>/</span>
          {selectionMode && (
            <>
              <Link
                to="/tickets/new"
                state={routerState}
                style={{ color: "var(--text-muted)", textDecoration: "none" }}
              >
                New ticket
              </Link>
              <span>/</span>
            </>
          )}
          <span style={{ color: "var(--text)" }}>Browse providers</span>
        </div>

        {/* Selection mode banner */}
        {selectionMode && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 18px",
              background: "var(--navy-900, #0b1e3f)",
              color: "#fff",
              borderRadius: 10,
              marginBottom: 24,
              fontSize: 13.5,
            }}
          >
            <span>
              <b>Selecting a provider</b> — click{" "}
              <span
                style={{
                  background: "rgba(255,255,255,0.15)",
                  padding: "1px 8px",
                  borderRadius: 4,
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
              >
                Select →
              </span>{" "}
              on any card to add them to your ticket.
            </span>
            <button
              type="button"
              onClick={() => navigate("/tickets/new", { state: routerState })}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.25)",
                color: "#fff",
                borderRadius: 7,
                padding: "6px 14px",
                fontSize: 12.5,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              ← Cancel
            </button>
          </div>
        )}

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <span className="eyebrow">Discover</span>
          <h1
            style={{
              margin: "10px 0 0",
              fontSize: "clamp(26px,4vw,40px)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
            }}
          >
            Find someone who can{" "}
            <span
              style={{
                textDecoration: "underline",
                textDecorationColor: "var(--amber-500)",
                textDecorationThickness: 3,
                textUnderlineOffset: 4,
              }}
            >
              show up today.
            </span>
          </h1>
          <p
            style={{
              marginTop: 10,
              fontSize: 15,
              color: "var(--text-muted)",
              maxWidth: 600,
            }}
          >
            {totalElements > 0
              ? totalElements.toLocaleString()
              : "…"}{" "}
            providers available. Use the filters below to narrow by trade,
            distance, experience, or budget.
          </p>
        </div>

        <div style={{ position: "relative", zIndex: 10 }}>
        <SearchBar
          barRef={barRef}
          selectedCategories={selectedCategories}
          toggleCategory={toggleCategory}
          clearCategories={() => {
            setSelectedCategories([]);
            setPage(1);
          }}
          radiusKm={radiusKm}
          setRadiusKm={setRadiusKm}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          minExp={minExp}
          setMinExp={setMinExp}
          setPage={setPage}
          coords={coords}
          locationEnabled={locationEnabled}
          setLocationEnabled={handleLocationToggle}
          isLoading={effectiveLoading}
          categories={activeCategories}
          categoryCountMap={categoryCountMap}
          openSeg={openSeg}
          setOpenSeg={setOpenSeg}
          hoverSeg={hoverSeg}
          setHoverSeg={setHoverSeg}
          onSearch={handleSearch}
        />
        </div>

        {/* Map toggle button */}
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => setMapOpen((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 16px",
              background: mapOpen ? "var(--navy-700, #1e3a8a)" : "var(--card, #fff)",
              color: mapOpen ? "#fff" : "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
            {mapOpen ? "Hide map" : "Show on map"}
          </button>
          {mapOpen && (
            <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
              {mapProviders.filter((p) => p.locationLat != null).length} providers shown
            </span>
          )}
        </div>

        {/* Map panel */}
        {mapOpen && (
          <div
            style={{
              position: "relative",
              zIndex: 1,
              height: 440,
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid var(--border)",
              marginBottom: 24,
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
            }}
          >
            <ProvidersMap providers={mapProviders} userCoords={coords} />
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "232px 1fr",
            gap: 32,
            alignItems: "flex-start",
          }}
        >
          <FilterSidebar
            selectedCategories={selectedCategories}
            toggleCategory={toggleCategory}
            radiusKm={radiusKm}
            setRadiusKm={setRadiusKm}
            minPrice={minPrice}
            setMinPrice={setMinPrice}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            minExp={minExp}
            setMinExp={setMinExp}
            setPage={setPage}
            coords={coords}
            locationEnabled={locationEnabled}
            setLocationEnabled={handleLocationToggle}
            categories={activeCategories}
            categoryCountMap={categoryCountMap}
            onReset={handleReset}
          />

          <ResultsSection
            resultsRef={resultsRef}
            sortRef={sortRef}
            isLoading={effectiveLoading}
            error={error}
            sortedResults={sortedResults}
            sortBy={sortBy}
            setSortBy={setSortBy}
            openSeg={openSeg}
            toggleSeg={toggleSeg}
            totalElements={totalElements}
            totalPages={totalPages}
            page={page}
            onPageChange={handlePageChange}
            coords={coords}
            selectionMode={selectionMode}
            routerState={routerState}
          />
        </div>
      </main>
    </div>
  );
}
