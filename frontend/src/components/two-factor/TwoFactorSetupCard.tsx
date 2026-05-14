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
import { useTwoFactorSetupMutation } from "@/hooks/useTwoFactorSetupMutation";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";

const setupSchema = z.object({
  accessToken: z.string().min(1, "Access token is required."),
});

export function TwoFactorSetupCard() {
  const [accessToken, setAccessToken] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"accessToken", string>>>(
    {},
  );
  const setupMutation = useTwoFactorSetupMutation();
  const { notify } = useToast();

  const canSubmit = accessToken.trim() !== "";

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    const parsed = setupSchema.safeParse({ accessToken: accessToken.trim() });
    if (!parsed.success) {
      setErrors(mapZodErrors(parsed.error));
      return;
    }

    setErrors({});

    try {
      await setupMutation.mutateAsync(parsed.data.accessToken);
    } catch (error) {
      notify(getErrorMessage(error), "error");
    }
  };

  const statusText = () => {
    if (setupMutation.isPending) {
      return "Generating 2FA secret...";
    }

    if (setupMutation.data) {
      return "Scan the QR code URI in your authenticator.";
    }

    return "Provide an access token to start 2FA setup.";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>2FA setup</CardTitle>
        <CardDescription>/api/v1/user/2fa/setup</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <label htmlFor="setup-token" className="text-sm font-medium text-ink">
          Access token
        </label>
        <Input
          id="setup-token"
          value={accessToken}
          onChange={(event) => setAccessToken(event.target.value)}
          placeholder="Paste access token"
          aria-invalid={Boolean(errors.accessToken)}
          className={
            errors.accessToken
              ? "border-ember/60 focus-visible:ring-ember/40"
              : undefined
          }
        />
        {errors.accessToken && (
          <p className="text-sm text-ember">{errors.accessToken}</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || setupMutation.isPending}
        >
          {setupMutation.isPending ? "Generating..." : "Generate secret"}
        </Button>
        <p className="text-sm text-ink/70">{statusText()}</p>
        {setupMutation.data && (
          <div className="w-full rounded-md border border-mist/60 bg-white/70 p-3 text-xs text-ink/70">
            <p>secret: {setupMutation.data.secret || "-"}</p>
            <p>qrCodeUri: {setupMutation.data.qrCodeUri || "-"}</p>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
