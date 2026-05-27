import { Link } from "react-router-dom";

interface PersonalInfoCardProps {
  firstName: string;
  lastName: string;
  email: string | undefined;
  emailVerified?: boolean;
}

const PILL_BASE: React.CSSProperties = {
  fontSize: 10,
  padding: "2px 6px",
  borderRadius: 4,
  letterSpacing: "0.06em",
};

export function PersonalInfoCard({ firstName, lastName, email, emailVerified }: PersonalInfoCardProps) {
  return (
    <>
      <div className="panel-title">
        <span className="num">01</span>
        <span className="label">Personal info</span>
        <span className="rule" />
        <Link to="/profile/edit" className="mono muted" style={{ fontSize: 11, letterSpacing: "0.05em", textDecoration: "none" }}>Edit →</Link>
      </div>

      <div className="card card-pad" style={{ marginBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px 32px" }}>
          <div>
            <div className="mono muted" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>First name</div>
            <div style={{ fontSize: 15, marginTop: 6 }}>{firstName || <span className="muted">—</span>}</div>
          </div>
          <div>
            <div className="mono muted" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>Last name</div>
            <div style={{ fontSize: 15, marginTop: 6 }}>{lastName || <span className="muted">—</span>}</div>
          </div>
          <div>
            <div className="mono muted" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>Email</div>
            <div style={{ fontSize: 15, marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {email || <span className="muted">—</span>}
              {email && emailVerified === true && (
                <span
                  className="mono"
                  style={{
                    ...PILL_BASE,
                    color: "var(--emerald-700)",
                    background: "var(--emerald-100)",
                  }}
                >
                  VERIFIED
                </span>
              )}
              {email && emailVerified === false && (
                <Link
                  to="/confirm-email"
                  className="mono"
                  title="Verify your email to get a verified badge"
                  style={{
                    ...PILL_BASE,
                    color: "var(--amber-800, #92400e)",
                    background: "var(--amber-100, #fef3c7)",
                    textDecoration: "none",
                  }}
                >
                  NOT VERIFIED
                </Link>
              )}
            </div>
          </div>
          <div>
            <div className="mono muted" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>Role</div>
            <div style={{ fontSize: 15, marginTop: 6 }}>Customer</div>
          </div>
        </div>
      </div>
    </>
  );
}
