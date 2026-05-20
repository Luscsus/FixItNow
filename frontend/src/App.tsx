import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { AdminRoute } from "@/components/routing/AdminRoute";
import { ProtectedRoute } from "@/components/routing/ProtectedRoute";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { ConfirmEmailPage } from "@/pages/ConfirmEmailPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { LoginPage } from "@/pages/LoginPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ProviderDashboardPage } from "@/pages/ProviderDashboardPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { RegisterProviderPage } from "@/pages/RegisterProviderPage";
import { RegisterUserPage } from "@/pages/RegisterUserPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { TwoFactorVerifyPage } from "@/pages/TwoFactorVerifyPage";
import { UserDashboardPage } from "@/pages/UserDashboardPage";
import { HomePage } from "@/pages/HomePage";
import { BrowseProvidersPage } from "@/pages/BrowseProvidersPage";

function App() {
  return (
    <Routes>
      {/* Full-screen auth pages (no navbar) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/user" element={<RegisterUserPage />} />
      <Route path="/register/provider" element={<RegisterProviderPage />} />
      <Route path="/confirm-email" element={<ConfirmEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/two-factor" element={<TwoFactorVerifyPage />} />

      {/* Admin dashboard (full-screen, no AppLayout, ADMIN role required) */}
      <Route element={<AdminRoute />}>
        <Route path="/dashboard/admin" element={<AdminDashboardPage />} />
      </Route>

      {/* Marketing pages with navbar */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/browse" element={<BrowseProvidersPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/dashboard/user" element={<UserDashboardPage />} />
          <Route path="/dashboard/provider" element={<ProviderDashboardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
