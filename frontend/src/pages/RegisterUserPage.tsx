import { useState } from "react";
import { Link } from "react-router-dom";
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

export function RegisterUserPage() {
  const registerMutation = useRegisterMutation();

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const pwStrength = passwordStrength(form.password);
  const canSubmit = Object.values(form).every((v) => v.trim() !== "");

  const set = (field: Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

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

  return (
    <div className="auth">
      {/* Left art panel */}
      <div className="auth-art">
        <div className="auth-art-grid" />

        <Link to="/" className="auth-brand-inv">
          <span className="brand-mark" aria-hidden="true" />
          <span>FixIt<span className="brand-now">Now</span></span>
        </Link>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 40, position: "relative", zIndex: 1, marginTop: 56 }}>
          <div>
            <p className="crumbs" style={{ color: "rgba(255,255,255,0.45)", marginBottom: 20 }}>
              For homeowners & tenants
            </p>
            <h1 className="display" style={{ color: "#fff", fontSize: "clamp(42px,4.8vw,68px)" }}>
              Report it.<br />
              Track it.<br />
              <span style={{ color: "var(--amber-500)" }}>Fixed.</span>
            </h1>
          </div>

          <div className="col" style={{ gap: 0 }}>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">01</span>
              <span className="fbody"><b>Instant matching.</b> AI routes your request to the right verified trade.</span>
            </div>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">02</span>
              <span className="fbody"><b>Live tracking.</b> See provider status and ETAs in real time.</span>
            </div>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">03</span>
              <span className="fbody"><b>Escrow payments.</b> Money only releases when you approve the work.</span>
            </div>
            <div className="feature-divider" />
          </div>
        </div>

        <div className="auth-meta">
          <div><b>12k+</b><br />jobs completed</div>
          <div><b>4.9★</b><br />avg. rating</div>
          <div><b>Free</b><br />to sign up</div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-side">
        <div className="auth-form">
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
              <h2 className="h1">You're in!</h2>
              <p className="body muted" style={{ maxWidth: 300 }}>
                Your account is ready. Sign in to get started.
              </p>
              <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
                Sign in now →
              </Link>
              <div style={{
                marginTop: 4,
                padding: "10px 14px",
                borderRadius: 10,
                background: "var(--amber-50, #fffbeb)",
                border: "1px solid var(--amber-200, #fde68a)",
                fontSize: 12.5,
                color: "var(--amber-800, #92400e)",
                lineHeight: 1.5,
                maxWidth: 300,
                textAlign: "left",
              }}>
                <strong>Optional:</strong> a verification email was sent to <strong>{form.email}</strong>.
                Confirm it anytime to get a{" "}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ verticalAlign: "middle" }}>
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {" "}verified badge on your profile.
              </div>
            </div>
          ) : (
            <>
              <div className="col" style={{ gap: 8, marginBottom: 32 }}>
                <div className="crumbs">
                  <Link to="/register" style={{ color: "inherit", textDecoration: "none" }}>Register</Link>
                  <span className="sep">/</span>
                  User
                </div>
                <h2 className="h1">Create your account</h2>
                <p className="body muted" style={{ marginTop: 4 }}>
                  Already have one?{" "}
                  <Link to="/login" style={{ color: "var(--navy-700)", fontWeight: 600, textDecoration: "none" }}>
                    Sign in →
                  </Link>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="col" style={{ gap: 20 }}>
                <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
                  <div className="field grow">
                    <label className="field-label" htmlFor="reg-first">First name</label>
                    <div className={`input-wrap${errors.firstName ? " error" : ""}`}>
                      <IconUser />
                      <input
                        id="reg-first"
                        className="input"
                        placeholder="Jane"
                        autoComplete="given-name"
                        value={form.firstName}
                        onChange={set("firstName")}
                      />
                    </div>
                    {errors.firstName && <span className="field-error">{errors.firstName}</span>}
                  </div>
                  <div className="field grow">
                    <label className="field-label" htmlFor="reg-last">Last name</label>
                    <div className={`input-wrap${errors.lastName ? " error" : ""}`}>
                      <IconUser />
                      <input
                        id="reg-last"
                        className="input"
                        placeholder="Doe"
                        autoComplete="family-name"
                        value={form.lastName}
                        onChange={set("lastName")}
                      />
                    </div>
                    {errors.lastName && <span className="field-error">{errors.lastName}</span>}
                  </div>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="reg-email">Email address</label>
                  <div className={`input-wrap${errors.email ? " error" : ""}`}>
                    <IconMail />
                    <input
                      id="reg-email"
                      className="input"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={form.email}
                      onChange={set("email")}
                    />
                  </div>
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="reg-password">Password</label>
                  <div className={`input-wrap${errors.password ? " error" : ""}`}>
                    <IconLock />
                    <input
                      id="reg-password"
                      className="input"
                      type="password"
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={set("password")}
                    />
                  </div>
                  {form.password && (
                    <div className={`pw-meter s${pwStrength}`}>
                      <span /><span /><span /><span />
                    </div>
                  )}
                  {errors.password && <span className="field-error">{errors.password}</span>}
                  <span className="field-hint">At least 8 characters. Use uppercase, numbers, and symbols for a stronger password.</span>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full btn-lg"
                  disabled={!canSubmit || registerMutation.isPending}
                  style={{ marginTop: 4 }}
                >
                  {registerMutation.isPending ? "Creating account…" : "Create account"}
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
