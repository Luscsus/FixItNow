import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

import { useAuth } from "@/context/auth";
import { changePassword } from "@/services/userService";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";
import { passwordStrength } from "@/utils/passwordStrength";
import { PasswordInput } from "@/components/ui/PasswordInput";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmNewPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Passwords do not match.",
    path: ["confirmNewPassword"],
  });

type Fields = "currentPassword" | "newPassword" | "confirmNewPassword";

export function ChangePasswordForm() {
  const { accessToken } = useAuth();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      changePassword(accessToken, {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }),
    onSuccess: () => {
      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    },
  });

  const set = (field: Fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setSuccess(false);
  };

  const pwStrength = passwordStrength(form.newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setErrors(mapZodErrors(parsed.error));
      return;
    }
    setErrors({});
    try {
      await mutation.mutateAsync();
    } catch (error) {
      setErrors({ currentPassword: getErrorMessage(error) });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="col" style={{ gap: 20 }}>
      <div className="field">
        <label className="field-label" htmlFor="cp-current">Current password</label>
        <PasswordInput
          id="cp-current"
          autoComplete="current-password"
          value={form.currentPassword}
          onChange={set("currentPassword")}
          hasError={Boolean(errors.currentPassword)}
        />
        {errors.currentPassword && <span className="field-error">{errors.currentPassword}</span>}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="cp-new">New password</label>
        <PasswordInput
          id="cp-new"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          value={form.newPassword}
          onChange={set("newPassword")}
          hasError={Boolean(errors.newPassword)}
        />
        {form.newPassword && (
          <div className={`pw-meter s${pwStrength}`}>
            <span /><span /><span /><span />
          </div>
        )}
        {errors.newPassword && <span className="field-error">{errors.newPassword}</span>}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="cp-confirm">Confirm new password</label>
        <PasswordInput
          id="cp-confirm"
          autoComplete="new-password"
          value={form.confirmNewPassword}
          onChange={set("confirmNewPassword")}
          hasError={Boolean(errors.confirmNewPassword)}
        />
        {errors.confirmNewPassword && <span className="field-error">{errors.confirmNewPassword}</span>}
      </div>

      <div className="row" style={{ gap: 12, alignItems: "center" }}>
        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? "Updating…" : "Update password"}
        </button>
        {success && <span style={{ color: "var(--emerald-700)", fontSize: 13 }}>Password updated.</span>}
      </div>
    </form>
  );
}
