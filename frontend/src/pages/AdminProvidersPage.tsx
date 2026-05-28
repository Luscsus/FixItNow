import { useState } from "react";
import {
  useApproveProviderMutation,
  useDeclineProviderMutation,
  usePendingProviders,
} from "@/hooks/useAdminProviders";
import type { Provider, ServiceCategory } from "@/domain/admin";

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  PLUMBING: "Plumbing",
  ELECTRICAL: "Electrical",
  CARPENTRY: "Carpentry",
  PAINTING: "Painting",
  CLEANING: "Cleaning",
  GARDENING: "Gardening",
  MOVING: "Moving",
  APPLIANCE_REPAIR: "Appliance Repair",
  HVAC: "HVAC",
  ROOFING: "Roofing",
  LOCKSMITH: "Locksmith",
  PEST_CONTROL: "Pest Control",
  TUTORING: "Tutoring",
  IT_SUPPORT: "IT Support",
  OTHER: "Other",
};

function initials(p: Provider) {
  return `${p.firstName[0] ?? ""}${p.lastName[0] ?? ""}`.toUpperCase();
}

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

const AVATAR_COLORS = [
  "#142C5E", "#047857", "#B45309", "#2563EB",
  "#7C3AED", "#DC2626", "#0891B2", "#65A30D",
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function AdminProvidersPage() {
  const { data: providers = [], isLoading, error } = usePendingProviders();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const approve = useApproveProviderMutation();
  const decline = useDeclineProviderMutation();

  const selected: Provider | null =
    providers.find((p) => p.id === selectedId) ?? providers[0] ?? null;

  function handleApprove() {
    if (!selected) return;
    approve.mutate(selected.id);
  }

  function handleDeclineSubmit() {
    if (!selected || !declineReason.trim()) return;
    decline.mutate(
      { id: selected.id, reason: declineReason.trim() },
      {
        onSuccess: () => {
          setDeclineOpen(false);
          setDeclineReason("");
        },
      },
    );
  }

  const isPending = approve.isPending || decline.isPending;

  return (
    <>
      {/* Hero */}
      <section style={{
        background: "var(--navy-900)",
        backgroundImage: "radial-gradient(ellipse at 100% 0%, rgba(245,158,11,0.22), transparent 55%), radial-gradient(ellipse at 0% 100%, rgba(42,75,160,0.4), transparent 60%)",
        color: "#fff",
        padding: "28px 0 32px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "56px 56px", pointerEvents: "none",
        }} />
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", position: "relative" }}>
          <span className="eyebrow" style={{ color: "var(--amber-500)" }}>Console · Provider review</span>
          <h1 style={{ fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 700, letterSpacing: "-0.025em", margin: "6px 0 8px", color: "#fff", lineHeight: 1.05 }}>
            <b style={{ color: "var(--amber-500)" }}>{providers.length}</b> provider{providers.length !== 1 ? "s" : ""} waiting on review
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: 0, maxWidth: 560 }}>
            Review provider applications and approve or decline them. Approved providers become immediately active on the platform.
          </p>
        </div>
      </section>

      {/* Main two-column layout */}
      <main className={`admin-providers-main${selected ? " has-selected" : ""}`} style={{
      <main style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        borderTop: "1px solid var(--border)",
        minHeight: 0,
      }}>
        {/* LEFT: Queue */}
        <aside className="admin-providers-queue" style={{
        <aside style={{
          background: "var(--card)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}>
          {/* Queue header */}
          <div style={{
            position: "sticky", top: 0,
            background: "var(--card)",
            borderBottom: "1px solid var(--border)",
            padding: "14px 18px",
            zIndex: 1,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Pending applications
              </h2>
              <span style={{
                background: "var(--amber-500)", color: "var(--navy-900)",
                fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
                padding: "3px 8px", borderRadius: 5, letterSpacing: "0.04em",
              }}>
                {providers.length}
              </span>
            </div>
          </div>

          {/* Queue items */}
          {isLoading && (
            <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
              Loading applications…
            </div>
          )}
          {error && (
            <div style={{ padding: 32, textAlign: "center", color: "var(--red-600)", fontSize: 14 }}>
              Failed to load applications.
            </div>
          )}
          {!isLoading && providers.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
              No pending applications.
            </div>
          )}
          {providers.map((p) => {
            const isSelected = (selected?.id === p.id);
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px 1fr",
                  gap: 12,
                  padding: "16px 18px",
                  cursor: "pointer",
                  position: "relative",
                  background: isSelected ? "var(--navy-50)" : "var(--card)",
                  boxShadow: isSelected ? "inset 3px 0 0 var(--navy-700)" : "none",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  textAlign: "left",
                  width: "100%",
                  transition: "background 0.12s",
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: avatarColor(p.id), color: "#fff",
                  fontSize: 13, fontWeight: 600,
                  display: "grid", placeItems: "center",
                  flexShrink: 0,
                  overflow: "hidden",
                }}>
                  {p.profilePictureUrl
                    ? <img src={p.profilePictureUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : initials(p)}
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2, color: "var(--text)" }}>
                    {p.firstName} {p.lastName}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 4 }}>
                    {p.categories.slice(0, 2).map((c) => CATEGORY_LABELS[c]).join(" · ")}
                    {p.categories.length > 2 && ` +${p.categories.length - 2}`}
                    {p.yearsOfExperience != null && ` · ${p.yearsOfExperience} yr${p.yearsOfExperience !== 1 ? "s" : ""}`}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-muted)", letterSpacing: "0.04em", marginTop: 6 }}>
                    Submitted {timeAgo(p.createdAt)}
                  </div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* RIGHT: Detail */}
        {selected ? (
          <section className="admin-provider-detail" style={{ padding: "28px 32px 80px", overflowY: "auto", position: "relative" }}>
            <button
              type="button"
              className="admin-back-btn mobile-only"
              onClick={() => setSelectedId(null)}
              aria-label="Back to applications"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to queue
            </button>
          <section style={{ padding: "28px 32px 80px", overflowY: "auto", position: "relative" }}>
            {/* Breadcrumbs */}
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 18 }}>
              <span>Provider applications</span>
              <span style={{ margin: "0 8px", opacity: 0.5 }}>/</span>
              <span style={{ color: "var(--text)" }}>{selected.firstName} {selected.lastName}</span>
            </div>

            {/* Provider header */}
            <div style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: 18, alignItems: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: 14,
                background: avatarColor(selected.id), color: "#fff",
                fontSize: 20, fontWeight: 600,
                display: "grid", placeItems: "center",
                overflow: "hidden",
              }}>
                {selected.profilePictureUrl
                  ? <img src={selected.profilePictureUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : initials(selected)}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, letterSpacing: "-0.02em" }}>
                  {selected.firstName} {selected.lastName}
                </h2>
                <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    {selected.categories.map((c) => CATEGORY_LABELS[c]).join(", ")}
                  </span>
                  <span style={{ width: 3, height: 3, background: "var(--slate-300)", borderRadius: 2, display: "inline-block" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                    Submitted {timeAgo(selected.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 01: Personal details */}
            <div className="panel-title" style={{ marginTop: 32 }}>
              <span className="num">01</span>
              <span className="label">Personal details</span>
              <span className="rule" />
            </div>
            <div className="admin-detail-grid" style={{
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 14, overflow: "hidden",
            }}>
              {[
                { label: "Full name", value: `${selected.firstName} ${selected.lastName}` },
                { label: "Email", value: selected.email, mono: true },
                { label: "Phone", value: selected.phoneNumber ?? "—", mono: true },
              ].map((f, i) => (
                <div key={i} style={{
                  padding: "16px 20px",
                  borderLeft: i > 0 ? "1px solid var(--border)" : "none",
                }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
                    {f.label}
                  </div>
                  <div style={{ marginTop: 8, fontWeight: 500, letterSpacing: "-0.005em", fontFamily: f.mono ? "var(--font-mono)" : undefined, fontSize: f.mono ? 13 : 14.5 }}>
                    {f.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Section 02: Service details */}
            <div className="panel-title" style={{ marginTop: 32 }}>
              <span className="num">02</span>
              <span className="label">Service details</span>
              <span className="rule" />
            </div>
            <div className="admin-detail-grid" style={{
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 14, overflow: "hidden",
            }}>
              {[
                {
                  label: "Trades",
                  value: selected.categories.map((c) => CATEGORY_LABELS[c]).join(", "),
                },
                {
                  label: "Experience",
                  value: selected.yearsOfExperience != null
                    ? `${selected.yearsOfExperience} year${selected.yearsOfExperience !== 1 ? "s" : ""}`
                    : "—",
                },
                {
                  label: "Price / hour",
                  value: selected.pricePerHour != null ? `$${selected.pricePerHour}/hr` : "—",
                  mono: true,
                },
                {
                  label: "Service radius",
                  value: selected.serviceRadiusKm != null ? `${selected.serviceRadiusKm} km` : "—",
                },
                {
                  label: "Street",
                  value: [selected.locationStreetName, selected.locationStreetNumber].filter(Boolean).join(" ") || "—",
                },
                {
                  label: "City",
                  value: [selected.locationCity, selected.locationPostalCode].filter(Boolean).join(" ") || "—",
                },
                {
                  label: "Country",
                  value: selected.locationCountry ?? "—",
                },
                {
                  label: "Location (lat)",
                  value: selected.locationLat != null ? String(selected.locationLat) : "—",
                  mono: true,
                },
                {
                  label: "Location (lon)",
                  value: selected.locationLon != null ? String(selected.locationLon) : "—",
                  mono: true,
                },
              ].map((f, i) => {
                const col = i % 3;
                const row = Math.floor(i / 3);
                const totalRows = 2;
                return (
                  <div key={i} style={{
                    padding: "16px 20px",
                    borderLeft: col > 0 ? "1px solid var(--border)" : "none",
                    borderBottom: row < totalRows - 1 ? "1px solid var(--border)" : "none",
                  }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
                      {f.label}
                    </div>
                    <div style={{ marginTop: 8, fontWeight: 500, letterSpacing: "-0.005em", fontFamily: f.mono ? "var(--font-mono)" : undefined, fontSize: f.mono ? 13 : 14.5 }}>
                      {f.value}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Section 03: Bio */}
            {selected.bio && (
              <>
                <div className="panel-title" style={{ marginTop: 32 }}>
                  <span className="num">03</span>
                  <span className="label">About the provider</span>
                  <span className="rule" />
                </div>
                <div className="card card-pad" style={{ background: "var(--slate-50)" }}>
                  <p style={{ margin: "0 0 14px", maxWidth: 720, fontStyle: "italic", color: "var(--text)", fontSize: 17, lineHeight: 1.55 }}>
                    "{selected.bio}"
                  </p>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Bio · {selected.bio.length} chars
                  </div>
                </div>
              </>
            )}

            {/* Decision bar */}
            <div style={{
              position: "sticky", bottom: 0,
              background: "var(--white)",
              borderTop: "1px solid var(--border)",
              boxShadow: "0 -12px 24px rgba(15,23,42,0.06)",
              padding: "16px 0",
              display: "flex", alignItems: "center", gap: 12,
              marginTop: 32,
              marginLeft: -32, marginRight: -32,
              paddingLeft: 32, paddingRight: 32,
            }}>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, color: "var(--text-muted)" }}>
                  Decision
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 500, marginTop: 4 }}>
                  {selected.firstName} {selected.lastName} · {selected.email}
                </div>
              </div>
              <span style={{ flex: 1 }} />
              <button
                className="btn"
                onClick={() => { setDeclineOpen(true); setDeclineReason(""); }}
                disabled={isPending}
                style={{ background: "var(--red-100)", color: "var(--red-700)", border: "1px solid #FCA5A5" }}
              >
                ✕ Decline
              </button>
              <button
                className="btn btn-lg"
                onClick={handleApprove}
                disabled={isPending}
                style={{ background: "var(--emerald-600)", color: "#fff", boxShadow: "0 1px 0 rgba(255,255,255,0.08) inset, 0 1px 2px rgba(5,150,105,0.3)" }}
              >
                {approve.isPending ? "Approving…" : "✓ Approve & activate →"}
              </button>
            </div>
          </section>
        ) : (
          !isLoading && (
            <section style={{ display: "grid", placeItems: "center", color: "var(--text-muted)", fontSize: 15 }}>
              No pending applications to review.
            </section>
          )
        )}
      </main>

      {/* Decline modal */}
      {declineOpen && selected && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(15,23,42,0.45)",
            display: "grid", placeItems: "center",
            padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeclineOpen(false); }}
        >
          <div style={{
            background: "var(--white)",
            borderRadius: 20,
            padding: 32,
            width: "100%", maxWidth: 480,
            boxShadow: "var(--shadow-lg)",
          }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>
              Decline application
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
              Provide a reason for declining <strong>{selected.firstName} {selected.lastName}</strong>'s application. This will be sent to the applicant by email.
            </p>
            <div className="field">
              <label className="field-label" htmlFor="decline-reason">Reason for declining</label>
              <textarea
                id="decline-reason"
                className="textarea"
                rows={4}
                placeholder="e.g. Missing required insurance documentation…"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                maxLength={1000}
              />
              <span className="field-hint">{declineReason.length} / 1000</span>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button
                className="btn btn-secondary"
                onClick={() => setDeclineOpen(false)}
                disabled={decline.isPending}
              >
                Cancel
              </button>
              <button
                className="btn"
                onClick={handleDeclineSubmit}
                disabled={!declineReason.trim() || decline.isPending}
                style={{ background: "var(--red-100)", color: "var(--red-700)", border: "1px solid #FCA5A5" }}
              >
                {decline.isPending ? "Declining…" : "Decline application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
