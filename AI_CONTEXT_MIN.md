# ArgenCash Frontend - Quick AI Context

- Stack: Next.js 16 + React 19 + TS + TanStack Query
- Branch: `develop`
- Remote: `https://github.com/giuliRicca/argencash-frontend.git`

## Run
- `npm install`
- Set `ARGENCASH_API_BASE_URL`
- `npm run dev`

## Quality
- `npm run lint`
- `npm run build`

## Key Routes
- Pages: `/`, `/dashboard`, `/accounts/[id]`, `/settings`
- Proxies: `src/app/api/**/route.ts`

## Important Notes
- Token key: `argencash.access-token`
- Keep `src/lib/contracts.ts` synced with backend DTOs
- Use design tokens (`src/app/globals.css`) + shared `ui` recipes (`src/lib/ui.ts`), avoid new hardcoded hex classes
- Main query keys:
  - `["accounts", accessToken]`
  - `["account-detail", accountId, accessToken]`
