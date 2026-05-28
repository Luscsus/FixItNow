# FixItNow

## Project Structure

```
FixItNow/
├── frontend/        # React + Vite (TypeScript)
└── backend/         # Spring Boot 3 (Java 21)
```

## CI/CD Pipeline

Every push to the `main` branch automatically runs tests and deploys the affected service. The pipelines are path-scoped — only the changed service redeploys.

### Frontend

**Workflow:** `.github/workflows/frontend.yml`  
**Triggers:** push to `main` when files inside `frontend/` change  
**Deploys to:** Netlify — https://fixitnow.si

| Step | What happens |
|---|---|
| Install dependencies | `npm ci` |
| Run tests | `npm test -- --run` (non-blocking until tests are added) |
| Build | `npm run build` → outputs to `frontend/dist/` |
| Deploy | `frontend/dist/` is published to Netlify |

### Backend

**Workflow:** `.github/workflows/backend.yml`  
**Triggers:** push to `main` when files inside `backend/` change, or manually via GitHub Actions → Run workflow  
**Deploys to:** Heroku — https://fix-it-now-backend-b27cce84b1a2.herokuapp.com

| Step | What happens |
|---|---|
| Run tests | `mvn test` (non-blocking until tests are added) |
| Build | `mvn package -DskipTests` → produces JAR |
| Deploy | JAR is deployed to Heroku via git push |

## Environments

### Frontend

| Variable | Dev | Production |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` (`.env.development`) | Set in Netlify environment variables |

### Backend

The active Spring profile is controlled by the `SPRING_PROFILES_ACTIVE` environment variable.

| Variable | Dev (`.env`) | Production (Heroku Config Vars) |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `dev` | `prod` |
| `DATABASE_URL` | local PostgreSQL JDBC URL | set by Heroku Postgres addon |
| `DB_USERNAME` / `DB_PASSWORD` | local credentials | set in Heroku Config Vars |
| `JWT_SECRET` | any dev value | strong secret, set in Heroku Config Vars |
| `BREVO_SMTP_LOGIN` / `BREVO_SMTP_KEY` | local or empty | set in Heroku Config Vars |
| `FRONTEND_URL` | `http://localhost:5173` | Netlify site URL, set in Heroku Config Vars |

Profile behaviour:
- `dev` — SQL logging enabled, DEBUG log level, Swagger UI enabled, DDL auto `update`
- `prod` — no SQL logging, INFO log level, Swagger UI disabled, DDL auto `validate`

## Required GitHub Secrets

Set these under **Settings → Secrets and variables → Actions**:

| Secret | Used by |
|---|---|
| `NETLIFY_AUTH_TOKEN` | Frontend workflow |
| `NETLIFY_SITE_ID` | Frontend workflow |
| `HEROKU_API_KEY` | Backend workflow |
| `HEROKU_APP_NAME` | Backend workflow |
| `HEROKU_EMAIL` | Backend workflow |

## Local Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
cp .env.example .env   # fill in your values
./mvnw spring-boot:run
```
