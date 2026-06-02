import { useTranslation } from "react-i18next";

export function SupportCard() {
  const { t } = useTranslation();
  return (
    <div className="rail-card">
      <div className="rail-head">
        <span className="num">P4</span>
        <span className="label">{t("providerAccount.support_title")}</span>
      </div>
      <div className="rail-row">
        <span className="k">{t("providerAccount.support_providerLine")}</span>
        <span className="v mono" style={{ fontSize: 12.5 }}>1-800-FIX-OPS</span>
      </div>
      <div className="rail-row">
        <span className="k">{t("providerAccount.support_accountManager")}</span>
        <span className="v">Reese O.</span>
      </div>
      <div className="rail-row">
        <span className="k">{t("providerAccount.support_avgReply")}</span>
        <span className="v mono" style={{ fontSize: 12.5 }}>&lt; 12 min</span>
      </div>
      <button className="btn btn-secondary btn-sm btn-full" style={{ marginTop: 14 }}>{t("providerAccount.support_openTicket")}</button>
    </div>
  );
}
