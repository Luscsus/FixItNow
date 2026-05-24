import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAllProvidersQuery } from "@/hooks/useAllProvidersQuery";
import { usePublicOpenTicketsQuery } from "@/hooks/usePublicOpenTicketsQuery";

/* ── SVG icon helpers ── */
function IconArrow({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}
function IconDrop({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6 8 4 12 4 15a8 8 0 0016 0c0-3-2-7-8-13z" />
    </svg>
  );
}
function IconBolt({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L4.09 12.26A2 2 0 005.62 15.5h4.72L9 22l9.53-10.26A2 2 0 0016.9 8.5h-4.72L13 2z" />
    </svg>
  );
}
function IconSpark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
function IconWrench({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
function IconCmd({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 3a3 3 0 00-3 3v12a3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3H6a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3 3 3 0 003 3h12a3 3 0 003-3 3 3 0 00-3-3z" />
    </svg>
  );
}
function IconPin({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}
function IconHammer({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 12l-8.5 8.5a2.12 2.12 0 01-3-3L12 9" />
      <path d="M17.64 15L22 10.64" />
      <path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 00-3.94-1.64H9l.92.82A6.18 6.18 0 0112 8.4v1.56l2 2h2.47l2.26 1.91" />
    </svg>
  );
}
function IconKey({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6" />
      <path d="M15.5 7.5l3 3L22 7l-3-3" />
    </svg>
  );
}

/* ── Category definitions ── */
const ALL_CATEGORIES = [
  { key: "PLUMBING",   label: "Plumbing",   Icon: IconDrop },
  { key: "ELECTRICAL", label: "Electrical", Icon: IconBolt },
  { key: "HVAC",       label: "HVAC",       Icon: IconSpark },
  { key: "HARDWARE",   label: "Hardware",   Icon: IconWrench },
  { key: "IT",         label: "IT",         Icon: IconCmd },
  { key: "CARPENTRY",  label: "Carpentry",  Icon: IconHammer },
  { key: "LOCKSMITH",  label: "Locksmith",  Icon: IconKey },
];

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];



export function HomePage() {
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [radiusKm, setRadiusKm] = useState(25);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  const { data: allProviders = [] } = useAllProvidersQuery();
  const { data: publicTickets = [] } = usePublicOpenTicketsQuery();

  const categoryCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    allProviders.forEach((p) => p.categories.forEach((cat) => { map[cat] = (map[cat] ?? 0) + 1; }));
    return map;
  }, [allProviders]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {},
      );
    }
  }, []);

  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key],
    );
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    selectedCategories.forEach((cat) => params.append("categories", cat));
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    params.set("radiusKm", String(radiusKm));
    navigate(`/browse?${params}`);
  };

  return (
    <div style={{ background: "var(--bg-canvas)" }}>

      {/* ── HERO ── */}
      <section className="hero-wrap" style={{ padding: "56px 0 80px", position: "relative", overflow: "hidden" }}>
        {/* Ambient art */}
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
              {/* Provider pill */}
              <div className="hero-tag">
                <span className="dot-stack">
                  <span>MC</span>
                  <span>PS</span>
                  <span>SO</span>
                </span>
                <span><b>{allProviders.length > 0 ? allProviders.length.toLocaleString() : "…"} providers</b> ready to take a look</span>
              </div>

              {/* Display heading */}
              <h1 className="display-mega">
                Something's<br />
                <span className="word-squiggle">broken.</span><br />
                Let's <span className="word-underline">fix&nbsp;it.</span>
              </h1>

              <p className="hero-lede" style={{ fontSize: 19, lineHeight: 1.55, color: "var(--text-muted)", maxWidth: 540, margin: "24px 0 0" }}>
                Describe the problem in a sentence. We'll match you with a vetted, available provider — and you'll watch every fix move from "reported" to "done."
              </p>

              {/* Problem box */}
              <form className="problem-box" onSubmit={handleSearch}>
                <div className="problem-label">What needs fixing?</div>
                <textarea
                  className="problem-textarea"
                  placeholder="e.g. The kitchen sink is leaking under the cabinet — water's pooling and the towels aren't keeping up."
                  rows={2}
                />

                {/* Selectable category chips */}
                <div className="problem-row">
                  {ALL_CATEGORIES.map(({ key, label, Icon }) => {
                    const active = selectedCategories.includes(key);
                    return (
                      <span
                        key={key}
                        role="button"
                        className="problem-chip"
                        aria-pressed={active}
                        onClick={() => toggleCategory(key)}
                        style={{
                          cursor: "pointer",
                          userSelect: "none",
                          background: active ? "var(--navy-900)" : undefined,
                          color: active ? "#fff" : undefined,
                          borderColor: active ? "var(--navy-900)" : undefined,
                          transition: "background 0.15s, color 0.15s",
                        }}
                      >
                        <Icon size={15} /> {label}
                        {categoryCountMap[key] != null && (
                          <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 2 }}>({categoryCountMap[key]})</span>
                        )}
                      </span>
                    );
                  })}
                </div>

                {/* Meta row: location, radius, price range, submit */}
                <div className="problem-meta">
                  <span className="problem-mini">
                    <IconPin size={14} />
                    {coords ? (
                      <b>GPS location</b>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>No location</span>
                    )}
                  </span>

                  <span className="problem-mini" style={{ gap: 5 }}>
                    <span>Within</span>
                    <select
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(Number(e.target.value))}
                      style={{
                        border: "none",
                        background: "transparent",
                        fontFamily: "inherit",
                        fontSize: "inherit",
                        fontWeight: 700,
                        color: "inherit",
                        cursor: "pointer",
                        padding: 0,
                        outline: "none",
                      }}
                    >
                      {RADIUS_OPTIONS.map((r) => (
                        <option key={r} value={r}>{r} km</option>
                      ))}
                    </select>
                  </span>

                  <span className="problem-mini" style={{ gap: 4 }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>$</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      style={{
                        width: 52,
                        border: "none",
                        borderBottom: "1.5px solid var(--border)",
                        background: "transparent",
                        fontFamily: "inherit",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "inherit",
                        outline: "none",
                        padding: "0 2px",
                        textAlign: "center",
                      }}
                    />
                    <span style={{ color: "var(--text-muted)" }}>–</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      style={{
                        width: 52,
                        border: "none",
                        borderBottom: "1.5px solid var(--border)",
                        background: "transparent",
                        fontFamily: "inherit",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "inherit",
                        outline: "none",
                        padding: "0 2px",
                        textAlign: "center",
                      }}
                    />
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>/hr</span>
                  </span>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ marginLeft: "auto" }}
                  >
                    <span>Find someone</span> <IconArrow size={16} />
                  </button>
                </div>
              </form>


              <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "14px 0 0", maxWidth: 660 }}>
                No account needed to browse. Free to file a ticket — you only pay the provider for the work they do.{" "}
                <Link
                  to="/register"
                  style={{ color: "var(--navy-700)", fontWeight: 600, textDecoration: "underline", textDecorationColor: "var(--amber-500)", textDecorationThickness: 2, textUnderlineOffset: 3, marginLeft: 6 }}
                >
                  Create an account
                </Link>{" "}
                to track your tickets.
              </p>
            </div>

            {/* RIGHT column — live card */}
            <aside className="live-card">
              <div className="live-card-grid" />
              <span className="live-pulse">Live · Bay Area</span>
              <h3 style={{ position: "relative", zIndex: 1, fontSize: 22, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.015em", margin: "14px 0 22px", color: "#fff" }}>
                Fixed today, by people on the platform.
              </h3>
              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { av: "MC", bg: "var(--amber-500)", color: "var(--navy-900)", ago: "2 MIN AGO", name: "Marcus C.", what: "arrived for a sink leak.", where: "Oakwood Bldg C · 2.3 mi" },
                  { av: "PS", bg: "oklch(0.65 0.06 60)", color: "#fff", ago: "11 MIN AGO", name: "Priya S.", what: "finished an AC service.", where: "Cedar Tower · 5★" },
                  { av: "SO", bg: "oklch(0.65 0.06 200)", color: "#fff", ago: "28 MIN AGO", name: "Sam O.", what: "swapped a laptop charge board.", where: "FIX-2411 · $185" },
                  { av: "RV", bg: "oklch(0.65 0.06 130)", color: "#fff", ago: "42 MIN AGO", name: "Renata V.", what: "cleared a clogged main drain.", where: "Howard St · 6th floor" },
                ].map((item) => (
                  <div key={item.ago} className="live-feed-item">
                    <div className="avatar" style={{ background: item.bg, color: item.color }}>{item.av}</div>
                    <div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "rgba(255,255,255,0.55)", letterSpacing: "0.06em" }}>{item.ago}</div>
                      <div style={{ color: "#fff", fontSize: 13.5, lineHeight: 1.4, marginTop: 3 }}>
                        <b>{item.name}</b> {item.what}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>{item.where}</div>
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
            <span className="eyebrow">02 · Browse by trade</span>
            <h2 className="display-2" style={{ marginTop: 14 }}>
              Whatever's <span className="amber-underline">broken</span>,<br />
              we've got someone for that.
            </h2>
          </div>
          <a href="#" className="btn btn-secondary">
            See all 18 trades <IconArrow size={15} />
          </a>
        </div>

        <div className="cat-grid">
          <a className="cat cat-feature" href="#">
            <span className="cat-arrow"><IconArrow size={14} /></span>
            <div className="cat-icon"><IconDrop size={22} /></div>
            <div style={{ marginTop: "auto" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--amber-500)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
                Most-booked this month
              </div>
              <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.05, marginTop: 14, color: "#fff" }}>
                Plumbing
              </div>
              <div className="cat-count" style={{ color: "rgba(255,255,255,0.5)" }}>
                {categoryCountMap["PLUMBING"] ?? "…"} providers · avg ~11 min response
              </div>
            </div>
          </a>

          <a className="cat cat-elect" href="#">
            <span className="cat-arrow"><IconArrow size={14} /></span>
            <div className="cat-icon" style={{ background: "rgba(245,158,11,0.18)", color: "var(--amber-700)" }}><IconBolt size={22} /></div>
            <div className="cat-name">Electrical</div>
            <div className="cat-count">{categoryCountMap["ELECTRICAL"] ?? "…"} providers</div>
          </a>

          <a className="cat cat-hvac" href="#">
            <span className="cat-arrow"><IconArrow size={14} /></span>
            <div className="cat-icon" style={{ background: "rgba(30,58,138,0.12)", color: "var(--navy-700)" }}><IconSpark size={22} /></div>
            <div className="cat-name">HVAC</div>
            <div className="cat-count">{categoryCountMap["HVAC"] ?? "…"} providers</div>
          </a>

          <a className="cat cat-hard" href="#">
            <span className="cat-arrow"><IconArrow size={14} /></span>
            <div className="cat-icon"><IconWrench size={22} /></div>
            <div className="cat-name">Hardware</div>
            <div className="cat-count">{categoryCountMap["HARDWARE"] ?? "…"} providers</div>
          </a>

          <a className="cat cat-soft" href="#">
            <span className="cat-arrow"><IconArrow size={14} /></span>
            <div className="cat-icon" style={{ background: "rgba(5,150,105,0.18)", color: "var(--emerald-700)" }}><IconCmd size={22} /></div>
            <div className="cat-name">IT &amp; Software</div>
            <div className="cat-count">{categoryCountMap["IT"] ?? "…"} providers</div>
          </a>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="container" id="how" style={{ paddingTop: 88, paddingBottom: 56 }}>
        <div style={{ maxWidth: 620 }}>
          <span className="eyebrow">03 · How it works</span>
          <h2 className="display-2" style={{ marginTop: 14, maxWidth: 700 }}>
            Three steps. <span className="amber-underline">No call-center.</span>
          </h2>
          <p style={{ marginTop: 18, color: "var(--text-muted)", fontSize: 17, lineHeight: 1.55 }}>
            From the moment you describe the problem to the moment someone's at your door, the whole flow lives in one place.
          </p>
        </div>

        <div className="steps">
          <div className="step">
            <span className="step-num">STEP 01 · ~30 SEC</span>
            <h3>Describe it,<br />or just snap a photo.</h3>
            <p>Type a sentence. Add a photo if you can. We auto-route the right trade based on what you wrote — no menus.</p>
            <div className="step-meta">Median time to file · <b>38 seconds</b></div>
          </div>

          <div className="step" style={{ borderTopColor: "var(--accent-deep)" }}>
            <span className="step-num">STEP 02 · ~12 MIN</span>
            <h3>A provider<br />accepts &amp; quotes.</h3>
            <p>Three best-fit providers see it instantly. The fastest accept wins. You see their rating, ETA, and an all-in quote before any work starts.</p>
            <div className="step-meta">Median time to accept · <b>11 min</b></div>
          </div>

          <div className="step" style={{ borderTopColor: "var(--emerald-600)" }}>
            <span className="step-num">STEP 03 · DONE</span>
            <h3>Track the fix.<br />Pay when it's done.</h3>
            <p>Watch the phase rail move from "accepted" to "on site" to "done." Chat with the provider live. Pay only after sign-off — no upfront fees.</p>
            <div className="step-meta">Same-day completion · <b>92%</b></div>
          </div>
        </div>
      </section>

      {/* ── PROOF BAND ── */}
      <section style={{ background: "var(--navy-900)", color: "#fff", padding: "64px 0", overflow: "hidden", position: "relative", marginTop: 96 }}>
        <div className="proof-grid-bg" />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 80, alignItems: "center" }}>
            <div>
              <span className="live-pulse" style={{ marginBottom: 14 }}>Last 30 days</span>
              <div className="proof-num" style={{ marginTop: 14 }}>
                <span className="amber">14,287</span> tickets fixed.<br />
                <span style={{ fontSize: "0.65em", color: "rgba(255,255,255,0.7)" }}>Zero phone calls placed.</span>
              </div>
            </div>
            <div className="proof-cells">
              <div className="proof-cell">
                <div className="lbl">Median response</div>
                <div className="big">12<span style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", marginLeft: 4 }}>min</span></div>
                <div className="hint">From "filed" to "accepted"</div>
              </div>
              <div className="proof-cell">
                <div className="lbl">Average rating</div>
                <div className="big">4.8<span style={{ fontSize: 22, color: "var(--amber-500)", marginLeft: 4 }}>★</span></div>
                <div className="hint">Across {allProviders.length > 0 ? allProviders.length.toLocaleString() : "…"} providers</div>
              </div>
              <div className="proof-cell">
                <div className="lbl">Same-day fix</div>
                <div className="big">92<span style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", marginLeft: 2 }}>%</span></div>
                <div className="hint">Reported and resolved in 24 hr</div>
              </div>
              <div className="proof-cell">
                <div className="lbl">Cities served</div>
                <div className="big">43</div>
                <div className="hint">Bay Area, NYC, LA, &amp; 40 more</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="cta-band" id="providers">
        {/* Rotated dark overlay (replaces ::before pseudo-element) */}
        <div className="cta-dark-overlay" />
        <div className="container cta-band-inner">
          <div>
            <span className="eyebrow" style={{ color: "var(--navy-900)" }}>04 · Get started</span>
            <h2 style={{ marginTop: 18 }}>
              Skip the wait.<br />
              File a ticket in 30 seconds.
            </h2>
            <p>Free to use. No subscriptions. Pay the provider for the work — that's it.</p>
          </div>
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            <Link to="/register" className="btn btn-lg btn-light btn-full">
              Sign up — I need a fix <IconArrow size={16} />
            </Link>
            <Link to="/register" className="btn btn-lg btn-ghost-on-dark btn-full">
              Join as a provider
            </Link>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "rgba(11,30,63,0.6)", margin: "6px 0 0", letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center" }}>
              Already a user?{" "}
              <Link to="/login" style={{ color: "var(--navy-900)", textDecoration: "underline" }}>Log in</Link>
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
              A maintenance OS for buildings, offices, and the people who actually live in them. Report it. Track it. Fixed.
            </p>
          </div>
          <div>
            <h4>Product</h4>
            <ul>
              <li><a href="#how">How it works</a></li>
              <li><a href="#">Browse providers</a></li>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h4>For providers</h4>
            <ul>
              <li><Link to="/register">Become a provider</Link></li>
              <li><a href="#">Provider handbook</a></li>
              <li><a href="#">Payouts</a></li>
              <li><a href="#">Provider login</a></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-muted)", letterSpacing: "0.05em" }}>
          <span>© 2026 FixItNow Inc.</span>
          <span>v 2.4 · Maintenance OS</span>
        </div>
      </footer>

    </div>
  );
}
