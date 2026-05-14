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
import { useRegisterMutation } from "@/hooks/useRegisterMutation";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";

const registerSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
});

export function RegisterCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<"email" | "password" | "firstName" | "lastName", string>>
  >({});
  const registerMutation = useRegisterMutation();
  const { notify } = useToast();

  const canSubmit =
    email.trim() !== "" &&
    password.trim() !== "" &&
    firstName.trim() !== "" &&
    lastName.trim() !== "";

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    const parsed = registerSchema.safeParse({
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

    if (!parsed.success) {
      setErrors(mapZodErrors(parsed.error));
      return;
    }

    setErrors({});

    try {
      await registerMutation.mutateAsync(parsed.data);
    } catch (error) {
      notify(getErrorMessage(error), "error");
    }
  };

  const statusText = () => {
    if (registerMutation.isPending) {
      return "Creating account...";
    }

    if (registerMutation.data) {
      return registerMutation.data.text || "Registration successful.";
    }

    return "Fill in the required fields to register.";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>/api/v1/auth/register</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <label
          htmlFor="register-email"
          className="text-sm font-medium text-ink"
        >
          Email
        </label>
        <Input
          id="register-email"
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
          htmlFor="register-first"
          className="text-sm font-medium text-ink"
        >
          First name
        </label>
        <Input
          id="register-first"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          placeholder="Jane"
          aria-invalid={Boolean(errors.firstName)}
          className={
            errors.firstName
              ? "border-ember/60 focus-visible:ring-ember/40"
              : undefined
          }
        />
        {errors.firstName && (
          <p className="text-sm text-ember">{errors.firstName}</p>
        )}
        <label htmlFor="register-last" className="text-sm font-medium text-ink">
          Last name
        </label>
        <Input
          id="register-last"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          placeholder="Doe"
          aria-invalid={Boolean(errors.lastName)}
          className={
            errors.lastName
              ? "border-ember/60 focus-visible:ring-ember/40"
              : undefined
          }
        />
        {errors.lastName && (
          <p className="text-sm text-ember">{errors.lastName}</p>
        )}
        <label
          htmlFor="register-password"
          className="text-sm font-medium text-ink"
        >
          Password
        </label>
        <Input
          id="register-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Create a password"
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
          disabled={!canSubmit || registerMutation.isPending}
        >
          {registerMutation.isPending ? "Registering..." : "Register"}
        </Button>
        <p className="text-sm text-ink/70">{statusText()}</p>
      </CardFooter>
    </Card>
  );
}
