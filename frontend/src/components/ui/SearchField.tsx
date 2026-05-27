import type { CSSProperties, InputHTMLAttributes } from "react";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

type SearchFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  containerStyle?: CSSProperties;
};

export function SearchField({ containerStyle, ...props }: SearchFieldProps) {
  return (
    <div style={{ position: "relative", width: "100%", ...containerStyle }}>
      <span style={{
        position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
        color: "var(--text-muted)", pointerEvents: "none", display: "flex",
      }}>
        <SearchIcon />
      </span>
      <input
        type="search"
        {...props}
        style={{
          height: 42,
          width: "100%",
          padding: "0 14px 0 38px",
          fontSize: 14,
          color: "var(--text)",
          background: "#fff",
          border: "1.5px solid var(--border)",
          borderRadius: 10,
          outline: "none",
          boxShadow: "var(--shadow-sm)",
          boxSizing: "border-box",
          transition: "border-color 0.12s, box-shadow 0.12s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--navy-700)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(20,44,94,0.12)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        }}
      />
    </div>
  );
}
