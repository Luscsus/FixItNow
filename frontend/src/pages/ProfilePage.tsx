import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { UserAccountPage } from "@/pages/UserAccountPage";
import { ProviderAccountPage } from "@/pages/ProviderAccountPage";

export function ProfilePage() {
  const { role } = useAuth();

  if (role === "CUSTOMER") return <UserAccountPage />;
  if (role === "PROVIDER") return <ProviderAccountPage />;

  // ADMIN or unknown role — redirect to their dashboard
  return <Navigate to="/dashboard/admin" replace />;
}
