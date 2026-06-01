import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LiveTrackingMapProps {
  providerLat: number | null;
  providerLng: number | null;
  destLat: number;
  destLng: number;
}

// Destination (customer) pin — amber teardrop.
const destIcon = L.divIcon({
  className: "",
  html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--amber-500,#f59e0b);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

// Provider (moving) marker — navy dot with a pulsing ring.
const providerIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:34px;height:34px">
      <span style="position:absolute;inset:0;border-radius:50%;background:rgba(11,30,63,0.25);animation:trk-pulse 1.8s ease-out infinite"></span>
      <span style="position:absolute;top:7px;left:7px;width:20px;height:20px;border-radius:50%;background:var(--navy-900,#0b1e3f);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></span>
    </div>
    <style>@keyframes trk-pulse{0%{transform:scale(0.6);opacity:0.7}100%{transform:scale(2.2);opacity:0}}</style>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

/** Keep both the provider and destination in view as the provider moves. */
function FitToPoints({
  providerLat,
  providerLng,
  destLat,
  destLng,
}: Readonly<LiveTrackingMapProps>) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = [[destLat, destLng]];
    if (providerLat != null && providerLng != null) {
      points.push([providerLat, providerLng]);
    }
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 16 });
    }
  }, [map, providerLat, providerLng, destLat, destLng]);
  return null;
}

export function LiveTrackingMap({
  providerLat,
  providerLng,
  destLat,
  destLng,
}: Readonly<LiveTrackingMapProps>) {
  return (
    <MapContainer
      center={[destLat, destLng]}
      zoom={14}
      style={{ width: "100%", height: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <FitToPoints
        providerLat={providerLat}
        providerLng={providerLng}
        destLat={destLat}
        destLng={destLng}
      />
      <Marker position={[destLat, destLng]} icon={destIcon} />
      {providerLat != null && providerLng != null && (
        <Marker position={[providerLat, providerLng]} icon={providerIcon} />
      )}
    </MapContainer>
  );
}
