import type { Metadata } from "next";
import { PrivacyPolicyContent } from "@/components/legal/privacy-policy-content";
import { LEGAL_CONTROLLER_OPERATING_NAME, PRIVACY_LAST_UPDATED, PRODUCT_SITE_DISPLAY } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Privacy Policy | ${LEGAL_CONTROLLER_OPERATING_NAME} — Latch`,
  description: `How ${LEGAL_CONTROLLER_OPERATING_NAME} collects, uses, and protects information for Latch (${PRODUCT_SITE_DISPLAY}), APIs, and official browser extensions.`,
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-svh pt-28 md:pt-36 pb-20">
      <div className="container max-w-3xl">
        <PrivacyPolicyContent />
        <p className="mt-16 text-xs text-foreground/50 leading-relaxed font-mono">
          Document version tied to repository review: {PRIVACY_LAST_UPDATED}. This policy is provided for transparency;
          it is not legal advice. Consult qualified counsel for jurisdiction-specific obligations before relying on it as
          a final consumer-facing instrument.
        </p>
      </div>
    </main>
  );
}
