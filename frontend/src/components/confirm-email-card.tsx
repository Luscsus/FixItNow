import { useEffect, useRef, useState } from "react";
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
import { useConfirmEmailQuery } from "@/hooks/useConfirmEmailQuery";
import { useResendEmailConfirmationMutation } from "@/hooks/useResendEmailConfirmationMutation";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";

const confirmEmailSchema = z.object({
  token: z.string().min(1, "Token is required."),
});

const resendConfirmationSchema = z.object({
  email: z.string().email("Enter a valid email."),
});

type ConfirmEmailCardProps = {
  initialToken?: string;
};

export function ConfirmEmailCard({ initialToken }: ConfirmEmailCardProps) {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<"token" | "email", string>>
  >({});
  const autoConfirmedToken = useRef<string | null>(null);
  const confirmQuery = useConfirmEmailQuery(token.trim());
  const resendMutation = useResendEmailConfirmationMutation();
  const { notify } = useToast();

  const canSubmit = token.trim().length > 0;
  const canResend = email.trim().length > 0;
  const isBusy = confirmQuery.isFetching;

  const confirmWithToken = async (nextToken: string) => {
    const parsed = confirmEmailSchema.safeParse({ token: nextToken.trim() });
    if (!parsed.success) {
      setErrors(mapZodErrors(parsed.error));
      return;
    }

    setErrors((current) => ({ ...current, token: undefined }));

    try {
      await confirmQuery.refetch();
    } catch (error) {
      notify(getErrorMessage(error), "error");
    }
  };

  const handleConfirm = async () => {
    if (!canSubmit) {
      return;
    }

    await confirmWithToken(token);
  };

  useEffect(() => {
    if (!initialToken) {
      return;
    }

    if (!token.trim()) {
      setToken(initialToken);
    }
  }, [initialToken, token]);

  useEffect(() => {
    const trimmed = token.trim();
    if (!initialToken || !trimmed) {
      return;
    }

    if (trimmed !== initialToken.trim()) {
      return;
    }

    if (autoConfirmedToken.current === trimmed) {
      return;
    }

    autoConfirmedToken.current = trimmed;
    void confirmWithToken(trimmed);
  }, [initialToken, token]);

  const handleResend = async () => {
    if (!canResend) {
      return;
    }

    const parsed = resendConfirmationSchema.safeParse({ email: email.trim() });
    if (!parsed.success) {
      setErrors((current) => ({ ...current, ...mapZodErrors(parsed.error) }));
      return;
    }

    setErrors((current) => ({ ...current, email: undefined }));

    try {
      await resendMutation.mutateAsync(parsed.data);
    } catch (error) {
      notify(getErrorMessage(error), "error");
    }
  };

  const statusText = () => {
    if (confirmQuery.isFetching) {
      return "Confirming email with the backend...";
    }

    if (confirmQuery.data) {
      return confirmQuery.data.text || "Email confirmed.";
    }

    return "Enter the token from your email to confirm the account.";
  };

  const resendStatusText = () => {
    if (resendMutation.isPending) {
      return "Sending confirmation email...";
    }

    if (resendMutation.data) {
      return (
        resendMutation.data.text || "Confirmation email sent (if it exists)."
      );
    }

    return "Enter your email to resend the confirmation link.";
  };

  return (
    <Card className="border-tide/30">
      <CardHeader>
        <CardTitle>Email confirmation</CardTitle>
        <CardDescription>
          Test the /api/v1/auth/confirm-email flow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <label htmlFor="confirm-token" className="text-sm font-medium text-ink">
          Token
        </label>
        <Input
          id="confirm-token"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Paste confirmation token"
          aria-invalid={Boolean(errors.token)}
          className={
            errors.token
              ? "border-ember/60 focus-visible:ring-ember/40"
              : undefined
          }
        />
        {errors.token && <p className="text-sm text-ember">{errors.token}</p>}
        <div className="pt-2">
          <label
            htmlFor="confirm-email"
            className="text-sm font-medium text-ink"
          >
            Email
          </label>
          <Input
            id="confirm-email"
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
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3">
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleConfirm} disabled={!canSubmit || isBusy}>
            {isBusy ? "Confirming..." : "Confirm email"}
          </Button>
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={!canResend || resendMutation.isPending}
          >
            {resendMutation.isPending ? "Sending..." : "Resend confirmation"}
          </Button>
        </div>
        <p className="text-sm text-ink/70">{statusText()}</p>
        <p className="text-sm text-ink/70">{resendStatusText()}</p>
      </CardFooter>
    </Card>
  );
}
