/**
 * Centralized feature flag configuration for MarketMyIdea.
 *
 * INSTAGRAM_OAUTH_ENABLED:
 * Controls public-facing Instagram OAuth connection controls (login, onboarding connect, dashboard connect).
 * Defaults to `false` for manual creator profile and Reel URL verification.
 *
 * Re-enabling Instagram OAuth in the future:
 * 1. Set `NEXT_PUBLIC_INSTAGRAM_OAUTH_ENABLED=true` in `.env.local` / Cloudflare environment variables.
 * 2. Verify Meta App Review permissions ('instagram_business_basic') and Redirect URIs in Meta Developer Console.
 */
export const INSTAGRAM_OAUTH_ENABLED: boolean =
  process.env.NEXT_PUBLIC_INSTAGRAM_OAUTH_ENABLED === 'true' ||
  process.env.INSTAGRAM_OAUTH_ENABLED === 'true' ||
  false;
