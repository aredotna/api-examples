/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ARENA_API_BASE?: string
  readonly VITE_ARENA_OAUTH_AUTHORIZE_URL?: string
  readonly VITE_ARENA_CLIENT_ID?: string
  readonly VITE_ARENA_REDIRECT_URI?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
