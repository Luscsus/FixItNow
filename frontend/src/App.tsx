import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/routing/ProtectedRoute";
import { ConfirmEmailPage } from "@/pages/ConfirmEmailPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { LoginPage } from "@/pages/LoginPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { RegisterPage } from "@/pages/RegisterPage";
import { RegisterProviderPage } from "@/pages/RegisterProviderPage";
import { RegisterUserPage } from "@/pages/RegisterUserPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { TwoFactorVerifyPage } from "@/pages/TwoFactorVerifyPage";
import { HomePage } from "@/pages/HomePage";

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

      {/* Marketing pages with navbar */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
