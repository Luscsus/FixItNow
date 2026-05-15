import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { useRegisterMutation } from "@/hooks/useRegisterMutation";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";

const schema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type Fields = "firstName" | "lastName" | "email" | "password";

const TRADES = [
  { id: "plumbing", label: "Plumbing", icon: "🔧" },
  { id: "electrical", label: "Electrical", icon: "⚡" },
  { id: "hvac", label: "HVAC", icon: "❄️" },
  { id: "carpentry", label: "Carpentry", icon: "🪚" },
  { id: "painting", label: "Painting", icon: "🎨" },
  { id: "it", label: "IT / Smart home", icon: "💻" },
];

function passwordStrength(pw: string): number {
  if (pw.length === 0) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="5" r="3" />
      <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="3.5" width="14" height="9" rx="1.5" />
      <path d="M1 5l7 4.5L15 5" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export function RegisterProviderPage() {
  const navigate = useNavigate();
  const registerMutation = useRegisterMutation();

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  // Provider-specific UI state (not sent to backend yet — flagged below)
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState(65);
  const [experience, setExperience] = useState("");
  const [radius, setRadius] = useState("");

  const pwStrength = passwordStrength(form.password);
  const canSubmit = Object.values(form).every((v) => v.trim() !== "");

  const set = (field: Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleTrade = (id: string) =>
    setSelectedTrades((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const parsed = schema.safeParse({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      password: form.password,
    });

    if (!parsed.success) {
      setErrors(mapZodErrors(parsed.error));
      return;
    }
    setErrors({});

    try {
      await registerMutation.mutateAsync(parsed.data);
      setSubmitted(true);
    } catch (error) {
      setErrors({ email: getErrorMessage(error) });
    }
  };

  // Earnings preview
  const weekly4 = hourlyRate * 4 * 4;
  const weekly8 = hourlyRate * 8 * 4;

  return (
    <div className="auth">
      {/* Left art panel */}
      <div className="auth-art">
        <div className="auth-art-grid" />

        <Link to="/" className="auth-brand-inv">
          <span className="brand-mark" aria-hidden="true" />
          <span>FixIt<span className="brand-now">Now</span></span>
        </Link>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 36, position: "relative", zIndex: 1, marginTop: 56 }}>
          <div>
            <p className="crumbs" style={{ color: "rgba(255,255,255,0.45)", marginBottom: 20 }}>
              For skilled tradespeople
            </p>
            <h1 className="display" style={{ color: "#fff", fontSize: "clamp(40px,4.5vw,64px)" }}>
              Your skills.<br />
              Your rates.<br />
              <span style={{ color: "var(--amber-500)" }}>Your clients.</span>
            </h1>
          </div>

          <div className="col" style={{ gap: 0 }}>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">01</span>
              <span className="fbody"><b>Set your own rate.</b> You decide what you charge per hour. No commission surprises.</span>
            </div>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">02</span>
              <span className="fbody"><b>Jobs come to you.</b> Get matched to nearby requests in your trade automatically.</span>
            </div>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">03</span>
              <span className="fbody"><b>Guaranteed payment.</b> Escrow means you always get paid for approved work.</span>
            </div>
            <div className="feature-divider" />
          </div>

          {/* Earnings preview */}
          <div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
              Earnings potential · @{hourlyRate}/hr
            </p>
            <div style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: "16px 20px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--amber-500)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Rate/hr</div>
                <div style={{ fontSize: 22, fontFamily: "var(--font-mono)", color: "#fff", fontWeight: 600, marginTop: 6 }}>${hourlyRate}</div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--amber-500)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>4 jobs/wk</div>
                <div style={{ fontSize: 22, fontFamily: "var(--font-mono)", color: "#fff", fontWeight: 600, marginTop: 6 }}>${(weekly4).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--amber-500)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>8 jobs/wk</div>
                <div style={{ fontSize: 22, fontFamily: "var(--font-mono)", color: "#fff", fontWeight: 600, marginTop: 6 }}>${(weekly8).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-meta">
          <div><b>4,200+</b><br />active providers</div>
          <div><b>€62</b><br />avg. hourly rate</div>
          <div><b>10%</b><br />platform fee</div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-side" style={{ padding: "40px 60px" }}>
        <div className="auth-form" style={{ maxWidth: 440 }}>
          {submitted ? (
            <div className="col" style={{ gap: 16, textAlign: "center", alignItems: "center", paddingTop: 40 }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "var(--emerald-100)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="h1">Application submitted!</h2>
              <p className="body muted">Confirm your email to complete your provider profile.</p>
              <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
                Go to sign in →
              </Link>
            </div>
          ) : (
            <>
              <div className="col" style={{ gap: 8, marginBottom: 28 }}>
                <div className="crumbs">
                  <Link to="/register" style={{ color: "inherit", textDecoration: "none" }}>Register</Link>
                  <span className="sep">/</span>
                  Provider
                </div>
                <h2 className="h1">Apply as a provider</h2>
                <p className="body muted" style={{ marginTop: 4 }}>
                  Already have an account?{" "}
                  <Link to="/login" style={{ color: "var(--navy-700)", fontWeight: 600, textDecoration: "none" }}>
                    Sign in →
                  </Link>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="col" style={{ gap: 24 }}>
                {/* Section 1 — Account */}
                <div>
                  <div className="panel-title">
                    <span className="num">01</span>
                    <span className="label">Account info</span>
                    <span className="rule" />
                  </div>
                  <div className="col" style={{ gap: 16 }}>
                    <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
                      <div className="field grow">
                        <label className="field-label" htmlFor="prov-first">First name</label>
                        <div className={`input-wrap${errors.firstName ? " error" : ""}`}>
                          <IconUser />
                          <input id="prov-first" className="input" placeholder="Jane" autoComplete="given-name"
                            value={form.firstName} onChange={set("firstName")} />
                        </div>
                        {errors.firstName && <span className="field-error">{errors.firstName}</span>}
                      </div>
                      <div className="field grow">
                        <label className="field-label" htmlFor="prov-last">Last name</label>
                        <div className={`input-wrap${errors.lastName ? " error" : ""}`}>
                          <IconUser />
                          <input id="prov-last" className="input" placeholder="Doe" autoComplete="family-name"
                            value={form.lastName} onChange={set("lastName")} />
                        </div>
                        {errors.lastName && <span className="field-error">{errors.lastName}</span>}
                      </div>
                    </div>

                    <div className="field">
                      <label className="field-label" htmlFor="prov-email">Email address</label>
                      <div className={`input-wrap${errors.email ? " error" : ""}`}>
                        <IconMail />
                        <input id="prov-email" className="input" type="email" placeholder="you@example.com"
                          autoComplete="email" value={form.email} onChange={set("email")} />
                      </div>
                      {errors.email && <span className="field-error">{errors.email}</span>}
                    </div>

                    <div className="field">
                      <label className="field-label" htmlFor="prov-password">Password</label>
                      <div className={`input-wrap${errors.password ? " error" : ""}`}>
                        <IconLock />
                        <input id="prov-password" className="input" type="password" placeholder="Min. 8 characters"
                          autoComplete="new-password" value={form.password} onChange={set("password")} />
                      </div>
                      {form.password && (
                        <div className={`pw-meter s${pwStrength}`}>
                          <span /><span /><span /><span />
                        </div>
                      )}
                      {errors.password && <span className="field-error">{errors.password}</span>}
                    </div>
                  </div>
                </div>

                {/* Section 2 — Trade (UI only, not in backend yet) */}
                <div>
                  <div className="panel-title">
                    <span className="num">02</span>
                    <span className="label">Your trade</span>
                    <span className="rule" />
                  </div>
                  <p className="field-hint" style={{ marginBottom: 10 }}>Select all that apply.</p>
                  <div className="trade-grid">
                    {TRADES.map((trade) => (
                      <button
                        key={trade.id}
                        type="button"
                        className="trade-chip"
                        aria-pressed={selectedTrades.includes(trade.id) ? "true" : "false"}
                        onClick={() => toggleTrade(trade.id)}
                      >
                        <span style={{ fontSize: 14 }}>{trade.icon}</span>
                        {trade.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 3 — Experience & coverage (UI only) */}
                <div>
                  <div className="panel-title">
                    <span className="num">03</span>
                    <span className="label">Experience</span>
                    <span className="rule" />
                  </div>
                  <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
                    <div className="field grow">
                      <label className="field-label">Years of experience</label>
                      <select className="fselect" value={experience} onChange={(e) => setExperience(e.target.value)}>
                        <option value="">Select…</option>
                        <option value="1">Less than 1 year</option>
                        <option value="2">1–3 years</option>
                        <option value="5">3–5 years</option>
                        <option value="10">5–10 years</option>
                        <option value="20">10+ years</option>
                      </select>
                    </div>
                    <div className="field grow">
                      <label className="field-label">Service radius</label>
                      <select className="fselect" value={radius} onChange={(e) => setRadius(e.target.value)}>
                        <option value="">Select…</option>
                        <option value="10">Up to 10 km</option>
                        <option value="25">Up to 25 km</option>
                        <option value="50">Up to 50 km</option>
                        <option value="100">Up to 100 km</option>
                        <option value="any">Anywhere</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 4 — Rate (UI only) */}
                <div>
                  <div className="panel-title">
                    <span className="num">04</span>
                    <span className="label">Hourly rate</span>
                    <span className="rule" />
                  </div>
                  <div className="rate-row">
                    <span className="rate-big">${hourlyRate}</span>
                    <span className="field-hint">/ hour</span>
                  </div>
                  <input
                    type="range"
                    className="slider"
                    min={20}
                    max={200}
                    step={5}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    style={{ marginTop: 10 }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span className="field-hint">$20</span>
                    <span className="field-hint">$200</span>
                  </div>
                </div>

                <p className="field-hint" style={{
                  background: "var(--slate-50)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "10px 14px", lineHeight: 1.6,
                }}>
                  <strong>Note:</strong> Trade, experience, radius, and rate fields are part of the provider profile — they will be saved once provider profile management is available in the backend.
                </p>

                <button
                  type="submit"
                  className="btn btn-primary btn-full btn-lg"
                  disabled={!canSubmit || registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Submitting application…" : "Submit application"}
                </button>

                <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6 }}>
                  By signing up you agree to our{" "}
                  <a href="#" style={{ color: "var(--navy-700)", textDecoration: "none" }}>Terms</a>
                  {" "}and{" "}
                  <a href="#" style={{ color: "var(--navy-700)", textDecoration: "none" }}>Privacy Policy</a>.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
