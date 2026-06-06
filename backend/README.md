<div align="center">

# FixItNow — Backend 

**Spring Boot REST API for FixItNow.** Business logic, authentication, database, and integrations.

[![Java](https://img.shields.io/badge/Java-21-007396?logo=openjdk&logoColor=white)](https://openjdk.org)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-database-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Flyway](https://img.shields.io/badge/Flyway-migrations-CC0200?logo=flyway&logoColor=white)](https://flywaydb.org)

[⬅️ Main README](../README.md)

</div>

---

## Tech stack

| Area | Technology |
|------|------------|
| Language | Java 21 |
| Framework | Spring Boot (Web, Data JPA, Validation) |
| Security | Spring Security, JWT (jjwt), 2FA (TOTP) |
| Database | PostgreSQL + Flyway migrations |
| Live chat | Spring WebSocket (STOMP) |
| Payments | Stripe |
| Email | Brevo (SMTP) |
| Image storage | Cloudinary |
| Smart search | Google Gemini API |
| Documentation | OpenAPI / Swagger UI |

## Running

> **Prerequisites:** Java 21, Maven, and Docker (for PostgreSQL).

```bash
# 1. Create your local config
cp .env.example .env

# 2. Start PostgreSQL (Docker, port 5432)
docker compose up -d

# 3. Run the API (default :8080)
mvn spring-boot:run
```

The API is then available at `http://localhost:8080`. Flyway applies the database migrations automatically on startup.

### Other commands

```bash
mvn clean package        # build (JAR)
mvn test                 # run tests
docker compose down      # stop the database
```

## API documentation

After startup, the Swagger UI is available at:

```
http://localhost:8080/swagger-ui.html
```

## Environment variables

Copy the provided template and fill in your values:

```bash
cp .env.example .env
```

All secrets are read from the environment; without configured keys the related features (payments, email, smart search, images) are disabled. The most relevant variables:

```bash
# Database
DATABASE_URL=jdbc:postgresql://localhost:5433/backend_db
DB_USERNAME=postgres
DB_PASSWORD=postgres

# Security
JWT_SECRET=<generate: openssl rand -base64 64>

# Frontend (CORS)
FRONTEND_URL=http://localhost:5173

# Integrations (optional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
BREVO_SMTP_LOGIN=
BREVO_SMTP_KEY=
GEMINI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Architecture

Layered, domain-organized code:

```
src/main/java/com/example/backend/
├── config/      # configuration (security, CORS, WebSocket ...)
├── domain/      # domain modules (user, ticket, chat, review, calendar ...)
├── repository/  # database access (JPA)
├── service/     # business logic
├── security/    # JWT, authentication, 2FA
├── web/         # REST controllers + DTOs (request/response)
└── common/      # shared components, responses, error handling
```

The database schema is managed with **Flyway** migrations in `src/main/resources/db/migration/` (`V1__…`, `V2__…`).

> Since JPA runs in `validate` mode, migrations must match the schema before startup.
