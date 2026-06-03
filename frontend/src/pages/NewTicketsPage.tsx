import { useMemo, useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import type { TicketPriority, ServiceCategory } from "@/domain/ticket";
import type { Provider } from "@/domain/admin";
import { useCreateTicketMutation } from "@/hooks/useCreateTicketMutation";
import { useActiveCategoriesQuery } from "@/hooks/useActiveCategoriesQuery";
import { useUploadImageMutation } from "@/hooks/useUploadImageMutation";
import { useToast } from "@/components/ui/toast";
import { ProviderAvailabilityPicker } from "@/components/ticket/ProviderAvailabilityPicker";
import { AddressAutocomplete } from "@/components/tickets/AddressAutocomplete";
import type { AddressSuggestion } from "@/services/geocodeService";

type Urgency = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type ProviderMode = "SPECIFIC" | "OPEN";

function formatCategoryLabel(value: string): string {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function NewTicketPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { notify } = useToast();

  type FormState = { title?: string; category?: ServiceCategory | ""; description?: string; location?: string; urgency?: Urgency | ""; providerMode?: ProviderMode };
  const routerState = routerLocation.state as { selectedProvider?: Provider; formState?: FormState } | null;
  const incomingProvider = routerState?.selectedProvider ?? null;
  const savedForm = routerState?.formState;

  const [title, setTitle]           = useState(savedForm?.title ?? "");
  const [category, setCategory]     = useState<ServiceCategory | "">(savedForm?.category ?? "");
  const [description, setDescription] = useState(savedForm?.description ?? "");
  const [location, setLocation]     = useState(savedForm?.location ?? "");
  // Exact coordinates, set when the customer picks an address suggestion.
  // Cleared whenever they edit the text again, so we never send stale coords.
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [urgency, setUrgency]       = useState<Urgency | "">(savedForm?.urgency ?? "");
  const [providerMode, setProviderMode] = useState<ProviderMode>(incomingProvider ? "SPECIFIC" : (savedForm?.providerMode ?? "OPEN"));
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(incomingProvider);
  const [requestedStartAt, setRequestedStartAt] = useState<string | null>(null);
  const [requestedEndAt, setRequestedEndAt]     = useState<string | null>(null);
  const [selectedImages, setSelectedImages]     = useState<File[]>([]);
  const [imagePreviews, setImagePreviews]       = useState<string[]>([]);
  const [imageError, setImageError]             = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ticketId = useMemo(() => "", []);
  const createTicketMutation = useCreateTicketMutation();
  const uploadImageMutation  = useUploadImageMutation();
  const { data: activeCategories = [], isLoading: loadingCategories } = useActiveCategoriesQuery();

  const needsRequestedTime = providerMode === "SPECIFIC";
  const hasRequestedTime   = Boolean(requestedStartAt && requestedEndAt);
  const canSubmit = Boolean(title.trim() && description.trim() && location.trim() && urgency && category && (providerMode !== "SPECIFIC" || (selectedProvider && hasRequestedTime)));

  const urgencySummary: Record<Urgency, { label: string; color: string }> = {
    LOW:      { label: t("newTicket.urgLow") + " · " + t("newTicket.urgLowHint"),        color: "var(--slate-500)" },
    MEDIUM:   { label: t("newTicket.urgMedium") + " · " + t("newTicket.urgMediumHint"),  color: "var(--blue-600)" },
    HIGH:     { label: t("newTicket.urgHigh") + " · " + t("newTicket.urgHighHint"),      color: "var(--amber-500)" },
    CRITICAL: { label: t("newTicket.urgCritical") + " · " + t("newTicket.urgCriticalHint"), color: "var(--red-600)" },
  };

  function handleImageFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (fileArray.some((f) => !allowed.includes(f.type))) { setImageError(t("newTicket.errors.invalidImageType")); return; }
    if (fileArray.some((f) => f.size > 5 * 1024 * 1024))  { setImageError(t("newTicket.errors.imageTooLarge")); return; }
    const combined = [...selectedImages, ...fileArray].slice(0, 10);
    setImageError(null);
    setSelectedImages(combined);
    setImagePreviews(combined.map((f) => URL.createObjectURL(f)));
  }

  function removeImage(index: number) {
    const next = selectedImages.filter((_, i) => i !== index);
    imagePreviews.forEach((url, i) => { if (i === index) URL.revokeObjectURL(url); });
    setSelectedImages(next);
    setImagePreviews(next.map((f) => URL.createObjectURL(f)));
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) { e.preventDefault(); handleImageFiles(e.dataTransfer.files); }

  useEffect(() => {
    if (createTicketMutation.isSuccess) {
      notify(t("newTicket.errors.ticketSubmitted"), "success");
      setTimeout(() => navigate("/dashboard/user"), 1500);
    }
  }, [createTicketMutation.isSuccess, navigate, notify, t]);

  useEffect(() => {
    if (createTicketMutation.isError) notify(t("newTicket.errors.failedSubmit"), "error");
  }, [createTicketMutation.isError, notify, t]);

  async function handleSubmit() {
    if (!canSubmit || !urgency) { setSubmitAttempted(true); return; }

    let imageUrls: string[] = [];
    if (selectedImages.length > 0) {
      try {
        imageUrls = await Promise.all(selectedImages.map((file) => uploadImageMutation.mutateAsync({ file, folder: "tickets" })));
      } catch {
        notify(t("newTicket.errors.failedUpload"), "error"); return;
      }
    }

    try {
      await createTicketMutation.mutateAsync({
        serviceType: title.trim(), category: category as ServiceCategory,
        description: description.trim(), location: location.trim(), priority: urgency as TicketPriority,
        latitude: locationCoords?.lat ?? null, longitude: locationCoords?.lng ?? null,
        assignedProviderId: providerMode === "SPECIFIC" && selectedProvider ? selectedProvider.id : null,
        requestedStartAt: providerMode === "SPECIFIC" && requestedStartAt ? requestedStartAt : null,
        requestedEndAt:   providerMode === "SPECIFIC" && requestedEndAt   ? requestedEndAt   : null,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      });
    } catch { /* handled by isError effect */ }
  }

  return (
    <main className="container page new-ticket-page">
      <div className="crumbs">
        <Link to="/dashboard/user">{t("newTicket.breadcrumb")}</Link>{" "}
        <span className="sep">/</span> {t("newTicket.fileATicket")}
      </div>

      <div className="new-ticket-heading">
        <span className="eyebrow">{t("newTicket.eyebrow")}</span>
        <h1 className="display-2 new-ticket-title">
          {t("newTicket.headline")} <span className="amber-underline">{t("newTicket.headlineBroken")}</span><br />
          {t("newTicket.headlineSub")}
        </h1>
      </div>

      <div className="new-ticket-grid">
        <div>
          {/* Section 01 */}
          <section className="form-section">
            <div className="head">
              <span className="num">01</span>
              <div>
                <div className="title">{t("newTicket.section01Title")}</div>
                <div className="sub">{t("newTicket.section01Sub")}</div>
              </div>
            </div>
            <div className="form-grid">
              <div className="field">
                <label className="field-label">{t("newTicket.titleLabel")}</label>
                <div className="input-wrap">
                  <input className="input" placeholder={t("newTicket.titlePlaceholder")} value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                {submitAttempted && !title.trim() ? <span className="field-error">{t("newTicket.errors.titleRequired")}</span> : <span className="field-hint">{t("newTicket.titleHint")}</span>}
              </div>

              <div className="field">
                <label className="field-label">{t("newTicket.categoryLabel")}</label>
                <select className="fselect" value={category} onChange={(e) => setCategory(e.target.value as ServiceCategory)} disabled={loadingCategories}>
                  <option value="" disabled>{loadingCategories ? t("newTicket.categoryLoading") : t("newTicket.categoryPlaceholder")}</option>
                  {activeCategories.map((value) => (<option key={value} value={value}>{formatCategoryLabel(value)}</option>))}
                </select>
                {submitAttempted && !category ? <span className="field-error">{t("newTicket.errors.categoryRequired")}</span> : <span className="field-hint">{t("newTicket.categoryHint")}</span>}
              </div>

              <div className="field">
                <label className="field-label">{t("newTicket.descriptionLabel")}</label>
                <textarea className="textarea" placeholder={t("newTicket.descriptionPlaceholder")} value={description} onChange={(e) => setDescription(e.target.value)} />
                {submitAttempted && !description.trim() ? <span className="field-error">{t("newTicket.errors.descriptionRequired")}</span> : <span className="field-hint">{t("newTicket.descriptionHint")}</span>}
              </div>

              <div className="field">
                <label className="field-label">
                  {t("newTicket.photosLabel")} <span className="muted new-ticket-optional">{t("newTicket.photosOptional")}</span>
                </label>
                <div className="dropzone" role="button" tabIndex={0} onClick={() => fileInputRef.current?.click()} onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
                  <strong>{t("newTicket.dropzoneText")}</strong>
                  <span className="dropzone-note">{t("newTicket.dropzoneNote")}</span>
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display: "none" }} onChange={(e) => e.target.files && handleImageFiles(e.target.files)} />
                {imageError && <span className="field-error" style={{ marginTop: 4 }}>{imageError}</span>}
                {imagePreviews.length > 0 && (
                  <div className="row gap-8 new-ticket-photo-grid" style={{ marginTop: 8, flexWrap: "wrap" }}>
                    {imagePreviews.map((url, i) => (
                      <div key={url} style={{ position: "relative" }}>
                        <img src={url} alt={`Photo ${i + 1}`} className="new-ticket-photo" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6, border: "1px solid var(--slate-200)" }} />
                        <button type="button" onClick={() => removeImage(i)} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "var(--red-600)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, lineHeight: 1, display: "grid", placeItems: "center" }} aria-label="Remove photo">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 02 */}
          <section className="form-section">
            <div className="head">
              <span className="num">02</span>
              <div>
                <div className="title">{t("newTicket.section02Title")}</div>
                <div className="sub">{t("newTicket.section02Sub")}</div>
              </div>
            </div>
            <div className="form-grid">
              <div className="field">
                <label className="field-label">{t("newTicket.locationLabel")}</label>
                <AddressAutocomplete
                  value={location}
                  resolved={locationCoords !== null}
                  hasError={submitAttempted && !location.trim()}
                  placeholder={t("newTicket.locationPlaceholder")}
                  onTextChange={(text) => {
                    setLocation(text);
                    // Editing the text invalidates any previously-picked coords.
                    setLocationCoords(null);
                  }}
                  onSelect={(s: AddressSuggestion) => {
                    setLocation(s.displayName);
                    setLocationCoords({ lat: s.lat, lng: s.lng });
                  }}
                />
                {submitAttempted && !location.trim() ? (
                  <span className="field-error">{t("newTicket.errors.locationRequired")}</span>
                ) : (
                  <span className="field-hint">
                    {locationCoords
                      ? t("newTicket.locationPinnedHint")
                      : t("newTicket.locationHint")}
                  </span>
                )}
              </div>

              <div className="field">
                <label className="field-label">{t("newTicket.urgencyLabel")}</label>
                <div className="urgency-grid">
                  {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as Urgency[]).map((level) => (
                    <UrgCard key={level} level={level} active={urgency === level} onClick={() => setUrgency(level)}
                      label={t(`newTicket.urg${level.charAt(0) + level.slice(1).toLowerCase()}`)}
                      name={t(`newTicket.urg${level.charAt(0) + level.slice(1).toLowerCase()}Name`)}
                      hint={t(`newTicket.urg${level.charAt(0) + level.slice(1).toLowerCase()}Hint`)}
                    />
                  ))}
                </div>
                {submitAttempted && !urgency && <span className="field-error" style={{ marginTop: 6 }}>{t("newTicket.errors.urgencyRequired")}</span>}
              </div>
            </div>
          </section>

          {/* Section 03 */}
          <section className="form-section">
            <div className="head">
              <span className="num">03</span>
              <div>
                <div className="title">{t("newTicket.section03Title")}</div>
                <div className="sub">{t("newTicket.section03Sub")}</div>
              </div>
            </div>
            <div className="form-grid">
              <div className="segment new-ticket-segment">
                <button aria-pressed={providerMode === "SPECIFIC"} type="button" onClick={() => { setProviderMode("SPECIFIC"); setSelectedProvider(null); }}>
                  {t("newTicket.specificProvider")}
                </button>
                <button aria-pressed={providerMode === "OPEN"} type="button" onClick={() => { setProviderMode("OPEN"); setSelectedProvider(null); }}>
                  {t("newTicket.openToAnyone")}
                </button>
              </div>

              {providerMode === "SPECIFIC" ? (
                selectedProvider ? (
                  <>
                    <div className="card provider-card">
                      <div className="avatar" style={{ width: 36, height: 36, fontSize: 13, background: "var(--amber-500)", color: "var(--navy-900)", borderRadius: "50%", display: "grid", placeItems: "center", fontWeight: 700, flexShrink: 0 }}>
                        {((selectedProvider.firstName?.[0] ?? "") + (selectedProvider.lastName?.[0] ?? "")).toUpperCase() || "?"}
                      </div>
                      <div>
                        <div className="row" style={{ gap: 8 }}>
                          <b className="new-ticket-provider-name">
                            {[selectedProvider.firstName, selectedProvider.lastName].filter(Boolean).join(" ") || selectedProvider.email}
                          </b>
                          <span className="verified-md">{t("newTicket.selectedProvider")}</span>
                        </div>
                        <div className="muted new-ticket-provider-meta">
                          {selectedProvider.categories.map((c) => c.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())).join(", ")}
                          {selectedProvider.pricePerHour != null ? ` · €${selectedProvider.pricePerHour}/hr` : ""}
                        </div>
                      </div>
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setRequestedStartAt(null); setRequestedEndAt(null); navigate("/providers", { state: { formState: { title, category, description, location, urgency, providerMode } } }); }}>
                        {t("newTicket.changeProvider")}
                      </button>
                    </div>

                    <div className="field" style={{ marginTop: 12 }}>
                      <label className="field-label">{t("newTicket.requestATime")}</label>
                      <span className="field-hint" style={{ display: "block", marginBottom: 10 }}>{t("newTicket.requestTimeHint")}</span>
                      <ProviderAvailabilityPicker providerId={selectedProvider.id} selectedStart={requestedStartAt} selectedEnd={requestedEndAt} onSelect={(s, e) => { setRequestedStartAt(s); setRequestedEndAt(e); }} />
                      {requestedStartAt && (
                        <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8, fontSize: 12 }} onClick={() => { setRequestedStartAt(null); setRequestedEndAt(null); }}>
                          {t("newTicket.clearSelection")}
                        </button>
                      )}
                      {submitAttempted && needsRequestedTime && !hasRequestedTime && (
                        <span className="field-error" style={{ marginTop: 8, display: "block" }}>{t("newTicket.errors.timeRequired")}</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="card provider-card" style={{ gridTemplateColumns: "1fr auto", alignItems: "center" }}>
                    <div className="muted" style={{ fontSize: 13.5 }}>{t("newTicket.noProviderSelected")}</div>
                    <button className="btn btn-primary btn-sm" type="button" onClick={() => navigate("/providers", { state: { formState: { title, category, description, location, urgency, providerMode } } })}>
                      {t("newTicket.browseProviders")}
                    </button>
                  </div>
                )
              ) : (
                <div className="card provider-card">
                  <div style={{ width: 36, height: 36, background: "var(--slate-100)", color: "var(--slate-500)", borderRadius: 18, display: "grid", placeItems: "center", border: "1.5px dashed var(--slate-300)", fontSize: 16, flexShrink: 0 }}>?</div>
                  <div>
                    <b className="new-ticket-provider-name">{t("newTicket.openToAnyone")}</b>
                    <div className="muted new-ticket-provider-meta">{t("newTicket.openToAnyoneDesc")}</div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="row new-ticket-actions" style={{ marginTop: 24, gap: 12 }}>
            <div className="row gap-12">
              <Link to="/dashboard/user" className="btn btn-ghost">{t("newTicket.backToDashboard")}</Link>
              <Link to="/" className="btn btn-ghost">{t("newTicket.home")}</Link>
            </div>
            <span className="grow" />
            <button className="btn btn-primary btn-lg new-ticket-submit-btn" type="button" onClick={handleSubmit} disabled={createTicketMutation.isPending || uploadImageMutation.isPending}>
              {uploadImageMutation.isPending ? t("newTicket.uploadingPhotos") : createTicketMutation.isPending ? t("newTicket.submitting") : t("newTicket.submitTicket")}
            </button>
          </div>
        </div>

        <aside>
          <div className="summary-card">
            <h4>{t("newTicket.liveSummary")}</h4>
            <div className="summary-row"><span className="key">{t("newTicket.summaryTicket")}</span><span className="val mono">{ticketId || "—"}</span></div>
            <div className="summary-row"><span className="key">{t("newTicket.summaryTitle")}</span><span className="val">{title || "—"}</span></div>
            <div className="summary-row"><span className="key">{t("newTicket.summaryCategory")}</span><span className="val">{category ? formatCategoryLabel(category) : "—"}</span></div>
            <div className="summary-row">
              <span className="key">{t("newTicket.summaryUrgency")}</span>
              <span className="val" style={{ color: urgency ? urgencySummary[urgency].color : "rgba(255,255,255,0.55)" }}>
                {urgency ? urgencySummary[urgency].label : "—"}
              </span>
            </div>
            <div className="summary-row"><span className="key">{t("newTicket.summaryLocation")}</span><span className="val new-ticket-summary-location">{location || "—"}</span></div>
            <div className="summary-row">
              <span className="key">{t("newTicket.summaryProvider")}</span>
              <span className="val">
                {providerMode === "SPECIFIC" && selectedProvider
                  ? [selectedProvider.firstName, selectedProvider.lastName].filter(Boolean).join(" ") || selectedProvider.email
                  : providerMode === "SPECIFIC" ? t("newTicket.notSelected") : t("newTicket.openToAnyone")}
              </span>
            </div>
            {providerMode === "SPECIFIC" && (
              <div className="summary-row">
                <span className="key">{t("newTicket.summaryRequestedTime")}</span>
                <span className="val mono" style={{ fontSize: 12 }}>
                  {requestedStartAt ? (() => {
                    const s = new Date(requestedStartAt);
                    const e2 = requestedEndAt ? new Date(requestedEndAt) : null;
                    const pad = (n: number) => String(n).padStart(2, "0");
                    const fmtT = (d: Date) => `${d.getHours()}:${pad(d.getMinutes())}`;
                    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                    return `${months[s.getMonth()]} ${s.getDate()} · ${fmtT(s)}${e2 ? `–${fmtT(e2)}` : ""}`;
                  })() : "—"}
                </span>
              </div>
            )}
            <div className="summary-row new-ticket-summary-last-row">
              <span className="key">{t("newTicket.summaryPhotos")}</span>
              <span className="val mono">{selectedImages.length > 0 ? t("newTicket.summaryPhotosSelected", { count: selectedImages.length }) : "—"}</span>
            </div>

            <div className="est">
              <div className="est-row">{t("newTicket.estimatedCost")}</div>
              <div className="est-big">{t("newTicket.tbd")}</div>
              <div className="est-row new-ticket-est-gap">{t("newTicket.estimatedResponse")}</div>
              <div className="est-big">{t("newTicket.tbd")}</div>
            </div>
            <p className="new-ticket-est-note">{t("newTicket.costNote")}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function UrgCard({ level, active, onClick, label, name, hint }: {
  readonly level: Urgency; readonly active: boolean; readonly onClick: () => void;
  readonly label: string; readonly name: string; readonly hint: string;
}) {
  const className = "urg-card " + (level === "LOW" ? "low" : level === "MEDIUM" ? "medium" : level === "HIGH" ? "high" : "critical");
  return (
    <button type="button" className={className} aria-pressed={active} onClick={onClick}>
      <span className="urg-label"><span className="urg-dot" aria-hidden="true" />{label}</span>
      <span className="urg-name">{name}</span>
      <span className="urg-hint">{hint}</span>
    </button>
  );
}
