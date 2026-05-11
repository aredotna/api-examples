# Are.na Explorer

A generic Are.na client for browsing channels, blocks, and users. Built with React + TypeScript on top of the published `@aredotna/sdk` and `@aredotna/react-query` packages.

## Quick Start

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

The app runs at `http://127.0.0.1:5173`.

## Scripts

```sh
pnpm dev          # production API
pnpm dev:staging  # staging API
pnpm dev:local    # local API at http://127.0.0.1:3111
pnpm build
pnpm lint
pnpm typecheck
pnpm format
```

## Configuration

Create `.env.local` from `.env.example` and set your OAuth client details:

```sh
VITE_API_ENV=production
VITE_OAUTH_CLIENT_ID=your_client_id
VITE_OAUTH_REDIRECT_URI=http://127.0.0.1:5173/oauth/callback
```

`VITE_API_ENV` can be `production`, `staging`, or `local`.

Register the redirect URI in your Are.na OAuth application:

```text
http://127.0.0.1:5173/oauth/callback
```

For Vercel, also register the deployed callback URL:

```text
https://<your-project>.vercel.app/oauth/callback
```

The demo creates a stable Are.na SDK client in `src/App.tsx`, provides it with `ArenaProvider`, and stores OAuth tokens in `sessionStorage` for future SDK requests.
