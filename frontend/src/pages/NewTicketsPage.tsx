import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import type { TicketPriority, ServiceCategory } from "@/domain/ticket";
import type { Provider } from "@/domain/admin";
import { useCreateTicketMutation } from "@/hooks/useCreateTicketMutation";
import { useActiveCategoriesQuery } from "@/hooks/useActiveCategoriesQuery";
import { useToast } from "@/components/ui/toast";
import { ProviderAvailabilityPicker } from "@/components/ticket/ProviderAvailabilityPicker";

type Urgency = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type ProviderMode = "SPECIFIC" | "OPEN";

function formatCategoryLabel(value: string): string {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const urgencySummary: Record<Urgency, { label: string; color: string }> = {
  LOW: { label: "Low · flexible", color: "var(--slate-500)" },
  MEDIUM: { label: "Medium · few days", color: "var(--blue-600)" },
  HIGH: { label: "High · today", color: "var(--amber-500)" },
  CRITICAL: { label: "Critical · now", color: "var(--red-600)" },
};

export function NewTicketPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { notify } = useToast();

  type FormState = {
    title?: string;
    category?: ServiceCategory | "";
    description?: string;
    location?: string;
    urgency?: Urgency | "";
    note?: string;
    providerMode?: ProviderMode;
  };
  const routerState = routerLocation.state as { selectedProvider?: Provider; formState?: FormState } | null;
  const incomingProvider = routerState?.selectedProvider ?? null;
  const savedForm = routerState?.formState;

  const [title, setTitle] = useState(savedForm?.title ?? "");
  const [category, setCategory] = useState<ServiceCategory | "">(savedForm?.category ?? "");
  const [description, setDescription] = useState(savedForm?.description ?? "");
  const [location, setLocation] = useState(savedForm?.location ?? "");
  const [urgency, setUrgency] = useState<Urgency | "">(savedForm?.urgency ?? "");
  const [providerMode, setProviderMode] = useState<ProviderMode>(
    incomingProvider ? "SPECIFIC" : (savedForm?.providerMode ?? "OPEN")
  );
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(incomingProvider);
  const [requestedStartAt, setRequestedStartAt] = useState<string | null>(null);
  const [requestedEndAt, setRequestedEndAt] = useState<string | null>(null);
  const [note, setNote] = useState(savedForm?.note ?? "");

  const ticketId = useMemo(() => "", []);
  const createTicketMutation = useCreateTicketMutation();
  const { data: activeCategories = [], isLoading: loadingCategories } = useActiveCategoriesQuery();

  const canSubmit = Boolean(title.trim() && description.trim() && location.trim() && urgency && category);

  // Monitor mutation success and navigate
  useEffect(() => {
    if (createTicketMutation.isSuccess) {
      notify("Ticket successfully submitted! ✓", "success");
      // Redirect to dashboard after 1.5 seconds
      setTimeout(() => {
        navigate("/dashboard/user");
      }, 1500);
    }
  }, [createTicketMutation.isSuccess, navigate, notify]);

  // Monitor mutation errors
  useEffect(() => {
    if (createTicketMutation.isError) {
      notify("Failed to submit ticket. Please try again.", "error");
    }
  }, [createTicketMutation.isError, notify]);

  async function handleSubmit() {
    if (!canSubmit || !urgency) {
      return;
    }

    const payload = {
      serviceType: title.trim(),
      category: category as ServiceCategory,
      description: description.trim(),
      location: location.trim(),
      priority: urgency as TicketPriority,
      assignedProviderId: providerMode === "SPECIFIC" && selectedProvider ? selectedProvider.id : null,
      requestedStartAt: providerMode === "SPECIFIC" && requestedStartAt ? requestedStartAt : null,
      requestedEndAt: providerMode === "SPECIFIC" && requestedEndAt ? requestedEndAt : null,
    };

    try {
      await createTicketMutation.mutateAsync(payload);
    } catch {
      // Error state is handled by the isError useEffect above
    }
  }

  return (
    <main className="container page new-ticket-page">
      <div className="crumbs">
        <Link to="/dashboard/user">Dashboard</Link> <span className="sep">/</span> File a ticket
      </div>

      <div className="new-ticket-heading">
        <span className="eyebrow">06 · Open a ticket</span>
        <h1 className="display-2 new-ticket-title">
          Tell us what&apos;s <span className="amber-underline">broken</span>.<br />
          Three sections. About 90 seconds.
        </h1>
      </div>

      <div className="new-ticket-grid">
        <div>
          <section className="form-section">
            <div className="head">
              <span className="num">01</span>
              <div>
                <div className="title">What&apos;s broken?</div>
                <div className="sub">A short summary helps us route it quickly. Be specific.</div>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="field-label">Title</label>
                <div className="input-wrap">
                  <input
                    className="input"
                    placeholder="e.g. Kitchen sink leaking under cabinet"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <span className="field-hint">A one-sentence headline — providers see this first.</span>
              </div>

              <div className="field">
                <label className="field-label">Category</label>
                <select
                  className="fselect"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                  disabled={loadingCategories}
                >
                  <option value="" disabled>
                    {loadingCategories ? "Loading…" : "Select a category"}
                  </option>
                  {activeCategories.map((value) => (
                    <option key={value} value={value}>
                      {formatCategoryLabel(value)}
                    </option>
                  ))}
                </select>
                <span className="field-hint">Choose the type of service needed.</span>
              </div>

              <div className="field">
                <label className="field-label">Description</label>
                <textarea
                  className="textarea"
                  placeholder="What's happening, where, when did it start?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <span className="field-hint">Mention anything you&apos;ve already tried.</span>
              </div>

              <div className="field">
                <label className="field-label">
                  Photos &amp; attachments <span className="muted new-ticket-optional">— optional but encouraged</span>
                </label>
                <div className="dropzone" role="button" tabIndex={0}>
                  <strong>Drop photos here or click to browse</strong>
                  <span className="dropzone-note">
                    Providers accept critical tickets <b>3.2× faster</b> with photos.
                  </span>
                </div>

                <div className="row gap-8" style={{ marginTop: 8 }}>
                  <div className="photo-placeholder new-ticket-photo">photo 01</div>
                  <div className="photo-placeholder new-ticket-photo">photo 02</div>
                </div>
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="head">
              <span className="num">02</span>
              <div>
                <div className="title">Where &amp; how urgent?</div>
                <div className="sub">This decides who sees it, when, and how fast they need to be there.</div>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="field-label">Location</label>
                <div className="input-wrap">
                  <input
                    className="input"
                    value={location}
                    placeholder="e.g. Oakwood HQ · Bldg C · Floor 2 · Kitchen"
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <span className="field-hint">Be as specific as you can — building, floor, room.</span>
              </div>

              <div className="field">
                <label className="field-label">Urgency</label>
                <div className="urgency-grid">
                  <UrgCard
                    level="LOW"
                    active={urgency === "LOW"}
                    onClick={() => setUrgency("LOW")}
                    label="01 · Low"
                    name="Whenever's good"
                    hint="No deadline. Bundle with other work."
                  />
                  <UrgCard
                    level="MEDIUM"
                    active={urgency === "MEDIUM"}
                    onClick={() => setUrgency("MEDIUM")}
                    label="02 · Medium"
                    name="Within a few days"
                    hint="Annoying but workable."
                  />
                  <UrgCard
                    level="HIGH"
                    active={urgency === "HIGH"}
                    onClick={() => setUrgency("HIGH")}
                    label="03 · High"
                    name="Today, ideally"
                    hint="Blocking work or comfort."
                  />
                  <UrgCard
                    level="CRITICAL"
                    active={urgency === "CRITICAL"}
                    onClick={() => setUrgency("CRITICAL")}
                    label="04 · Critical"
                    name="Right now"
                    hint="Safety risk or active damage."
                  />
                </div>
              </div>

            </div>
          </section>

          <section className="form-section">
            <div className="head">
              <span className="num">03</span>
              <div>
                <div className="title">Who do you want?</div>
                <div className="sub">Pick a provider, or let us auto-match the best fit.</div>
              </div>
            </div>

            <div className="form-grid">
              <div className="segment new-ticket-segment">
                <button
                  aria-pressed={providerMode === "SPECIFIC"}
                  type="button"
                  onClick={() => {
                    setProviderMode("SPECIFIC");
                    setSelectedProvider(null);
                  }}
                >
                  Specific provider
                </button>
                <button
                  aria-pressed={providerMode === "OPEN"}
                  type="button"
                  onClick={() => {
                    setProviderMode("OPEN");
                    setSelectedProvider(null);
                  }}
                >
                  Open to anyone
                </button>
              </div>

              {providerMode === "SPECIFIC" ? (
                selectedProvider ? (
                  <>
                  <div className="card provider-card">
                    <div
                      className="avatar"
                      style={{
                        width: 36, height: 36, fontSize: 13,
                        background: "var(--amber-500)", color: "var(--navy-900)",
                        borderRadius: "50%", display: "grid", placeItems: "center",
                        fontWeight: 700, flexShrink: 0,
                      }}
                    >
                      {((selectedProvider.firstName?.[0] ?? "") + (selectedProvider.lastName?.[0] ?? "")).toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="row" style={{ gap: 8 }}>
                        <b className="new-ticket-provider-name">
                          {[selectedProvider.firstName, selectedProvider.lastName].filter(Boolean).join(" ") || selectedProvider.email}
                        </b>
                        <span className="verified-md">✓ Selected</span>
                      </div>
                      <div className="muted new-ticket-provider-meta">
                        {selectedProvider.categories.map((c) =>
                          c.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())
                        ).join(", ")}
                        {selectedProvider.pricePerHour != null ? ` · $${selectedProvider.pricePerHour}/hr` : ""}
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      onClick={() => {
                        setRequestedStartAt(null);
                        setRequestedEndAt(null);
                        navigate("/providers", { state: { formState: { title, category, description, location, urgency, note, providerMode } } });
                      }}
                    >
                      Change
                    </button>
                  </div>

                  {/* Schedule a time with this provider */}
                  <div className="field" style={{ marginTop: 12 }}>
                    <label className="field-label">
                      Request a time{" "}
                      <span className="muted new-ticket-optional">— optional</span>
                    </label>
                    <span className="field-hint" style={{ display: "block", marginBottom: 10 }}>
                      Choose one of the provider's available slots. They'll confirm when they accept your ticket.
                    </span>
                    <ProviderAvailabilityPicker
                      providerId={selectedProvider.id}
                      selectedStart={requestedStartAt}
                      selectedEnd={requestedEndAt}
                      onSelect={(s, e) => {
                        setRequestedStartAt(s);
                        setRequestedEndAt(e);
                      }}
                    />
                    {requestedStartAt && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ marginTop: 8, fontSize: 12 }}
                        onClick={() => { setRequestedStartAt(null); setRequestedEndAt(null); }}
                      >
                        ✕ Clear selection
                      </button>
                    )}
                  </div>
                  </>
                ) : (
                  <div className="card provider-card" style={{ gridTemplateColumns: "1fr auto", alignItems: "center" }}>
                    <div className="muted" style={{ fontSize: 13.5 }}>
                      No provider selected yet. Browse and pick one from the provider directory.
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      type="button"
                      onClick={() => navigate("/providers", { state: { formState: { title, category, description, location, urgency, note, providerMode } } })}
                    >
                      Browse providers →
                    </button>
                  </div>
                )
              ) : (
                <div className="card provider-card">
                  <div style={{ width: 36, height: 36, background: "var(--slate-100)", color: "var(--slate-500)", borderRadius: 18, display: "grid", placeItems: "center", border: "1.5px dashed var(--slate-300)", fontSize: 16, flexShrink: 0 }}>?</div>
                  <div>
                    <b className="new-ticket-provider-name">Open to anyone</b>
                    <div className="muted new-ticket-provider-meta">
                      All available providers will see this ticket and can assign themselves.
                    </div>
                  </div>
                </div>
              )}

              <div className="field">
                <label className="field-label">
                  Note for the provider <span className="muted new-ticket-optional">— optional</span>
                </label>
                <textarea
                  className="textarea"
                  placeholder="Anything they should know before they arrive?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </section>

          <div className="row" style={{ marginTop: 24, gap: 12 }}>
            <div className="row gap-12">
              <Link to="/dashboard/user" className="btn btn-ghost">Back to Dashboard</Link>
              <Link to="/" className="btn btn-ghost">Home</Link>
            </div>
            <span className="grow" />
            <button className="btn btn-secondary" type="button">Save as draft</button>
            <button className="btn btn-primary btn-lg" type="button" onClick={handleSubmit} disabled={!canSubmit || createTicketMutation.isPending}>
              {createTicketMutation.isPending ? "Submitting..." : "Submit ticket"}
            </button>
          </div>
        </div>

        <aside>
          <div className="summary-card">
            <h4>Live summary</h4>

            <div className="summary-row">
              <span className="key">Ticket</span>
              <span className="val mono">{ticketId || "—"}</span>
            </div>
            <div className="summary-row">
              <span className="key">Title</span>
              <span className="val">{title || "—"}</span>
            </div>
            <div className="summary-row">
              <span className="key">Category</span>
              <span className="val">{category ? formatCategoryLabel(category) : "—"}</span>
            </div>
            <div className="summary-row">
              <span className="key">Urgency</span>
              <span className="val" style={{ color: urgency ? urgencySummary[urgency].color : "rgba(255,255,255,0.55)" }}>
                {urgency ? urgencySummary[urgency].label : "—"}
              </span>
            </div>
            <div className="summary-row">
              <span className="key">Location</span>
              <span className="val new-ticket-summary-location">{location || "—"}</span>
            </div>
            <div className="summary-row">
              <span className="key">Provider</span>
              <span className="val">
                {providerMode === "SPECIFIC" && selectedProvider
                  ? [selectedProvider.firstName, selectedProvider.lastName].filter(Boolean).join(" ") || selectedProvider.email
                  : providerMode === "SPECIFIC"
                    ? "Not selected"
                    : "Open to anyone"}
              </span>
            </div>
            {providerMode === "SPECIFIC" && (
              <div className="summary-row">
                <span className="key">Requested time</span>
                <span className="val mono" style={{ fontSize: 12 }}>
                  {requestedStartAt
                    ? (() => {
                        const s = new Date(requestedStartAt);
                        const e = requestedEndAt ? new Date(requestedEndAt) : null;
                        const pad = (n: number) => String(n).padStart(2,"0");
                        const fmtT = (d: Date) => `${d.getHours()}:${pad(d.getMinutes())}`;
                        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                        return `${months[s.getMonth()]} ${s.getDate()} · ${fmtT(s)}${e ? `–${fmtT(e)}` : ""}`;
                      })()
                    : "—"}
                </span>
              </div>
            )}
            <div className="summary-row new-ticket-summary-last-row">
              <span className="key">Photos</span>
              <span className="val mono">—</span>
            </div>

            <div className="est">
              <div className="est-row">Estimated cost</div>
              <div className="est-big">TBD</div>
              <div className="est-row new-ticket-est-gap">Estimated response</div>
              <div className="est-big">TBD</div>
            </div>

            <p className="new-ticket-est-note">
              Final cost confirmed by provider before any work starts. You can decline the quote at no charge.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function UrgCard(props: {
  level: Urgency;
  active: boolean;
  onClick: () => void;
  label: string;
  name: string;
  hint: string;
}) {
  const className =
    "urg-card " +
    (props.level === "LOW"
      ? "low"
      : props.level === "MEDIUM"
        ? "medium"
        : props.level === "HIGH"
          ? "high"
          : "critical");

  return (
    <button type="button" className={className} aria-pressed={props.active} onClick={props.onClick}>
      <span className="urg-label">
        <span className="urg-dot" aria-hidden="true" />
        {props.label}
      </span>
      <span className="urg-name">{props.name}</span>
      <span className="urg-hint">{props.hint}</span>
    </button>
  );
}
