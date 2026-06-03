interface AuthStatProps {
  /** The formatted value to show, or null when unavailable (renders a fallback dash). */
  value: string | null;
  label: string;
  loading?: boolean;
}

/**
 * A single metric tile in the auth-page side panel. Shows a subtle skeleton
 * while loading and an em-dash fallback when the value is unavailable, so the
 * layout never collapses or shows stale placeholders.
 */
export function AuthStat({ value, label, loading = false }: AuthStatProps) {
  return (
    <div>
      <b>
        {loading ? (
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: "2.4em",
              height: "0.7em",
              borderRadius: 4,
              background: "currentColor",
              opacity: 0.18,
              animation: "authStatPulse 1.2s ease-in-out infinite",
            }}
          />
        ) : (
          value ?? "—"
        )}
      </b>
      <br />
      {label}
    </div>
  );
}

