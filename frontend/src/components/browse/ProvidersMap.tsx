import { useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ProviderDto } from "@/services/providerService";
import { avatarColor, initials, CATEGORY_LABEL } from "./browseConstants";

function createProviderIcon(provider: ProviderDto) {
  const av = avatarColor(provider.id);
  const init = initials(provider.firstName, provider.lastName);
  return L.divIcon({
    className: "",
    html: `<div style="width:40px;height:40px;border-radius:50%;background:${av.bg};color:${av.color};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.35);cursor:pointer;letter-spacing:-0.01em">${init}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -24],
  });
}

function AutoFitBounds({
  providers,
  userCoords,
}: {
  providers: ProviderDto[];
  userCoords: { lat: number; lon: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = providers
      .filter((p) => p.locationLat != null && p.locationLon != null)
      .map((p) => [p.locationLat!, p.locationLon!]);

    if (userCoords) points.push([userCoords.lat, userCoords.lon]);

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [map, providers, userCoords]);

  return null;
}

interface ProvidersMapProps {
  providers: ProviderDto[];
  userCoords: { lat: number; lon: number } | null;
}

export function ProvidersMap({ providers, userCoords }: ProvidersMapProps) {
  const navigate = useNavigate();

  const mappable = useMemo(
    () => providers.filter((p) => p.locationLat != null && p.locationLon != null),
    [providers],
  );

  const center: [number, number] = userCoords
    ? [userCoords.lat, userCoords.lon]
    : mappable.length > 0
      ? [mappable[0].locationLat!, mappable[0].locationLon!]
      : [46.5, 15.6];

  if (mappable.length === 0) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontSize: 14,
          background: "var(--slate-50, #f8fafc)",
        }}
      >
        No providers with location data to display.
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={userCoords ? 10 : 7}
      style={{ width: "100%", height: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <AutoFitBounds providers={mappable} userCoords={userCoords} />
      {mappable.map((p) => (
        <Marker
          key={p.id}
          position={[p.locationLat!, p.locationLon!]}
          icon={createProviderIcon(p)}
          eventHandlers={{
            click: () =>
              navigate(`/providers/${p.id}`, { state: { provider: p } }),
          }}
        >
          <Tooltip direction="top" offset={[0, -24]}>
            <div style={{ fontFamily: "inherit", lineHeight: 1.5, minWidth: 120 }}>
              <b style={{ fontSize: 13 }}>
                {p.firstName} {p.lastName}
              </b>
              {p.categories.length > 0 && (
                <>
                  <br />
                  <span style={{ fontSize: 12, color: "#555" }}>
                    {CATEGORY_LABEL[p.categories[0]] ?? p.categories[0]}
                  </span>
                </>
              )}
              <br />
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                ${p.pricePerHour}/hr
              </span>
            </div>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
