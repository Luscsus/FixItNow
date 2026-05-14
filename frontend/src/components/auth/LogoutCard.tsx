import { useState } from "react";

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
import { useLogoutMutation } from "@/hooks/useLogoutMutation";
import { getErrorMessage } from "@/lib/errorMessage";

export function LogoutCard() {
  const [refreshToken, setRefreshToken] = useState("");
  const logoutMutation = useLogoutMutation();

  const canSubmit = refreshToken.trim() !== "";

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    await logoutMutation.mutateAsync({ refreshToken: refreshToken.trim() });
  };

  const statusText = () => {
    if (logoutMutation.isPending) {
      return "Logging out...";
    }

    if (logoutMutation.isError) {
      return getErrorMessage(logoutMutation.error);
    }

    if (logoutMutation.data) {
      return logoutMutation.data.text || "Logged out.";
    }

    return "Provide a refresh token to revoke it.";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logout</CardTitle>
        <CardDescription>/api/v1/auth/logout</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <label htmlFor="logout-token" className="text-sm font-medium text-ink">
          Refresh token
        </label>
        <Input
          id="logout-token"
          value={refreshToken}
          onChange={(event) => setRefreshToken(event.target.value)}
          placeholder="Paste refresh token"
        />
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || logoutMutation.isPending}
        >
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </Button>
        <p className="text-sm text-ink/70">{statusText()}</p>
      </CardFooter>
    </Card>
  );
}
