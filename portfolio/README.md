# Are.na Portfolio

A minimal statically generated portfolio site backed by a public Are.na channel.

The app uses one top-level channel as its source. Blocks connected directly to that
channel render on the home page, and channels connected to it become the persistent
site navigation. Blocks in those child channels render on their own static pages.

## Stack

- pnpm + Next.js 15 + React 19
- Static export (`next build`)
- Server-fetched public Are.na data via `@aredotna/sdk`
- No auth and no client-side data fetching
- RSS feed and Open Graph metadata

## Quick Start

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

The app runs at `http://127.0.0.1:5175`.

## Configuration

```sh
ARENA_CHANNEL_SLUG=arena-influences
ARENA_API_BASE_URL=https://api.are.na
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:5175
```

`ARENA_CHANNEL_SLUG` must point to a public Are.na channel. Keep the root channel
small enough to fetch at build time: the build reads all root blocks plus all
blocks in one level of child channels.

## Routes

- `/` renders blocks connected directly to the root channel.
- `/[channel]` renders blocks connected to a child channel.
- `/show/[id]` renders a permalink for each fetched block.
- `/rss.xml` renders an RSS 2.0 feed for every fetched block.

## Scripts

```sh
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm format
```
