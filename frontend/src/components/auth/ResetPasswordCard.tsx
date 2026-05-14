import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useResetPasswordMutation } from "@/hooks/useResetPasswordMutation";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required."),
  newPassword: z.string().min(8, "Password must be at least 8 characters."),
});

export function ResetPasswordCard() {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<"token" | "newPassword", string>>
  >({});
  const resetMutation = useResetPasswordMutation();
  const { notify } = useToast();

  const canSubmit = token.trim() !== "" && newPassword.trim() !== "";

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    const parsed = resetPasswordSchema.safeParse({
      token: token.trim(),
      newPassword,
    });

    if (!parsed.success) {
      setErrors(mapZodErrors(parsed.error));
      return;
    }

    setErrors({});

    try {
      await resetMutation.mutateAsync(parsed.data);
    } catch (error) {
      notify(getErrorMessage(error), "error");
    }
  };

  const statusText = () => {
    if (resetMutation.isPending) {
      return "Resetting password...";
    }

    if (resetMutation.data) {
      return resetMutation.data.text || "Password updated.";
    }

    return "Paste the reset token and provide a new password.";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>/api/v1/auth/reset-password</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <label htmlFor="reset-token" className="text-sm font-medium text-ink">
          Reset token
        </label>
        <Input
          id="reset-token"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Paste reset token"
          aria-invalid={Boolean(errors.token)}
          className={
            errors.token
              ? "border-ember/60 focus-visible:ring-ember/40"
              : undefined
          }
        />
        {errors.token && <p className="text-sm text-ember">{errors.token}</p>}
        <label
          htmlFor="reset-password"
          className="text-sm font-medium text-ink"
        >
          New password
        </label>
        <Input
          id="reset-password"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="New password"
          aria-invalid={Boolean(errors.newPassword)}
          className={
            errors.newPassword
              ? "border-ember/60 focus-visible:ring-ember/40"
              : undefined
          }
        />
        {errors.newPassword && (
          <p className="text-sm text-ember">{errors.newPassword}</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || resetMutation.isPending}
        >
          {resetMutation.isPending ? "Resetting..." : "Reset password"}
        </Button>
        <p className="text-sm text-ink/70">{statusText()}</p>
      </CardFooter>
    </Card>
  );
}
