import { useEffect, useState } from "react";
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
import { useVerifyTwoFactorMutation } from "@/hooks/useVerifyTwoFactorMutation";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";

const verifySchema = z.object({
  tempToken: z.string().min(1, "Temp token is required."),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

type TwoFactorVerifyCardProps = {
  initialTempToken?: string;
  onAuthenticated?: (session: AuthSession) => void;
};

export function TwoFactorVerifyCard({
  initialTempToken = "",
  onAuthenticated,
}: TwoFactorVerifyCardProps) {
  const [tempToken, setTempToken] = useState(initialTempToken);
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<"tempToken" | "code", string>>
  >({});
  const verifyMutation = useVerifyTwoFactorMutation();
  const { notify } = useToast();

  useEffect(() => {
    setTempToken(initialTempToken);
  }, [initialTempToken]);

  const canSubmit = tempToken.trim() !== "" && code.trim() !== "";

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    const parsed = verifySchema.safeParse({
      tempToken: tempToken.trim(),
      code: code.trim(),
    });

    if (!parsed.success) {
      setErrors(mapZodErrors(parsed.error));
      return;
    }

    setErrors({});

    try {
      const result = await verifyMutation.mutateAsync(parsed.data);
      onAuthenticated?.(result);
    } catch (error) {
      notify(getErrorMessage(error), "error");
    }
  };

  const statusText = () => {
    if (verifyMutation.isPending) {
      return "Verifying 2FA...";
    }

    if (verifyMutation.data) {
      return "2FA verified.";
    }

    return "Enter the temp token and TOTP code to finish login.";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>2FA verify</CardTitle>
        <CardDescription>/api/v1/auth/2fa/verify</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <label htmlFor="verify-temp" className="text-sm font-medium text-ink">
          Temp token
        </label>
        <Input
          id="verify-temp"
          value={tempToken}
          onChange={(event) => setTempToken(event.target.value)}
          placeholder="Paste temp token"
          aria-invalid={Boolean(errors.tempToken)}
          className={
            errors.tempToken
              ? "border-ember/60 focus-visible:ring-ember/40"
              : undefined
          }
        />
        {errors.tempToken && (
          <p className="text-sm text-ember">{errors.tempToken}</p>
        )}
        <label htmlFor="verify-code" className="text-sm font-medium text-ink">
          TOTP code
        </label>
        <Input
          id="verify-code"
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
          disabled={!canSubmit || verifyMutation.isPending}
        >
          {verifyMutation.isPending ? "Verifying..." : "Verify 2FA"}
        </Button>
        <p className="text-sm text-ink/70">{statusText()}</p>
      </CardFooter>
    </Card>
  );
}
