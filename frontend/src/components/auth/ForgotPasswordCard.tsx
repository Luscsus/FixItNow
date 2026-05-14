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
import { useForgotPasswordMutation } from "@/hooks/useForgotPasswordMutation";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email."),
});

export function ForgotPasswordCard() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"email", string>>>({});
  const forgotMutation = useForgotPasswordMutation();
  const { notify } = useToast();

  const canSubmit = email.trim() !== "";

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    const parsed = forgotPasswordSchema.safeParse({ email: email.trim() });
    if (!parsed.success) {
      setErrors(mapZodErrors(parsed.error));
      return;
    }

    setErrors({});

    try {
      await forgotMutation.mutateAsync(parsed.data);
    } catch (error) {
      notify(getErrorMessage(error), "error");
    }
  };

  const statusText = () => {
    if (forgotMutation.isPending) {
      return "Sending reset email...";
    }

    if (forgotMutation.data) {
      return forgotMutation.data.text || "Reset email sent (if it exists).";
    }

    return "Enter your email to request a reset link.";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>/api/v1/auth/forgot-password</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <label htmlFor="forgot-email" className="text-sm font-medium text-ink">
          Email
        </label>
        <Input
          id="forgot-email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          aria-invalid={Boolean(errors.email)}
          className={
            errors.email
              ? "border-ember/60 focus-visible:ring-ember/40"
              : undefined
          }
        />
        {errors.email && <p className="text-sm text-ember">{errors.email}</p>}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || forgotMutation.isPending}
        >
          {forgotMutation.isPending ? "Sending..." : "Send reset email"}
        </Button>
        <p className="text-sm text-ink/70">{statusText()}</p>
      </CardFooter>
    </Card>
  );
}
