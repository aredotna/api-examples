import { OAuth } from "@aredotna/sdk/oauth";
import {
  getArenaEnvironment,
  getArenaEnvironmentConfig,
  type ArenaEnvironment,
} from "./api";

export function getOAuthClient(
  environment: ArenaEnvironment = getArenaEnvironment()
): OAuth {
  const { apiBaseUrl, authorizationBaseUrl } =
    getArenaEnvironmentConfig(environment);
  const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID?.trim();

  if (!clientId) {
    throw new Error(
      "VITE_OAUTH_CLIENT_ID is not set. Please register an OAuth application and add the client ID to your .env file.",
    );
  }

  const redirectUri = getOAuthRedirectUri();

  return new OAuth({
    apiBaseUrl,
    authorizationBaseUrl,
    clientId,
    redirectUri,
  });
}

export function getOAuthRedirectUri(): string {
  return (
    import.meta.env.VITE_OAUTH_REDIRECT_URI ||
    `${window.location.origin}/oauth/callback`
  );
}

export function isOnOAuthRedirectOrigin(): boolean {
  return new URL(getOAuthRedirectUri()).origin === window.location.origin;
}

export function redirectToOAuthOrigin(): void {
  const redirectUrl = new URL(getOAuthRedirectUri());
  window.location.href = `${redirectUrl.origin}${window.location.pathname}${window.location.search}${window.location.hash}`;
}
