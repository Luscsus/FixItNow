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
import { useTwoFactorEnableMutation } from "@/hooks/useTwoFactorEnableMutation";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";

const enableSchema = z.object({
  accessToken: z.string().min(1, "Access token is required."),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export function TwoFactorEnableCard() {
  const [accessToken, setAccessToken] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<"accessToken" | "code", string>>
  >({});
  const enableMutation = useTwoFactorEnableMutation();
  const { notify } = useToast();

  const canSubmit = accessToken.trim() !== "" && code.trim() !== "";

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    const parsed = enableSchema.safeParse({
      accessToken: accessToken.trim(),
      code: code.trim(),
    });

    if (!parsed.success) {
      setErrors(mapZodErrors(parsed.error));
      return;
    }

    setErrors({});

    try {
      await enableMutation.mutateAsync(parsed.data);
    } catch (error) {
      notify(getErrorMessage(error), "error");
    }
  };

  const statusText = () => {
    if (enableMutation.isPending) {
      return "Enabling 2FA...";
    }

    if (enableMutation.data) {
      return enableMutation.data.text || "2FA enabled.";
    }

    return "Provide the current TOTP code to enable 2FA.";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>2FA enable</CardTitle>
        <CardDescription>/api/v1/user/2fa/enable</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <label htmlFor="enable-access" className="text-sm font-medium text-ink">
          Access token
        </label>
        <Input
          id="enable-access"
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
        <label htmlFor="enable-code" className="text-sm font-medium text-ink">
          TOTP code
        </label>
        <Input
          id="enable-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="123456"
          aria-invalid={Boolean(errors.code)}
          className={
            errors.code
              ? "border-ember/60 focus-visible:ring-ember/40"
              : undefined
          }
        />
        {errors.code && <p className="text-sm text-ember">{errors.code}</p>}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || enableMutation.isPending}
        >
          {enableMutation.isPending ? "Enabling..." : "Enable 2FA"}
        </Button>
        <p className="text-sm text-ink/70">{statusText()}</p>
      </CardFooter>
    </Card>
  );
}
