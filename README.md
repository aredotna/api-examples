# Are.na API Examples

A collection of self-contained example apps demonstrating different ways to build on the [Are.na](https://www.are.na) API.

Each example lives in its own folder, picks its own stack and tooling, and deploys as its own Vercel project. There is **no shared code** between examples. Each one should be readable top-to-bottom on its own.

## Examples

| Folder                      | What it shows                                                                                                                                 | Stack                                                      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [`explorer/`](./explorer)   | Generic Are.na client for browsing channels, blocks, and users — built on the published `@aredotna/sdk` and `@aredotna/react-query` packages. | Vite, React 18, pnpm, `@aredotna/sdk`                      |
| [`swimlanes/`](./swimlanes) | Kanban-style board built on the published `@aredotna/sdk` and `@aredotna/react-query` packages.                                               | Vite, React 19, pnpm, Tailwind, shadcn/ui, `@aredotna/sdk` |

See each folder's `README.md` for setup, env vars, and scripts.

## Running an example locally

Install once from the repo root:

```sh
pnpm install
```

Copy the env template for the example you want to run:

```sh
cp explorer/.env.example explorer/.env.local
cp swimlanes/.env.example swimlanes/.env.local
```

Create an Are.na OAuth application and add the local redirect URI for the example:

| Example   | Local redirect URI                         |
| --------- | ------------------------------------------ |
| Explorer  | `http://127.0.0.1:5173/oauth/callback`     |
| Swimlanes | `http://127.0.0.1:5174/auth/callback`      |

Set the OAuth client ID in the copied `.env.local` file, then run the example:

```sh
pnpm dev:explorer
pnpm dev:swimlanes
```

Explorer runs at `http://127.0.0.1:5173`; swimlanes runs at `http://127.0.0.1:5174`.

You can also run example scripts directly with `pnpm --filter arena-explorer <script>` or `pnpm --filter arena-swimlanes <script>`.

## Tooling

The repo uses a pnpm workspace and a shared Biome config for formatting and linting:

```sh
pnpm lint
pnpm lint:fix
pnpm format
pnpm typecheck
pnpm test
```

## Deploying to Vercel

Each example is deployed as its own Vercel project. When creating a project on Vercel:

1. Import this repo.
2. Set **Root Directory** to the example folder (e.g. `explorer` or `swimlanes`).
3. Vercel will pick up the example's own `vercel.json` and `package.json`, using the root pnpm lockfile.
4. Set the example's environment variables (see its `.env.example`).
5. Add the deployed callback URL to the Are.na OAuth app:
   - Explorer: `https://<your-project>.vercel.app/oauth/callback`
   - Swimlanes: `https://<your-project>.vercel.app/auth/callback`

Pushes to `main` will trigger deploys for every linked Vercel project, but each one only rebuilds when files inside its root directory change.

## Adding a new example

1. Create a new folder at the repo root (e.g. `my-example/`).
2. Make it fully self-contained:
   - Its own `package.json`.
   - Its own `README.md` with what it shows, setup steps, and scripts.
   - Its own `.env.example` (never commit a real `.env`).
   - Its own `vercel.json` if it needs SPA rewrites or custom build settings.
3. Add a row to the Examples table above.
4. Create a new Vercel project pointing at the folder.

### Conventions

- One folder per example. No nested examples.
- No cross-folder imports.
- Use the root pnpm workspace and shared Biome config for package management, formatting, and linting.
- Pick the simplest stack that demonstrates the point.
- Document any required Are.na OAuth client configuration (redirect URIs, scopes) in the example's README.
