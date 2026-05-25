import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { EditUserProfileForm } from "@/components/edit-profile/EditUserProfileForm";
import { EditProviderProfileForm } from "@/components/edit-profile/EditProviderProfileForm";
import { ChangePasswordForm } from "@/components/edit-profile/ChangePasswordForm";

export function EditProfilePage() {
  const { role } = useAuth();

  if (role !== "CUSTOMER" && role !== "PROVIDER") {
    return <Navigate to="/profile" replace />;
  }

  const isProvider = role === "PROVIDER";

  return (
    <main className="container" style={{ paddingTop: 32, paddingBottom: 64, maxWidth: 880 }}>
      <div className="crumbs" style={{ marginBottom: 18 }}>
        <Link to="/profile" style={{ color: "inherit", textDecoration: "none" }}>Profile</Link>
        <span className="sep">/</span>
        <span>Edit</span>
      </div>

      <h1 className="h1" style={{ marginBottom: 6 }}>Edit profile</h1>
      <p className="body muted" style={{ marginBottom: 32 }}>
        Update your {isProvider ? "business " : ""}details. Changes save when you press the button under each section.
      </p>

      <section style={{ marginBottom: 40 }}>
        <h2 className="h2" style={{ marginBottom: 16, fontSize: 18 }}>
          {isProvider ? "Business details" : "Personal info"}
        </h2>
        <div className="card card-pad">
          {isProvider ? <EditProviderProfileForm /> : <EditUserProfileForm />}
        </div>
      </section>

      <section>
        <h2 className="h2" style={{ marginBottom: 16, fontSize: 18 }}>Change password</h2>
        <div className="card card-pad">
          <ChangePasswordForm />
        </div>
      </section>

      <div style={{ marginTop: 32 }}>
        <Link to="/profile" className="btn btn-secondary">← Back to profile</Link>
      </div>
    </main>
  );
}
