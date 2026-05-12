# Contributing

This repository contains self-contained Are.na API example apps. Each example should remain readable and runnable on its own.

## Local Setup

```sh
pnpm install
cp explorer/.env.example explorer/.env.local
cp portfolio/.env.example portfolio/.env.local
cp swimlanes/.env.example swimlanes/.env.local
```

Set the OAuth client ID for the OAuth example you are working on, or the channel/site settings for Portfolio, then run it from the root:

```sh
pnpm dev:explorer
pnpm dev:portfolio
pnpm dev:swimlanes
```

## Checks

Run the shared checks before opening a pull request:

```sh
pnpm lint
pnpm typecheck
pnpm test
```

## Example Conventions

- Keep each example in one top-level folder.
- Do not import code across example folders.
- Commit `.env.example` only; never commit real `.env` or `.env.local` files.
- Include a README with setup, scripts, required env vars, and OAuth redirect URIs.
- Include a `vercel.json` when the app needs SPA rewrites or custom build settings.
