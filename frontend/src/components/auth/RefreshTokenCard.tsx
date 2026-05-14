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
import { useRefreshTokenMutation } from "@/hooks/useRefreshTokenMutation";
import { getErrorMessage } from "@/lib/errorMessage";

export function RefreshTokenCard() {
  const [refreshToken, setRefreshToken] = useState("");
  const refreshMutation = useRefreshTokenMutation();

  const canSubmit = refreshToken.trim() !== "";

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    await refreshMutation.mutateAsync({ refreshToken: refreshToken.trim() });
  };

  const statusText = () => {
    if (refreshMutation.isPending) {
      return "Refreshing token...";
    }

    if (refreshMutation.isError) {
      return getErrorMessage(refreshMutation.error);
    }

    if (refreshMutation.data) {
      return "Tokens refreshed.";
    }

    return "Provide a refresh token to get a new session.";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Refresh token</CardTitle>
        <CardDescription>/api/v1/auth/refresh</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <label htmlFor="refresh-token" className="text-sm font-medium text-ink">
          Refresh token
        </label>
        <Input
          id="refresh-token"
          value={refreshToken}
          onChange={(event) => setRefreshToken(event.target.value)}
          placeholder="Paste refresh token"
        />
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || refreshMutation.isPending}
        >
          {refreshMutation.isPending ? "Refreshing..." : "Refresh"}
        </Button>
        <p className="text-sm text-ink/70">{statusText()}</p>
        {refreshMutation.data && (
          <div className="w-full rounded-md border border-mist/60 bg-white/70 p-3 text-xs text-ink/70">
            <p>accessToken: {refreshMutation.data.accessToken || "-"}</p>
            <p>refreshToken: {refreshMutation.data.refreshToken || "-"}</p>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
