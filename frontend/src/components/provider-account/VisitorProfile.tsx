import { Link, useNavigate } from "react-router-dom";
import type { ProviderDto } from "@/services/providerService";
import { CATEGORY_LABEL, avatarColor, initials } from "@/components/browse/browseConstants";
import { SaveProviderButton } from "@/components/browse/SaveProviderButton";
import { WeekSchedule } from "@/components/provider-account/WeekSchedule";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { useAuth } from "@/context/auth";
import { useTicketsQuery } from "@/hooks/useTicketsQuery";

interface VisitorProfileProps {
  provider: ProviderDto | undefined;
}

export function VisitorProfile({ provider }: Readonly<VisitorProfileProps>) {
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
            <Link to="/" style={{ color: "rgba(255,255,255,0.55)" }}>Home</Link>
            <span className="sep">/</span>
            <Link to="/browse" style={{ color: "rgba(255,255,255,0.55)" }}>Browse providers</Link>
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
                  <span className="verified-md">✓ Verified</span>
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
                    {CATEGORY_LABEL[cat] ?? cat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rev-strip">
            <div className="rev-cell amber">
              <div className="lbl">Rate</div>
              <div className="val">
                ${provider.pricePerHour}
                <span className="unit">/hr</span>
              </div>
            </div>
            <div className="rev-cell">
              <div className="lbl">Experience</div>
              <div className="val">
                {provider.yearsOfExperience}
                <span className="unit">yr</span>
              </div>
            </div>
            {provider.serviceRadiusKm > 0 && (
              <div className="rev-cell">
                <div className="lbl">Service radius</div>
                <div className="val">
                  {provider.serviceRadiusKm}
                  <span className="unit">km</span>
                </div>
              </div>
            )}
            <div className="rev-cell">
              <div className="lbl">Status</div>
              <div className="val" style={{ fontSize: 16 }}>
                <span style={{ color: "#34D399" }}>●</span>
                <span className="unit">Active</span>
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
                <span className="label">About</span>
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
            <span className="label">Trades &amp; specialties</span>
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
              <span className="label">Book {provider.firstName}</span>
            </div>
            <div className="rail-row">
              <span className="k">Hourly rate</span>
              <span className="v mono" style={{ fontSize: 14 }}>
                ${provider.pricePerHour} <span className="muted">/ hr</span>
              </span>
            </div>
            {provider.serviceRadiusKm > 0 && (
              <div className="rail-row">
                <span className="k">Service area</span>
                <span className="v mono" style={{ fontSize: 14 }}>
                  {provider.serviceRadiusKm} km radius
                </span>
              </div>
            )}
            <div className="rail-row">
              <span className="k">Experience</span>
              <span className="v mono" style={{ fontSize: 14 }}>
                {provider.yearsOfExperience} yr
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
                  Book now →
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-full"
                  style={{ marginTop: 8 }}
                  onClick={goToMessageProvider}
                >
                  Send message
                </button>
              </>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
