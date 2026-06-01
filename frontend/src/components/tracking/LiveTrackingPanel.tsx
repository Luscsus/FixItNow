import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth";
import { getTrackingSnapshot } from "@/services/trackingService";
import { useTrackingSocket } from "@/hooks/useTrackingSocket";
import { LiveTrackingMap } from "./LiveTrackingMap";
import { formatDistance, formatEta, googleMapsDirUrl, appleMapsDirUrl } from "./trackingFormat";
import type { Ticket } from "@/domain/ticket";
import type { TrackingSnapshot } from "@/domain/tracking";

interface Props {
  ticket: Ticket;
  isProvider: boolean;
}

/**
 * Live GPS tracking panel shown on the ticket detail page while the ticket is
 * IN_TRANSIT.
 *
 *  - Customer: watches the provider move on a map with live distance/ETA.
 *  - Provider: toggles "Share my location", which streams their browser GPS to
 *    the server (and back, so they see their own ETA too).
 */
export function LiveTrackingPanel({ ticket, isProvider }: Readonly<Props>) {
  const { accessToken, refreshSession } = useAuth();
  const [snapshot, setSnapshot] = useState<TrackingSnapshot | null>(null);
  // Providers auto-start sharing as soon as the ticket is in transit — the
  // "Mark as In Transit" click is the user gesture that lets the geolocation
  // prompt appear. They can still toggle it off.
  const [sharing, setSharing] = useState(isProvider);
  const [geoError, setGeoError] = useState<string | null>(null);
  // Reported GPS accuracy radius (metres) of the provider's own last fix —
  // surfaced so they understand why a laptop's position can look off.
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  // Throttle publishes: watchPosition can fire several times a second, but each
  // update triggers a server-side OSRM routing call. ~4s is plenty for a live
  // ETA and keeps us well under the public OSRM demo server's rate limits.
  const lastPublishRef = useRef<number>(0);

  const active = ticket.status === "IN_TRANSIT";

  // Seed the last-known snapshot from REST (covers refresh + initial load).
  // The live WS feed is the source of truth, so a failed seed isn't fatal —
  // don't retry (avoids console noise when the backend is briefly unreachable).
  const seedQuery = useQuery({
    queryKey: ["tracking", ticket.id],
    queryFn: () => getTrackingSnapshot(ticket.id, accessToken),
    enabled: active && Boolean(accessToken),
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (seedQuery.data && !snapshot) setSnapshot(seedQuery.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedQuery.data]);

  const { connected, publishLocation } = useTrackingSocket({
    ticketId: active ? ticket.id : null,
    accessToken,
    onSnapshot: setSnapshot,
    refreshSession,
  });

  // Provider GPS broadcast: start/stop watchPosition with the share toggle.
  useEffect(() => {
    if (!isProvider || !sharing || !active) {
      // Stop any active watch when sharing turns off.
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }
    if (!("geolocation" in navigator)) {
      setGeoError("Geolocation isn't available in this browser.");
      setSharing(false);
      return;
    }
    setGeoError(null);
    const MIN_PUBLISH_INTERVAL_MS = 4_000;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setAccuracyMeters(pos.coords.accuracy);
        const now = Date.now();
        if (now - lastPublishRef.current < MIN_PUBLISH_INTERVAL_MS) return;
        lastPublishRef.current = now;
        publishLocation({
          ticketId: ticket.id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: Number.isFinite(pos.coords.heading) ? pos.coords.heading : null,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError(
            "Location is blocked for this site. Click the icon left of the address " +
            "bar → Site settings → Location → Allow, then reload and try again.",
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoError("Your device couldn't determine its position. Check that location services are on.");
        } else {
          setGeoError("Couldn't read your location — please try again.");
        }
        setSharing(false);
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 },
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isProvider, sharing, active, ticket.id, publishLocation]);

  if (!active) return null;

  const hasDest = snapshot?.destLat != null && snapshot?.destLng != null;
  const hasProvider = snapshot?.providerLat != null && snapshot?.providerLng != null;

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div>
          <div
            className="mono"
            style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}
          >
            Live tracking
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
            {isProvider ? "Your route to the customer" : "Your provider is on the way"}
          </div>
        </div>
        <span style={{ flex: 1 }} />
        <span
          className="mono"
          style={{
            fontSize: 10.5,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: connected ? "var(--emerald-700)" : "var(--text-muted)",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 3, background: connected ? "var(--emerald-600)" : "var(--slate-400)" }} />
          {connected ? "Live" : "Connecting…"}
        </span>
      </div>

      {/* Map */}
      <div style={{ height: 320, position: "relative" }}>
        {hasDest ? (
          <LiveTrackingMap
            providerLat={snapshot!.providerLat}
            providerLng={snapshot!.providerLng}
            destLat={snapshot!.destLat!}
            destLng={snapshot!.destLng!}
          />
        ) : (
          <div style={{ height: "100%", display: "grid", placeItems: "center", color: "var(--text-muted)", fontSize: 13, background: "var(--slate-50, #f8fafc)", textAlign: "center", padding: "0 24px" }}>
            {seedQuery.isFetching
              ? "Locating destination…"
              : "We couldn't resolve this ticket's address to a point on the map."}
          </div>
        )}
      </div>

      {/* Stats / controls */}
      <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Provider: destination address + one-tap navigation (origin pre-filled
            with the provider's live position when available, so both ends are
            set and they can just hit Start). */}
        {isProvider && hasDest && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: "12px",
              borderRadius: 10,
              background: "var(--slate-50, #f8fafc)",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Destination
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, wordBreak: "break-word" }}>
                {snapshot!.destAddress || ticket.location || "Customer location"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a
                className="btn btn-primary btn-sm"
                href={googleMapsDirUrl({
                  destLat: snapshot!.destLat!,
                  destLng: snapshot!.destLng!,
                  originLat: snapshot!.providerLat,
                  originLng: snapshot!.providerLng,
                })}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11" />
                </svg>
                Google Maps
              </a>
              <a
                className="btn btn-secondary btn-sm"
                href={appleMapsDirUrl({
                  destLat: snapshot!.destLat!,
                  destLng: snapshot!.destLng!,
                  originLat: snapshot!.providerLat,
                  originLng: snapshot!.providerLng,
                })}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11" />
                </svg>
                Apple Maps
              </a>
            </div>
            {!hasProvider && (
              <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                Tip: turn on location sharing first so navigation starts from your current position.
              </span>
            )}
          </div>
        )}

        {hasProvider ? (
          <div style={{ display: "flex", gap: 24 }}>
            <div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Distance left
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>
                {formatDistance(snapshot!.distanceMeters)}
              </div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                ETA
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>
                {formatEta(snapshot!.etaSeconds)}
              </div>
            </div>
            {snapshot!.nearby && (
              <div style={{ marginLeft: "auto", alignSelf: "center" }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "5px 12px",
                    borderRadius: 999,
                    background: "var(--emerald-100, #d1fae5)",
                    color: "var(--emerald-700, #047857)",
                  }}
                >
                  Almost there
                </span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {isProvider
              ? (sharing
                  ? "Getting your location… allow the permission prompt so the customer can see you approaching."
                  : "Location sharing is off. Turn it on so the customer can see you approaching.")
              : "Waiting for your provider to start sharing their location…"}
          </div>
        )}

        {/* Provider share toggle */}
        {isProvider && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              className={`btn btn-sm ${sharing ? "btn-secondary" : "btn-primary"}`}
              onClick={() => setSharing((s) => !s)}
            >
              {sharing ? "Stop sharing location" : "Share my location"}
            </button>
            {sharing && (
              <span style={{ fontSize: 12.5, color: "var(--emerald-700)" }}>
                Broadcasting your position live
              </span>
            )}
          </div>
        )}

        {/* GPS accuracy note — on laptops/desktops the browser positions you via
            Wi-Fi/IP, which can be off by hundreds of metres. Real GPS (a phone)
            is far more precise. */}
        {isProvider && sharing && accuracyMeters != null && (
          <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
            Location accuracy: ±{Math.round(accuracyMeters)} m
            {accuracyMeters > 200 &&
              " — this device positions via Wi-Fi. Open FixItNow on your phone for precise GPS."}
          </span>
        )}

        {geoError && (
          <div style={{ fontSize: 12.5, color: "#B91C1C", background: "#FEE2E2", padding: "8px 10px", borderRadius: 8 }}>
            {geoError}
          </div>
        )}
      </div>
    </div>
  );
}
