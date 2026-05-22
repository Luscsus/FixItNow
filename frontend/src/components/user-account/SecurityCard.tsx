import { Link } from "react-router-dom";

interface SecurityCardProps {
  email: string | undefined;
}

export function SecurityCard({ email }: SecurityCardProps) {
  return (
    <div className="rail-card">
      <div className="rail-head">
        <span className="num">N2</span>
        <span className="label">Security</span>
      </div>
      <div className="rail-row">
        <span className="k">Email</span>
        <span className="v" style={{ wordBreak: "break-all", textAlign: "right", fontSize: 13 }}>
          {email || "—"}
        </span>
      </div>
      <div className="rail-row">
        <span className="k">Password</span>
        <span className="v mono" style={{ fontSize: 12 }}>••••••••</span>
      </div>
      <div className="rail-row">
        <span className="k">Two-factor</span>
        <span className="v mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>Not set up</span>
      </div>
      <Link to="/profile/security" className="btn btn-secondary btn-sm btn-full" style={{ marginTop: 14 }}>
        Manage security →
      </Link>
    </div>
  );
}
