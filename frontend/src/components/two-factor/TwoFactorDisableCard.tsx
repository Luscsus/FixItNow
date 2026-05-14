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
import { useTwoFactorDisableMutation } from "@/hooks/useTwoFactorDisableMutation";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";

const disableSchema = z.object({
  accessToken: z.string().min(1, "Access token is required."),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export function TwoFactorDisableCard() {
  const [accessToken, setAccessToken] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<"accessToken" | "code", string>>
  >({});
  const disableMutation = useTwoFactorDisableMutation();
  const { notify } = useToast();

  const canSubmit = accessToken.trim() !== "" && code.trim() !== "";

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    const parsed = disableSchema.safeParse({
      accessToken: accessToken.trim(),
      code: code.trim(),
    });

    if (!parsed.success) {
      setErrors(mapZodErrors(parsed.error));
      return;
    }

    setErrors({});

    try {
      await disableMutation.mutateAsync(parsed.data);
    } catch (error) {
      notify(getErrorMessage(error), "error");
    }
  };

  const statusText = () => {
    if (disableMutation.isPending) {
      return "Disabling 2FA...";
    }

    if (disableMutation.data) {
      return disableMutation.data.text || "2FA disabled.";
    }

    return "Provide the current TOTP code to disable 2FA.";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>2FA disable</CardTitle>
        <CardDescription>/api/v1/user/2fa/disable</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <label
          htmlFor="disable-access"
          className="text-sm font-medium text-ink"
        >
          Access token
        </label>
        <Input
          id="disable-access"
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
        <label htmlFor="disable-code" className="text-sm font-medium text-ink">
          TOTP code
        </label>
        <Input
          id="disable-code"
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
          disabled={!canSubmit || disableMutation.isPending}
        >
          {disableMutation.isPending ? "Disabling..." : "Disable 2FA"}
        </Button>
        <p className="text-sm text-ink/70">{statusText()}</p>
      </CardFooter>
    </Card>
  );
}
