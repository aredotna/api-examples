# Are.na Swimlanes

A kanban-style swimlane board built on the Are.na API. Channels become lanes, blocks become cards, and connection metadata tracks card placement and state.

Live example: [`arena-api-examples-swimlanes.vercel.app`](https://arena-api-examples-swimlanes.vercel.app/)

## Stack

- pnpm + Vite + React 19
- Strict TypeScript
- Tailwind CSS + shadcn/ui
- Pragmatic Drag and Drop
- `@aredotna/sdk` + `@aredotna/react-query`
- Biome (lint + format)
- Vitest

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy env vars:

```bash
cp .env.example .env.local
```

3. Set `VITE_ARENA_CLIENT_ID` from your OAuth app and ensure the app has `write` scope and this redirect URI:

```text
http://127.0.0.1:5174/auth/callback
```

4. Start dev server:

```bash
pnpm dev
```

The app runs at `http://127.0.0.1:5174`.

## Configuration

`.env.local` only requires your OAuth client ID:

```sh
VITE_ARENA_CLIENT_ID=your_arena_oauth_client_id
```

Optional API host overrides:

```sh
VITE_ARENA_API_BASE=https://api.are.na
VITE_ARENA_AUTHORIZATION_BASE=https://www.are.na
```

The redirect URI is derived from the current origin as `/auth/callback`; register that callback URL with Are.na.

For local API development, set `VITE_ARENA_API_BASE=http://127.0.0.1:3111`. Set `VITE_ARENA_AUTHORIZATION_BASE` only when pointing OAuth authorization at a non-production Are.na host.

For Vercel, also register the deployed callback URL in your Are.na OAuth application:

```text
https://arena-api-examples-swimlanes.vercel.app/auth/callback
```

## Available Scripts

- `pnpm dev` - run Vite dev server at `http://127.0.0.1:5174`
- `pnpm build` - typecheck and production build
- `pnpm typecheck` - run TypeScript project checks
- `pnpm lint` - run Biome check
- `pnpm lint:fix` - auto-fix lint + formatting
- `pnpm format` - format all files
- `pnpm test` - run Vitest in watch mode
- `pnpm test:run` - run Vitest once

## Demo Behavior

- First authenticated run asks you to select an existing board channel or create one.
- When creating a board, each default lane can use an existing channel or create a new one.
- Add cards (blocks) into lanes and edit card metadata.
- Drag cards within/across lanes (connection move/create/delete).
- Drag lanes to reorder lane-channel connections.
