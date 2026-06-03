import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/context/auth";
import { useCurrentProvider } from "@/hooks/useCurrentProvider";
import { updateCurrentProvider, updateProfilePicture } from "@/services/userService";
import { uploadImage } from "@/services/imageService";
import { getErrorMessage, getTranslatedFieldErrors } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";
import { bankFromIban, formatIban, isValidIban, normalizeIban } from "@/lib/iban";
import { StripeConnectPanel } from "@/components/edit-profile/StripeConnectPanel";
import type { ServiceCategory } from "@/domain/admin";

type TradeEntry = { icon: string; category: ServiceCategory };

const TRADES: TradeEntry[] = [
  { icon: "🔧", category: "PLUMBING" },
  { icon: "⚡", category: "ELECTRICAL" },
  { icon: "❄️", category: "HVAC" },
  { icon: "🪚", category: "CARPENTRY" },
  { icon: "🎨", category: "PAINTING" },
  { icon: "🏠", category: "ROOFING" },
  { icon: "🔌", category: "APPLIANCE_REPAIR" },
  { icon: "🔑", category: "LOCKSMITH" },
  { icon: "🧹", category: "CLEANING" },
  { icon: "🌱", category: "GARDENING" },
  { icon: "🐜", category: "PEST_CONTROL" },
  { icon: "📦", category: "MOVING" },
  { icon: "📚", category: "TUTORING" },
  { icon: "💻", category: "IT_SUPPORT" },
  { icon: "✨", category: "OTHER" },
];

const BIO_MAX = 2000;

type Fields =
  | "firstName" | "lastName" | "phoneNumber"
  | "locationStreetName" | "locationStreetNumber" | "locationCity"
  | "locationPostalCode" | "locationCountry"
  | "pricePerHour" | "yearsOfExperience" | "serviceRadiusKm"
  | "categories" | "bio"
  | "bankAccountHolder" | "bankIban" | "bankBic" | "bankName";

export function EditProviderProfileForm() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { data: provider } = useCurrentProvider();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const schema = z.object({
    firstName: z.string().min(1, t("editProfile.error_firstName")),
    lastName: z.string().min(1, t("editProfile.error_lastName")),
    phoneNumber: z.string().max(50).optional(),
    locationStreetName: z.string().min(1, t("editProfile.error_streetName")).max(255),
    locationStreetNumber: z.string().max(20).optional(),
    locationCity: z.string().min(1, t("editProfile.error_city")).max(100),
    locationPostalCode: z.string().max(20).optional(),
    locationCountry: z.string().max(100).optional(),
    pricePerHour: z.number().positive(t("editProfile.error_pricePositive")),
    yearsOfExperience: z.number().int().min(0).max(80),
    serviceRadiusKm: z.number().int().min(1).max(500),
    categories: z.array(z.string()).min(1, t("editProfile.error_categories")),
    bio: z.string().max(BIO_MAX).optional(),
    bankAccountHolder: z.string().max(200).optional(),
    bankIban: z.string().optional(),
    bankBic: z.string().max(20).optional(),
    bankName: z.string().max(200).optional(),
  }).refine(
    (v) => !v.bankIban || isValidIban(v.bankIban),
    { path: ["bankIban"], message: t("editProfile.error_iban") },
  );

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const [form, setForm] = useState({
    firstName: "", lastName: "", phoneNumber: "",
    locationStreetName: "", locationStreetNumber: "",
    locationCity: "", locationPostalCode: "", locationCountry: "",
    pricePerHour: "", yearsOfExperience: "", serviceRadiusKm: "",
    bio: "", bankAccountHolder: "", bankIban: "", bankBic: "", bankName: "",
  });
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (provider) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        firstName: provider.firstName ?? "",
        lastName: provider.lastName ?? "",
        phoneNumber: provider.phoneNumber ?? "",
        locationStreetName: provider.locationStreetName ?? "",
        locationStreetNumber: provider.locationStreetNumber ?? "",
        locationCity: provider.locationCity ?? "",
        locationPostalCode: provider.locationPostalCode ?? "",
        locationCountry: provider.locationCountry ?? "",
        pricePerHour: provider.pricePerHour?.toString() ?? "",
        yearsOfExperience: provider.yearsOfExperience?.toString() ?? "",
        serviceRadiusKm: provider.serviceRadiusKm?.toString() ?? "",
        bio: provider.bio ?? "",
        bankAccountHolder:
          provider.bankAccountHolder ??
          `${provider.firstName ?? ""} ${provider.lastName ?? ""}`.trim(),
        bankIban: provider.bankIban ? formatIban(provider.bankIban) : "",
        bankBic: provider.bankBic ?? "",
        bankName: provider.bankName ?? "",
      });
      setCategories(provider.categories ?? []);
    }
  }, [provider]);

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateCurrentProvider>[1]) =>
      updateCurrentProvider(accessToken, payload),
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["currentProvider"] });
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError(t("editProfile.photoTypeError"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(t("editProfile.photoSizeError"));
      return;
    }
    setUploadError(null);
    setPendingFile(file);
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  }

  const setField = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((p) => ({ ...p, [field]: e.target.value }));
      setSuccess(false);
    };

  const toggleCategory = (c: ServiceCategory) => {
    setCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
    setSuccess(false);
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phoneNumber: form.phoneNumber.trim() || null,
      locationStreetName: form.locationStreetName.trim(),
      locationStreetNumber: form.locationStreetNumber.trim() || undefined,
      locationCity: form.locationCity.trim(),
      locationPostalCode: form.locationPostalCode.trim() || undefined,
      locationCountry: form.locationCountry.trim() || undefined,
      pricePerHour: Number(form.pricePerHour),
      yearsOfExperience: Number(form.yearsOfExperience),
      serviceRadiusKm: Number(form.serviceRadiusKm),
      categories,
      bio: form.bio.trim() || null,
      bankAccountHolder: form.bankAccountHolder.trim() || null,
      bankIban: form.bankIban.trim() ? normalizeIban(form.bankIban) : null,
      bankBic: form.bankBic.trim().toUpperCase() || null,
      bankName: form.bankName.trim() || null,
    };
    const parsed = schema.safeParse({
      ...payload,
      phoneNumber: payload.phoneNumber ?? undefined,
      bio: payload.bio ?? undefined,
      bankAccountHolder: payload.bankAccountHolder ?? undefined,
      bankIban: payload.bankIban ?? undefined,
      bankBic: payload.bankBic ?? undefined,
      bankName: payload.bankName ?? undefined,
    });
    if (!parsed.success) {
      setErrors(mapZodErrors(parsed.error));
      return;
    }
    setErrors({});
    try {
      if (pendingFile) {
        setIsUploading(true);
        const imageUrl = await uploadImage(pendingFile, "profile-pictures", accessToken);
        await updateProfilePicture(accessToken, imageUrl);
        setPendingFile(null);
        setIsUploading(false);
        queryClient.invalidateQueries({ queryKey: ["currentProvider"] });
      }
      await mutation.mutateAsync(payload);
    } catch (error) {
      setIsUploading(false);
      const fieldErrors = getTranslatedFieldErrors(error, t);
      if (fieldErrors) {
        setErrors(fieldErrors);
      } else {
        setErrors({ firstName: getErrorMessage(error) });
      }
    }
  };

  const currentPicture = previewUrl ?? provider?.profilePictureUrl ?? null;
  const initials =
    ((provider?.firstName?.[0] ?? "") + (provider?.lastName?.[0] ?? "")).toUpperCase() || "?";
  const isPending = mutation.isPending || isUploading;

  function submitLabel(): string {
    if (isUploading) return t("editProfile.uploading");
    if (mutation.isPending) return t("editProfile.saving");
    return t("editProfile.saveChanges");
  }

  return (
    <form onSubmit={handleSubmit} className="col" style={{ gap: 20 }}>
      {/* Profile picture */}
      <div className="col" style={{ gap: 8, alignItems: "flex-start" }}>
        <span className="field-label">{t("editProfile.profilePhoto")}</span>
        <div className="row" style={{ gap: 14, alignItems: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", overflow: "hidden",
            background: "var(--amber-500)", display: "grid", placeItems: "center",
            fontSize: 26, fontWeight: 700, color: "var(--navy-900)",
            flexShrink: 0, border: "2px solid var(--slate-200)",
          }}>
            {currentPicture
              ? <img src={currentPicture} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials}
          </div>
          <div className="col" style={{ gap: 4 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()}>
              {pendingFile ? t("editProfile.changePhoto") : t("editProfile.uploadPhoto")}
            </button>
            <span style={{ fontSize: 12, color: "var(--slate-500)" }}>{t("editProfile.photoHint")}</span>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleFileChange} />
        {uploadError && <span className="field-error">{uploadError}</span>}
        {pendingFile && !uploadError && (
          <span style={{ fontSize: 12, color: "var(--emerald-700)" }}>"{pendingFile.name}" {t("editProfile.readyToUpload")}</span>
        )}
      </div>

      <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
        <div className="field grow">
          <label className="field-label" htmlFor="p-first">{t("userAccount.personalInfo_firstName")}</label>
          <div className={`input-wrap${errors.firstName ? " error" : ""}`}>
            <input id="p-first" className="input" value={form.firstName} onChange={setField("firstName")} />
          </div>
          {errors.firstName && <span className="field-error">{errors.firstName}</span>}
        </div>
        <div className="field grow">
          <label className="field-label" htmlFor="p-last">{t("userAccount.personalInfo_lastName")}</label>
          <div className={`input-wrap${errors.lastName ? " error" : ""}`}>
            <input id="p-last" className="input" value={form.lastName} onChange={setField("lastName")} />
          </div>
          {errors.lastName && <span className="field-error">{errors.lastName}</span>}
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="p-phone">{t("editProfile.phoneNumber")}</label>
        <div className={`input-wrap${errors.phoneNumber ? " error" : ""}`}>
          <input id="p-phone" className="input" value={form.phoneNumber} onChange={setField("phoneNumber")} autoComplete="tel" />
        </div>
        {errors.phoneNumber && <span className="field-error">{errors.phoneNumber}</span>}
      </div>

      <div className="field">
        <label className="field-label">{t("editProfile.serviceCategories")}</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
          {TRADES.map((tr) => {
            const selected = categories.includes(tr.category);
            return (
              <button
                type="button"
                key={tr.category}
                onClick={() => toggleCategory(tr.category)}
                className="btn"
                style={{
                  padding: "8px 10px", fontSize: 13,
                  background: selected ? "var(--navy-700)" : "var(--surface-2)",
                  color: selected ? "#fff" : "inherit",
                  border: "1px solid var(--border)",
                  textAlign: "left", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <span>{tr.icon}</span>
                <span>{t(`categories.${tr.category}`)}</span>
              </button>
            );
          })}
        </div>
        {errors.categories && <span className="field-error">{errors.categories}</span>}
      </div>

      <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
        <div className="field grow">
          <label className="field-label" htmlFor="p-rate">{t("editProfile.hourlyRate")}</label>
          <div className={`input-wrap${errors.pricePerHour ? " error" : ""}`}>
            <input id="p-rate" className="input" type="number" step="0.01" value={form.pricePerHour} onChange={setField("pricePerHour")} />
          </div>
          {errors.pricePerHour && <span className="field-error">{errors.pricePerHour}</span>}
        </div>
        <div className="field grow">
          <label className="field-label" htmlFor="p-years">{t("editProfile.yearsOfExperience")}</label>
          <div className={`input-wrap${errors.yearsOfExperience ? " error" : ""}`}>
            <input id="p-years" className="input" type="number" value={form.yearsOfExperience} onChange={setField("yearsOfExperience")} />
          </div>
          {errors.yearsOfExperience && <span className="field-error">{errors.yearsOfExperience}</span>}
        </div>
      </div>

      <div className="row form-row" style={{ gap: 12, alignItems: "flex-start" }}>
        <div className="field grow" style={{ flexBasis: "65%" }}>
          <label className="field-label" htmlFor="p-street">{t("editProfile.streetName")}</label>
          <div className={`input-wrap${errors.locationStreetName ? " error" : ""}`}>
            <input id="p-street" className="input" value={form.locationStreetName} onChange={setField("locationStreetName")} autoComplete="address-line1" />
          </div>
          {errors.locationStreetName && <span className="field-error">{errors.locationStreetName}</span>}
        </div>
        <div className="field" style={{ flexBasis: "30%" }}>
          <label className="field-label" htmlFor="p-streetno">{t("editProfile.streetNo")}</label>
          <div className={`input-wrap${errors.locationStreetNumber ? " error" : ""}`}>
            <input id="p-streetno" className="input" value={form.locationStreetNumber} onChange={setField("locationStreetNumber")} autoComplete="address-line2" />
          </div>
        </div>
      </div>

      <div className="row form-row" style={{ gap: 12, alignItems: "flex-start" }}>
        <div className="field grow">
          <label className="field-label" htmlFor="p-city">{t("editProfile.city")}</label>
          <div className={`input-wrap${errors.locationCity ? " error" : ""}`}>
            <input id="p-city" className="input" value={form.locationCity} onChange={setField("locationCity")} autoComplete="address-level2" />
          </div>
          {errors.locationCity && <span className="field-error">{errors.locationCity}</span>}
        </div>
        <div className="field">
          <label className="field-label" htmlFor="p-postal">{t("editProfile.postalCode")}</label>
          <div className="input-wrap">
            <input id="p-postal" className="input" value={form.locationPostalCode} onChange={setField("locationPostalCode")} autoComplete="postal-code" />
          </div>
        </div>
        <div className="field grow">
          <label className="field-label" htmlFor="p-country">{t("editProfile.country")}</label>
          <div className="input-wrap">
            <input id="p-country" className="input" value={form.locationCountry} onChange={setField("locationCountry")} autoComplete="country-name" />
          </div>
        </div>
      </div>

      <div className="field grow">
        <label className="field-label" htmlFor="p-radius">{t("editProfile.serviceRadius")}</label>
        <div className={`input-wrap${errors.serviceRadiusKm ? " error" : ""}`}>
          <input id="p-radius" className="input" type="number" value={form.serviceRadiusKm} onChange={setField("serviceRadiusKm")} />
        </div>
        {errors.serviceRadiusKm && <span className="field-error">{errors.serviceRadiusKm}</span>}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="p-bio">{t("editProfile.bio")}</label>
        <div className={`input-wrap${errors.bio ? " error" : ""}`} style={{ alignItems: "flex-start" }}>
          <textarea id="p-bio" className="input" rows={5} maxLength={BIO_MAX} value={form.bio} onChange={setField("bio")} style={{ resize: "vertical" }} />
        </div>
        <span className="field-hint">{form.bio.length}/{BIO_MAX}</span>
        {errors.bio && <span className="field-error">{errors.bio}</span>}
      </div>

      {/* Payout details */}
      <div style={{ marginTop: 8, padding: 16, borderRadius: 12, border: "1px solid var(--border)", background: "var(--slate-50, #f8fafc)" }}>
        <div style={{ marginBottom: 14 }}>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>
            {t("editProfile.payoutDetails")}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
            {t("editProfile.payoutDesc")}
          </div>
        </div>

        <StripeConnectPanel />

        <div className="field">
          <label className="field-label" htmlFor="p-bank-holder">{t("editProfile.accountHolder")}</label>
          <div className={`input-wrap${errors.bankAccountHolder ? " error" : ""}`}>
            <input id="p-bank-holder" className="input" placeholder={t("editProfile.accountHolderPlaceholder")} value={form.bankAccountHolder} onChange={setField("bankAccountHolder")} autoComplete="cc-name" />
          </div>
          {errors.bankAccountHolder && <span className="field-error">{errors.bankAccountHolder}</span>}
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label className="field-label" htmlFor="p-bank-iban">{t("editProfile.iban")}</label>
          <div className={`input-wrap${errors.bankIban ? " error" : ""}`}>
            <input
              id="p-bank-iban" className="input"
              placeholder="SI56 1234 5678 9012 345"
              value={form.bankIban}
              onChange={(e) => {
                const formatted = formatIban(e.target.value);
                // Auto-fill bank name + BIC from the IBAN for recognized Slovenian
                // banks; leave them untouched for foreign / unknown IBANs.
                const info = bankFromIban(formatted);
                setForm((p) => ({
                  ...p,
                  bankIban: formatted,
                  ...(info ? { bankName: info.bankName, bankBic: info.bic } : {}),
                }));
                setSuccess(false);
              }}
              spellCheck={false} autoComplete="off"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}
            />
          </div>
          <span className="field-hint">{t("editProfile.ibanHint")}</span>
          {errors.bankIban && <span className="field-error">{errors.bankIban}</span>}
        </div>

        <div className="row" style={{ gap: 12, marginTop: 12 }}>
          <div className="field grow">
            <label className="field-label" htmlFor="p-bank-bic">{t("editProfile.bicSwift")}</label>
            <div className={`input-wrap${errors.bankBic ? " error" : ""}`}>
              <input id="p-bank-bic" className="input" placeholder="LJBASI2X" value={form.bankBic}
                onChange={(e) => { setForm((p) => ({ ...p, bankBic: e.target.value.toUpperCase() })); setSuccess(false); }}
                spellCheck={false} autoComplete="off" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }} />
            </div>
            {errors.bankBic && <span className="field-error">{errors.bankBic}</span>}
          </div>
          <div className="field grow">
            <label className="field-label" htmlFor="p-bank-name">{t("editProfile.bankName")}</label>
            <div className={`input-wrap${errors.bankName ? " error" : ""}`}>
              <input id="p-bank-name" className="input" placeholder="Nova Ljubljanska Banka" value={form.bankName} onChange={setField("bankName")} autoComplete="off" />
            </div>
            {errors.bankName && <span className="field-error">{errors.bankName}</span>}
          </div>
        </div>
      </div>

      <div className="row" style={{ gap: 12, alignItems: "center" }}>
        <button type="submit" className="btn btn-primary" disabled={isPending}>{submitLabel()}</button>
        {success && <span style={{ color: "var(--emerald-700)", fontSize: 13 }}>{t("editProfile.saved")}</span>}
      </div>
    </form>
  );
}
