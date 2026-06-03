import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ProviderDto } from "@/services/providerService";
import { CATEGORY_LABEL, avatarColor, initials, useBrowseI18n } from "./browseConstants";
import { SaveProviderButton } from "./SaveProviderButton";
import { useAuth } from "@/context/auth";
import { useTicketsQuery } from "@/hooks/useTicketsQuery";

interface ProviderCardProps {
  provider: ProviderDto;
  coords: { lat: number; lon: number } | null;
  selectionMode: boolean;
  routerState: { formState?: unknown } | null;
}

/**
 * Build the `state.selectedProvider` payload the new-ticket form expects.
 * Centralised so both "Book" and "Message" (and any future entry points)
 * stay in sync if the form's shape changes.
 */
function buildSelectedProviderState(p: ProviderDto, formState?: unknown) {
  return {
    formState,
    selectedProvider: {
      id: p.id,
      email: "",
      firstName: p.firstName,
      lastName: p.lastName,
      phoneNumber: null,
      status: p.status,
      emailVerified: true,
      locationStreetName: p.locationStreetName,
      locationStreetNumber: p.locationStreetNumber,
      locationCity: p.locationCity,
      locationPostalCode: p.locationPostalCode,
      locationCountry: p.locationCountry,
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
  };
}

export function ProviderCard({
  provider: p,
  coords,
  selectionMode,
  routerState,
}: Readonly<ProviderCardProps>) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { categoryLabels } = useBrowseI18n();
  const { isAuthenticated } = useAuth();
  // Customer's own tickets — used to find an existing chat with this provider
  // when they click "Message". Empty for non-customers (query disabled).
  const { data: ownTickets = [] } = useTicketsQuery();
  const av = avatarColor(p.id);
  const init = initials(p.firstName, p.lastName);
  const showDist =
    coords != null && p.distanceKm != null && p.distanceKm < 19000;

  /** Go to /tickets/new with this provider pre-attached. */
  function handleBook() {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    navigate("/tickets/new", {
      state: buildSelectedProviderState(p, routerState?.formState),
    });
  }

  /**
   * Open the existing chat with this provider if one exists; otherwise fall
   * back to the new-ticket flow (chat rooms in this app only exist tied to
   * tickets).
   */
  function handleMessage() {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    const ticketWithChat = ownTickets
      .filter((t) => t.assignedServiceProviderId === p.id && t.chatRoomId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))[0];
    if (ticketWithChat?.chatRoomId) {
      navigate(`/chat?room=${ticketWithChat.chatRoomId}`);
    } else {
      handleBook();
    }
  }

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
          overflow: "hidden",
        }}
      >
        {p.profilePictureUrl ? (
          <img
            src={p.profilePictureUrl}
            alt={`${p.firstName} ${p.lastName}`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          init
        )}
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
            {t("providerCard.verified")}
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
          {t("providerCard.yrExp", { n: p.yearsOfExperience })}
          {p.serviceRadiusKm ? ` · ${t("providerCard.servesWithin", { km: p.serviceRadiusKm })}` : ""}
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
              {categoryLabels[cat] ?? CATEGORY_LABEL[cat] ?? cat}
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
              {p.yearsOfExperience} {t("profile.yr")}
            </b>{" "}
            {t("providerCard.experience")}
          </span>
          {showDist && (
            <span>
              ·{" "}
              <b style={{ color: "var(--text)", fontWeight: 600 }}>
                {p.distanceKm!.toFixed(1)} km
              </b>{" "}
              {t("providerCard.away")}
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
            {t("providerCard.active")}
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
          {t("providerCard.from")} <b>€{p.pricePerHour}</b>
          <small style={{ color: "var(--text-muted)", fontWeight: 400 }}>
            {" "}
            {t("common.perHour")}
          </small>
        </span>
        {selectionMode ? (
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={() =>
              navigate("/tickets/new", {
                state: buildSelectedProviderState(p, routerState?.formState),
              })
            }
          >
            {t("providerCard.select")}
          </button>
        ) : (
          <>
            <button
              className="btn btn-primary btn-sm"
              type="button"
              onClick={handleBook}
            >
              {t("providerCard.book")}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              style={{ fontSize: 12, padding: "4px 8px" }}
              onClick={handleMessage}
            >
              {t("providerCard.message")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
