import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import type { TicketPriority } from "@/domain/ticket";
import { useCreateTicketMutation } from "@/hooks/useCreateTicketMutation";
import { useToast } from "@/components/ui/toast";

type Urgency = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type ProviderMode = "SPECIFIC" | "AUTOMATCH" | "OPEN";

const categories = ["Electrical", "Plumbing", "Hardware", "Software", "HVAC", "Other"];

const urgencySummary: Record<Urgency, { label: string; color: string }> = {
  LOW: { label: "Low · flexible", color: "var(--slate-500)" },
  MEDIUM: { label: "Medium · few days", color: "var(--blue-600)" },
  HIGH: { label: "High · today", color: "var(--amber-500)" },
  CRITICAL: { label: "Critical · now", color: "var(--red-600)" },
};

export function NewTicketPage() {
  const navigate = useNavigate();
  const { notify } = useToast();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [urgency, setUrgency] = useState<Urgency | "">("");
  const [preferredWindow, setPreferredWindow] = useState("");
  const [access, setAccess] = useState("");
  const [providerName] = useState("");
  const [providerMode, setProviderMode] = useState<ProviderMode>("AUTOMATCH");
  const [note, setNote] = useState("");

  const ticketId = useMemo(() => "", []);
  const createTicketMutation = useCreateTicketMutation();

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
      description: description.trim(),
      location: location.trim(),
      priority: urgency as TicketPriority,
    };

    await createTicketMutation.mutateAsync(payload);
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
                  className="select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
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
              <div className="row gap-16 new-ticket-loc-row">
                <div className="field grow">
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

                <div className="field new-ticket-asset-field">
                  <label className="field-label">Asset / serial #</label>
                  <div className="input-wrap">
                    <input className="input mono" placeholder="optional" />
                  </div>
                  <span className="field-hint">If it&apos;s a tagged piece of equipment.</span>
                </div>
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

              <div className="row gap-16 new-ticket-loc-row">
                <div className="field grow">
                  <label className="field-label">Preferred window</label>
                  <div className="input-wrap">
                    <input
                      className="input"
                      value={preferredWindow}
                      placeholder="e.g. Today · before 5 PM"
                      onChange={(e) => setPreferredWindow(e.target.value)}
                    />
                  </div>
                </div>

                <div className="field new-ticket-asset-field">
                  <label className="field-label">Access</label>
                  <select
                    className="select new-ticket-access"
                    value={access}
                    onChange={(e) => setAccess(e.target.value)}
                  >
                    <option value="" disabled>Select access</option>
                    <option>Someone will be on site</option>
                    <option>Use building keycode</option>
                    <option>Coordinate with front desk</option>
                  </select>
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
                  onClick={() => setProviderMode("SPECIFIC")}
                >
                  Specific provider
                </button>
                <button
                  aria-pressed={providerMode === "AUTOMATCH"}
                  type="button"
                  onClick={() => setProviderMode("AUTOMATCH")}
                >
                  Auto-match
                </button>
                <button
                  aria-pressed={providerMode === "OPEN"}
                  type="button"
                  onClick={() => setProviderMode("OPEN")}
                >
                  Open to anyone
                </button>
              </div>

              <div className="card provider-card">
                <div className="avatar new-ticket-provider-avatar">MC</div>

                <div>
                  <div className="row" style={{ gap: 8 }}>
                    <b className="new-ticket-provider-name">{providerName || "Select provider"}</b>
                    {providerName ? <span className="verified-md">✓ Verified</span> : null}
                  </div>

                  <div className="muted new-ticket-provider-meta">
                    {providerName
                      ? "Master plumber · Oakwood Pros · ★ 4.9 · responds in ~11 min · 2.3 mi"
                      : "Auto-match will pick the best fit."}
                  </div>
                </div>

                <button className="btn btn-ghost btn-sm" type="button">Change</button>
              </div>

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
              <span className="val">{category || "—"}</span>
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
              <span className="val">{providerMode === "SPECIFIC" ? providerName : "Auto-selected"}</span>
            </div>
            <div className="summary-row new-ticket-summary-last-row">
              <span className="key">Photos</span>
              <span className="val mono">02 attached</span>
            </div>

            <div className="est">
              <div className="est-row">Estimated cost</div>
              <div className="est-big">$95 - $185</div>
              <div className="est-row new-ticket-est-gap">Estimated response</div>
              <div className="est-big">~ 11 min</div>
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
