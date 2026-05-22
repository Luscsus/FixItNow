import { Link } from "react-router-dom";

export function RecentTicketsCard() {
  return (
    <>
      <div className="panel-title">
        <span className="num">02</span>
        <span className="label">Recent tickets</span>
        <span className="rule" />
        <Link to="/dashboard/user" className="mono muted" style={{ fontSize: 11, letterSpacing: "0.05em" }}>Go to dashboard →</Link>
      </div>

      <div className="card card-pad" style={{ marginBottom: 32 }}>
        <p className="muted" style={{ fontSize: 14, margin: 0 }}>
          Your ticket history will appear here once you start filing tickets.
        </p>
        <Link to="/dashboard/user" className="btn btn-primary btn-sm" style={{ marginTop: 14, display: "inline-flex" }}>
          Go to dashboard →
        </Link>
      </div>
    </>
  );
}
