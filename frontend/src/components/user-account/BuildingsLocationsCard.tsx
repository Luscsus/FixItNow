import { useTranslation } from "react-i18next";

export function BuildingsLocationsCard() {
  const { t } = useTranslation();
  return (
    <>
      <div className="panel-title">
        <span className="num">03</span>
        <span className="label">{t("userAccount.buildings_title")}</span>
        <span className="rule" />
        <button className="mono" style={{ background: "none", border: 0, color: "var(--accent-deep)", fontSize: 11, letterSpacing: "0.05em", cursor: "pointer" }}>{t("userAccount.buildings_addBtn")}</button>
      </div>

      <div className="card card-pad">
        <p className="muted" style={{ fontSize: 14, margin: 0 }}>
          {t("userAccount.buildings_desc")}
        </p>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 14 }}>{t("userAccount.buildings_addBtn")}</button>
      </div>
    </>
  );
}
