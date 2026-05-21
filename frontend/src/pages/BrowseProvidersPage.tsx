import { useNavigate, useLocation } from "react-router-dom";

import type { Provider } from "@/domain/admin";
import { useProvidersQuery } from "@/hooks/useProvidersQuery";

function categoryLabel(cat: string): string {
  return cat
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function providerInitials(p: Provider): string {
  return ((p.firstName?.[0] ?? "") + (p.lastName?.[0] ?? "")).toUpperCase() || "?";
}

export function BrowseProvidersPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { data: providers = [], isLoading } = useProvidersQuery();
  const savedFormState = (routerLocation.state as { formState?: unknown } | null)?.formState;

  function handleSelect(provider: Provider) {
    navigate("/tickets/new", { state: { selectedProvider: provider, formState: savedFormState } });
  }

  return (
    <main className="container page">
      <div className="crumbs">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("/tickets/new", { state: { formState: savedFormState } });
          }}
        >
          New ticket
        </a>{" "}
        <span className="sep">/</span> Browse providers
      </div>

      <div className="new-ticket-heading">
        <span className="eyebrow">Providers</span>
        <h1 className="display-2 new-ticket-title">
          Pick a <span className="amber-underline">provider</span>.
        </h1>
      </div>

      {isLoading ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: "var(--slate-400)" }}>
          Loading providers…
        </div>
      ) : providers.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 15, color: "var(--slate-500)" }}>
            No approved providers available yet.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
            marginTop: 8,
          }}
        >
          {providers.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} onSelect={handleSelect} />
          ))}
        </div>
      )}
    </main>
  );
}

function ProviderCard({
  provider,
  onSelect,
}: {
  provider: Provider;
  onSelect: (p: Provider) => void;
}) {
  const fullName =
    [provider.firstName, provider.lastName].filter(Boolean).join(" ") || provider.email;

  return (
    <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
        <div
          className="avatar"
          style={{
            width: 44,
            height: 44,
            fontSize: 15,
            background: "var(--amber-500)",
            color: "var(--navy-900)",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {providerInitials(provider)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{fullName}</div>
          {provider.pricePerHour != null && (
            <div className="muted" style={{ fontSize: 12.5 }}>
              ${provider.pricePerHour} / hr
            </div>
          )}
        </div>

        {provider.yearsOfExperience != null && (
          <span
            className="pill"
            style={{ background: "var(--slate-100)", color: "var(--slate-600)", fontSize: 11.5 }}
          >
            {provider.yearsOfExperience} yr exp
          </span>
        )}
      </div>

      {provider.bio && (
        <p
          className="muted"
          style={{
            fontSize: 13,
            lineHeight: 1.55,
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {provider.bio}
        </p>
      )}

      {provider.categories.length > 0 && (
        <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
          {provider.categories.map((cat) => (
            <span
              key={cat}
              className="pill"
              style={{ background: "var(--blue-50, #eff6ff)", color: "var(--blue-700, #1d4ed8)", fontSize: 11 }}
            >
              {categoryLabel(cat)}
            </span>
          ))}
        </div>
      )}

      <button
        className="btn btn-primary btn-sm"
        style={{ marginTop: 4, alignSelf: "flex-start" }}
        type="button"
        onClick={() => onSelect(provider)}
      >
        Select provider →
      </button>
    </div>
  );
}
