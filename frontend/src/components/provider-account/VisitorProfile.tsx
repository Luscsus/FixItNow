import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ProviderDto } from "@/services/providerService";
import { CATEGORY_LABEL, avatarColor, initials, useBrowseI18n } from "@/components/browse/browseConstants";
import { SaveProviderButton } from "@/components/browse/SaveProviderButton";
import { WeekSchedule } from "@/components/provider-account/WeekSchedule";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { useAuth } from "@/context/auth";
import { useTicketsQuery } from "@/hooks/useTicketsQuery";

interface VisitorProfileProps {
  provider: ProviderDto | undefined;
}

export function VisitorProfile({ provider }: Readonly<VisitorProfileProps>) {
  const { t } = useTranslation();
  const { categoryLabels } = useBrowseI18n();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  // Customer's own tickets — used to find an existing chat with this provider
  // when they hit "Send message". Providers viewing other providers won't have
  // this populated (the query is disabled), and that's fine.
  const { data: ownTickets = [] } = useTicketsQuery();

  /** Navigate to the new-ticket flow with this provider pre-attached. */
  function goToNewTicketWithProvider() {
    if (!provider) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    navigate("/tickets/new", {
      state: {
        selectedProvider: {
          id: provider.id,
          email: "",
          firstName: provider.firstName,
          lastName: provider.lastName,
          phoneNumber: provider.phoneNumber ?? null,
          profilePictureUrl: provider.profilePictureUrl ?? null,
          status: provider.status,
          emailVerified: provider.emailVerified ?? true,
          locationStreetName: provider.locationStreetName,
          locationStreetNumber: provider.locationStreetNumber,
          locationCity: provider.locationCity,
          locationPostalCode: provider.locationPostalCode,
          locationCountry: provider.locationCountry,
          locationLat: provider.locationLat,
          locationLon: provider.locationLon,
          pricePerHour: provider.pricePerHour,
          yearsOfExperience: provider.yearsOfExperience,
          serviceRadiusKm: provider.serviceRadiusKm,
          categories: provider.categories,
          bio: provider.bio,
        },
      },
    });
  }

  /**
   * Try to open an existing chat with this provider. Chat rooms only exist
   * tied to tickets in this app, so:
   *   1. If the customer already has a ticket assigned to this provider with
   *      a live chat room → open that chat directly.
   *   2. Otherwise fall back to creating a new ticket (same as "Book now").
   */
  function goToMessageProvider() {
    if (!provider) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    // Find the most recent ticket with this provider that has a chat room.
    const ticketWithChat = ownTickets
      .filter((t) => t.assignedServiceProviderId === provider.id && t.chatRoomId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))[0];
    if (ticketWithChat?.chatRoomId) {
      navigate(`/chat?room=${ticketWithChat.chatRoomId}`);
    } else {
      // No existing chat — only way to start one is via a ticket.
      goToNewTicketWithProvider();
    }
  }

  // Hide the booking rail entirely for providers viewing other providers —
  // booking/messaging another provider doesn't make sense in this app.
  const showBookingRail = role !== "PROVIDER";
  if (!provider) {
    return (
      <div>
        <div className="pro-hero">
          <div className="pro-hero-grid" />
          <div className="container" style={{ paddingTop: 48, paddingBottom: 48 }}>
            <div style={{ height: 80, borderRadius: 12, background: "rgba(255,255,255,0.08)", maxWidth: 400 }} />
          </div>
        </div>
      </div>
    );
  }

  const av = avatarColor(provider.id);
  const init = initials(provider.firstName, provider.lastName);

  return (
    <div>
      <section className="pro-hero">
        <div className="pro-hero-grid" />
        <div className="container">
          <div className="crumbs" style={{ color: "rgba(255,255,255,0.55)", marginBottom: 18 }}>
            <Link to="/" style={{ color: "rgba(255,255,255,0.55)" }}>{t("profile.home")}</Link>
            <span className="sep">/</span>
            <Link to="/browse" style={{ color: "rgba(255,255,255,0.55)" }}>{t("profile.browse")}</Link>
            <span className="sep">/</span>
            <span style={{ color: "rgba(255,255,255,0.85)" }}>
              {provider.firstName} {provider.lastName}
            </span>
          </div>

          <div className="pro-hero-inner">
            <div
              className="pro-avatar"
              style={provider.profilePictureUrl
                ? { padding: 0, overflow: "hidden" }
                : { background: av.bg, color: av.color }}
            >
              {provider.profilePictureUrl ? (
                <img
                  src={provider.profilePictureUrl}
                  alt={`${provider.firstName} ${provider.lastName}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                init
              )}
            </div>
            <div>
              <h1>
                {provider.firstName} {provider.lastName}
                {provider.emailVerified && (
                  <span className="verified-md">{t("providerCard.verified")}</span>
                )}
                <span style={{ marginLeft: 12, display: "inline-flex", verticalAlign: "middle" }}>
                  <SaveProviderButton providerId={provider.id} variant="full" />
                </span>
              </h1>
              <div className="sub" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {provider.categories.map((cat) => (
                  <span
                    key={cat}
                    className="mono"
                    style={{
                      fontSize: 11,
                      background: "rgba(255,255,255,0.12)",
                      padding: "2px 8px",
                      borderRadius: 4,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {categoryLabels[cat] ?? CATEGORY_LABEL[cat] ?? cat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rev-strip">
            <div className="rev-cell amber">
              <div className="lbl">{t("profile.rate")}</div>
              <div className="val">
                €{provider.pricePerHour}
                <span className="unit">{t("common.perHour")}</span>
              </div>
            </div>
            <div className="rev-cell">
              <div className="lbl">{t("profile.experience")}</div>
              <div className="val">
                {provider.yearsOfExperience}
                <span className="unit">{t("profile.yr")}</span>
              </div>
            </div>
            {provider.serviceRadiusKm > 0 && (
              <div className="rev-cell">
                <div className="lbl">{t("profile.serviceRadius")}</div>
                <div className="val">
                  {provider.serviceRadiusKm}
                  <span className="unit">{t("common.km")}</span>
                </div>
              </div>
            )}
            <div className="rev-cell">
              <div className="lbl">{t("profile.status")}</div>
              <div className="val" style={{ fontSize: 16 }}>
                <span style={{ color: "#34D399" }}>●</span>
                <span className="unit">{t("profile.active")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container pro-body">
        <div>
          {provider.bio && (
            <>
              <div className="panel-title">
                <span className="num">01</span>
                <span className="label">{t("profile.about")}</span>
                <span className="rule" />
              </div>
              <div className="card card-pad" style={{ marginBottom: 32 }}>
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.7, color: "var(--text)" }}>
                  {provider.bio}
                </p>
              </div>
            </>
          )}

          <div className="panel-title">
            <span className="num">{provider.bio ? "02" : "01"}</span>
            <span className="label">{t("profile.tradesSpecialties")}</span>
            <span className="rule" />
          </div>
          <div className="card card-pad" style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {provider.categories.map((cat) => (
                <span className="specchip" key={cat}>
                  {CATEGORY_LABEL[cat] ?? cat}
                </span>
              ))}
            </div>
          </div>

          <WeekSchedule providerId={provider.id} editable={false} />

          <div style={{ marginTop: 32 }}>
            <ReviewsSection
              providerId={provider.id}
              sectionNumber={provider.bio ? "03" : "02"}
            />
          </div>
        </div>

        <aside>
          <div className="rail-card">
            <div className="rail-head">
              <span className="label">{t("profile.book", { name: provider.firstName })}</span>
            </div>
            <div className="rail-row">
              <span className="k">{t("profile.hourlyRate")}</span>
              <span className="v mono" style={{ fontSize: 14 }}>
                €{provider.pricePerHour} <span className="muted">{t("common.perHour")}</span>
              </span>
            </div>
            {provider.serviceRadiusKm > 0 && (
              <div className="rail-row">
                <span className="k">{t("profile.serviceArea")}</span>
                <span className="v mono" style={{ fontSize: 14 }}>
                  {provider.serviceRadiusKm} {t("profile.kmRadius")}
                </span>
              </div>
            )}
            <div className="rail-row">
              <span className="k">{t("profile.experience")}</span>
              <span className="v mono" style={{ fontSize: 14 }}>
                {provider.yearsOfExperience} {t("profile.yr")}
              </span>
            </div>
            {showBookingRail && (
              <>
                <button
                  type="button"
                  className="btn btn-primary btn-full"
                  style={{ marginTop: 16 }}
                  onClick={goToNewTicketWithProvider}
                >
                  {t("profile.bookNow")}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-full"
                  style={{ marginTop: 8 }}
                  onClick={goToMessageProvider}
                >
                  {t("profile.sendMessage")}
                </button>
              </>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
