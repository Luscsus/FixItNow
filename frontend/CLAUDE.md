# CLAUDE.md — Frontend

Guidance for AI agents working in the FixItNow web client. Read the
[root CLAUDE.md](../CLAUDE.md) first for the product overview.

## Overview

Installable PWA built with **React 19 + TypeScript + Vite**, styled with
**Tailwind CSS** and **shadcn/ui** primitives, with server state managed by
**TanStack Query**. It is a thin client over the Spring Boot backend (REST +
STOMP WebSocket) and must not duplicate authorization or business logic.

**Notable libraries:** React Router 7, TanStack Query, Zod (validation),
react-i18next (i18n), Leaflet / react-leaflet (maps), FullCalendar (scheduling),
`@stomp/stompjs` + `sockjs-client` (real-time chat & tracking),
`@react-oauth/google` (Google sign-in), jsPDF + qrcode (invoices/payment QR),
and `vite-plugin-pwa` (offline/installable).

## Build, Run, Lint

```bash
npm install
npm run dev       # Vite dev server (http://localhost:3000)
npm run build     # tsc -b && vite build (type-check + production bundle)
npm run preview   # Serve the production build locally
npm run lint      # ESLint
```

- Path alias: `@/` → `src/` (configured in `vite.config.ts` and tsconfig).
- Environment: `VITE_API_BASE_URL` (default `http://localhost:8080`) points at
  the backend. Vite only exposes vars prefixed `VITE_`. Dev values live in
  `.env.development` — treat any keys there as dev-only and never rely on the
  client to keep a secret.

## Layered Architecture

Keep responsibilities in their own layer; data flows
`services → mappers → domain → hooks → components/pages`.

| Layer        | Path             | Responsibility                                      |
|--------------|------------------|-----------------------------------------------------|
| DTO          | `src/dto/`       | Wire shapes that mirror backend request/response    |
| Mapper       | `src/mappers/`   | Convert DTO ↔ domain models                         |
| Domain       | `src/domain/`    | App-facing model types                              |
| Service      | `src/services/`  | HTTP/WebSocket calls (via `httpClient`)             |
| Hook         | `src/hooks/`     | TanStack Query query/mutation hooks                 |
| Component    | `src/components/`| Reusable UI, grouped by feature                     |
| Page         | `src/pages/`     | Route-level screens (wired in `App.tsx`)            |
| Config / Lib | `src/config/`, `src/lib/`, `src/utils/` | Query client, env, helpers, validation |

## Conventions

- **Functional components with hooks only** — no class components.
- **Types:** prefer `type` aliases for DTOs and domain models; use `interface`
  for component props.
- **Naming:** components are `PascalCase` in `PascalCase.tsx` files; hooks are
  `useX` camelCase in `useX.ts`; services are camelCase. Some legacy files use
  kebab-case (e.g. `confirm-email-card.tsx`) — match the local neighbourhood
  rather than renaming en masse.
- **Imports:** relative imports within a single layer; the `@/` alias for
  cross-layer imports.
- **Styling:** Tailwind utility classes and small reusable `ui/` components;
  avoid inline styles. Use the `cn()` helper in `src/lib/utils.ts` to merge
  class names. Support light/dark themes (see `ThemeToggle`).
- **i18n:** user-facing strings go through react-i18next — do not hardcode
  display copy in components.

## Data Fetching (TanStack Query)

- Co-locate query/mutation hooks in `src/hooks/`; one hook per concern
  (`useTicketsQuery`, `useCreateTicketMutation`, …).
- Keep query keys stable and descriptive so cache invalidation is predictable;
  invalidate the relevant keys after mutations rather than refetching manually.
- The shared client is configured in `src/config/queryClient.ts`.

## HTTP & Auth

- All REST calls go through `requestJson` in `src/services/httpClient.ts`,
  which builds URLs from `env.apiBaseUrl` and sets JSON headers (it deliberately
  leaves `Content-Type` unset for `FormData` uploads so the browser can add the
  multipart boundary).
- On a `403` for a non-auth path, `httpClient` transparently runs the registered
  auth-refresh handler (single-flight) and retries once. Register the handler via
  `setAuthRefreshHandler`; don't reimplement refresh logic in feature code.
- Failed responses throw `ApiError` (`status` + `body`) — handle these in hooks.
- JWT access tokens are short-lived; refresh tokens drive re-auth. Token helpers
  live in `src/lib/jwt.ts`.

## Routing & Access Control

- Routes are declared in `src/App.tsx`. Layout/guard wrappers:
  - `AppLayout` — public pages with the navbar.
  - `ProtectedRoute` — requires authentication.
  - `AdminRoute` + `AdminLayout` — requires the `ADMIN` role (full-screen console).
- Full-screen auth pages (login, register, reset, 2FA, legal) render without the
  app navbar.
- Client-side guards are UX only; the backend remains the authoritative
  authorization boundary.

## Real-Time

- Chat and live provider tracking use STOMP over SockJS (`@stomp/stompjs` +
  `sockjs-client`). `vite.config.ts` aliases Node's `global` to `window` because
  sockjs-client expects it. Connect to `/ws` and authenticate with the access
  token; destinations and payloads are documented in
  [../backend/README-chat.md](../backend/README-chat.md).

## PWA

- `vite-plugin-pwa` (`registerType: 'autoUpdate'`) generates the manifest and
  service worker. Keep the manifest/icon set in `vite.config.ts` in sync with
  assets under `public/`. The navigate fallback is `/index.html` for SPA
  routing.

## When Changing the Backend Contract

A change to a backend endpoint, DTO, or enum must be reflected here: update the
matching `dto/`, then the `mappers/` and `domain/` types, then the consuming
`services/` and `hooks/`. Keep both sides in the same change set.
