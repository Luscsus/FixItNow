import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";

import { useRegisterProviderMutation } from "@/hooks/useRegisterProviderMutation";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";

const schema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Enter a valid email."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(100, "Password must be at most 100 characters."),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required.")
    .max(50, "Phone number must be at most 50 characters."),
});

type Fields =
  | "firstName"
  | "lastName"
  | "email"
  | "password"
  | "phoneNumber"
  | "trades"
  | "yearsOfExperience"
  | "serviceRadiusKm"
  | "locationStreetName"
  | "locationCity"
  | "locationPostalCode"
  | "locationCountry"
  | "bio";

// All 15 backend ServiceCategory values, in display order.
const TRADES: { id: string; label: string; icon: string; category: string }[] = [
  { id: "plumbing", label: "Plumbing", icon: "🔧", category: "PLUMBING" },
  { id: "electrical", label: "Electrical", icon: "⚡", category: "ELECTRICAL" },
  { id: "hvac", label: "HVAC", icon: "❄️", category: "HVAC" },
  { id: "carpentry", label: "Carpentry", icon: "🪚", category: "CARPENTRY" },
  { id: "painting", label: "Painting", icon: "🎨", category: "PAINTING" },
  { id: "roofing", label: "Roofing", icon: "🏠", category: "ROOFING" },
  { id: "appliance_repair", label: "Appliance repair", icon: "🔌", category: "APPLIANCE_REPAIR" },
  { id: "locksmith", label: "Locksmith", icon: "🔑", category: "LOCKSMITH" },
  { id: "cleaning", label: "Cleaning", icon: "🧹", category: "CLEANING" },
  { id: "gardening", label: "Gardening", icon: "🌱", category: "GARDENING" },
  { id: "pest_control", label: "Pest control", icon: "🐜", category: "PEST_CONTROL" },
  { id: "moving", label: "Moving", icon: "📦", category: "MOVING" },
  { id: "tutoring", label: "Tutoring", icon: "📚", category: "TUTORING" },
  { id: "it", label: "IT / Smart home", icon: "💻", category: "IT_SUPPORT" },
  { id: "other", label: "Other", icon: "✨", category: "OTHER" },
];

const BIO_MAX = 2000;

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

function IconPhone() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 2.5h3l1.5 3.5L5.5 7a8 8 0 0 0 3.5 3.5l1-2 3.5 1.5v3a1 1 0 0 1-1 1A12 12 0 0 1 2 3.5a1 1 0 0 1 1-1z" />
    </svg>
  );
}


export function RegisterProviderPage() {
  const registerMutation = useRegisterProviderMutation();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  // Provider-profile fields
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState(65);
  const [yearsOfExperience, setYearsOfExperience] = useState<string>("");
  const [radius, setRadius] = useState<string>("");
  const [bio, setBio] = useState("");

  // Location
  const [streetName, setStreetName] = useState<string>("");
  const [streetNumber, setStreetNumber] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("");
  const [country, setCountry] = useState<string>("");

  const pwStrength = passwordStrength(form.password);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleTrade = (id: string) =>
    setSelectedTrades((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = schema.safeParse({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      password: form.password,
      phoneNumber: form.phoneNumber.trim(),
    });

    const nextErrors: Partial<Record<Fields, string>> = parsed.success
      ? {}
      : mapZodErrors(parsed.error);

    if (selectedTrades.length === 0) {
      nextErrors.trades = "Select at least one trade.";
    }

    const years = yearsOfExperience === "" ? NaN : Number(yearsOfExperience);
    if (!Number.isFinite(years) || years < 0 || years > 80) {
      nextErrors.yearsOfExperience = "Enter years of experience between 0 and 80.";
    }

    const radiusKm = radius === "" ? NaN : Number(radius);
    if (!Number.isFinite(radiusKm) || radiusKm < 1 || radiusKm > 500) {
      nextErrors.serviceRadiusKm = "Select a service radius.";
    }

    if (!streetName.trim()) nextErrors.locationStreetName = "Street name is required.";
    if (!city.trim()) nextErrors.locationCity = "City is required.";
    if (!postalCode.trim()) nextErrors.locationPostalCode = "Postal code is required.";
    if (!country.trim()) nextErrors.locationCountry = "Country is required.";

    if (bio.length > BIO_MAX) {
      nextErrors.bio = `Bio must be at most ${BIO_MAX} characters.`;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    const categories = TRADES
      .filter((t) => selectedTrades.includes(t.id))
      .map((t) => t.category);

    try {
      await registerMutation.mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        phoneNumber: form.phoneNumber.trim(),
        locationStreetName: streetName.trim(),
        locationStreetNumber: streetNumber.trim() || undefined,
        locationCity: city.trim(),
        locationPostalCode: postalCode.trim(),
        locationCountry: country.trim(),
        pricePerHour: hourlyRate,
        yearsOfExperience: years,
        serviceRadiusKm: radiusKm,
        categories,
        bio: bio.trim() || undefined,
      });
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
              <p className="body muted">Your application is pending administrator approval. You'll be notified by email once it's reviewed.</p>
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
                    <div className="row form-row" style={{ gap: 12, alignItems: "flex-start" }}>
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
                        <input id="prov-password" className="input" type="password" placeholder="8–100 characters"
                          autoComplete="new-password" value={form.password} onChange={set("password")} />
                      </div>
                      {form.password && (
                        <div className={`pw-meter s${pwStrength}`}>
                          <span /><span /><span /><span />
                        </div>
                      )}
                      {errors.password && <span className="field-error">{errors.password}</span>}
                    </div>

                    <div className="field">
                      <label className="field-label" htmlFor="prov-phone">Phone number</label>
                      <div className={`input-wrap${errors.phoneNumber ? " error" : ""}`}>
                        <IconPhone />
                        <input id="prov-phone" className="input" type="tel" placeholder="+386 41 234 567"
                          autoComplete="tel" value={form.phoneNumber} onChange={set("phoneNumber")} />
                      </div>
                      {errors.phoneNumber && <span className="field-error">{errors.phoneNumber}</span>}
                      <span className="field-hint">Customers will use this to reach you about jobs.</span>
                    </div>
                  </div>
                </div>

                {/* Section 2 — Location */}
                <div>
                  <div className="panel-title">
                    <span className="num">02</span>
                    <span className="label">Service location</span>
                    <span className="rule" />
                  </div>
                  <p className="field-hint" style={{ marginBottom: 10 }}>
                    We use your location to match you with nearby job requests.
                  </p>

                  <div className="row form-row" style={{ gap: 12, alignItems: "flex-start", marginTop: 12 }}>
                  <div className="row" style={{ gap: 12, alignItems: "flex-start", marginTop: 12 }}>
                    <div className="field" style={{ flex: 3 }}>
                      <label className="field-label" htmlFor="prov-street">Street name</label>
                      <div className={`input-wrap${errors.locationStreetName ? " error" : ""}`}>
                        <input
                          id="prov-street"
                          className="input"
                          placeholder="Main Street"
                          value={streetName}
                          onChange={(e) => setStreetName(e.target.value)}
                          autoComplete="address-line1"
                        />
                      </div>
                      {errors.locationStreetName && <span className="field-error">{errors.locationStreetName}</span>}
                    </div>
                    <div className="field" style={{ flex: 1, minWidth: 0 }}>
                      <label className="field-label" htmlFor="prov-streetno">No.</label>
                      <div className="input-wrap">
                        <input
                          id="prov-streetno"
                          className="input"
                          placeholder="123"
                          value={streetNumber}
                          onChange={(e) => setStreetNumber(e.target.value)}
                          autoComplete="address-line2"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row form-row" style={{ gap: 12, alignItems: "flex-start", marginTop: 8 }}>
                  <div className="row" style={{ gap: 12, alignItems: "flex-start", marginTop: 8 }}>
                    <div className="field" style={{ flex: 1, minWidth: 0 }}>
                      <label className="field-label" htmlFor="prov-postal">Postal code</label>
                      <div className={`input-wrap${errors.locationPostalCode ? " error" : ""}`}>
                        <input
                          id="prov-postal"
                          className="input"
                          placeholder="1000"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          autoComplete="postal-code"
                        />
                      </div>
                      {errors.locationPostalCode && <span className="field-error">{errors.locationPostalCode}</span>}
                    </div>
                    <div className="field" style={{ flex: 3 }}>
                      <label className="field-label" htmlFor="prov-city">City</label>
                      <div className={`input-wrap${errors.locationCity ? " error" : ""}`}>
                        <input
                          id="prov-city"
                          className="input"
                          placeholder="Ljubljana"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          autoComplete="address-level2"
                        />
                      </div>
                      {errors.locationCity && <span className="field-error">{errors.locationCity}</span>}
                    </div>
                  </div>

                  <div className="row form-row" style={{ gap: 12, alignItems: "flex-start", marginTop: 8 }}>
                  <div className="row" style={{ gap: 12, alignItems: "flex-start", marginTop: 8 }}>
                    <div className="field" style={{ flex: 1 }}>
                      <label className="field-label" htmlFor="prov-country">Country</label>
                      <div className={`input-wrap${errors.locationCountry ? " error" : ""}`}>
                        <input
                          id="prov-country"
                          className="input"
                          placeholder="Slovenia"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          autoComplete="country-name"
                        />
                      </div>
                      {errors.locationCountry && <span className="field-error">{errors.locationCountry}</span>}
                    </div>
                  </div>
                </div>

                {/* Section 3 — Trades */}
                <div>
                  <div className="panel-title">
                    <span className="num">03</span>
                    <span className="label">Your trades</span>
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
                  {errors.trades && <span className="field-error" style={{ marginTop: 8 }}>{errors.trades}</span>}
                </div>

                {/* Section 4 — Experience & coverage */}
                <div>
                  <div className="panel-title">
                    <span className="num">04</span>
                    <span className="label">Experience & coverage</span>
                    <span className="rule" />
                  </div>
                  <div className="row form-row" style={{ gap: 12, alignItems: "flex-start" }}>
                  <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
                    <div className="field grow">
                      <label className="field-label" htmlFor="prov-years">Years of experience</label>
                      <div className={`input-wrap${errors.yearsOfExperience ? " error" : ""}`}>
                        <input
                          id="prov-years"
                          className="input"
                          type="number"
                          min={0}
                          max={80}
                          step={1}
                          placeholder="e.g. 7"
                          value={yearsOfExperience}
                          onChange={(e) => setYearsOfExperience(e.target.value)}
                        />
                      </div>
                      {errors.yearsOfExperience && <span className="field-error">{errors.yearsOfExperience}</span>}
                    </div>
                    <div className="field grow">
                      <label className="field-label" htmlFor="prov-radius">Service radius</label>
                      <select
                        id="prov-radius"
                        className="fselect"
                        value={radius}
                        onChange={(e) => setRadius(e.target.value)}
                      >
                        <option value="">Select…</option>
                        <option value="10">Up to 10 km</option>
                        <option value="25">Up to 25 km</option>
                        <option value="50">Up to 50 km</option>
                        <option value="100">Up to 100 km</option>
                        <option value="500">Up to 500 km</option>
                      </select>
                      {errors.serviceRadiusKm && <span className="field-error">{errors.serviceRadiusKm}</span>}
                    </div>
                  </div>
                </div>

                {/* Section 5 — Rate */}
                <div>
                  <div className="panel-title">
                    <span className="num">05</span>
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

                {/* Section 6 — Bio */}
                <div>
                  <div className="panel-title">
                    <span className="num">06</span>
                    <span className="label">About you</span>
                    <span className="rule" />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="prov-bio">Short bio (optional)</label>
                    <textarea
                      id="prov-bio"
                      className="input"
                      placeholder="Tell customers about your experience, certifications, and the kinds of jobs you take on."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      maxLength={BIO_MAX}
                      style={{ minHeight: 96, padding: "10px 12px", lineHeight: 1.5, resize: "vertical" }}
                    />
                    <div className="row" style={{ justifyContent: "space-between", marginTop: 4 }}>
                      {errors.bio
                        ? <span className="field-error">{errors.bio}</span>
                        : <span className="field-hint">Visible on your provider profile.</span>}
                      <span className="field-hint">{bio.length} / {BIO_MAX}</span>
                    </div>
                  </div>
                </div>

                <p className="field-hint" style={{
                  background: "var(--slate-50)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "10px 14px", lineHeight: 1.6,
                }}>
                  <strong>Note:</strong> Your application will be reviewed by an administrator before you can sign in.
                </p>

                <button
                  type="submit"
                  className="btn btn-primary btn-full btn-lg"
                  disabled={registerMutation.isPending}
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
