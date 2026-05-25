import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { useAuth } from "@/context/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { updateCurrentUser } from "@/services/userService";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";

const schema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
});

type Fields = "firstName" | "lastName";

export function EditUserProfileForm() {
  const { accessToken } = useAuth();
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ firstName: "", lastName: "" });
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ firstName: user.firstName ?? "", lastName: user.lastName ?? "" });
    }
  }, [user]);

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

  const handleSubmit = async (e: React.FormEvent) => {
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
      await mutation.mutateAsync();
    } catch (error) {
      setErrors({ firstName: getErrorMessage(error) });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="col" style={{ gap: 20 }}>
      <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
        <div className="field grow">
          <label className="field-label" htmlFor="edit-first">First name</label>
          <div className={`input-wrap${errors.firstName ? " error" : ""}`}>
            <input
              id="edit-first"
              className="input"
              value={form.firstName}
              onChange={set("firstName")}
              autoComplete="given-name"
            />
          </div>
          {errors.firstName && <span className="field-error">{errors.firstName}</span>}
        </div>
        <div className="field grow">
          <label className="field-label" htmlFor="edit-last">Last name</label>
          <div className={`input-wrap${errors.lastName ? " error" : ""}`}>
            <input
              id="edit-last"
              className="input"
              value={form.lastName}
              onChange={set("lastName")}
              autoComplete="family-name"
            />
          </div>
          {errors.lastName && <span className="field-error">{errors.lastName}</span>}
        </div>
      </div>

      <div className="row" style={{ gap: 12, alignItems: "center" }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving…" : "Save changes"}
        </button>
        {success && (
          <span style={{ color: "var(--emerald-700)", fontSize: 13 }}>Saved.</span>
        )}
      </div>
    </form>
  );
}
