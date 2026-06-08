# CLAUDE.md — Backend

Guidance for AI agents working in the FixItNow Spring Boot backend. Read the
[root CLAUDE.md](../CLAUDE.md) first for the product overview.

## Overview

Java 21 / Spring Boot 3.3.x REST + WebSocket API with a layered clean
architecture. It owns all business logic for the FixItNow marketplace:
authentication, tickets, chat, provider calendars, payments, notifications,
geocoding/routing, and live tracking.

**Core technologies:** Spring Web, Spring Security, Spring Data JPA, Spring
WebSocket (STOMP), PostgreSQL, Flyway migrations, JWT (jjwt), TOTP 2FA
(samstevens), Stripe Connect, Cloudinary, Google Gemini, Brevo SMTP / SendGrid,
springdoc OpenAPI, and Lombok.

## Build, Run, Test

```bash
docker compose up -d        # PostgreSQL on localhost:5433
./mvnw spring-boot:run      # Run the API on :8080 (dev profile by default)
./mvnw test                 # Run the test suite
./mvnw clean package        # Build the deployable jar (target/backend-0.0.1-SNAPSHOT.jar)
```

- Configuration lives in `src/main/resources/application.yml` with
  `application-dev.yml` / `application-prod.yml` profile overrides.
- Local secrets are loaded from a `.env` file via `spring-dotenv`. Copy
  `.env.example` and fill in real values; never commit secrets.
- API docs (when running): `http://localhost:8080/swagger-ui.html`.

## Package Structure

```
com.example.backend
├── config/          Spring configuration beans (Security, WebSocket, Stripe,
│                    Cloudinary, OpenAPI, ApplicationConfig)
├── domain/          JPA entities only — no business logic
│   ├── user/        User, Provider, UserRole, UserStatus, ServiceCategory, SavedProvider
│   ├── ticket/      Ticket, TicketStatus, TicketPriority, TicketStatusHistory
│   ├── chat/        ChatRoom, ChatMessage, MessageType, MessageStatus
│   ├── calendar/    ProviderTimeBlock, TimeBlockType, RecurrenceFrequency
│   ├── notification/ Notification, NotificationType
│   ├── location/    Location (structured address + coordinates)
│   ├── review/      Review
│   └── token/       VerificationToken, RefreshToken, TokenType
├── repository/      Spring Data JPA interfaces — queries only
├── service/         Business logic interfaces + impls (impl/ subpackage or
│                    *ServiceImpl alongside the interface)
├── web/
│   ├── controller/  REST + STOMP controllers — thin; delegate to services
│   └── dto/
│       ├── request/  Validated inbound payloads
│       └── response/ Outbound response shapes
├── security/        JWT provider, filters, UserPrincipal, CustomUserDetailsService
└── common/
    ├── exception/   Custom exceptions + GlobalExceptionHandler
    └── response/    Shared response wrappers (ErrorResponse)
```

> Note: there is both a legacy `exception/` package and a `common/exception/`
> package. Prefer `common/exception/` for new shared exceptions and the
> `GlobalExceptionHandler`.

## Architecture Rules

- **Controllers** receive requests, validate input with `@Valid`, call one
  service method, and return a `ResponseEntity`. No business logic, no
  repository access, and no branching beyond HTTP-status selection.
- **Services** own all business logic. Define an interface in `service/` and the
  implementation as `*ServiceImpl` (or in an `impl/` subpackage). Annotate
  implementations with `@Transactional` at the class level.
- **Repositories** expose query methods only. Use `@Modifying` + JPQL for bulk
  mutations. Never put business logic in a repository.
- **Domain entities** are plain JPA entities. The `User` hierarchy uses
  `@Inheritance(strategy = JOINED)` with a discriminator column, so subclasses
  such as `Provider` map to their own joined tables.
- **DTOs** cross the web boundary only. Never accept or return JPA entities in
  controllers or service method signatures.
- **Security context** uses `UserPrincipal` (wraps `User`). Extract it in
  controllers via `@AuthenticationPrincipal UserPrincipal principal`.

## Naming Conventions

| Layer        | Convention                            | Example                            |
|--------------|---------------------------------------|------------------------------------|
| Entity       | PascalCase noun                       | `User`, `Ticket`, `RefreshToken`   |
| Repository   | `<Entity>Repository`                  | `TicketRepository`                 |
| Service I/F  | `<Domain>Service`                     | `TicketService`                    |
| Service Impl | `<Domain>ServiceImpl`                 | `TicketServiceImpl`                |
| Controller   | `<Domain>Controller`                  | `TicketController`                 |
| Request DTO  | `<Action>Request`                     | `CreateTicketRequest`              |
| Response DTO | `<Action/Domain>Response`             | `AuthResponse`                     |
| Exception    | Descriptive + `Exception` suffix      | `InvalidTokenException`            |
| Enum         | PascalCase, values SCREAMING_SNAKE    | `TicketStatus.IN_PROGRESS`         |

- Methods: `camelCase`, verb-first (`register`, `findByEmail`, `revokeAllByUser`).
- Constants: `SCREAMING_SNAKE_CASE`. Fields: `camelCase`, no Hungarian notation.
- URL paths: `kebab-case`, versioned under `/api/v1/` (chat uses `/api/`).

## Database & Migrations

- PostgreSQL with Flyway. Migrations live in
  `src/main/resources/db/migration/` as `V<n>__description.sql` and run on
  startup.
- **Schema changes go in a new, sequentially numbered migration** — never edit a
  migration that has already been applied/committed.
- Hibernate runs with `ddl-auto: validate`; the schema is owned by Flyway, not
  Hibernate. Entities must match the migrated schema or startup fails.

## Security

- **JWT access token:** 15 min (`app.jwt.access-token-expiration-ms`).
- **Temp token** (2FA login step): 5 min (`app.jwt.temp-token-expiration-ms`).
- **Refresh token:** 7 days, stored as a hashed UUID, revoked on use and on
  password reset. All of a user's refresh tokens are revoked on password reset
  and on new token issuance.
- Public endpoints are listed explicitly in `SecurityConfig` — do **not** use
  wildcards for auth-protected paths.
- `JWT_SECRET` and all integration keys come from environment variables only.
  Generate a JWT secret with `openssl rand -base64 64`; rotating it invalidates
  existing tokens on restart.

### Two-Factor Authentication (TOTP)

- `dev.samstevens.totp` (SHA-1, 6 digits, 30s window).
- Setup: `POST /api/v1/user/2fa/setup` → scan QR / enter secret →
  `POST /api/v1/user/2fa/enable`.
- Login with 2FA: `POST /api/v1/auth/login` returns `requiresTwoFactor=true` +
  `tempToken` → `POST /api/v1/auth/2fa/verify` with `tempToken` + `code` →
  returns full tokens.
- `twoFactorSecret` is currently stored in plain text — encrypt at rest in
  production (e.g. a JPA attribute converter).

## Real-Time (WebSocket + STOMP)

- Endpoint `/ws`, app prefix `/app`, topic prefix `/topic`.
- STOMP connections authenticate via an `Authorization: Bearer <token>` header,
  enforced by `WebSocketAuthChannelInterceptor`.
- Chat and live tracking flow over STOMP; see
  [README-chat.md](README-chat.md) for destinations and payloads. A chat room is
  created when a provider accepts a ticket and is keyed on
  `ticket_id` / `customer_id` / `provider_id`.

## Payments (Stripe Connect)

- Providers onboard via Stripe Connect; checkout uses destination charges with a
  platform **application fee** (`stripe.application-fee-percent`, default 10%).
- Webhooks are verified with `stripe.webhook-secret`. Locally, forward events
  with `stripe listen`.
- Leave `STRIPE_SECRET_KEY` blank to disable payments in development.

## External Integrations

- **Gemini** (`gemini.*`): AI service-category classification. Called from the
  backend only — never expose the key to the client.
- **Geocoding/routing:** Nominatim (`NominatimGeocodingService`) and OSRM
  (`OsrmRoutingService`). Respect upstream rate limits / usage policies.
- **Cloudinary:** image uploads (`ImageUploadController` + `CloudinaryService`),
  size-limited via `cloudinary.max-file-size-mb`.
- **Email:** Brevo SMTP (primary) / SendGrid. Email sends are `@Async`
  fire-and-forget; failures are logged but must not break the request.

## Validation & Error Handling

- Use Jakarta Validation annotations on request DTOs and `@Valid` on every
  `@RequestBody`. Don't re-validate in services what the DTO already guarantees.
- Throw specific typed exceptions from services; `GlobalExceptionHandler` maps
  each to the right HTTP status and converts validation failures to a structured
  `fieldErrors` map.
- The generic handler logs the full stack trace and returns 500 without leaking
  internals. `server.error.include-message: never` keeps Spring's default
  messages out of responses.

## Key Environment Variables

| Variable                       | Required | Description                                |
|--------------------------------|----------|--------------------------------------------|
| `DATABASE_URL`                 | Yes      | JDBC PostgreSQL URL                        |
| `DB_USERNAME` / `DB_PASSWORD`  | Yes      | Database credentials                       |
| `JWT_SECRET`                   | Yes      | Base64 HS256 key (≥256 bit)                |
| `FRONTEND_URL`                 | Yes      | Frontend base URL for email links / CORS   |
| `BREVO_SMTP_LOGIN` / `BREVO_SMTP_KEY` | For email | Brevo SMTP credentials              |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | For payments | Stripe keys             |
| `GEMINI_API_KEY`               | For classify | Google Gemini API key                  |
| `CLOUDINARY_*`                 | For uploads | Cloudinary cloud name / key / secret    |
| `PLATFORM_FEE_PERCENT`         | No       | Marketplace commission (default 10)        |

See `.env.example` for the full list and defaults.
