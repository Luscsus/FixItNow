import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { useSEO } from "@/hooks/useSEO";
import { UserAccountPage } from "@/pages/UserAccountPage";
import { ProviderAccountPage } from "@/pages/ProviderAccountPage";

export function ProfilePage() {
  useSEO({ title: "My Profile", robots: "noindex, nofollow" });
  const { role } = useAuth();

  if (role === "CUSTOMER") return <UserAccountPage />;
  if (role === "PROVIDER") return <ProviderAccountPage />;

  // ADMIN or unknown role — redirect to their dashboard
  return <Navigate to="/dashboard/admin" replace />;
}
