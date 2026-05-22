interface PersonalInfoCardProps {
  firstName: string;
  lastName: string;
  email: string | undefined;
}

export function PersonalInfoCard({ firstName, lastName, email }: PersonalInfoCardProps) {
  return (
    <>
      <div className="panel-title">
        <span className="num">01</span>
        <span className="label">Personal info</span>
        <span className="rule" />
        <a href="#" className="mono muted" style={{ fontSize: 11, letterSpacing: "0.05em" }}>Edit →</a>
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
            <div style={{ fontSize: 15, marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
              {email || <span className="muted">—</span>}
              {email && (
                <span className="mono" style={{ fontSize: 10, color: "var(--emerald-700)", background: "var(--emerald-100)", padding: "2px 6px", borderRadius: 4, letterSpacing: "0.06em" }}>VERIFIED</span>
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
