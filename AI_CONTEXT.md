# AI Context - ArgenCash Frontend

## Project Snapshot
- Name: ArgenCash frontend
- Stack: Next.js 16 (App Router), React 19, TypeScript, TanStack Query
- Style: Tailwind CSS

## Repository
- Remote: `https://github.com/giuliRicca/argencash-frontend.git`
- Main working branch: `develop`

## Local Setup
1. Install deps:
   - `npm install`
2. Set env:
   - `ARGENCASH_API_BASE_URL=http://localhost:5018`
3. Run:
   - `npm run dev`

## Build / Quality
- Build: `npm run build`
- Lint: `npm run lint`

## Frontend Route Structure
- Pages:
  - `/`
  - `/dashboard`
  - `/accounts/[id]`
  - `/settings`
- API proxy routes live in `src/app/api/**/route.ts`

## Auth / Session
- JWT token stored in localStorage key: `argencash.access-token`
- UI reads token through `useStoredToken()`
- Next proxy routes normalize/forward auth header to backend

## Features Implemented
- Auth flow (register/login/me)
- Dashboard accounts and multi-rate cards
- Account detail with create/delete transactions
- Transfer creation from dashboard and account detail
- Transfer visual indicator in transaction list
- Account update (name + exchange rate type)
- Settings page with categories management

## API Proxy Highlights
- `/api/accounts` and `/api/accounts/[id]`
- `/api/transactions` and `/api/transactions/[id]`
- `/api/transfers`
- `/api/categories`
- `/api/exchange-rates/live`
- `/api/exchange-rates/live/batch`

## Conventions For AI Edits
- Keep contracts in `src/lib/contracts.ts` aligned with backend DTOs.
- Prefer showing backend enum values directly unless mapped intentionally.
- Use centralized style tokens in `src/app/globals.css` and shared recipes in `src/lib/ui.ts`.
- Avoid introducing new hardcoded hex palette classes in components unless adding a new token first.
- Prefer `ui.*` recipes for panel/button/input/select/badge/error styles.
- Invalidate React Query keys after mutations:
  - accounts: `["accounts", accessToken]`
  - account detail: `["account-detail", accountId, accessToken]`

## Deployment Notes
- `ARGENCASH_API_BASE_URL` must be set in runtime environment.
- Do not hardcode backend URL in components; use `buildBackendUrl()`.
