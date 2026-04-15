# ArgenCash Frontend

Recruiter-facing frontend for ArgenCash, a USD/ARS-focused personal finance platform. Built with modern React patterns and connected to the ArgenCash backend API.

## Product focus

ArgenCash helps users manage money in volatile dual-currency environments by combining:

- account-level currency profiles
- transaction and transfer workflows
- budget tracking
- live exchange-rate visibility

## Tech stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- TanStack Query for server state
- React Hook Form + Zod for form validation
- Tailwind CSS v4

## Main routes

- `/` landing page and product overview
- `/register`, `/verify`, `/login` auth flow
- `/dashboard` portfolio and operations overview
- `/accounts/[id]` account detail and transaction context
- `/settings` account and app settings

## API proxy routes

Frontend route handlers proxy requests to the backend under `src/app/api/**`, including:

- auth (`/api/auth/*`)
- accounts (`/api/accounts*`)
- transactions (`/api/transactions*`)
- transfers (`/api/transfers`)
- budgets (`/api/budgets*`)
- categories (`/api/categories`)
- exchange rates (`/api/exchange-rates/live`, `/api/exchange-rates/live/batch`)

## Local setup

### Prerequisites

- Node.js 20+
- npm 10+
- Running ArgenCash backend API

### 1) Configure environment

Create `.env` from `.env.example` and set:

```env
ARGENCASH_API_BASE_URL=http://localhost:5018
```

### 2) Install and run

```bash
npm install
npm run dev
```

App URL: `http://localhost:3000`

## Quality checks

```bash
npm run lint
npm run build
```

## Docker

```bash
docker build -t argencash-frontend .
docker run --rm -p 3000:3000 argencash-frontend
```

## Security and public repo notes

- Keep `.env` local only; do not commit environment-specific values.
- Use a non-production backend URL for demos.
- If you publish a live demo, configure CORS and auth token handling carefully.

## License

This project is licensed under the MIT License. See `LICENSE`.
