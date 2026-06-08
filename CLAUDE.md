# CLAUDE.md

Guidance for Claude Code and other AI agents working in the **FixItNow** repository.

## What FixItNow Is

FixItNow is a service marketplace that connects customers with local service
providers (plumbers, electricians, handymen, etc.). Customers report a problem
as a **ticket**, the platform matches and classifies it, providers accept and
schedule the job, the two parties chat in real time, the provider's location is
tracked live on the way to the job, and payment is settled through Stripe with a
platform commission.

Key capabilities:

- Ticket lifecycle (create → classify → match → schedule → in-progress → complete)
- AI-assisted service-category classification (Google Gemini)
- Real-time chat (WebSocket + STOMP) and live provider tracking
- Geocoding and routing (Nominatim / OSRM) with map-based browsing
- Stripe Connect payments with marketplace application fees
- JWT auth with refresh tokens, TOTP two-factor auth, and email verification
- Admin console for moderating providers, users, and tickets
- Installable PWA front end with i18n and light/dark themes

## Repository Layout

This is a two-part monorepo. Each part has its own `CLAUDE.md` with detailed,
layer-specific rules — **read the relevant one before working in that tree.**

| Path        | Stack                                             | Details                |
|-------------|---------------------------------------------------|------------------------|
| `backend/`  | Java 21, Spring Boot 3.3, PostgreSQL, Flyway      | [backend/CLAUDE.md](backend/CLAUDE.md) |
| `frontend/` | React 19, TypeScript, Vite, Tailwind, shadcn/ui   | [frontend/CLAUDE.md](frontend/CLAUDE.md) |

The backend is the source of truth for all business logic. The frontend is a
thin client that talks to the backend over REST and WebSocket; it must never
duplicate authorization or business rules.

## Running the Stack Locally

Start the database, then the backend, then the frontend.

```bash
# 1. PostgreSQL (from backend/, exposes localhost:5433)
cd backend && docker compose up -d

# 2. Backend API on http://localhost:8080
cd backend && ./mvnw spring-boot:run

# 3. Frontend dev server on http://localhost:3000 (Vite)
cd frontend && npm install && npm run dev
```

The frontend reaches the API via `VITE_API_BASE_URL` (default
`http://localhost:8080`). Secrets and integration keys live in `.env` files that
are **not** committed; see each subproject's `.env.example` / `.env.development`
and `CLAUDE.md` for the required variables.

## Cross-Cutting Conventions

- **Never commit secrets.** API keys, JWT secrets, and database credentials come
  from environment variables only. Treat any committed `.env.development` value
  as throwaway/dev-only.
- **Keep the contract aligned.** A change to a backend DTO, endpoint path, or
  enum almost always requires a matching change in the frontend `dto/`,
  `services/`, and `mappers/` layers (and vice versa). Update both sides in the
  same change.
- **Match the surrounding code.** Follow the existing structure, naming, and
  comment density of the file and layer you are editing rather than introducing
  new patterns.
- **API versioning.** Most REST endpoints are namespaced under `/api/v1/`; some
  feature areas (e.g. chat) use `/api/`. Follow the convention already used by
  neighbouring controllers.
- **Commits.** Branch off `main`; the active development branch is `dev`. Only
  commit or push when explicitly asked.

## Where to Look First

- API reference while the backend is running: `http://localhost:8080/swagger-ui.html`
- Chat/WebSocket protocol: [backend/README-chat.md](backend/README-chat.md)
- Database schema and history: `backend/src/main/resources/db/migration/`
