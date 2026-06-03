import { useTranslation } from "react-i18next";

const SPECIALTIES = ["Emergency calls", "Commercial", "P-trap & fixtures", "Water heaters", "Drain & sewer", "Re-pipe"];

export function SpecialtiesRatesCard() {
  const { t } = useTranslation();
  return (
    <div className="rail-card">
      <div className="rail-head">
        <span className="num">P1</span>
        <span className="label">{t("providerAccount.specialties_title")}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {SPECIALTIES.map((s) => (
          <span className="specchip" key={s}>{s}</span>
        ))}
      </div>
      <div className="rail-row">
        <span className="k">{t("providerAccount.specialties_hourly")}</span>
        <span className="v mono" style={{ fontSize: 14 }}>€95 <span className="muted">/ hr</span></span>
      </div>
      <div className="rail-row">
        <span className="k">{t("providerAccount.specialties_minimum")}</span>
        <span className="v mono" style={{ fontSize: 14 }}>1 hr</span>
      </div>
      <div className="rail-row">
        <span className="k">{t("providerAccount.specialties_afterHours")}</span>
        <span className="v mono" style={{ fontSize: 14 }}>+ €50</span>
      </div>
      <div className="rail-row">
        <span className="k">{t("providerAccount.specialties_serviceArea")}</span>
        <span className="v mono" style={{ fontSize: 14 }}>8 mi radius</span>
      </div>
      <button className="btn btn-secondary btn-sm btn-full" style={{ marginTop: 14 }}>{t("providerAccount.specialties_editPricing")}</button>
    </div>
  );
}
