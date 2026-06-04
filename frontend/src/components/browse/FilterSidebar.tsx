import { useTranslation } from "react-i18next";
import { BrowsePill } from "./BrowsePill";
import {
  CATEGORY_META,
  BUDGET_PRESETS,
  FILTER_HEAD,
  RANGE_ROW,
  useBrowseI18n,
} from "./browseConstants";

interface FilterSidebarProps {
  readonly categories: string[];
  readonly selectedCategories: string[];
  readonly toggleCategory: (key: string) => void;
  readonly radiusKm: number;
  readonly setRadiusKm: (v: number) => void;
  readonly minPrice: string;
  readonly setMinPrice: (v: string) => void;
  readonly maxPrice: string;
  readonly setMaxPrice: (v: string) => void;
  readonly minExp: number;
  readonly setMinExp: (v: number) => void;
  readonly setPage: (p: number) => void;
  readonly coords: { lat: number; lon: number } | null;
  readonly locationEnabled: boolean;
  readonly setLocationEnabled: (v: boolean) => void;
  readonly categoryCountMap: Record<string, number>;
  readonly onReset: () => void;
}

export function FilterSidebar({
  categories, selectedCategories, toggleCategory,
  radiusKm, setRadiusKm,
  minPrice, setMinPrice, maxPrice, setMaxPrice,
  minExp, setMinExp, setPage,
  coords, locationEnabled, setLocationEnabled,
  categoryCountMap, onReset,
}: FilterSidebarProps) {
  const { t } = useTranslation();
  const { categoryLabels, expPresets } = useBrowseI18n();

  return (
    <aside>
      <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {t("filterSidebar.refine")}
        </span>
        <button type="button" onClick={onReset} style={{ background: "none", border: "none", fontSize: 12, color: "var(--navy-700, #1e3a8a)", cursor: "pointer", fontWeight: 500, padding: 0, fontFamily: "inherit" }}>
          {t("filterSidebar.reset")}
        </button>
      </div>

      {/* Trade */}
      <div style={{ marginBottom: 26 }}>
        <h4 style={FILTER_HEAD}>{t("filterSidebar.trade")}</h4>
        <div style={{ maxHeight: 200, overflowY: "auto" }}>
          {categories.map((key) => {
            const meta = CATEGORY_META[key] ?? { label: key, Icon: null };
            const { Icon } = meta;
            const label = categoryLabels[key] ?? meta.label;
            return (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 0", fontSize: 13.5, cursor: "pointer" }}>
                <input type="checkbox" checked={selectedCategories.includes(key)} onChange={() => toggleCategory(key)} style={{ accentColor: "var(--navy-700, #1e3a8a)", width: 14, height: 14, flexShrink: 0 }} />
                {Icon && <Icon size={12} />}
                <span style={{ flex: 1, color: "var(--text)" }}>{label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
                  {categoryCountMap[key] ?? 0}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Distance */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <h4 style={{ ...FILTER_HEAD, margin: 0 }}>{t("filterSidebar.location")}</h4>
          <button type="button" onClick={() => { setLocationEnabled(!locationEnabled); setPage(1); }}
            style={{ width: 34, height: 19, borderRadius: 10, border: "none", padding: 0, background: locationEnabled ? "var(--navy-700, #1e3a8a)" : "var(--slate-300, #cbd5e1)", cursor: "pointer", position: "relative", flexShrink: 0, transition: "background 0.2s" }}
          >
            <span style={{ position: "absolute", top: 2, left: locationEnabled ? 17 : 2, width: 15, height: 15, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
          </button>
        </div>
        {locationEnabled && coords && (
          <>
            <input type="range" min={5} max={100} value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} onMouseUp={() => setPage(1)} style={{ width: "100%", accentColor: "var(--navy-700, #1e3a8a)" }} />
            <div style={RANGE_ROW}>
              <span>5 km</span>
              <span style={{ color: "var(--text)", fontWeight: 600 }}>{radiusKm} km</span>
              <span>100 km</span>
            </div>
          </>
        )}
        {locationEnabled && !coords && (
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
            {t("common.loading")}
          </p>
        )}
        {!locationEnabled && (
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
            {t("filterSidebar.any")}
          </p>
        )}
      </div>

      {/* Experience */}
      <div style={{ marginBottom: 26 }}>
        <h4 style={FILTER_HEAD}>{t("filterSidebar.experience")}</h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
          {expPresets.map(({ label, value }) => (
            <BrowsePill key={value} active={minExp === value} onClick={() => { setMinExp(value); setPage(1); }}>
              {label}
            </BrowsePill>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div style={{ marginBottom: 26 }}>
        <h4 style={FILTER_HEAD}>{t("filterSidebar.budget")}</h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
          {BUDGET_PRESETS.map((p) => {
            const active = minPrice === p.min && maxPrice === p.max;
            return (
              <BrowsePill key={p.label} active={active} onClick={() => { setMinPrice(p.min); setMaxPrice(p.max); setPage(1); }}>
                {p.label}
              </BrowsePill>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {(["Min €", "Max €"] as const).map((ph, i) => (
            <input key={ph} type="number" min={0} placeholder={ph}
              value={i === 0 ? minPrice : maxPrice}
              onChange={(e) => i === 0 ? setMinPrice(e.target.value) : setMaxPrice(e.target.value)}
              style={{ width: "100%", padding: "7px 9px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 12.5, background: "var(--card, #fff)", color: "var(--text)", fontFamily: "inherit", outline: "none" }}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
