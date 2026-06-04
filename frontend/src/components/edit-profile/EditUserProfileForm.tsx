import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/context/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { updateCurrentUser, updateProfilePicture } from "@/services/userService";
import { uploadImage } from "@/services/imageService";
import { getErrorMessage, getTranslatedFieldErrors } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";
import { useUserLocation } from "@/hooks/useUserLocation";
import { LocationModal } from "@/components/user-account/LocationModal";

type Fields = "firstName" | "lastName";

export function EditUserProfileForm() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { saved: savedLocation } = useUserLocation();
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const schema = z.object({
    firstName: z.string().min(1, t("editProfile.error_firstName")),
    lastName: z.string().min(1, t("editProfile.error_lastName")),
  });

  const [form, setForm] = useState({ firstName: "", lastName: "" });
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [success, setSuccess] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ firstName: user.firstName ?? "", lastName: user.lastName ?? "" });
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const mutation = useMutation({
    mutationFn: () =>
      updateCurrentUser(accessToken, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      }),
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  const set = (field: Fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setSuccess(false);
  };

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
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
  }

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
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
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      }
      await mutation.mutateAsync();
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

  const currentPicture = previewUrl ?? user?.profilePictureUrl ?? null;
  const initials =
    ((user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "")).toUpperCase() || "?";

  const isPending = mutation.isPending || isUploading;

  function submitLabel(): string {
    if (isUploading) return t("editProfile.uploading");
    if (isPending) return t("editProfile.saving");
    return t("editProfile.saveChanges");
  }

  return (
    <form onSubmit={handleSubmit} className="col" style={{ gap: 20 }}>
      <div className="col" style={{ gap: 8, alignItems: "flex-start" }}>
        <span className="field-label">{t("editProfile.profilePhoto")}</span>
        <div className="row" style={{ gap: 14, alignItems: "center" }}>
          <div
            style={{
              width: 72, height: 72, borderRadius: "50%", overflow: "hidden",
              background: "var(--amber-500)", display: "grid", placeItems: "center",
              fontSize: 26, fontWeight: 700, color: "var(--navy-900)",
              flexShrink: 0, border: "2px solid var(--slate-200)",
            }}
          >
            {currentPicture ? (
              <img src={currentPicture} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initials
            )}
          </div>
          <div className="col" style={{ gap: 4 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()}>
              {pendingFile ? t("editProfile.changePhoto") : t("editProfile.uploadPhoto")}
            </button>
            <span style={{ fontSize: 12, color: "var(--slate-500)" }}>
              {t("editProfile.photoHint")}
            </span>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        {uploadError && <span className="field-error">{uploadError}</span>}
        {pendingFile && !uploadError && (
          <span style={{ fontSize: 12, color: "var(--emerald-700)" }}>
            "{pendingFile.name}" {t("editProfile.readyToUpload")}
          </span>
        )}
      </div>

      <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
        <div className="field grow">
          <label className="field-label" htmlFor="edit-first">{t("userAccount.personalInfo_firstName")}</label>
          <div className={`input-wrap${errors.firstName ? " error" : ""}`}>
            <input id="edit-first" className="input" value={form.firstName} onChange={set("firstName")} autoComplete="given-name" />
          </div>
          {errors.firstName && <span className="field-error">{errors.firstName}</span>}
        </div>
        <div className="field grow">
          <label className="field-label" htmlFor="edit-last">{t("userAccount.personalInfo_lastName")}</label>
          <div className={`input-wrap${errors.lastName ? " error" : ""}`}>
            <input id="edit-last" className="input" value={form.lastName} onChange={set("lastName")} autoComplete="family-name" />
          </div>
          {errors.lastName && <span className="field-error">{errors.lastName}</span>}
        </div>
      </div>

      {/* Default location */}
      <div className="field">
        <span className="field-label">{t("userAccount.buildings_defaultLabel")}</span>
        <div
          className="row"
          style={{
            alignItems: "center", gap: 12, justifyContent: "space-between",
            border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span style={{ fontSize: 14, color: savedLocation ? "var(--text)" : "var(--text-muted)", wordBreak: "break-word" }}>
              {savedLocation?.address ?? t("userAccount.buildings_noneSet")}
            </span>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }} onClick={() => setLocationModalOpen(true)}>
            {savedLocation ? t("userAccount.buildings_editBtn") : t("userAccount.buildings_addBtn")}
          </button>
        </div>
      </div>

      <div className="row" style={{ gap: 12, alignItems: "center" }}>
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {submitLabel()}
        </button>
        {success && <span style={{ color: "var(--emerald-700)", fontSize: 13 }}>{t("editProfile.saved")}</span>}
      </div>

      <LocationModal open={locationModalOpen} onClose={() => setLocationModalOpen(false)} />
    </form>
  );
}
