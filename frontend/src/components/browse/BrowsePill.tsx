export function BrowsePill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "5px 13px",
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: active ? 600 : 400,
        border: `1.5px solid ${active ? "var(--navy-700, #1e3a8a)" : "var(--border)"}`,
        background: active ? "var(--navy-900, #0b1e3f)" : "transparent",
        color: active ? "#fff" : "var(--text)",
        cursor: "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
        transition: "all 0.12s",
      }}
    >
      {children}
    </button>
  );
}
