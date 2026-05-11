/**
 * Session cookies need SameSite=None + Secure so credentialed `fetch` from
 * `chrome-extension://` (cross-site to the API host) sends them on POST, not
 * only on top-level navigations. Production always does this; in dev we turn
 * it on when extension integration env is set — otherwise Lax on localhost
 * would drop the cookie on extension → API calls and registration/finish would
 * see a new anonymous session (no challenge → "Registration challenge expired").
 */
export function crossSiteCookieAttrs(): { sameSite: "none" | "lax"; secure: boolean } {
  const prod = process.env.NODE_ENV === "production";
  const extensionWebauthn =
    Boolean(process.env.WEBAUTHN_EXTENSION_IDS?.trim()) ||
    Boolean(
      process.env.API_CORS_ALLOWED_ORIGINS
        ?.split(",")
        .some((o) => o.trim().toLowerCase().startsWith("chrome-extension://"))
    );
  const crossSite = prod || extensionWebauthn;
  return {
    sameSite: crossSite ? "none" : "lax",
    secure: crossSite,
  };
}
