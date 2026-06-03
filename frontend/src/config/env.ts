// Strip any trailing slash so callers can safely append paths like `/ws` or
// `/api/...` without producing a double slash (`//ws`), which breaks Spring's
// SockJS endpoint mapping and triggers 403 / CORS failures in production.
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export const env = {
  apiBaseUrl: rawApiBaseUrl.replace(/\/+$/, ''),
}
