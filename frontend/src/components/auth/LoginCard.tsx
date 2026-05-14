import { useState } from "react";
import { Link } from "react-router-dom";
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
import type { AuthSession } from "@/domain/auth";
import { useLoginMutation } from "@/hooks/useLoginMutation";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

type LoginCardProps = {
  onAuthenticated?: (session: AuthSession) => void;
  onRequiresTwoFactor?: (tempToken: string) => void;
};

export function LoginCard({
  onAuthenticated,
  onRequiresTwoFactor,
}: LoginCardProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<"email" | "password", string>>
  >({});
  const [showConfirmLink, setShowConfirmLink] = useState(false);
  const loginMutation = useLoginMutation();
  const { notify } = useToast();

  const canSubmit = email.trim() !== "" && password.trim() !== "";

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    const parsed = loginSchema.safeParse({
      email: email.trim(),
      password,
    });

    if (!parsed.success) {
      setErrors(mapZodErrors(parsed.error));
      return;
    }

    setErrors({});

    let result: AuthSession;
    try {
      setShowConfirmLink(false);
      result = await loginMutation.mutateAsync(parsed.data);
    } catch (error) {
      const message = getErrorMessage(error);
      setShowConfirmLink(message.toLowerCase().includes("verify your email"));
      notify(message, "error");
      return;
    }

    if (result.requiresTwoFactor) {
      onRequiresTwoFactor?.(result.tempToken);
      return;
    }

    onAuthenticated?.(result);
  };

  const statusText = () => {
    if (loginMutation.isPending) {
      return "Signing in...";
    }

    if (loginMutation.data) {
      if (loginMutation.data.requiresTwoFactor) {
        return "Two-factor verification required.";
      }

      return "Login successful.";
    }

    return "Enter your credentials to request access tokens.";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>/api/v1/auth/login</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <label htmlFor="login-email" className="text-sm font-medium text-ink">
          Email
        </label>
        <Input
          id="login-email"
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
        <label
          htmlFor="login-password"
          className="text-sm font-medium text-ink"
        >
          Password
        </label>
        <Input
          id="login-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Your password"
          aria-invalid={Boolean(errors.password)}
          className={
            errors.password
              ? "border-ember/60 focus-visible:ring-ember/40"
              : undefined
          }
        />
        {errors.password && (
          <p className="text-sm text-ember">{errors.password}</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || loginMutation.isPending}
        >
          {loginMutation.isPending ? "Signing in..." : "Login"}
        </Button>
        <p className="text-sm text-ink/70">{statusText()}</p>
        {showConfirmLink && (
          <Link
            className="text-sm text-ink/70 underline underline-offset-4"
            to="/confirm-email"
          >
            Confirm or resend email confirmation
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
