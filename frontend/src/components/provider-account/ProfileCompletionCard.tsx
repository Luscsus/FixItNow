import { useTranslation } from "react-i18next";

export function ProfileCompletionCard() {
  const { t } = useTranslation();
  return (
    <div className="rail-card" style={{ background: "var(--amber-50)", borderColor: "var(--amber-100)" }}>
      <div className="rail-head">
        <span className="num" style={{ color: "var(--amber-700)" }}>P3</span>
        <span className="label" style={{ color: "var(--amber-700)" }}>Profile · 84%</span>
      </div>
      <div style={{ height: 6, background: "rgba(180,83,9,0.15)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: "84%", height: "100%", background: "var(--amber-500)" }} />
      </div>
      <div
        style={{ marginTop: 14, fontSize: 13, lineHeight: 1.55, color: "var(--amber-700)" }}
        dangerouslySetInnerHTML={{ __html: t("providerAccount.profileCompletion_desc") }}
      />
      <button className="btn btn-accent btn-sm btn-full" style={{ marginTop: 14 }}>{t("providerAccount.profileCompletion_finish")}</button>
    </div>
  );
}
