# Are.na V3 Client Demo

React + TypeScript demo for the Are.na API using the published `@aredotna/sdk` and `@aredotna/react-query` packages.

## Quick Start

```sh
pnpm install
pnpm dev
```

The app runs at `http://localhost:5173`.

## Scripts

```sh
pnpm dev          # production API
pnpm dev:staging  # staging API
pnpm dev:local    # local API at http://localhost:3111
pnpm build
pnpm lint
```

## Configuration

Create `.env` from `env.example` and set your OAuth client details:

```sh
VITE_API_ENV=production
VITE_OAUTH_CLIENT_ID=your_client_id
VITE_OAUTH_REDIRECT_URI=http://localhost:5173/oauth/callback
```

`VITE_API_ENV` can be `production`, `staging`, or `local`.

The demo creates a stable Are.na SDK client in `src/App.tsx`, provides it with `ArenaProvider`, and stores OAuth tokens in `sessionStorage` for future SDK requests.
