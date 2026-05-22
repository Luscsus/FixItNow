import { IconSearch, IconPin, IconChevron } from "./BrowseIcons";
import { BrowsePill } from "./BrowsePill";
import {
  type Segment,
  ALL_CATEGORIES,
  CATEGORY_LABEL,
  EXP_PRESETS,
  BUDGET_PRESETS,
  DROPDOWN,
  FILTER_HEAD,
  RANGE_ROW,
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
  isLoading: boolean;
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
  isLoading,
  categoryCountMap,
  openSeg,
  setOpenSeg,
  hoverSeg,
  setHoverSeg,
  onSearch,
}: SearchBarProps) {
  const catLabel =
    selectedCategories.length === 0
      ? "All trades"
      : selectedCategories.map((c) => CATEGORY_LABEL[c] ?? c).join(", ");
  const locLabel = coords ? `GPS · ${radiusKm} km radius` : "No location";
  const expLabel = minExp > 0 ? `${minExp}+ years` : "Any";
  const budgetLabel =
    minPrice || maxPrice
      ? `$${minPrice || "0"}–$${maxPrice || "∞"}/hr`
      : "Any budget";

  const hasFilter = {
    category: selectedCategories.length > 0,
    location: !!coords,
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
          <SegLabel name="Category" dot={hasFilter.category} />
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
          <div style={{ ...DROPDOWN, minWidth: 268, padding: "4px 0" }}>
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
                Select trades
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
                  Clear all
                </button>
              )}
            </div>
            {ALL_CATEGORIES.map(({ key, label, Icon }) => {
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
                  <Icon size={13} />
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
        )}
      </div>

      {divider}

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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#10b981",
                      display: "block",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>
                    GPS location detected
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                    marginBottom: 18,
                  }}
                >
                  {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
                </div>
                <div style={{ ...FILTER_HEAD, marginBottom: 8 }}>
                  Search radius
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  onMouseUp={() => setPage(1)}
                  style={{
                    width: "100%",
                    accentColor: "var(--navy-700, #1e3a8a)",
                  }}
                />
                <div style={RANGE_ROW}>
                  <span>5 km</span>
                  <span style={{ color: "var(--text)", fontWeight: 600 }}>
                    {radiusKm} km
                  </span>
                  <span>100 km</span>
                </div>
              </>
            ) : (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontSize: 16 }}>📍</span>
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>
                    No location detected
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "var(--text-muted)",
                    lineHeight: 1.55,
                  }}
                >
                  Showing all providers regardless of distance. Enable GPS in
                  your browser for distance-based filtering and sorting.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {divider}

      {/* ── Experience ── */}
      <div style={{ position: "relative", flex: "1 1 0", minWidth: 0 }}>
        <div {...segProps("experience")}>
          <SegLabel name="Experience" dot={hasFilter.experience} />
          <SegVal text={expLabel} placeholder={!hasFilter.experience} />
        </div>

        {openSeg === "experience" && (
          <div style={{ ...DROPDOWN, minWidth: 264, padding: 18 }}>
            <div style={{ ...FILTER_HEAD, marginBottom: 12 }}>
              Minimum experience
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 18,
              }}
            >
              {EXP_PRESETS.map(({ label, value }) => (
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
            <div style={{ ...FILTER_HEAD, marginBottom: 8 }}>Custom</div>
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
              <span>0 yr</span>
              <span style={{ color: "var(--text)", fontWeight: 600 }}>
                {minExp > 0 ? `${minExp}+ yr` : "Any"}
              </span>
              <span>20 yr</span>
            </div>
          </div>
        )}
      </div>

      {divider}

      {/* ── Budget ── */}
      <div style={{ position: "relative", flex: "1 1 0", minWidth: 0 }}>
        <div {...segProps("budget")}>
          <SegLabel name="Budget" dot={hasFilter.budget} />
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
              Budget per hour
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
            <div style={{ ...FILTER_HEAD, marginBottom: 10 }}>Custom range</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {(["Min $", "Max $"] as const).map((ph, i) => (
                <input
                  key={ph}
                  type="number"
                  min={0}
                  placeholder={ph}
                  value={i === 0 ? minPrice : maxPrice}
                  onChange={(e) =>
                    i === 0
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
          <span style={{ fontSize: 13.5 }}>Search</span>
        </button>
      </div>
    </form>
  );
}
