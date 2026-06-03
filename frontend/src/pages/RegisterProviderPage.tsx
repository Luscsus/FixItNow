import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useRegisterProviderMutation } from "@/hooks/useRegisterProviderMutation";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";
import { PasswordInput } from "@/components/ui/PasswordInput";

type Fields =
  | "firstName" | "lastName" | "email" | "password" | "phoneNumber"
  | "trades" | "yearsOfExperience" | "serviceRadiusKm"
  | "locationStreetName" | "locationCity" | "locationPostalCode" | "locationCountry" | "bio";

const TRADES_DATA: { id: string; icon: string; category: string; key: string }[] = [
  { id: "plumbing",        icon: "🔧", category: "PLUMBING",        key: "plumbing" },
  { id: "electrical",      icon: "⚡", category: "ELECTRICAL",      key: "electrical" },
  { id: "hvac",            icon: "❄️", category: "HVAC",            key: "hvac" },
  { id: "carpentry",       icon: "🪚", category: "CARPENTRY",       key: "carpentry" },
  { id: "painting",        icon: "🎨", category: "PAINTING",        key: "painting" },
  { id: "roofing",         icon: "🏠", category: "ROOFING",         key: "roofing" },
  { id: "appliance_repair",icon: "🔌", category: "APPLIANCE_REPAIR",key: "applianceRepair" },
  { id: "locksmith",       icon: "🔑", category: "LOCKSMITH",       key: "locksmith" },
  { id: "cleaning",        icon: "🧹", category: "CLEANING",        key: "cleaning" },
  { id: "gardening",       icon: "🌱", category: "GARDENING",       key: "gardening" },
  { id: "pest_control",    icon: "🐜", category: "PEST_CONTROL",    key: "pestControl" },
  { id: "moving",          icon: "📦", category: "MOVING",          key: "moving" },
  { id: "tutoring",        icon: "📚", category: "TUTORING",        key: "tutoring" },
  { id: "it",              icon: "💻", category: "IT_SUPPORT",      key: "it" },
  { id: "other",           icon: "✨", category: "OTHER",           key: "other" },
];

const BIO_MAX = 2000;

function passwordStrength(pw: string): number {
  if (pw.length === 0) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="5" r="3" /><path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="3.5" width="14" height="9" rx="1.5" /><path d="M1 5l7 4.5L15 5" />
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
  const { t } = useTranslation();
  const registerMutation = useRegisterProviderMutation();

  const schema = z.object({
    firstName:   z.string().min(1, t("registerProvider.errors.firstNameRequired")),
    lastName:    z.string().min(1, t("registerProvider.errors.lastNameRequired")),
    email:       z.string().email(t("registerProvider.errors.enterValidEmail")),
    password:    z.string().min(8, t("registerProvider.errors.passwordMinLength")).max(100, t("registerProvider.errors.passwordMaxLength")),
    phoneNumber: z.string().min(1, t("registerProvider.errors.phoneRequired")).max(50),
  });

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", phoneNumber: "" });
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState(65);
  const [yearsOfExperience, setYearsOfExperience] = useState<string>("");
  const [radius, setRadius] = useState<string>("");
  const [bio, setBio] = useState("");
  const [streetName, setStreetName] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");

  const pwStrength = passwordStrength(form.password);
  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleTrade = (id: string) =>
    setSelectedTrades((prev) => prev.includes(id) ? prev.filter((t2) => t2 !== id) : [...prev, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = schema.safeParse({
      firstName: form.firstName.trim(), lastName: form.lastName.trim(),
      email: form.email.trim(), password: form.password, phoneNumber: form.phoneNumber.trim(),
    });

    const nextErrors: Partial<Record<Fields, string>> = parsed.success ? {} : mapZodErrors(parsed.error);

    if (selectedTrades.length === 0) nextErrors.trades = t("registerProvider.errors.selectOneTrade");

    const years = yearsOfExperience === "" ? NaN : Number(yearsOfExperience);
    if (!Number.isFinite(years) || years < 0 || years > 80)
      nextErrors.yearsOfExperience = t("registerProvider.errors.yearsRange");

    const radiusKm = radius === "" ? NaN : Number(radius);
    if (!Number.isFinite(radiusKm) || radiusKm < 1 || radiusKm > 500)
      nextErrors.serviceRadiusKm = t("registerProvider.errors.selectRadius");

    if (!streetName.trim()) nextErrors.locationStreetName = t("registerProvider.errors.streetRequired");
    if (!city.trim())       nextErrors.locationCity = t("registerProvider.errors.cityRequired");
    if (!postalCode.trim()) nextErrors.locationPostalCode = t("registerProvider.errors.postalRequired");
    if (!country.trim())    nextErrors.locationCountry = t("registerProvider.errors.countryRequired");

    if (bio.length > BIO_MAX) nextErrors.bio = t("registerProvider.errors.bioMaxLength", { max: BIO_MAX });

    if (Object.keys(nextErrors).length > 0) { setErrors(nextErrors); return; }
    setErrors({});

    const categories = TRADES_DATA.filter((tr) => selectedTrades.includes(tr.id)).map((tr) => tr.category);

    try {
      await registerMutation.mutateAsync({
        firstName: form.firstName.trim(), lastName: form.lastName.trim(),
        email: form.email.trim(), password: form.password, phoneNumber: form.phoneNumber.trim(),
        locationStreetName: streetName.trim(), locationStreetNumber: streetNumber.trim() || undefined,
        locationCity: city.trim(), locationPostalCode: postalCode.trim(), locationCountry: country.trim(),
        pricePerHour: hourlyRate, yearsOfExperience: years, serviceRadiusKm: radiusKm,
        categories, bio: bio.trim() || undefined,
      });
      setSubmitted(true);
    } catch (error) {
      setErrors({ email: getErrorMessage(error) });
    }
  };

  const weekly4 = hourlyRate * 4 * 4;
  const weekly8 = hourlyRate * 8 * 4;

  return (
    <div className="auth">
      <div className="auth-art">
        <div className="auth-art-grid" />
        <Link to="/" className="auth-brand-inv">
          <span className="brand-mark" aria-hidden="true" />
          <span>FixIt<span className="brand-now">Now</span></span>
        </Link>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 36, position: "relative", zIndex: 1, marginTop: 56 }}>
          <div>
            <p className="crumbs" style={{ color: "rgba(255,255,255,0.45)", marginBottom: 20 }}>
              {t("registerProvider.forSkilledTradespeople")}
            </p>
            <h1 className="display" style={{ color: "#fff", fontSize: "clamp(40px,4.5vw,64px)" }}>
              {t("registerProvider.yourSkills")}<br />
              {t("registerProvider.yourRates")}<br />
              <span style={{ color: "var(--amber-500)" }}>{t("registerProvider.yourClients")}</span>
            </h1>
          </div>

          <div className="col" style={{ gap: 0 }}>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">01</span>
              <span className="fbody"><b>{t("registerProvider.feature01")}</b> {t("registerProvider.feature01body")}</span>
            </div>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">02</span>
              <span className="fbody"><b>{t("registerProvider.feature02")}</b> {t("registerProvider.feature02body")}</span>
            </div>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">03</span>
              <span className="fbody"><b>{t("registerProvider.feature03")}</b> {t("registerProvider.feature03body")}</span>
            </div>
            <div className="feature-divider" />
          </div>

          <div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
              {t("registerProvider.earningsPotential", { rate: hourlyRate })}
            </p>
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--amber-500)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>{t("registerProvider.ratePerHr")}</div>
                <div style={{ fontSize: 22, fontFamily: "var(--font-mono)", color: "#fff", fontWeight: 600, marginTop: 6 }}>€{hourlyRate}</div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--amber-500)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>{t("registerProvider.jobsPerWk4")}</div>
                <div style={{ fontSize: 22, fontFamily: "var(--font-mono)", color: "#fff", fontWeight: 600, marginTop: 6 }}>€{weekly4.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--amber-500)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>{t("registerProvider.jobsPerWk8")}</div>
                <div style={{ fontSize: 22, fontFamily: "var(--font-mono)", color: "#fff", fontWeight: 600, marginTop: 6 }}>€{weekly8.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-meta">
          <div><b>4,200+</b><br />{t("registerProvider.activeProviders")}</div>
          <div><b>€62</b><br />{t("registerProvider.avgHourlyRate")}</div>
          <div><b>10%</b><br />{t("registerProvider.platformFee")}</div>
        </div>
      </div>

      <div className="auth-form-side" style={{ padding: "40px 60px" }}>
        <div className="auth-form" style={{ maxWidth: 440 }}>
          {submitted ? (
            <div className="col" style={{ gap: 16, textAlign: "center", alignItems: "center", paddingTop: 40 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--emerald-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="h1">{t("registerProvider.applicationSubmitted")}</h2>
              <p className="body muted">{t("registerProvider.applicationPending")}</p>
              <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: 8 }}>{t("registerProvider.goToSignIn")}</Link>
            </div>
          ) : (
            <>
              <div className="col" style={{ gap: 8, marginBottom: 28 }}>
                <div className="crumbs">
                  <Link to="/register" style={{ color: "inherit", textDecoration: "none" }}>{t("registerProvider.registerBreadcrumb")}</Link>
                  <span className="sep">/</span>
                  {t("registerProvider.provider")}
                </div>
                <h2 className="h1">{t("registerProvider.applyAsProvider")}</h2>
                <p className="body muted" style={{ marginTop: 4 }}>
                  {t("registerProvider.alreadyHaveAccount")}{" "}
                  <Link to="/login" style={{ color: "var(--navy-700)", fontWeight: 600, textDecoration: "none" }}>{t("registerProvider.signIn")}</Link>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="col" style={{ gap: 24 }}>
                {/* Section 1 — Account */}
                <div>
                  <div className="panel-title">
                    <span className="num">01</span>
                    <span className="label">{t("registerProvider.section01")}</span>
                    <span className="rule" />
                  </div>
                  <div className="col" style={{ gap: 16 }}>
                    <div className="row form-row" style={{ gap: 12, alignItems: "flex-start" }}>
                      <div className="field grow">
                        <label className="field-label" htmlFor="prov-first">{t("registerProvider.firstName")}</label>
                        <div className={`input-wrap${errors.firstName ? " error" : ""}`}>
                          <IconUser />
                          <input id="prov-first" className="input" placeholder="Jane" autoComplete="given-name" value={form.firstName} onChange={set("firstName")} />
                        </div>
                        {errors.firstName && <span className="field-error">{errors.firstName}</span>}
                      </div>
                      <div className="field grow">
                        <label className="field-label" htmlFor="prov-last">{t("registerProvider.lastName")}</label>
                        <div className={`input-wrap${errors.lastName ? " error" : ""}`}>
                          <IconUser />
                          <input id="prov-last" className="input" placeholder="Doe" autoComplete="family-name" value={form.lastName} onChange={set("lastName")} />
                        </div>
                        {errors.lastName && <span className="field-error">{errors.lastName}</span>}
                      </div>
                    </div>

                    <div className="field">
                      <label className="field-label" htmlFor="prov-email">{t("registerProvider.emailAddress")}</label>
                      <div className={`input-wrap${errors.email ? " error" : ""}`}>
                        <IconMail />
                        <input id="prov-email" className="input" type="email" placeholder={t("registerProvider.emailPlaceholder")} autoComplete="email" value={form.email} onChange={set("email")} />
                      </div>
                      {errors.email && <span className="field-error">{errors.email}</span>}
                    </div>

                    <div className="field">
                      <label className="field-label" htmlFor="prov-password">{t("registerProvider.password")}</label>
                      <PasswordInput id="prov-password" placeholder={t("registerProvider.passwordPlaceholder")} autoComplete="new-password" value={form.password} onChange={set("password")} hasError={Boolean(errors.password)} />
                      {form.password && (<div className={`pw-meter s${pwStrength}`}><span /><span /><span /><span /></div>)}
                      {errors.password && <span className="field-error">{errors.password}</span>}
                    </div>

                    <div className="field">
                      <label className="field-label" htmlFor="prov-phone">{t("registerProvider.phoneNumber")}</label>
                      <div className={`input-wrap${errors.phoneNumber ? " error" : ""}`}>
                        <IconPhone />
                        <input id="prov-phone" className="input" type="tel" placeholder={t("registerProvider.phonePlaceholder")} autoComplete="tel" value={form.phoneNumber} onChange={set("phoneNumber")} />
                      </div>
                      {errors.phoneNumber && <span className="field-error">{errors.phoneNumber}</span>}
                      <span className="field-hint">{t("registerProvider.phoneHint")}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2 — Location */}
                <div>
                  <div className="panel-title">
                    <span className="num">02</span>
                    <span className="label">{t("registerProvider.section02")}</span>
                    <span className="rule" />
                  </div>
                  <p className="field-hint" style={{ marginBottom: 10 }}>{t("registerProvider.locationHint")}</p>

                  <div className="row form-row" style={{ gap: 12, alignItems: "flex-start", marginTop: 12 }}>
                    <div className="field" style={{ flex: 3 }}>
                      <label className="field-label" htmlFor="prov-street">{t("registerProvider.streetName")}</label>
                      <div className={`input-wrap${errors.locationStreetName ? " error" : ""}`}>
                        <input id="prov-street" className="input" placeholder={t("registerProvider.streetNamePlaceholder")} value={streetName} onChange={(e) => setStreetName(e.target.value)} autoComplete="address-line1" />
                      </div>
                      {errors.locationStreetName && <span className="field-error">{errors.locationStreetName}</span>}
                    </div>
                    <div className="field" style={{ flex: 1, minWidth: 0 }}>
                      <label className="field-label" htmlFor="prov-streetno">{t("registerProvider.streetNo")}</label>
                      <div className="input-wrap">
                        <input id="prov-streetno" className="input" placeholder={t("registerProvider.streetNoPlaceholder")} value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} autoComplete="address-line2" />
                      </div>
                    </div>
                  </div>

                  <div className="row form-row" style={{ gap: 12, alignItems: "flex-start", marginTop: 8 }}>
                    <div className="field" style={{ flex: 1, minWidth: 0 }}>
                      <label className="field-label" htmlFor="prov-postal">{t("registerProvider.postalCode")}</label>
                      <div className={`input-wrap${errors.locationPostalCode ? " error" : ""}`}>
                        <input id="prov-postal" className="input" placeholder={t("registerProvider.postalCodePlaceholder")} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} autoComplete="postal-code" />
                      </div>
                      {errors.locationPostalCode && <span className="field-error">{errors.locationPostalCode}</span>}
                    </div>
                    <div className="field" style={{ flex: 3 }}>
                      <label className="field-label" htmlFor="prov-city">{t("registerProvider.city")}</label>
                      <div className={`input-wrap${errors.locationCity ? " error" : ""}`}>
                        <input id="prov-city" className="input" placeholder={t("registerProvider.cityPlaceholder")} value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
                      </div>
                      {errors.locationCity && <span className="field-error">{errors.locationCity}</span>}
                    </div>
                  </div>

                  <div className="row form-row" style={{ gap: 12, alignItems: "flex-start", marginTop: 8 }}>
                    <div className="field" style={{ flex: 1 }}>
                      <label className="field-label" htmlFor="prov-country">{t("registerProvider.country")}</label>
                      <div className={`input-wrap${errors.locationCountry ? " error" : ""}`}>
                        <input id="prov-country" className="input" placeholder={t("registerProvider.countryPlaceholder")} value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country-name" />
                      </div>
                      {errors.locationCountry && <span className="field-error">{errors.locationCountry}</span>}
                    </div>
                  </div>
                </div>

                {/* Section 3 — Trades */}
                <div>
                  <div className="panel-title">
                    <span className="num">03</span>
                    <span className="label">{t("registerProvider.section03")}</span>
                    <span className="rule" />
                  </div>
                  <p className="field-hint" style={{ marginBottom: 10 }}>{t("registerProvider.selectAllThatApply")}</p>
                  <div className="trade-grid">
                    {TRADES_DATA.map((trade) => (
                      <button key={trade.id} type="button" className="trade-chip" aria-pressed={selectedTrades.includes(trade.id) ? "true" : "false"} onClick={() => toggleTrade(trade.id)}>
                        <span style={{ fontSize: 14 }}>{trade.icon}</span>
                        {t(`registerProvider.trades.${trade.key}`)}
                      </button>
                    ))}
                  </div>
                  {errors.trades && <span className="field-error" style={{ marginTop: 8 }}>{errors.trades}</span>}
                </div>

                {/* Section 4 — Experience & coverage */}
                <div>
                  <div className="panel-title">
                    <span className="num">04</span>
                    <span className="label">{t("registerProvider.section04")}</span>
                    <span className="rule" />
                  </div>
                  <div className="row form-row" style={{ gap: 12, alignItems: "flex-start" }}>
                    <div className="field grow">
                      <label className="field-label" htmlFor="prov-years">{t("registerProvider.yearsOfExperience")}</label>
                      <div className={`input-wrap${errors.yearsOfExperience ? " error" : ""}`}>
                        <input id="prov-years" className="input" type="number" min={0} max={80} step={1} placeholder={t("registerProvider.yearsPlaceholder")} value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} />
                      </div>
                      {errors.yearsOfExperience && <span className="field-error">{errors.yearsOfExperience}</span>}
                    </div>
                    <div className="field grow">
                      <label className="field-label" htmlFor="prov-radius">{t("registerProvider.serviceRadius")}</label>
                      <select id="prov-radius" className="fselect" value={radius} onChange={(e) => setRadius(e.target.value)}>
                        <option value="">{t("registerProvider.selectRadius")}</option>
                        <option value="10">{t("registerProvider.upTo10km")}</option>
                        <option value="25">{t("registerProvider.upTo25km")}</option>
                        <option value="50">{t("registerProvider.upTo50km")}</option>
                        <option value="100">{t("registerProvider.upTo100km")}</option>
                        <option value="500">{t("registerProvider.upTo500km")}</option>
                      </select>
                      {errors.serviceRadiusKm && <span className="field-error">{errors.serviceRadiusKm}</span>}
                    </div>
                  </div>
                </div>

                {/* Section 5 — Rate */}
                <div>
                  <div className="panel-title">
                    <span className="num">05</span>
                    <span className="label">{t("registerProvider.section05")}</span>
                    <span className="rule" />
                  </div>
                  <div className="rate-row">
                    <span className="rate-big">€{hourlyRate}</span>
                    <span className="field-hint">{t("registerProvider.hourPerHour")}</span>
                  </div>
                  <input type="range" className="slider" min={20} max={200} step={5} value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} style={{ marginTop: 10 }} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span className="field-hint">€20</span>
                    <span className="field-hint">€200</span>
                  </div>
                </div>

                {/* Section 6 — Bio */}
                <div>
                  <div className="panel-title">
                    <span className="num">06</span>
                    <span className="label">{t("registerProvider.section06")}</span>
                    <span className="rule" />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="prov-bio">{t("registerProvider.shortBio")}</label>
                    <textarea id="prov-bio" className="input" placeholder={t("registerProvider.bioPlaceholder")} value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={BIO_MAX} style={{ minHeight: 96, padding: "10px 12px", lineHeight: 1.5, resize: "vertical" }} />
                    <div className="row" style={{ justifyContent: "space-between", marginTop: 4 }}>
                      {errors.bio ? <span className="field-error">{errors.bio}</span> : <span className="field-hint">{t("registerProvider.bioVisible")}</span>}
                      <span className="field-hint">{bio.length} / {BIO_MAX}</span>
                    </div>
                  </div>
                </div>

                <p className="field-hint" style={{ background: "var(--slate-50)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", lineHeight: 1.6 }}>
                  <strong>{t("common.note")}:</strong> {t("registerProvider.adminReviewNote")}
                </p>

                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? t("registerProvider.submittingApplication") : t("registerProvider.submitApplication")}
                </button>

                <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6 }}>
                  {t("registerProvider.agreeToTerms")}{" "}
                  <a href="#" style={{ color: "var(--navy-700)", textDecoration: "none" }}>{t("registerProvider.terms")}</a>
                  {" "}{t("registerProvider.and")}{" "}
                  <a href="#" style={{ color: "var(--navy-700)", textDecoration: "none" }}>{t("registerProvider.privacyPolicy")}</a>.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
