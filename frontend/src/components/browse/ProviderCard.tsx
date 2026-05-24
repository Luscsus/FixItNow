import { Link, useNavigate } from "react-router-dom";
import type { ProviderDto } from "@/services/providerService";
import { CATEGORY_LABEL, avatarColor, initials } from "./browseConstants";
import { SaveProviderButton } from "./SaveProviderButton";

interface ProviderCardProps {
  provider: ProviderDto;
  coords: { lat: number; lon: number } | null;
  selectionMode: boolean;
  routerState: { formState?: unknown } | null;
}

export function ProviderCard({
  provider: p,
  coords,
  selectionMode,
  routerState,
}: Readonly<ProviderCardProps>) {
  const navigate = useNavigate();
  const av = avatarColor(p.id);
  const init = initials(p.firstName, p.lastName);
  const showDist =
    coords != null && p.distanceKm != null && p.distanceKm < 19000;

  return (
    <div
      className="browse-provider-card"
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "96px 1fr auto",
        gap: 20,
        background: "var(--card, #fff)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 20,
        alignItems: "flex-start",
      }}
    >
      {/* Stretched link — covers entire card, sits behind buttons via z-index */}
      <Link
        to={`/providers/${p.id}`}
        state={{ provider: p }}
        aria-label={`View ${p.firstName} ${p.lastName}'s profile`}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 12,
          zIndex: 1,
        }}
      />

      {/* Avatar */}
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 14,
          background: av.bg,
          color: av.color,
          display: "grid",
          placeItems: "center",
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        {init}
      </div>

      {/* Content */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            {p.firstName} {p.lastName}
          </h3>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              color: "var(--emerald-700, #047857)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              background: "var(--emerald-100, #d1fae5)",
              padding: "2px 7px",
              borderRadius: 4,
            }}
          >
            ✓ Verified
          </span>
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            marginTop: 4,
            fontFamily: "var(--font-mono)",
          }}
        >
          {p.yearsOfExperience} yr exp
          {p.serviceRadiusKm ? ` · serves within ${p.serviceRadiusKm} km` : ""}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 8,
          }}
        >
          {p.categories.map((cat) => (
            <span
              key={cat}
              style={{
                fontSize: 11.5,
                fontWeight: 500,
                padding: "3px 9px",
                background: "var(--slate-100)",
                color: "var(--text)",
                borderRadius: 999,
              }}
            >
              {CATEGORY_LABEL[cat] ?? cat}
            </span>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginTop: 12,
            fontSize: 13,
            color: "var(--text-muted)",
            flexWrap: "wrap",
          }}
        >
          <span>
            <b style={{ color: "var(--text)", fontWeight: 600 }}>
              {p.yearsOfExperience} yr
            </b>{" "}
            experience
          </span>
          {showDist && (
            <span>
              ·{" "}
              <b style={{ color: "var(--text)", fontWeight: 600 }}>
                {p.distanceKm!.toFixed(1)} km
              </b>{" "}
              away
            </span>
          )}
        </div>
        {p.bio && (
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              lineHeight: 1.45,
              marginTop: 8,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {p.bio}
          </div>
        )}
      </div>

      {/* CTA — position: relative + zIndex: 2 keeps buttons above the stretched link */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "flex-end",
          minWidth: 152,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <SaveProviderButton providerId={p.id} />
          <span
            style={{
              fontSize: 11.5,
              fontFamily: "var(--font-mono)",
              color: "var(--emerald-700, #047857)",
              background: "var(--emerald-100, #d1fae5)",
              padding: "3px 8px",
              borderRadius: 4,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Active
          </span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: "var(--text)",
            fontWeight: 500,
          }}
        >
          from <b>${p.pricePerHour}</b>
          <small style={{ color: "var(--text-muted)", fontWeight: 400 }}>
            {" "}
            /hr
          </small>
        </span>
        {selectionMode ? (
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={() =>
              navigate("/tickets/new", {
                state: {
                  formState: routerState?.formState,
                  selectedProvider: {
                    id: p.id,
                    email: "",
                    firstName: p.firstName,
                    lastName: p.lastName,
                    phoneNumber: null,
                    status: p.status,
                    emailVerified: true,
                    locationLat: p.locationLat,
                    locationLon: p.locationLon,
                    pricePerHour: p.pricePerHour,
                    yearsOfExperience: p.yearsOfExperience,
                    serviceRadiusKm: p.serviceRadiusKm,
                    categories: p.categories,
                    bio: p.bio,
                    rejectionReason: null,
                    approvedAt: null,
                    createdAt: new Date(p.createdAt),
                  },
                },
              })
            }
          >
            Select →
          </button>
        ) : (
          <>
            <button className="btn btn-primary btn-sm" type="button">
              Book →
            </button>
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              style={{ fontSize: 12, padding: "4px 8px" }}
            >
              Message
            </button>
          </>
        )}
      </div>
    </div>
  );
}
