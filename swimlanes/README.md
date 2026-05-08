# Swimlane

A kanban-style swimlane board built on the Are.na API. Channels become lanes, blocks become cards, and connection metadata tracks card placement and state.

## Stack

- Yarn + Vite + React 19
- Strict TypeScript
- Tailwind CSS + shadcn/ui
- Pragmatic Drag and Drop
- `openapi-typescript` + `openapi-fetch`
- Biome (lint + format) + Husky pre-commit hooks
- Vitest

## Setup

1. Install dependencies:

```bash
yarn install
```

2. Copy env vars:

```bash
cp .env.example .env.local
```

3. Set `VITE_ARENA_CLIENT_ID` from your OAuth app and ensure the redirect URI includes:

```text
http://localhost:5173/auth/callback
```

4. Start dev server:

```bash
yarn dev
```

## OpenAPI Type Generation

The app commits a local snapshot and generates types from it:

```bash
yarn api:spec:refresh      # fetch http://localhost:3111/v3/openapi.json
yarn api:types:generate    # generate src/api/openapi.generated.ts
yarn api:sync              # run both
```

## Available Scripts

- `yarn dev` - run Vite dev server
- `yarn build` - typecheck and production build
- `yarn typecheck` - run TypeScript project checks
- `yarn lint` - run Biome check
- `yarn lint:fix` - auto-fix lint + formatting
- `yarn format` - format all files
- `yarn test` - run Vitest in watch mode
- `yarn test:run` - run Vitest once

## Demo Behavior

- First authenticated run bootstraps one board and default lanes.
- Add cards (blocks) into lanes and edit card metadata.
- Drag cards within/across lanes (connection move/create/delete).
- Drag lanes to reorder lane-channel connections.
