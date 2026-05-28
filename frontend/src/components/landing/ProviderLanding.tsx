import { Link } from "react-router-dom";
import { useAllProvidersQuery } from "@/hooks/useAllProvidersQuery";
import { usePublicOpenTicketsQuery } from "@/hooks/usePublicOpenTicketsQuery";

/* ── SVG icons ── */
function IconArrow({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}
function IconWallet({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h15a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h12v4" />
      <circle cx="17" cy="13" r="1.5" fill="currentColor" />
    </svg>
  );
}
function IconRadar({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path d="M12 12l6-4" />
    </svg>
  );
}
function IconCalendar({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function IconShield({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function IconStar({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3 7 7 .8-5.4 4.7L18 22l-6-3.5L6 22l1.4-7.5L2 9.8 9 9z" />
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

const INCOMING_JOBS = [
  { id: "FIX-2418", trade: "PLUMBING",   title: "Leaking shut-off valve, kitchen",         dist: "1.2 mi", payout: "$140–180", urgency: "URGENT" },
  { id: "FIX-2417", trade: "ELECTRICAL", title: "Outlet sparking, master bedroom",         dist: "2.8 mi", payout: "$120–160", urgency: "TODAY" },
  { id: "FIX-2416", trade: "HVAC",       title: "AC not cooling, 3-bedroom condo",         dist: "3.4 mi", payout: "$220–290", urgency: "TODAY" },
];

const PROVIDER_QUOTES = [
  {
    name: "Marcus C.", trade: "Plumbing · Oakland", earnings: "$94k", years: 2,
    quote: "I used to spend half my week chasing leads on Craigslist. Now jobs hit my phone, I pick the ones I want, and the money lands the next day. I haven't placed an ad in 18 months.",
  },
  {
    name: "Priya S.", trade: "HVAC · San Jose", earnings: "$112k", years: 3,
    quote: "The radius and rate filters are the whole game. I only see jobs that fit what I do — no driving an hour for a $60 fix. Same-day payouts mean I never wait on an invoice.",
  },
];

export function ProviderLanding() {
  const { data: allProviders = [] } = useAllProvidersQuery();
  const { data: publicTickets = [] } = usePublicOpenTicketsQuery();

  const openJobsCount = publicTickets.length;
  const providerCount = allProviders.length;

  return (
    <div style={{ background: "var(--bg-canvas)" }}>

      {/* ── HERO ── */}
      <section className="hero-wrap" style={{ padding: "10px 0 64px", position: "relative", overflow: "hidden" }}>
        {/* Ambient art — different angle than user side */}
        <div style={{
          position: "absolute", bottom: -160, right: -120,
          width: 540, height: 540, pointerEvents: "none",
          background: "radial-gradient(circle at 50% 50%, rgba(245,158,11,0.12), transparent 55%)",
          borderRadius: "50%",
        }} />

        <div className="container">
          <div className="hero-grid">

            {/* LEFT column */}
            <div>
              {/* Live demand pill */}
              <div className="hero-tag">
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "3px 10px",
                  background: "var(--emerald-100)", color: "var(--emerald-700)",
                  borderRadius: 999, fontFamily: "var(--font-mono)", fontSize: 10.5,
                  fontWeight: 700, letterSpacing: "0.06em",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--emerald-600)" }} />
                  LIVE
                </span>
                <span><b>{openJobsCount > 0 ? openJobsCount.toLocaleString() : "…"} open jobs</b> in your trade right now</span>
              </div>

              {/* Display heading */}
              <h1 className="display-mega">
                Work that<br />
                finds <span className="word-underline">you.</span><br />
                <span className="word-squiggle">Not the other way.</span>
              </h1>

              <p className="hero-lede" style={{ fontSize: 16, lineHeight: 1.5, color: "var(--text-muted)", maxWidth: 480, margin: "16px 0 0" }}>
                Nearby jobs, your rate, your schedule. Paid the day after.
              </p>

              {/* CTA row */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 22 }}>
                <Link to="/register/provider" className="btn btn-primary btn-lg" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  Apply as a provider <IconArrow size={16} />
                </Link>
                <a href="#provider-how" className="btn btn-secondary btn-lg">
                  See how it works
                </a>
              </div>

              {/* Trust strip */}
              <div style={{
                marginTop: 28, display: "flex", flexWrap: "wrap", gap: 22,
                fontSize: 13, color: "var(--text-muted)",
              }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <IconShield size={15} /> Verified background checks
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <IconWallet size={15} /> Payouts in 24 hours
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <IconCalendar size={15} /> Set your own availability
                </span>
              </div>

              <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "26px 0 0", maxWidth: 660 }}>
                Free to apply. No subscription. We take a flat 8% from completed jobs — no leads-fees, no monthly cost.{" "}
                <Link
                  to="/login"
                  style={{ color: "var(--navy-700)", fontWeight: 600, textDecoration: "underline", textDecorationColor: "var(--amber-500)", textDecorationThickness: 2, textUnderlineOffset: 3, marginLeft: 6 }}
                >
                  Already a provider? Log in
                </Link>
              </p>
            </div>

            {/* RIGHT column — Earnings + incoming jobs mock dashboard */}
            <aside className="live-card">
              <div className="live-card-grid" />

              {/* Earnings header */}
              <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div>
                  <span className="live-pulse">Today · Earnings</span>
                  <div style={{ marginTop: 14, fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em", color: "#fff", lineHeight: 1 }}>
                    <span style={{ color: "var(--amber-500)" }}>$</span>847
                    <span style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", fontWeight: 500, marginLeft: 4 }}>.50</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", marginTop: 6, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                    +3 JOBS · 6.5 HRS WORKED
                  </div>
                </div>
                {/* Mini sparkline */}
                <svg width={110} height={48} viewBox="0 0 110 48" style={{ flexShrink: 0, marginTop: 4 }}>
                  <defs>
                    <linearGradient id="provGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(245,158,11,0.55)" />
                      <stop offset="100%" stopColor="rgba(245,158,11,0)" />
                    </linearGradient>
                  </defs>
                  <path d="M0 36 L15 30 L30 32 L45 22 L60 24 L75 14 L90 18 L110 6 L110 48 L0 48 Z" fill="url(#provGrad)" />
                  <path d="M0 36 L15 30 L30 32 L45 22 L60 24 L75 14 L90 18 L110 6"
                    fill="none" stroke="var(--amber-500)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Divider */}
              <div style={{ position: "relative", zIndex: 1, height: 1, background: "rgba(255,255,255,0.08)", margin: "22px 0 18px" }} />

              <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>Incoming jobs near you</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "rgba(255,255,255,0.55)", letterSpacing: "0.06em" }}>
                  WITHIN 5 MI
                </span>
              </div>

              {/* Job cards */}
              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                {INCOMING_JOBS.map((j) => (
                  <div key={j.id} style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    padding: "12px 14px",
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--amber-500)", letterSpacing: "0.08em", fontWeight: 600 }}>
                          {j.trade}
                        </span>
                        <span style={{
                          fontFamily: "var(--font-mono)", fontSize: 9.5, letterSpacing: "0.06em",
                          padding: "1px 6px", borderRadius: 4, fontWeight: 700,
                          background: j.urgency === "URGENT" ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.08)",
                          color: j.urgency === "URGENT" ? "var(--amber-500)" : "rgba(255,255,255,0.65)",
                        }}>{j.urgency}</span>
                      </div>
                      <div style={{ color: "#fff", fontSize: 13, lineHeight: 1.35, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {j.title}
                      </div>
                      <div style={{ display: "flex", gap: 10, fontSize: 11.5, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><IconPin size={11} /> {j.dist}</span>
                        <span>· {j.payout}</span>
                      </div>
                    </div>
                    <button style={{
                      background: "var(--amber-500)", color: "var(--navy-900)",
                      border: 0, borderRadius: 8, padding: "8px 12px",
                      fontWeight: 700, fontSize: 12.5, cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}>
                      Accept
                    </button>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── MARQUEE — real demand ── */}
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

      {/* ── WHY PROVIDERS JOIN ── */}
      <section className="container" style={{ paddingTop: 72, paddingBottom: 56 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 32, flexWrap: "wrap" }}>
          <div>
            <span className="eyebrow">02 · Why providers stay</span>
            <h2 className="display-2" style={{ marginTop: 14 }}>
              Built for the people<br />
              who <span className="amber-underline">actually do the work.</span>
            </h2>
          </div>
          <p style={{ maxWidth: 380, color: "var(--text-muted)", fontSize: 16, lineHeight: 1.55, margin: 0 }}>
            We don't sell leads. We don't take a cut of your tools. We move the friction out of the way so you can spend your hours billable, not hunting.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 18,
        }}>
          <FeatureCard
            icon={<IconRadar size={22} />}
            tint="amber"
            title="Jobs near you, ranked"
            body="Set your radius. We push only the tickets you're a real match for — by trade, distance, and the rate band you've set."
          />
          <FeatureCard
            icon={<IconWallet size={22} />}
            tint="emerald"
            title="Paid in 24 hours"
            body="Job marked done, client signs off, money in your account the next morning. No 30-day invoicing, no chasing payments."
          />
          <FeatureCard
            icon={<IconCalendar size={22} />}
            tint="navy"
            title="Your rate, your hours"
            body="Set hourly rates per category. Block off days. Decline anything that doesn't fit. You're the boss — we're the dispatcher."
          />
          <FeatureCard
            icon={<IconShield size={22} />}
            tint="amber"
            title="Zero marketing tax"
            body="No website, no ads, no SEO games. One flat 8% on jobs you complete — no monthly fee, no lead-purchase scheme."
          />
        </div>
      </section>

      {/* ── HOW IT WORKS (PROVIDER) ── */}
      <section className="container" id="provider-how" style={{ paddingTop: 88, paddingBottom: 56 }}>
        <div style={{ maxWidth: 620 }}>
          <span className="eyebrow">03 · Getting on the platform</span>
          <h2 className="display-2" style={{ marginTop: 14, maxWidth: 700 }}>
            From application to <span className="amber-underline">first payout</span>,<br />
            usually inside a week.
          </h2>
          <p style={{ marginTop: 18, color: "var(--text-muted)", fontSize: 17, lineHeight: 1.55 }}>
            We verify carefully because clients trust the badge. Once you're in, jobs start pinging your phone the same day you go live.
          </p>
        </div>

        <div className="steps">
          <div className="step">
            <span className="step-num">STEP 01 · ~10 MIN</span>
            <h3>Apply &amp; upload<br />your credentials.</h3>
            <p>License, insurance, ID. Pick your trades, your service area, and your rate band. We run a background check in the background.</p>
            <div className="step-meta">Approval median · <b>48 hours</b></div>
          </div>

          <div className="step" style={{ borderTopColor: "var(--accent-deep)" }}>
            <span className="step-num">STEP 02 · LIVE</span>
            <h3>Get matched<br />with nearby jobs.</h3>
            <p>Tickets in your radius and trade hit your phone. See the location, scope, photos, and pay range up front. Tap accept — or skip.</p>
            <div className="step-meta">First job offer · <b>under 6 hours</b></div>
          </div>

          <div className="step" style={{ borderTopColor: "var(--emerald-600)" }}>
            <span className="step-num">STEP 03 · PAYOUT</span>
            <h3>Finish, sign off,<br />get paid.</h3>
            <p>Mark the ticket done from your phone. Client confirms. Payment auto-deposits the next business day — minus our flat 8%, that's it.</p>
            <div className="step-meta">Average per-job payout · <b>$182</b></div>
          </div>
        </div>
      </section>

      {/* ── EARNINGS / PROOF BAND ── */}
      <section style={{ background: "var(--navy-900)", color: "#fff", padding: "64px 0", overflow: "hidden", position: "relative", marginTop: 96 }}>
        <div className="proof-grid-bg" />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="proof-band-inner" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 80, alignItems: "center" }}>
            <div>
              <span className="live-pulse" style={{ marginBottom: 14 }}>Provider economics · Last 90 days</span>
              <div className="proof-num" style={{ marginTop: 14 }}>
                <span className="amber">$1,840</span> avg weekly.<br />
                <span style={{ fontSize: "0.65em", color: "rgba(255,255,255,0.7)" }}>For full-time providers on platform.</span>
              </div>
            </div>
            <div className="proof-cells">
              <div className="proof-cell">
                <div className="lbl">Active providers</div>
                <div className="big">{providerCount > 0 ? providerCount.toLocaleString() : "…"}</div>
                <div className="hint">Across 43 cities</div>
              </div>
              <div className="proof-cell">
                <div className="lbl">Jobs / week</div>
                <div className="big">11<span style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", marginLeft: 4 }}>avg</span></div>
                <div className="hint">Per active full-timer</div>
              </div>
              <div className="proof-cell">
                <div className="lbl">5★ rate</div>
                <div className="big">78<span style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", marginLeft: 2 }}>%</span></div>
                <div className="hint">Of completed jobs</div>
              </div>
              <div className="proof-cell">
                <div className="lbl">Provider take</div>
                <div className="big">92<span style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", marginLeft: 2 }}>%</span></div>
                <div className="hint">8% flat platform fee — no extras</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="container" style={{ paddingTop: 88, paddingBottom: 24 }}>
        <div style={{ maxWidth: 620, marginBottom: 36 }}>
          <span className="eyebrow">04 · From the people on the truck</span>
          <h2 className="display-2" style={{ marginTop: 14 }}>
            What providers <span className="amber-underline">actually say.</span>
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20,
        }}>
          {PROVIDER_QUOTES.map((p) => (
            <div key={p.name} style={{
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "26px 28px",
              boxShadow: "var(--shadow-sm)",
              position: "relative",
            }}>
              <div style={{ display: "flex", gap: 3, color: "var(--amber-500)", marginBottom: 14 }}>
                {[0,1,2,3,4].map((i) => <IconStar key={i} size={14} />)}
              </div>
              <p style={{ fontSize: 16, lineHeight: 1.55, margin: 0, color: "var(--text)", letterSpacing: "-0.005em" }}>
                "{p.quote}"
              </p>
              <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{p.trade} · {p.years} yr on platform</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Earned last yr
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--emerald-700)" }}>
                    {p.earnings}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="cta-band">
        <div className="cta-dark-overlay" />
        <div className="container cta-band-inner">
          <div>
            <span className="eyebrow" style={{ color: "var(--navy-900)" }}>05 · Ready to start</span>
            <h2 style={{ marginTop: 18 }}>
              Stop chasing jobs.<br />
              Let them come to you.
            </h2>
            <p>Apply in 10 minutes. Get verified in 48 hours. Most providers see their first job offer the same day they go live.</p>
          </div>
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            <Link to="/register/provider" className="btn btn-lg btn-light btn-full">
              Apply as a provider <IconArrow size={16} />
            </Link>
            <Link to="/register" className="btn btn-lg btn-ghost-on-dark btn-full">
              I'm a user, not a provider
            </Link>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "rgba(11,30,63,0.6)", margin: "6px 0 0", letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center" }}>
              Already a provider?{" "}
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
              A maintenance OS that connects working tradespeople with the jobs already nearby. No leads to buy, no monthly fees.
            </p>
          </div>
          <div>
            <h4>For providers</h4>
            <ul>
              <li><Link to="/register/provider">Apply now</Link></li>
              <li><a href="#provider-how">How it works</a></li>
              <li><a href="#">Provider handbook</a></li>
              <li><a href="#">Payouts &amp; fees</a></li>
            </ul>
          </div>
          <div>
            <h4>Trades we cover</h4>
            <ul>
              <li><a href="#">Plumbing</a></li>
              <li><a href="#">Electrical</a></li>
              <li><a href="#">HVAC</a></li>
              <li><a href="#">All 18 trades</a></li>
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
          <span>v 2.4 · For providers</span>
        </div>
      </footer>

    </div>
  );
}

/* ── Feature card ── */
function FeatureCard({
  icon, title, body, tint,
}: {
  icon: React.ReactNode; title: string; body: string;
  tint: "amber" | "emerald" | "navy";
}) {
  const tintMap = {
    amber:   { bg: "rgba(245,158,11,0.14)", fg: "var(--amber-700)" },
    emerald: { bg: "rgba(5,150,105,0.14)",  fg: "var(--emerald-700)" },
    navy:    { bg: "rgba(30,58,138,0.10)",  fg: "var(--navy-700)" },
  }[tint];

  return (
    <div style={{
      background: "#fff",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: "24px 22px",
      transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
      cursor: "default",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: tintMap.bg, color: tintMap.fg,
        display: "grid", placeItems: "center",
        marginBottom: 16,
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.015em", margin: "0 0 8px" }}>
        {title}
      </h3>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--text-muted)", margin: 0 }}>
        {body}
      </p>
    </div>
  );
}
