/**
 * Public legal copy — single place to bump dates and swap contact/entity after counsel review.
 * Replace LEGAL_CONTROLLER_* and PRIVACY_CONTACT_EMAIL when the incorporated entity differs.
 */
export const PRIVACY_LAST_UPDATED = "2026-05-14";

/** Operating name shown on consumer-facing pages (counsel: align with contracts). */
export const LEGAL_CONTROLLER_OPERATING_NAME = "3000 Labs";

/** One-line description for privacy intro (counsel: replace with registered legal name + jurisdiction). */
export const LEGAL_CONTROLLER_DESCRIPTION =
  `${LEGAL_CONTROLLER_OPERATING_NAME}, operating the Latch website, APIs, and related software`;

export const PRIVACY_CONTACT_EMAIL = "privacy@latch.so";

/** Display-only hostname for “our site” (production canonical URL should match WEBAUTHN_ORIGIN). */
export const PRODUCT_SITE_DISPLAY = "latch.so";
