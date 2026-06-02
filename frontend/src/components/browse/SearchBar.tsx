import { useTranslation } from "react-i18next";
import { IconSearch, IconPin, IconChevron } from "./BrowseIcons";
import { BrowsePill } from "./BrowsePill";
import {
  type Segment,
  CATEGORY_META,
  BUDGET_PRESETS,
  DROPDOWN,
  FILTER_HEAD,
  RANGE_ROW,
  useBrowseI18n,
} from "./browseConstants";

function SegLabel({ name, dot }: { name: string; dot?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        color: "var(--text-muted)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontWeight: 700,
        marginBottom: 4,
      }}
    >
      {name}
      {dot && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "var(--navy-700, #1e3a8a)",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
      )}
    </div>
  );
}

function SegVal({
  text,
  placeholder,
  badge,
}: {
  text: string;
  placeholder?: boolean;
  badge?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 6,
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: placeholder ? 400 : 500,
          color: placeholder ? "var(--text-muted)" : "var(--text)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
        }}
      >
        {text}
      </span>
      <span
        style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}
      >
        {badge != null && badge > 0 && (
          <span
            style={{
              background: "var(--navy-900, #0b1e3f)",
              color: "#fff",
              borderRadius: 999,
              padding: "1px 6px",
              fontSize: 10,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
            }}
          >
            {badge}
          </span>
        )}
        <IconChevron />
      </span>
    </div>
  );
}

interface SearchBarProps {
  barRef: React.RefObject<HTMLFormElement | null>;
  selectedCategories: string[];
  toggleCategory: (key: string) => void;
  clearCategories: () => void;
  radiusKm: number;
  setRadiusKm: (v: number) => void;
  minPrice: string;
  setMinPrice: (v: string) => void;
  maxPrice: string;
  setMaxPrice: (v: string) => void;
  minExp: number;
  setMinExp: (v: number) => void;
  setPage: (p: number) => void;
  coords: { lat: number; lon: number } | null;
  locationEnabled: boolean;
  setLocationEnabled: (v: boolean) => void;
  isLoading: boolean;
  categories: string[];
  categoryCountMap: Record<string, number>;
  openSeg: Segment | null;
  setOpenSeg: (s: Segment | null) => void;
  hoverSeg: Segment | null;
  setHoverSeg: (s: Segment | null) => void;
  onSearch: (e: React.FormEvent) => void;
}

export function SearchBar({
  barRef,
  selectedCategories,
  toggleCategory,
  clearCategories,
  radiusKm,
  setRadiusKm,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  minExp,
  setMinExp,
  setPage,
  coords,
  locationEnabled,
  setLocationEnabled,
  isLoading,
  categories,
  categoryCountMap,
  openSeg,
  setOpenSeg,
  hoverSeg,
  setHoverSeg,
  onSearch,
}: SearchBarProps) {
  const { t } = useTranslation();
  const { categoryLabels, expPresets } = useBrowseI18n();

  const catLabel =
    selectedCategories.length === 0
      ? t("browse.allTrades")
      : selectedCategories.map((c) => categoryLabels[c] ?? c).join(", ");
  let locLabel = t("browse.anyDistance");
  if (locationEnabled) locLabel = coords ? t("browse.gpsRadius", { km: radiusKm }) : t("browse.awaitingGps");
  const expLabel = minExp > 0 ? t("browse.expYears", { n: minExp }) : t("browse.anyExp");
  const budgetLabel =
    minPrice || maxPrice
      ? `$${minPrice || "0"}–$${maxPrice || "∞"}/hr`
      : t("browse.anyBudget");

  const hasFilter = {
    category: selectedCategories.length > 0,
    location: locationEnabled,
    experience: minExp > 0,
    budget: !!(minPrice || maxPrice),
  };

  const segBg = (s: Segment) =>
    openSeg === s || hoverSeg === s
      ? "var(--slate-50, #f8fafc)"
      : "transparent";

  const segProps = (s: Segment) => ({
    onClick: () => setOpenSeg(openSeg === s ? null : s),
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

  const divider = (
    <div
      style={{
        width: 1,
        background: "var(--border)",
        margin: "14px 0",
        flexShrink: 0,
      }}
    />
  );

  return (
    <form
      ref={barRef}
      onSubmit={onSearch}
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
          <SegLabel name={t("searchBar.category")} dot={hasFilter.category} />
          <SegVal
            text={catLabel}
            placeholder={!hasFilter.category}
            badge={
              selectedCategories.length > 0
                ? selectedCategories.length
                : undefined
            }
          />
        </div>

        {openSeg === "category" && (
          <div style={{ ...DROPDOWN, minWidth: 268 }}>
            <div
              style={{
                padding: "10px 16px 10px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--text-muted)",
                }}
              >
                {t("searchBar.selectTrades")}
              </span>
              {selectedCategories.length > 0 && (
                <button
                  type="button"
                  onClick={clearCategories}
                  style={{
                    fontSize: 12,
                    color: "var(--navy-700, #1e3a8a)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    fontWeight: 500,
                    fontFamily: "inherit",
                  }}
                >
                  {t("searchBar.clearAll")}
                </button>
              )}
            </div>
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {categories.map((key) => {
              const meta = CATEGORY_META[key] ?? { label: key, Icon: null };
              const { Icon } = meta;
              const label = categoryLabels[key] ?? meta.label;
              const active = selectedCategories.includes(key);
              return (
                <div
                  key={key}
                  onClick={() => toggleCategory(key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 16px",
                    cursor: "pointer",
                    background: active
                      ? "var(--slate-50, #f8fafc)"
                      : "transparent",
                    transition: "background 0.1s",
                  }}
                >
                  <div
                    style={{
                      width: 17,
                      height: 17,
                      borderRadius: 4,
                      border: `1.5px solid ${active ? "var(--navy-700, #1e3a8a)" : "var(--border)"}`,
                      background: active
                        ? "var(--navy-900, #0b1e3f)"
                        : "transparent",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                      transition: "all 0.1s",
                    }}
                  >
                    {active && (
                      <span
                        style={{
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 900,
                          lineHeight: 1,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  {Icon && <Icon size={13} />}
                  <span
                    style={{ flex: 1, fontSize: 13.5, color: "var(--text)" }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--text-muted)",
                    }}
                  >
                    {categoryCountMap[key] ?? 0}
                  </span>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>

      {divider}

      {/* ── Location ── */}
      <div style={{ position: "relative", flex: "1 1 0", minWidth: 0 }}>
        <div {...segProps("location")}>
          <SegLabel name={t("searchBar.location")} dot={hasFilter.location} />
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <IconPin size={12} />
            <SegVal text={locLabel} placeholder={!coords} />
          </div>
        </div>

        {openSeg === "location" && (
          <div style={{ ...DROPDOWN, minWidth: 288, padding: 18 }}>
            {/* Toggle row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{t("searchBar.distanceFilter")}</span>
              <button
                type="button"
                onClick={() => { setLocationEnabled(!locationEnabled); setPage(1); }}
                style={{
                  width: 38, height: 21, borderRadius: 11, border: "none", padding: 0,
                  background: locationEnabled ? "var(--navy-700, #1e3a8a)" : "var(--slate-300, #cbd5e1)",
                  cursor: "pointer", position: "relative", flexShrink: 0,
                  transition: "background 0.2s",
                }}
              >
                <span style={{
                  position: "absolute", top: 3,
                  left: locationEnabled ? 19 : 3,
                  width: 15, height: 15, borderRadius: "50%", background: "#fff",
                  transition: "left 0.2s",
                }} />
              </button>
            </div>

            {locationEnabled && coords && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "block", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{t("searchBar.gpsDetected")}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginLeft: "auto" }}>
                    {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
                  </span>
                </div>
                <div style={{ ...FILTER_HEAD, marginBottom: 8 }}>{t("searchBar.searchRadius")}</div>
                <input
                  type="range" min={5} max={100} value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  onMouseUp={() => setPage(1)}
                  style={{ width: "100%", accentColor: "var(--navy-700, #1e3a8a)" }}
                />
                <div style={RANGE_ROW}>
                  <span>5 km</span>
                  <span style={{ color: "var(--text)", fontWeight: 600 }}>{radiusKm} km</span>
                  <span>100 km</span>
                </div>
              </>
            )}

            {locationEnabled && !coords && (
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55 }}>
                {t("searchBar.waitingForGps")}
              </p>
            )}

            {!locationEnabled && (
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55 }}>
                {t("searchBar.enableLocation")}
              </p>
            )}
          </div>
        )}
      </div>

      {divider}

      {/* ── Experience ── */}
      <div style={{ position: "relative", flex: "1 1 0", minWidth: 0 }}>
        <div {...segProps("experience")}>
          <SegLabel name={t("searchBar.experience")} dot={hasFilter.experience} />
          <SegVal text={expLabel} placeholder={!hasFilter.experience} />
        </div>

        {openSeg === "experience" && (
          <div style={{ ...DROPDOWN, minWidth: 264, padding: 18 }}>
            <div style={{ ...FILTER_HEAD, marginBottom: 12 }}>
              {t("searchBar.minExperience")}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 18,
              }}
            >
              {expPresets.map(({ label, value }) => (
                <BrowsePill
                  key={value}
                  active={minExp === value}
                  onClick={() => {
                    setMinExp(value);
                    setPage(1);
                    setOpenSeg(null);
                  }}
                >
                  {label}
                </BrowsePill>
              ))}
            </div>
            <div style={{ ...FILTER_HEAD, marginBottom: 8 }}>{t("searchBar.custom")}</div>
            <input
              type="range"
              min={0}
              max={20}
              value={minExp}
              onChange={(e) => setMinExp(Number(e.target.value))}
              onMouseUp={() => setPage(1)}
              style={{
                width: "100%",
                accentColor: "var(--navy-700, #1e3a8a)",
              }}
            />
            <div style={RANGE_ROW}>
              <span>0 {t("profile.yr")}</span>
              <span style={{ color: "var(--text)", fontWeight: 600 }}>
                {minExp > 0 ? `${minExp}+ ${t("profile.yr")}` : t("searchBar.anyExp")}
              </span>
              <span>20 {t("profile.yr")}</span>
            </div>
          </div>
        )}
      </div>

      {divider}

      {/* ── Budget ── */}
      <div style={{ position: "relative", flex: "1 1 0", minWidth: 0 }}>
        <div {...segProps("budget")}>
          <SegLabel name={t("searchBar.budget")} dot={hasFilter.budget} />
          <SegVal text={budgetLabel} placeholder={!hasFilter.budget} />
        </div>

        {openSeg === "budget" && (
          <div
            style={{
              ...DROPDOWN,
              minWidth: 288,
              padding: 18,
              right: 6,
              left: "auto",
            }}
          >
            <div style={{ ...FILTER_HEAD, marginBottom: 12 }}>
              {t("searchBar.budgetPerHour")}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 18,
              }}
            >
              {BUDGET_PRESETS.map((p) => {
                const active = minPrice === p.min && maxPrice === p.max;
                return (
                  <BrowsePill
                    key={p.label}
                    active={active}
                    onClick={() => {
                      setMinPrice(p.min);
                      setMaxPrice(p.max);
                      setPage(1);
                      setOpenSeg(null);
                    }}
                  >
                    {p.label}
                  </BrowsePill>
                );
              })}
            </div>
            <div style={{ ...FILTER_HEAD, marginBottom: 10 }}>{t("searchBar.customRange")}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {(["min", "max"] as const).map((side) => (
                <input
                  key={side}
                  type="number"
                  min={0}
                  placeholder={side === "min" ? t("searchBar.minPlaceholder") : t("searchBar.maxPlaceholder")}
                  value={side === "min" ? minPrice : maxPrice}
                  onChange={(e) =>
                    side === "min"
                      ? setMinPrice(e.target.value)
                      : setMaxPrice(e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 13,
                    background: "transparent",
                    color: "var(--text)",
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Search button ── */}
      <div style={{ padding: 6, display: "flex", alignItems: "center" }}>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: "10px 20px", gap: 8, whiteSpace: "nowrap" }}
          disabled={isLoading}
        >
          <IconSearch size={16} />
          <span style={{ fontSize: 13.5 }}>{t("searchBar.search")}</span>
        </button>
      </div>
    </form>
  );
}
