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
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm format
```

## Configuration

Create `.env.local` from `.env.example` and set your OAuth client details:

```sh
VITE_ARENA_CLIENT_ID=your_arena_oauth_client_id
```

Optional API host overrides:

```sh
VITE_ARENA_API_BASE=https://api.are.na
VITE_ARENA_AUTHORIZATION_BASE=https://www.are.na
```

For local API development, set `VITE_ARENA_API_BASE=http://127.0.0.1:3111`. Set `VITE_ARENA_AUTHORIZATION_BASE` only when pointing OAuth authorization at a non-production Are.na host.

Register the redirect URI with `write` scope in your Are.na OAuth application:

```text
http://127.0.0.1:5173/auth/callback
```

For Vercel, also register the deployed callback URL:

```text
https://<your-project>.vercel.app/auth/callback
```

The demo creates a stable Are.na SDK client in `src/App.tsx`, provides it with `ArenaProvider`, and stores OAuth tokens in `sessionStorage` for future SDK requests.
