# Are.na Portfolio

A minimal statically generated portfolio site backed by a public Are.na channel.

Live example: [`arena-api-examples-portfolio.vercel.app`](https://arena-api-examples-portfolio.vercel.app/)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Faredotna%2Fapi-examples%2Ftree%2Fmain%2Fportfolio&project-name=arena-portfolio&repository-name=arena-portfolio&env=ARENA_CHANNEL_SLUG&envDefaults=%7B%22ARENA_CHANNEL_SLUG%22%3A%22arena-influences%22%7D&envDescription=Choose+the+public+Are.na+channel+to+render.&envLink=https%3A%2F%2Fgithub.com%2Faredotna%2Fapi-examples%2Ftree%2Fmain%2Fportfolio%23configuration&demo-title=Are.na+Portfolio&demo-description=A+static+portfolio+generated+from+one+public+Are.na+channel.&demo-url=https%3A%2F%2Farena-api-examples-portfolio.vercel.app%2F)

The app uses one top-level channel as its source. Blocks connected directly to that
channel render on the home page, and channels connected to it become the persistent
site navigation. Blocks in those child channels render on their own static pages.

## Stack

- pnpm + Next.js 15 + React 19
- Static export (`next build`)
- Server-fetched public Are.na data via `@aredotna/sdk`
- SSR measured masonry via Pretext and `@napi-rs/canvas`
- No auth and no client-side API fetching
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
