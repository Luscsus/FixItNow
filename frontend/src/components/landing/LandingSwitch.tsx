import { useTranslation } from "react-i18next";

export type LandingView = "user" | "provider";

interface Props {
  readonly value: LandingView;
  readonly onChange: (v: LandingView) => void;
}

export function LandingSwitch({ value, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <div className="landing-switch-wrap">
      <div
        className="landing-switch"
        role="tablist"
        aria-label="Choose what you're here for"
        data-active={value}
      >
        <span className="landing-switch-thumb" aria-hidden="true" />

        <button
          type="button"
          role="tab"
          aria-selected={value === "user"}
          className={`landing-switch-btn ${value === "user" ? "is-active" : ""}`}
          onClick={() => onChange("user")}
        >
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6 8 4 12 4 15a8 8 0 0016 0c0-3-2-7-8-13z" />
          </svg>
          <span>{t("landing.iNeedAFix")}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={value === "provider"}
          className={`landing-switch-btn ${value === "provider" ? "is-active" : ""}`}
          onClick={() => onChange("provider")}
        >
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
          </svg>
          <span>{t("landing.imAProvider")}</span>
        </button>
      </div>
    </div>
  );
}
