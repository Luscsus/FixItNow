<div align="center">

# FixItNow — Frontend

**React + TypeScript web application (PWA) for FixItNow.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-build-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

[⬅️ Main README](../README.md)

</div>

---

## Tech stack

| Area | Technology |
|------|------------|
| Framework | React 19, TypeScript |
| Build | Vite, vite-plugin-pwa |
| Styling | Tailwind CSS, shadcn/ui |
| Data | TanStack Query |
| Routing | React Router |
| Live chat | STOMP.js + SockJS (WebSocket) |
| Maps | Leaflet, React Leaflet |
| i18n | i18next (SL / EN) |
| Validation | Zod |
| Smart search | Google GenAI |

## Running

```bash
npm install      # install dependencies
npm run dev      # development server (Vite)
npm run build    # production build
npm run preview  # preview the build
npm run lint     # ESLint
```

## Environment variables

Create a `.env` file in the `frontend/` directory:

```bash
VITE_API_BASE_URL=http://localhost:8080   # backend API address
```

## Architecture (layered)

```
src/
├── components/   # UI components
├── hooks/        # React hooks
├── services/     # API calls
├── domain/       # domain models
├── dto/          # data transfer objects (DTO)
├── mappers/      # DTO ↔ domain conversions
└── i18n/         # translations (en.json, sl.json)
```

> The backend must be running locally (default `http://localhost:8080`), or set `VITE_API_BASE_URL` to a remote address.
