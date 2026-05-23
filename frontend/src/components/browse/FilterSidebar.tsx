import { BrowsePill } from "./BrowsePill";
import {
  CATEGORY_META,
  EXP_PRESETS,
  BUDGET_PRESETS,
  FILTER_HEAD,
  RANGE_ROW,
} from "./browseConstants";

interface FilterSidebarProps {
  categories: string[];
  selectedCategories: string[];
  toggleCategory: (key: string) => void;
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
  categoryCountMap: Record<string, number>;
  onReset: () => void;
}

export function FilterSidebar({
  categories,
  selectedCategories,
  toggleCategory,
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
  categoryCountMap,
  onReset,
}: FilterSidebarProps) {
  return (
    <aside>
      <div
        style={{
          marginBottom: 18,
          paddingBottom: 14,
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
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Refine
        </span>
        <button
          type="button"
          onClick={onReset}
          style={{
            background: "none",
            border: "none",
            fontSize: 12,
            color: "var(--navy-700, #1e3a8a)",
            cursor: "pointer",
            fontWeight: 500,
            padding: 0,
            fontFamily: "inherit",
          }}
        >
          Reset all
        </button>
      </div>

      {/* Trade */}
      <div style={{ marginBottom: 26 }}>
        <h4 style={FILTER_HEAD}>Trade</h4>
        <div style={{ maxHeight: 200, overflowY: "auto" }}>
        {categories.map((key) => {
          const meta = CATEGORY_META[key] ?? { label: key, Icon: null };
          const { label, Icon } = meta;
          return (
            <label
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "5px 0",
                fontSize: 13.5,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(key)}
                onChange={() => toggleCategory(key)}
                style={{
                  accentColor: "var(--navy-700, #1e3a8a)",
                  width: 14,
                  height: 14,
                  flexShrink: 0,
                }}
              />
              {Icon && <Icon size={12} />}
              <span style={{ flex: 1, color: "var(--text)" }}>{label}</span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-muted)",
                }}
              >
                {categoryCountMap[key] ?? 0}
              </span>
            </label>
          );
        })}
        </div>
      </div>

      {/* Distance */}
      {coords && (
        <div style={{ marginBottom: 26 }}>
          <h4 style={FILTER_HEAD}>Distance</h4>
          <input
            type="range"
            min={5}
            max={100}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            onMouseUp={() => setPage(1)}
            style={{ width: "100%", accentColor: "var(--navy-700, #1e3a8a)" }}
          />
          <div style={RANGE_ROW}>
            <span>5 km</span>
            <span style={{ color: "var(--text)", fontWeight: 600 }}>
              {radiusKm} km
            </span>
            <span>100 km</span>
          </div>
        </div>
      )}

      {/* Experience */}
      <div style={{ marginBottom: 26 }}>
        <h4 style={FILTER_HEAD}>Min experience</h4>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 5,
            marginBottom: 10,
          }}
        >
          {EXP_PRESETS.map(({ label, value }) => (
            <BrowsePill
              key={value}
              active={minExp === value}
              onClick={() => {
                setMinExp(value);
                setPage(1);
              }}
            >
              {label}
            </BrowsePill>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div style={{ marginBottom: 26 }}>
        <h4 style={FILTER_HEAD}>Budget /hr</h4>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 5,
            marginBottom: 10,
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
                }}
              >
                {p.label}
              </BrowsePill>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
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
                padding: "7px 9px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                fontSize: 12.5,
                background: "var(--card, #fff)",
                color: "var(--text)",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
