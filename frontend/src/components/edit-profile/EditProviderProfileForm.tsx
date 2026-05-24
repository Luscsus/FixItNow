import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { useAuth } from "@/context/auth";
import { useCurrentProvider } from "@/hooks/useCurrentProvider";
import { updateCurrentProvider } from "@/services/userService";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";
import type { ServiceCategory } from "@/domain/admin";

const TRADES: { label: string; icon: string; category: ServiceCategory }[] = [
  { label: "Plumbing", icon: "🔧", category: "PLUMBING" },
  { label: "Electrical", icon: "⚡", category: "ELECTRICAL" },
  { label: "HVAC", icon: "❄️", category: "HVAC" },
  { label: "Carpentry", icon: "🪚", category: "CARPENTRY" },
  { label: "Painting", icon: "🎨", category: "PAINTING" },
  { label: "Roofing", icon: "🏠", category: "ROOFING" },
  { label: "Appliance repair", icon: "🔌", category: "APPLIANCE_REPAIR" },
  { label: "Locksmith", icon: "🔑", category: "LOCKSMITH" },
  { label: "Cleaning", icon: "🧹", category: "CLEANING" },
  { label: "Gardening", icon: "🌱", category: "GARDENING" },
  { label: "Pest control", icon: "🐜", category: "PEST_CONTROL" },
  { label: "Moving", icon: "📦", category: "MOVING" },
  { label: "Tutoring", icon: "📚", category: "TUTORING" },
  { label: "IT / Smart home", icon: "💻", category: "IT_SUPPORT" },
  { label: "Other", icon: "✨", category: "OTHER" },
];

const BIO_MAX = 2000;

const schema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  phoneNumber: z.string().max(50).optional(),
  locationLat: z.number().min(-90).max(90),
  locationLon: z.number().min(-180).max(180),
  pricePerHour: z.number().positive("Price must be positive."),
  yearsOfExperience: z.number().int().min(0).max(80),
  serviceRadiusKm: z.number().int().min(1).max(500),
  categories: z.array(z.string()).min(1, "Pick at least one category."),
  bio: z.string().max(BIO_MAX).optional(),
});

type Fields =
  | "firstName"
  | "lastName"
  | "phoneNumber"
  | "locationLat"
  | "locationLon"
  | "pricePerHour"
  | "yearsOfExperience"
  | "serviceRadiusKm"
  | "categories"
  | "bio";

export function EditProviderProfileForm() {
  const { accessToken } = useAuth();
  const { data: provider } = useCurrentProvider();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    locationLat: "",
    locationLon: "",
    pricePerHour: "",
    yearsOfExperience: "",
    serviceRadiusKm: "",
    bio: "",
  });
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (provider) {
      setForm({
        firstName: provider.firstName ?? "",
        lastName: provider.lastName ?? "",
        phoneNumber: provider.phoneNumber ?? "",
        locationLat: provider.locationLat?.toString() ?? "",
        locationLon: provider.locationLon?.toString() ?? "",
        pricePerHour: provider.pricePerHour?.toString() ?? "",
        yearsOfExperience: provider.yearsOfExperience?.toString() ?? "",
        serviceRadiusKm: provider.serviceRadiusKm?.toString() ?? "",
        bio: provider.bio ?? "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phoneNumber: form.phoneNumber.trim() || null,
      locationLat: Number(form.locationLat),
      locationLon: Number(form.locationLon),
      pricePerHour: Number(form.pricePerHour),
      yearsOfExperience: Number(form.yearsOfExperience),
      serviceRadiusKm: Number(form.serviceRadiusKm),
      categories,
      bio: form.bio.trim() || null,
    };
    const parsed = schema.safeParse({
      ...payload,
      phoneNumber: payload.phoneNumber ?? undefined,
      bio: payload.bio ?? undefined,
    });
    if (!parsed.success) {
      setErrors(mapZodErrors(parsed.error));
      return;
    }
    setErrors({});
    try {
      await mutation.mutateAsync(payload);
    } catch (error) {
      setErrors({ firstName: getErrorMessage(error) });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="col" style={{ gap: 20 }}>
      <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
        <div className="field grow">
          <label className="field-label" htmlFor="p-first">First name</label>
          <div className={`input-wrap${errors.firstName ? " error" : ""}`}>
            <input id="p-first" className="input" value={form.firstName} onChange={setField("firstName")} />
          </div>
          {errors.firstName && <span className="field-error">{errors.firstName}</span>}
        </div>
        <div className="field grow">
          <label className="field-label" htmlFor="p-last">Last name</label>
          <div className={`input-wrap${errors.lastName ? " error" : ""}`}>
            <input id="p-last" className="input" value={form.lastName} onChange={setField("lastName")} />
          </div>
          {errors.lastName && <span className="field-error">{errors.lastName}</span>}
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="p-phone">Phone number</label>
        <div className={`input-wrap${errors.phoneNumber ? " error" : ""}`}>
          <input id="p-phone" className="input" value={form.phoneNumber} onChange={setField("phoneNumber")} autoComplete="tel" />
        </div>
        {errors.phoneNumber && <span className="field-error">{errors.phoneNumber}</span>}
      </div>

      <div className="field">
        <label className="field-label">Service categories</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
          {TRADES.map((t) => {
            const selected = categories.includes(t.category);
            return (
              <button
                type="button"
                key={t.category}
                onClick={() => toggleCategory(t.category)}
                className="btn"
                style={{
                  padding: "8px 10px",
                  fontSize: 13,
                  background: selected ? "var(--navy-700)" : "var(--surface-2)",
                  color: selected ? "#fff" : "inherit",
                  border: "1px solid var(--border)",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
        {errors.categories && <span className="field-error">{errors.categories}</span>}
      </div>

      <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
        <div className="field grow">
          <label className="field-label" htmlFor="p-rate">Hourly rate ($)</label>
          <div className={`input-wrap${errors.pricePerHour ? " error" : ""}`}>
            <input id="p-rate" className="input" type="number" step="0.01" value={form.pricePerHour} onChange={setField("pricePerHour")} />
          </div>
          {errors.pricePerHour && <span className="field-error">{errors.pricePerHour}</span>}
        </div>
        <div className="field grow">
          <label className="field-label" htmlFor="p-years">Years of experience</label>
          <div className={`input-wrap${errors.yearsOfExperience ? " error" : ""}`}>
            <input id="p-years" className="input" type="number" value={form.yearsOfExperience} onChange={setField("yearsOfExperience")} />
          </div>
          {errors.yearsOfExperience && <span className="field-error">{errors.yearsOfExperience}</span>}
        </div>
      </div>

      <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
        <div className="field grow">
          <label className="field-label" htmlFor="p-lat">Latitude</label>
          <div className={`input-wrap${errors.locationLat ? " error" : ""}`}>
            <input id="p-lat" className="input" type="number" step="0.0000001" value={form.locationLat} onChange={setField("locationLat")} />
          </div>
          {errors.locationLat && <span className="field-error">{errors.locationLat}</span>}
        </div>
        <div className="field grow">
          <label className="field-label" htmlFor="p-lon">Longitude</label>
          <div className={`input-wrap${errors.locationLon ? " error" : ""}`}>
            <input id="p-lon" className="input" type="number" step="0.0000001" value={form.locationLon} onChange={setField("locationLon")} />
          </div>
          {errors.locationLon && <span className="field-error">{errors.locationLon}</span>}
        </div>
        <div className="field grow">
          <label className="field-label" htmlFor="p-radius">Service radius (km)</label>
          <div className={`input-wrap${errors.serviceRadiusKm ? " error" : ""}`}>
            <input id="p-radius" className="input" type="number" value={form.serviceRadiusKm} onChange={setField("serviceRadiusKm")} />
          </div>
          {errors.serviceRadiusKm && <span className="field-error">{errors.serviceRadiusKm}</span>}
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="p-bio">Bio</label>
        <div className={`input-wrap${errors.bio ? " error" : ""}`} style={{ alignItems: "flex-start" }}>
          <textarea
            id="p-bio"
            className="input"
            rows={5}
            maxLength={BIO_MAX}
            value={form.bio}
            onChange={setField("bio")}
            style={{ resize: "vertical" }}
          />
        </div>
        <span className="field-hint">{form.bio.length}/{BIO_MAX}</span>
        {errors.bio && <span className="field-error">{errors.bio}</span>}
      </div>

      <div className="row" style={{ gap: 12, alignItems: "center" }}>
        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Save changes"}
        </button>
        {success && <span style={{ color: "var(--emerald-700)", fontSize: 13 }}>Saved.</span>}
      </div>
    </form>
  );
}
