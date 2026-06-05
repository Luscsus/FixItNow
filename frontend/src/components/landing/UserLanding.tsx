import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAllProvidersQuery } from "@/hooks/useAllProvidersQuery";
import { usePublicOpenTicketsQuery } from "@/hooks/usePublicOpenTicketsQuery";
import { useActiveCategoriesQuery } from "@/hooks/useActiveCategoriesQuery";
import { usePublicStatsQuery } from "@/hooks/usePublicStatsQuery";
import { useRecentActivityQuery } from "@/hooks/useRecentActivityQuery";
import { initialsOf, avatarStyleFor, timeAgo } from "@/lib/activityFormat";
import { CATEGORY_META } from "@/components/browse/browseConstants";
import { IconHammer, IconSparkles } from "@/components/browse/BrowseIcons";
import { classifyCategory } from "@/lib/classifyCategory";

function IconArrow({ size = 14 }: { readonly size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}
function IconDrop({ size = 20 }: { readonly size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6 8 4 12 4 15a8 8 0 0016 0c0-3-2-7-8-13z" />
    </svg>
  );
}
function IconBolt({ size = 20 }: { readonly size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L4.09 12.26A2 2 0 005.62 15.5h4.72L9 22l9.53-10.26A2 2 0 0016.9 8.5h-4.72L13 2z" />
    </svg>
  );
}
function IconSpark({ size = 20 }: { readonly size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
function IconPin({ size = 14 }: { readonly size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}
function IconChevron({ size = 14, open = false }: { readonly size?: number; readonly open?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
      <path d="M3 6l5 5 5-5" />
    </svg>
  );
}

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

export function UserLanding() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [radiusKm, setRadiusKm] = useState(25);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  const [problemText, setProblemText] = useState("");
  const [classifying, setClassifying] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [smartMatchActive, setSmartMatchActive] = useState(true);

  const { data: allProviders = [] } = useAllProvidersQuery();
  const { data: publicTickets = [] } = usePublicOpenTicketsQuery();
  const { data: activeCategories = [] } = useActiveCategoriesQuery();
  const { data: stats } = usePublicStatsQuery();
  const { data: activity = [], isLoading: activityLoading, isError: activityError } = useRecentActivityQuery();

  function activityAction(status: string, categoryLabel: string): string {
    switch (status) {
      case "COMPLETED": return t("userLanding.activityCompleted", { category: categoryLabel });
      case "IN_TRANSIT": return t("userLanding.activityInTransit", { category: categoryLabel });
      case "APPROVED": return t("userLanding.activityApproved", { category: categoryLabel });
      default: return t("userLanding.activityUpdated", { category: categoryLabel });
    }
  }

  const categoryCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    allProviders.forEach((p) => p.categories.forEach((cat) => { map[cat] = (map[cat] ?? 0) + 1; }));
    return map;
  }, [allProviders]);

  const topCategories = useMemo(() =>
    [...activeCategories]
      .sort((a, b) => (categoryCountMap[b] ?? 0) - (categoryCountMap[a] ?? 0))
      .slice(0, 10),
  [activeCategories, categoryCountMap]);

  const requestLocation = () => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},
    );
  };

  const toggleCategory = (key: string) => {
    setSmartMatchActive(false);
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key],
    );
  };

  const handleSmartMatch = () => {
    setSmartMatchActive((v) => !v);
  };

  const handleSearch = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    let cats = selectedCategories;

    if (smartMatchActive && problemText.trim()) {
      setClassifying(true);
      try {
        const category = await classifyCategory(problemText.trim(), activeCategories);
        cats = [category];
      } catch {
        // fall through with current selection
      } finally {
        setClassifying(false);
      }
    }

    const params = new URLSearchParams();
    cats.forEach((cat) => params.append("categories", cat));
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    params.set("radiusKm", String(radiusKm));
    navigate(`/browse?${params}`);
  };

  return (
    <div style={{ background: "var(--bg-canvas)" }}>

      {/* ── HERO ── */}
      <section className="hero-wrap" style={{ padding: "10px 0 64px", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: -120, right: -100,
          width: 620, height: 620, pointerEvents: "none",
          background: "radial-gradient(circle at 50% 50%, rgba(245,158,11,0.16), transparent 55%)",
          borderRadius: "50%",
        }} />

        <div className="container">
          <div className="hero-grid">

            {/* LEFT column */}
            <div>
              <div className="hero-tag">
                <span className="dot-stack">
                  <span>MC</span>
                  <span>PS</span>
                  <span>SO</span>
                </span>
                <span><b>{allProviders.length > 0 ? allProviders.length.toLocaleString() : "…"} {t("userLanding.providersReady", { count: "" }).replace("{{count}} ", "")}</b></span>
              </div>

              <h1 className="display-mega">
                {t("userLanding.heroBroken")}<br />
                <span className="word-squiggle">{t("userLanding.heroBrokenWord")}</span><br />
                {t("userLanding.heroLetsFixIt")} <span className="word-underline">{t("userLanding.heroFixIt")}</span>
              </h1>

              <p className="hero-lede" style={{ fontSize: 16, lineHeight: 1.5, color: "var(--text-muted)", maxWidth: 480, margin: "16px 0 0" }}>
                {t("userLanding.heroLede")}
              </p>

              {/* Problem box */}
              <form className="problem-box" onSubmit={handleSearch}>
                <div className="problem-label">{t("userLanding.whatNeedsFixing")}</div>
                <textarea
                  className="problem-textarea"
                  placeholder={t("userLanding.problemPlaceholder")}
                  rows={2}
                  value={problemText}
                  onChange={(e) => setProblemText(e.target.value)}
                />

                <div className="problem-meta" style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "6px 12px" }}
                    onClick={() => setFiltersOpen((v) => !v)}
                  >
                    {t("userLanding.filters")} <IconChevron size={13} open={filtersOpen} />
                  </button>

                  <button
                    type="button"
                    className="btn"
                    style={{
                      display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "6px 12px",
                      fontWeight: 600,
                      transition: "background 0.2s, color 0.2s, border-color 0.2s",
                      ...(smartMatchActive
                        ? { background: "var(--amber-500)", color: "var(--navy-900)", border: "1.5px solid var(--amber-600)" }
                        : { background: "#fff", color: "var(--text)", border: "1px solid var(--slate-300)" }
                      ),
                    }}
                    onClick={handleSmartMatch}
                  >
                    <IconSpark size={14} /> {t("userLanding.smartMatch")}
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary problem-submit"
                    style={{ marginLeft: "auto" }}
                    disabled={classifying}
                  >
                    {classifying ? t("userLanding.matching") : <><span>{t("userLanding.findSomeone")}</span> <IconArrow size={16} /></>}
                  </button>
                </div>

                {/* Collapsible filters panel */}
                <div style={{
                  overflow: "hidden",
                  maxHeight: filtersOpen ? 500 : 0,
                  opacity: filtersOpen ? 1 : 0,
                  transition: "max-height 0.3s ease, opacity 0.2s ease",
                }}>
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, marginTop: 10 }}>
                    <div className="problem-row">
                      {topCategories.map((key) => {
                        const meta = CATEGORY_META[key];
                        const label = t(`categories.${key}`, { defaultValue: meta?.label ?? key });
                        const Icon = meta?.Icon;
                        const active = selectedCategories.includes(key);
                        return (
                          <span
                            key={key}
                            role="button"
                            className="problem-chip"
                            aria-pressed={active}
                            onClick={() => toggleCategory(key)}
                            style={{
                              cursor: "pointer", userSelect: "none",
                              background: active ? "var(--navy-900)" : undefined,
                              color: active ? "#fff" : undefined,
                              borderColor: active ? "var(--navy-900)" : undefined,
                              transition: "background 0.15s, color 0.15s",
                            }}
                          >
                            {Icon && <Icon size={15} />} {label}
                            {categoryCountMap[key] != null && (
                              <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 2 }}>({categoryCountMap[key]})</span>
                            )}
                          </span>
                        );
                      })}
                    </div>

                    <div className="problem-meta" style={{ marginTop: 12 }}>
                      <span className="problem-mini">
                        <IconPin size={14} />
                        {coords ? (
                          <b>{t("userLanding.gpsLocation")}</b>
                        ) : (
                          <button
                            type="button"
                            onClick={requestLocation}
                            style={{
                              background: "none", border: "none", padding: 0,
                              font: "inherit", fontSize: "inherit",
                              color: "var(--navy-600, #1e40af)", cursor: "pointer",
                              textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 2,
                            }}
                          >
                            {t("userLanding.useMyLocation")}
                          </button>
                        )}
                      </span>

                      <span className="problem-mini" style={{ gap: 5 }}>
                        <span>{t("userLanding.within")}</span>
                        <select
                          value={radiusKm}
                          onChange={(e) => { setSmartMatchActive(false); setRadiusKm(Number(e.target.value)); }}
                          style={{
                            border: "none", background: "transparent", fontFamily: "inherit",
                            fontSize: "inherit", fontWeight: 700, color: "inherit", cursor: "pointer", padding: 0, outline: "none",
                          }}
                        >
                          {RADIUS_OPTIONS.map((r) => (
                            <option key={r} value={r}>{r} km</option>
                          ))}
                        </select>
                      </span>

                      <span className="problem-mini" style={{ gap: 4 }}>
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>€</span>
                        <input
                          type="number" min={0} placeholder="min" value={minPrice}
                          onChange={(e) => { setSmartMatchActive(false); setMinPrice(e.target.value); }}
                          style={{ width: 52, border: "none", borderBottom: "1.5px solid var(--border)", background: "transparent", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "inherit", outline: "none", padding: "0 2px", textAlign: "center" }}
                        />
                        <span style={{ color: "var(--text-muted)" }}>–</span>
                        <input
                          type="number" min={0} placeholder="max" value={maxPrice}
                          onChange={(e) => { setSmartMatchActive(false); setMaxPrice(e.target.value); }}
                          style={{ width: 52, border: "none", borderBottom: "1.5px solid var(--border)", background: "transparent", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "inherit", outline: "none", padding: "0 2px", textAlign: "center" }}
                        />
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>/hr</span>
                      </span>
                    </div>
                  </div>
                </div>
              </form>

              <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "14px 0 0", maxWidth: 660 }}>
                {t("userLanding.noAccountNeeded")}{" "}
                <Link
                  to="/register"
                  style={{ color: "var(--navy-700)", fontWeight: 600, textDecoration: "underline", textDecorationColor: "var(--amber-500)", textDecorationThickness: 2, textUnderlineOffset: 3, marginLeft: 6 }}
                >
                  {t("userLanding.createAccount")}
                </Link>{" "}
                {t("userLanding.toTrackTickets")}
              </p>
            </div>

            {/* RIGHT column — live activity feed (real, platform-wide) */}
            <aside className="live-card">
              <div className="live-card-grid" />
              <span className="live-pulse">{t("userLanding.liveLabel")}</span>
              <h3 style={{ position: "relative", zIndex: 1, fontSize: 22, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.015em", margin: "14px 0 20px", color: "#fff" }}>
                {t("userLanding.fixedTodayHeadline")}
              </h3>

              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 16, minHeight: 220 }}>
                {activityLoading ? (
                  [0, 1, 2, 3].map((i) => (
                    <div key={i} className="live-feed-item" style={{ opacity: 0.5 }}>
                      <div className="avatar" style={{ background: "rgba(255,255,255,0.12)" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 9, width: "30%", borderRadius: 4, background: "rgba(255,255,255,0.12)" }} />
                        <div style={{ height: 12, width: "75%", borderRadius: 4, background: "rgba(255,255,255,0.12)", marginTop: 7 }} />
                      </div>
                    </div>
                  ))
                ) : activityError ? (
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13.5, padding: "12px 0" }}>
                    {t("userLanding.activityError")}
                  </div>
                ) : activity.length === 0 ? (
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13.5, padding: "12px 0", lineHeight: 1.5 }}>
                    {t("userLanding.activityEmpty")}
                  </div>
                ) : (
                  activity.slice(0, 4).map((item, idx) => {
                    const av = avatarStyleFor(item.actorName);
                    const catLabel = t(`categories.${item.category}`, { defaultValue: item.serviceType });
                    const meta = [item.city, item.amount != null ? `€${item.amount.toLocaleString()}` : null]
                      .filter(Boolean).join(" · ");
                    return (
                      <div key={`${item.changedAt}-${idx}`} className="live-feed-item">
                        <div className="avatar" style={{ background: av.bg, color: av.color }}>{initialsOf(item.actorName)}</div>
                        <div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "rgba(255,255,255,0.55)", letterSpacing: "0.06em" }}>
                            {timeAgo(item.changedAt, i18n.language)}
                          </div>
                          <div style={{ color: "#fff", fontSize: 13.5, lineHeight: 1.4, marginTop: 3 }}>
                            <b>{item.actorName}</b> {activityAction(item.status, catLabel)}
                          </div>
                          {meta && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>{meta}</div>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Real platform totals */}
              <div style={{ position: "relative", zIndex: 1, marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.1)", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {([
                  { key: "today", label: t("userLanding.metricFixedToday"), value: stats?.completedTicketsToday, accent: "var(--amber-500)" },
                  { key: "providers", label: t("userLanding.metricActiveProviders"), value: stats?.activeProvidersCount, accent: "#fff" },
                  { key: "allTime", label: t("userLanding.metricTotalCompleted"), value: stats?.completedTicketsAllTime, accent: "#fff" },
                ] as const).map((m) => (
                  <div key={m.key}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: m.accent, letterSpacing: "-0.02em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                      {m.value == null ? "—" : m.value.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", marginTop: 6, lineHeight: 1.3, fontFamily: "var(--font-mono)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="marquee-wrap" aria-hidden="true">
        <div className="marquee">
          {[...publicTickets, ...publicTickets].map((item, i) => (
            <span key={i} className="marquee-item">
              <span className="mono">{item.category}</span>
              {item.serviceType}
              <span className="mdot" />
            </span>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <section className="container" id="categories" style={{ paddingTop: 72, paddingBottom: 56 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 32 }}>
          <div>
            <span className="eyebrow">{t("userLanding.categoriesEyebrow")}</span>
            <h2 className="display-2" style={{ marginTop: 14 }}>
              {t("userLanding.categoriesHeadline")} <span className="amber-underline">{t("userLanding.categoriesHeadlineBroken")}</span><br />
              {t("userLanding.categoriesHeadlineSub")}
            </h2>
          </div>
          <Link to="/browse" className="btn btn-secondary">
            {t("userLanding.seeAllTrades")} <IconArrow size={15} />
          </Link>
        </div>

        <div className="cat-grid">
          <Link className="cat cat-feature" to="/browse?categories=PLUMBING">
            <span className="cat-arrow"><IconArrow size={14} /></span>
            <div className="cat-icon"><IconDrop size={22} /></div>
            <div style={{ marginTop: "auto" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--amber-500)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
                {t("userLanding.mostBooked")}
              </div>
              <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.05, marginTop: 14, color: "#fff" }}>
                {t("categories.PLUMBING", "Plumbing")}
              </div>
              <div className="cat-count" style={{ color: "rgba(255,255,255,0.5)" }}>
                {categoryCountMap["PLUMBING"] ?? "…"} {t("userLanding.providersCount", { count: "" }).replace("{{count}} ", "")}
              </div>
            </div>
          </Link>

          <Link className="cat cat-elect" to="/browse?categories=ELECTRICAL">
            <span className="cat-arrow"><IconArrow size={14} /></span>
            <div className="cat-icon" style={{ background: "rgba(245,158,11,0.18)", color: "var(--amber-700)" }}><IconBolt size={22} /></div>
            <div className="cat-name">{t("categories.ELECTRICAL", "Electrical")}</div>
            <div className="cat-count">{categoryCountMap["ELECTRICAL"] ?? "…"} {t("userLanding.providersCount", { count: "" }).replace("{{count}} ", "")}</div>
          </Link>

          <Link className="cat cat-hvac" to="/browse?categories=HVAC">
            <span className="cat-arrow"><IconArrow size={14} /></span>
            <div className="cat-icon" style={{ background: "rgba(30,58,138,0.12)", color: "var(--navy-700)" }}><IconSpark size={22} /></div>
            <div className="cat-name">{t("categories.HVAC", "HVAC")}</div>
            <div className="cat-count">{categoryCountMap["HVAC"] ?? "…"} {t("userLanding.providersCount", { count: "" }).replace("{{count}} ", "")}</div>
          </Link>

          <Link className="cat cat-hard" to="/browse?categories=CARPENTRY">
            <span className="cat-arrow"><IconArrow size={14} /></span>
            <div className="cat-icon"><IconHammer size={22} /></div>
            <div className="cat-name">{t("categories.CARPENTRY", "Carpentry")}</div>
            <div className="cat-count">{categoryCountMap["CARPENTRY"] ?? "…"} {t("userLanding.providersCount", { count: "" }).replace("{{count}} ", "")}</div>
          </Link>

          <Link className="cat cat-soft" to="/browse?categories=CLEANING">
            <span className="cat-arrow"><IconArrow size={14} /></span>
            <div className="cat-icon" style={{ background: "rgba(5,150,105,0.18)", color: "var(--emerald-700)" }}><IconSparkles size={22} /></div>
            <div className="cat-name">{t("categories.CLEANING", "Cleaning")}</div>
            <div className="cat-count">{categoryCountMap["CLEANING"] ?? "…"} {t("userLanding.providersCount", { count: "" }).replace("{{count}} ", "")}</div>
          </Link>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="container" id="how" style={{ paddingTop: 88, paddingBottom: 56 }}>
        <div style={{ maxWidth: 620 }}>
          <span className="eyebrow">{t("userLanding.howItWorksEyebrow")}</span>
          <h2 className="display-2" style={{ marginTop: 14, maxWidth: 700 }}>
            {t("userLanding.howItWorksHeadline")} <span className="amber-underline">{t("userLanding.howItWorksHighlight")}</span>
          </h2>
          <p style={{ marginTop: 18, color: "var(--text-muted)", fontSize: 17, lineHeight: 1.55 }}>
            {t("userLanding.howItWorksSub")}
          </p>
        </div>

        <div className="steps">
          <div className="step">
            <span className="step-num">{t("userLanding.step01num")}</span>
            <h3>{t("userLanding.step01title")}</h3>
            <p>{t("userLanding.step01body")}</p>
            <div className="step-meta">{t("userLanding.step01meta", { time: "38 seconds" })}</div>
          </div>

          <div className="step" style={{ borderTopColor: "var(--accent-deep)" }}>
            <span className="step-num">{t("userLanding.step02num")}</span>
            <h3>{t("userLanding.step02title")}</h3>
            <p>{t("userLanding.step02body")}</p>
            <div className="step-meta">
              {t("userLanding.step02meta", { time: stats?.medianResponseMinutes != null ? `${stats.medianResponseMinutes} min` : "—" })}
            </div>
          </div>

          <div className="step" style={{ borderTopColor: "var(--emerald-600)" }}>
            <span className="step-num">{t("userLanding.step03num")}</span>
            <h3>{t("userLanding.step03title")}</h3>
            <p>{t("userLanding.step03body")}</p>
            <div className="step-meta">
              {t("userLanding.step03meta", { rate: stats?.sameDayFixRate != null ? `${Math.round(stats.sameDayFixRate * 100)}%` : "—" })}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROOF BAND ── */}
      <section style={{ background: "var(--navy-900)", color: "#fff", padding: "64px 0", overflow: "hidden", position: "relative", marginTop: 96 }}>
        <div className="proof-grid-bg" />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="proof-band-inner" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 80, alignItems: "center" }}>
            <div>
              <span className="live-pulse" style={{ marginBottom: 14 }}>{t("userLanding.last30days")}</span>
              <div className="proof-num" style={{ marginTop: 14 }}>
                <span className="amber">
                  {stats ? stats.completedTicketsLast30Days.toLocaleString() : "…"}
                </span>{" "}
                {t("userLanding.ticketsFixed")}<br />
                <span style={{ fontSize: "0.65em", color: "rgba(255,255,255,0.7)" }}>
                  {t("userLanding.zeroPhoneCalls")}
                </span>
              </div>
            </div>
            <div className="proof-cells">
              <div className="proof-cell">
                <div className="lbl">{t("userLanding.medianResponse")}</div>
                <div className="big">
                  {stats?.medianResponseMinutes != null ? stats.medianResponseMinutes : "—"}
                  <span style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", marginLeft: 4 }}>{t("common.min")}</span>
                </div>
                <div className="hint">{t("userLanding.fromFiledToAccepted")}</div>
              </div>
              <div className="proof-cell">
                <div className="lbl">{t("userLanding.averageRating")}</div>
                <div className="big">
                  {stats?.averageRating != null ? stats.averageRating.toFixed(1) : "—"}
                  <span style={{ fontSize: 22, color: "var(--amber-500)", marginLeft: 4 }}>★</span>
                </div>
                <div className="hint">
                  {t("userLanding.acrossReviews", { count: stats?.reviewCount ?? 0 })}
                </div>
              </div>
              <div className="proof-cell">
                <div className="lbl">{t("userLanding.sameDayFix")}</div>
                <div className="big">
                  {stats?.sameDayFixRate != null ? Math.round(stats.sameDayFixRate * 100) : "—"}
                  <span style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", marginLeft: 2 }}>%</span>
                </div>
                <div className="hint">{t("userLanding.reportedResolved24h")}</div>
              </div>
              <div className="proof-cell">
                <div className="lbl">{t("userLanding.citiesServed")}</div>
                <div className="big">{stats ? stats.citiesServedCount : "…"}</div>
                <div className="hint">
                  {stats ? t("userLanding.activeProviders", { count: stats.activeProvidersCount }) : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="cta-band" id="providers">
        <div className="cta-dark-overlay" />
        <div className="container cta-band-inner">
          <div style={{ position: "relative", zIndex: 1 }}>
            <span className="eyebrow" style={{ color: "var(--navy-900)" }}>{t("userLanding.ctaEyebrow")}</span>
            <h2 style={{ marginTop: 18 }}>
              {t("userLanding.ctaHeadline")}<br />
              {t("userLanding.ctaSubheadline")}
            </h2>
            <p>{t("userLanding.ctaBody")}</p>
          </div>
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            <Link to="/register" className="btn btn-lg btn-light btn-full">
              {t("userLanding.signUpNeedFix")} <IconArrow size={16} />
            </Link>
            <Link to="/register" className="btn btn-lg btn-ghost-on-dark btn-full">
              {t("userLanding.joinAsProvider")}
            </Link>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "rgba(11,30,63,0.6)", margin: "6px 0 0", letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center" }}>
              {t("userLanding.alreadyUser")}{" "}
              <Link to="/login" style={{ color: "var(--navy-900)", textDecoration: "underline" }}>{t("nav.logIn")}</Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="container" style={{ paddingTop: 56, paddingBottom: 32, borderTop: "1px solid var(--border)" }}>
        <div className="mfoot-grid">
          <div>
            <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", textDecoration: "none", color: "inherit", marginBottom: 14 }}>
              <span className="brand-mark" aria-hidden="true" />
              <span>FixIt<span className="brand-now">Now</span></span>
            </Link>
            <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--text-muted)", margin: "10px 0 0", maxWidth: 320 }}>
              {t("userLanding.footerTagline")}
            </p>
          </div>
          <div>
            <h4>{t("userLanding.footerProduct")}</h4>
            <ul>
              <li><a href="#how">{t("userLanding.footerHowItWorks")}</a></li>
            </ul>
          </div>
          <div>
            <h4>{t("userLanding.footerForProviders")}</h4>
            <ul>
              <li><Link to="/register">{t("userLanding.footerBecomeProvider")}</Link></li>
            </ul>
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-muted)", letterSpacing: "0.05em" }}>
          <span>{t("userLanding.footerCopyright")}</span>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <Link to="/terms" style={{ color: "inherit", textDecoration: "none" }}>{t("legal.termsTitle")}</Link>
            <Link to="/privacy" style={{ color: "inherit", textDecoration: "none" }}>{t("legal.privacyTitle")}</Link>

          </div>
        </div>
      </footer>

    </div>
  );
}
