import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth";

export function AdminRoute() {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
