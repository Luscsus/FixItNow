import { useAuth } from "@/context/auth";
import {
  useSavedProvidersQuery,
  useToggleSavedProvider,
} from "@/hooks/useSavedProviders";

interface SaveProviderButtonProps {
  providerId: string;
  variant?: "icon" | "full";
}

export function SaveProviderButton({ providerId, variant = "icon" }: SaveProviderButtonProps) {
  const { role, accessToken } = useAuth();
  const { data: saved = [] } = useSavedProvidersQuery();
  const toggle = useToggleSavedProvider();

  if (!accessToken || role !== "CUSTOMER") return null;

  const isSaved = saved.some((p) => p.id === providerId);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    toggle.mutate({ providerId, save: !isSaved });
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        className={`btn btn-sm ${isSaved ? "btn-secondary" : "btn-ghost"}`}
        onClick={handleClick}
        disabled={toggle.isPending}
        aria-pressed={isSaved}
      >
        <span style={{ marginRight: 6, color: isSaved ? "var(--amber-500)" : "inherit" }}>
          {isSaved ? "★" : "☆"}
        </span>
        {isSaved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggle.isPending}
      aria-label={isSaved ? "Unsave provider" : "Save provider"}
      aria-pressed={isSaved}
      title={isSaved ? "Saved" : "Save provider"}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontSize: 18,
        color: isSaved ? "var(--amber-500)" : "var(--slate-400)",
        padding: 4,
        lineHeight: 1,
      }}
    >
      {isSaved ? "★" : "☆"}
    </button>
  );
}
