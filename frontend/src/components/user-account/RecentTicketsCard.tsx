import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function RecentTicketsCard() {
  const { t } = useTranslation();
  return (
    <>
      <div className="panel-title">
        <span className="num">02</span>
        <span className="label">{t("userAccount.recentTickets_title")}</span>
        <span className="rule" />
        <Link to="/dashboard/user" className="mono muted" style={{ fontSize: 11, letterSpacing: "0.05em" }}>{t("userAccount.recentTickets_go")}</Link>
      </div>

      <div className="card card-pad" style={{ marginBottom: 32 }}>
        <p className="muted" style={{ fontSize: 14, margin: 0 }}>
          {t("userAccount.recentTickets_desc")}
        </p>
        <Link to="/dashboard/user" className="btn btn-primary btn-sm" style={{ marginTop: 14, display: "inline-flex" }}>
          {t("userAccount.recentTickets_go")}
        </Link>
      </div>
    </>
  );
}
