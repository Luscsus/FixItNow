export function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  if (total <= 1) return null;

  const pages: (number | "…")[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++)
      pages.push(i);
    if (page < total - 2) pages.push("…");
    pages.push(total);
  }

  const base: React.CSSProperties = {
    minWidth: 36,
    height: 36,
    padding: "0 10px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--card, #fff)",
    color: "var(--text)",
    fontSize: 13.5,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.1s",
  };

  return (
    <div
      className="pagination"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 4,
        marginTop: 32,
        marginBottom: 40,
      }}
    >
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        style={{
          ...base,
          opacity: page === 1 ? 0.35 : 1,
          cursor: page === 1 ? "default" : "pointer",
          gap: 6,
          paddingLeft: 12,
        }}
      >
        ← Prev
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`e${i}`}
            style={{
              padding: "0 4px",
              color: "var(--text-muted)",
              fontSize: 13,
              userSelect: "none",
            }}
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            style={{
              ...base,
              background:
                p === page ? "var(--navy-900, #0b1e3f)" : "var(--card, #fff)",
              color: p === page ? "#fff" : "var(--text)",
              borderColor:
                p === page ? "var(--navy-900, #0b1e3f)" : "var(--border)",
              fontWeight: p === page ? 700 : 500,
            }}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === total}
        style={{
          ...base,
          opacity: page === total ? 0.35 : 1,
          cursor: page === total ? "default" : "pointer",
          gap: 6,
          paddingRight: 12,
        }}
      >
        Next →
      </button>
    </div>
  );
}

export function usePaginatedItems<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    pageItems: items.slice(start, start + pageSize),
    totalPages,
    safePage,
  };
}
