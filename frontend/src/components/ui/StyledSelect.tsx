import type { SelectHTMLAttributes } from "react";

const CHEVRON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E";

export function StyledSelect({
  style,
  disabled,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      disabled={disabled}
      style={{
        appearance: "none",
        WebkitAppearance: "none",
        MozAppearance: "none",
        height: 38,
        width: "100%",
        padding: "0 32px 0 12px",
        fontSize: 13,
        fontWeight: 600,
        color: "var(--text)",
        background: `var(--card) url("${CHEVRON}") no-repeat right 10px center`,
        backgroundSize: "12px",
        border: "1px solid var(--border)",
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        outline: "none",
        transition: "border-color 0.12s, box-shadow 0.12s",
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--navy-700)";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(20,44,94,0.12)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}
