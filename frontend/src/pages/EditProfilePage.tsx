import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth";
import { useSEO } from "@/hooks/useSEO";
import { EditUserProfileForm } from "@/components/edit-profile/EditUserProfileForm";
import { EditProviderProfileForm } from "@/components/edit-profile/EditProviderProfileForm";
import { ChangePasswordForm } from "@/components/edit-profile/ChangePasswordForm";

export function EditProfilePage() {
  useSEO({ title: "Edit Profile", robots: "noindex, nofollow" });
  const { t } = useTranslation();
  const { role } = useAuth();

  if (role !== "CUSTOMER" && role !== "PROVIDER") {
    return <Navigate to="/profile" replace />;
  }

  const isProvider = role === "PROVIDER";

  return (
    <main className="container" style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 880 }}>
      <div className="crumbs" style={{ marginBottom: 18 }}>
        <Link to="/profile" style={{ color: "inherit", textDecoration: "none" }}>{t("editProfile.profile")}</Link>
        <span className="sep">/</span>
        <span>{t("editProfile.edit")}</span>
      </div>

      <h1 className="h1" style={{ marginBottom: 6 }}>{t("editProfile.editProfile")}</h1>
      <p className="body muted" style={{ marginBottom: 32 }}>
        {t("editProfile.updateDetails", { type: isProvider ? t("editProfile.business") : "" })}
      </p>

      <section style={{ marginBottom: 40 }}>
        <h2 className="h2" style={{ marginBottom: 16, fontSize: 18 }}>
          {isProvider ? t("editProfile.businessDetails") : t("editProfile.personalInfo")}
        </h2>
        <div className="card card-pad">
          {isProvider ? <EditProviderProfileForm /> : <EditUserProfileForm />}
        </div>
      </section>

      <section>
        <h2 className="h2" style={{ marginBottom: 16, fontSize: 18 }}>{t("editProfile.changePassword")}</h2>
        <div className="card card-pad">
          <ChangePasswordForm />
        </div>
      </section>

      <div style={{ marginTop: 32 }}>
        <Link to="/profile" className="btn btn-secondary">{t("editProfile.backToProfile")}</Link>
      </div>
    </main>
  );
}
