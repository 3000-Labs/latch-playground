import {
  LEGAL_CONTROLLER_DESCRIPTION,
  LEGAL_CONTROLLER_OPERATING_NAME,
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_LAST_UPDATED,
  PRODUCT_SITE_DISPLAY,
} from "@/lib/legal";

const sectionClass = "space-y-4";
const h2 = "font-mono text-xl sm:text-2xl font-semibold tracking-tight text-foreground pt-2";
const h3 = "font-mono text-base sm:text-lg font-medium text-foreground/95 mt-6 mb-2";
const p = "text-sm sm:text-base text-foreground/85 leading-relaxed";
const ul = "list-disc pl-5 space-y-2 text-sm sm:text-base text-foreground/85 leading-relaxed";
const tableWrap = "overflow-x-auto rounded-md border border-border my-4";
const th = "text-left font-mono text-xs uppercase tracking-wide text-foreground/90 border-b border-border px-3 py-2";
const td = "align-top text-sm text-foreground/80 border-b border-border/80 px-3 py-2.5";

export function PrivacyPolicyContent() {
  return (
    <article className="space-y-12">
      <header className="space-y-3 border-b border-border pb-8">
        <h1 className="font-mono text-3xl sm:text-4xl font-bold tracking-tighter">Privacy Policy</h1>
        <p className="font-mono text-sm text-foreground/60">
          Last updated: {PRIVACY_LAST_UPDATED}
        </p>
        <p className={p}>
          This Privacy Policy describes how {LEGAL_CONTROLLER_DESCRIPTION} (“{LEGAL_CONTROLLER_OPERATING_NAME}”, “we”,
          “us”, or “our”) collects, uses, discloses, and protects information when you use the Latch website (including{" "}
          <span className="font-mono text-foreground/90">{PRODUCT_SITE_DISPLAY}</span> and any successor domains we
          operate), our hosted application programming interfaces (“APIs”), our reference wallet experiences (such as
          the Smart Accounts demo), and official Latch browser extension(s) that connect to our services (together, the
          “Services”). Capitalized terms used in this policy have the meanings given here or in any linked terms of use
          if we publish them.
        </p>
      </header>

      <section aria-labelledby="scope" className={sectionClass}>
        <h2 id="scope" className={h2}>
          1. Scope
        </h2>
        <p className={p}>
          This policy applies to personal information we process in connection with the Services. It does not govern
          third-party websites, decentralized applications (“dApps”), wallet extensions from other providers, or public
          blockchain networks — those are governed by their own terms and policies.
        </p>
        <p className={p}>
          If you install an official <strong className="text-foreground">Latch browser extension</strong>, the same
          policy applies to information processed through that extension when it communicates with our APIs and
          website, in addition to the extension-specific disclosures in Section 8.
        </p>
      </section>

      <section aria-labelledby="definitions" className={sectionClass}>
        <h2 id="definitions" className={h2}>
          2. Definitions
        </h2>
        <ul className={ul}>
          <li>
            <strong className="text-foreground">Personal information</strong> means information that identifies,
            relates to, describes, is reasonably capable of being associated with, or could reasonably be linked with a
            particular consumer or household, as well as similar terms like “personal data” under applicable law.
          </li>
          <li>
            <strong className="text-foreground">On-chain data</strong> means data recorded on a public blockchain (for
            example Stellar / Soroban ledger entries, contract addresses, transaction payloads, and wallet addresses).
            On-chain data is typically public, permanent, and outside our control once submitted.
          </li>
          <li>
            <strong className="text-foreground">Off-chain data</strong> means data processed on our servers or
            infrastructure providers (for example database rows, HTTP logs, and session cookies).
          </li>
        </ul>
      </section>

      <section aria-labelledby="collection" className={sectionClass}>
        <h2 id="collection" className={h2}>
          3. Information we collect
        </h2>
        <p className={p}>
          We collect only the information reasonably necessary to operate, secure, and improve the Services. Categories
          depend on which features you use (for example passkey registration vs. delegated signing).
        </p>

        <h3 className={h3}>3.1 Account, session, and device context</h3>
        <ul className={ul}>
          <li>
            <strong className="text-foreground">Session cookie.</strong> We set an HTTP-only session cookie (named{" "}
            <span className="font-mono">sid</span>) to associate your browser or extension with a server-side session.
            In production, this cookie may use <span className="font-mono">SameSite=None</span> and{" "}
            <span className="font-mono">Secure</span> so that credentialed requests from an allowed browser extension
            origin can complete WebAuthn and API flows without dropping the session.
          </li>
          <li>
            <strong className="text-foreground">Session lifetime.</strong> Server-side sessions are created and renewed
            with a rolling expiration window of approximately thirty (30) days of activity unless ended earlier (for
            example by cookie clearance or security measures).
          </li>
          <li>
            <strong className="text-foreground">Identifiers we generate.</strong> We assign internal identifiers to users
            and sessions stored in our database; these are not necessarily meaningful outside our systems.
          </li>
        </ul>

        <h3 className={h3}>3.2 WebAuthn / passkey registration and authentication</h3>
        <ul className={ul}>
          <li>
            <strong className="text-foreground">Credential and key material.</strong> When you register a passkey, we
            store WebAuthn credential identifiers and public-key material (including COSE-encoded and raw P-256 public
            keys) needed to verify future assertions. We store a signature counter and optional metadata such as
            transports, authenticator device type, and backup state when reported by your device.
          </li>
          <li>
            <strong className="text-foreground">Challenges.</strong> We issue short-lived cryptographic challenges for
            registration and sign-in. These records include the challenge bytes, relying party id, and requesting web
            origin. Challenges are designed to expire approximately five (5) minutes after creation and are deleted
            after successful completion of the ceremony when the protocol flow finishes.
          </li>
          <li>
            <strong className="text-foreground">What we do not receive from WebAuthn.</strong> Your biometric samples
            (such as fingerprints or face geometry) stay on your device; we receive only cryptographic proofs your
            authenticator releases under the WebAuthn standard.
          </li>
        </ul>

        <h3 className={h3}>3.3 Smart Accounts and signers</h3>
        <ul className={ul}>
          <li>
            <strong className="text-foreground">Smart account linkage.</strong> We store data needed to associate your
            passkeys and policies with Stellar smart account addresses you create or manage through the Services,
            including deployment status and cryptographic salts or key material our application uses in accordance with
            our technical design.
          </li>
          <li>
            <strong className="text-foreground">Account signers.</strong> We may store records of additional or alternate
            signers (for example delegated signers, recovery-related signer types, or labels you provide) linked to your
            smart account so the product can enforce your chosen authorization model.
          </li>
        </ul>

        <h3 className={h3}>3.4 Transactions and Stellar / Soroban activity</h3>
        <ul className={ul}>
          <li>
            <strong className="text-foreground">Transaction payloads.</strong> When you request transaction building,
            simulation, submission, or related endpoints, our servers process transaction and authorization data you
            send (for example XDR-encoded transactions and authorization entries, signer addresses, and signed payloads)
            to perform the requested operation.
          </li>
          <li>
            <strong className="text-foreground">RPC and ledger visibility.</strong> Submitted transactions become part of
            the public ledger. We also send RPC requests (for example to simulate or submit transactions) to the Soroban
            / Stellar RPC endpoint configured for the deployment. Those network operators process requests under their
            own privacy policies.
          </li>
        </ul>

        <h3 className={h3}>3.5 Third-party wallets you connect</h3>
        <p className={p}>
          If you connect a third-party wallet (for example Phantom, MetaMask, Freighter, or Lobstr), that wallet
          provider processes information under its own privacy policy. We may receive public addresses and signatures
          you approve for transmission to our APIs or to the network, but we do not control the wallet’s local storage
          or analytics.
        </p>

        <h3 className={h3}>3.6 Server and security logs</h3>
        <p className={p}>
          Like most hosted services, our infrastructure may automatically collect diagnostic and security information
          such as IP address, approximate location derived from IP, user agent, timestamps, request paths, HTTP status
          codes, and similar telemetry in server or platform logs. We use this information to operate, secure, and debug
          the Services.
        </p>

        <h3 className={h3}>3.7 Analytics</h3>
        <p className={p}>
          We do not currently load third-party marketing analytics scripts in the application code shipped from this
          repository. If we enable optional analytics (for example product analytics on Vercel or another provider),
          we will update this policy and, where required, provide appropriate consent or opt-out mechanisms before
          turning them on in production.
        </p>
      </section>

      <section aria-labelledby="not-collect" className={sectionClass}>
        <h2 id="not-collect" className={h2}>
          4. What we do not intend to collect
        </h2>
        <ul className={ul}>
          <li>
            We do <strong className="text-foreground">not</strong> ask you to upload a Stellar seed phrase to our servers
            as part of the product flows described in our documentation, and you should never paste a seed phrase into any
            Latch-controlled form.
          </li>
          <li>
            We do <strong className="text-foreground">not</strong> custody your third-party wallet’s private keys;
            signing with those wallets happens through the wallet provider’s software on your device unless you
            explicitly choose to share a derived key or signature with us as part of a transaction flow.
          </li>
        </ul>
        <p className={p}>
          If you believe you have transmitted highly sensitive data to us by mistake, contact us immediately using the
          details in Section 16 so we can assist with mitigation steps available to us.
        </p>
      </section>

      <section aria-labelledby="use" className={sectionClass}>
        <h2 id="use" className={h2}>
          5. How we use information
        </h2>
        <ul className={ul}>
          <li>Provide, maintain, and improve the Services (including onboarding, authentication, and transaction flows).</li>
          <li>Detect, prevent, and respond to fraud, abuse, and security incidents.</li>
          <li>Comply with law and enforce our terms.</li>
          <li>Communicate with you about the Services when you contact us or when notices are required.</li>
        </ul>
        <p className={p}>
          Depending on your jurisdiction, we rely on a mix of legal bases such as performance of a contract, legitimate
          interests that are not overridden by your rights, compliance with legal obligations, and consent where
          required. The basis that applies to a specific activity can vary; where the law requires us to identify it, we
          do so in our internal records and notices at collection when applicable.
        </p>
      </section>

      <section aria-labelledby="sharing" className={sectionClass}>
        <h2 id="sharing" className={h2}>
          6. How we share information
        </h2>
        <p className={p}>We share personal information only as described in this policy or with your direction.</p>
        <ul className={ul}>
          <li>
            <strong className="text-foreground">Infrastructure providers (“subprocessors”).</strong> We use cloud
            hosting and database providers to run the Services. They process data on our instructions and under
            contractual safeguards.
          </li>
          <li>
            <strong className="text-foreground">Public blockchains.</strong> When you submit transactions, information
            contained in those transactions is replicated across the network and may be indexed by third-party
            explorers.
          </li>
          <li>
            <strong className="text-foreground">Legal and safety.</strong> We may disclose information if we believe in
            good faith that disclosure is required by law, subpoena, or legal process, or to protect the rights, safety,
            and security of users, the public, or ourselves.
          </li>
          <li>
            <strong className="text-foreground">Business transfers.</strong> If we are involved in a merger, acquisition,
            financing, or sale of assets, information may be transferred as part of that transaction, subject to
            standard confidentiality arrangements.
          </li>
        </ul>

        <div className={tableWrap}>
          <table className="w-full min-w-[280px] border-collapse">
            <caption className="sr-only">
              Representative subprocessors for the Services
            </caption>
            <thead>
              <tr>
                <th scope="col" className={th}>
                  Subprocessor (category)
                </th>
                <th scope="col" className={th}>
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={td}>Vercel (hosting / serverless)</td>
                <td className={td}>Hosts the Next.js application and API routes; may process HTTP logs and deployment metadata.</td>
              </tr>
              <tr>
                <td className={td}>Neon (managed Postgres)</td>
                <td className={td}>Stores application database records described in Section 3.</td>
              </tr>
              <tr>
                <td className={td}>Stellar / Soroban RPC operators</td>
                <td className={td}>
                  Processes RPC requests (simulate, submit, query) when our servers forward traffic to the configured
                  network endpoint.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="cookies" className={sectionClass}>
        <h2 id="cookies" className={h2}>
          7. Cookies and similar technologies
        </h2>
        <p className={p}>
          We use strictly necessary cookies to maintain your session. We do not use advertising cookies in the current
          implementation described in Section 3.7. You can control cookies through your browser settings; disabling
          strictly necessary cookies may prevent sign-in or passkey flows from working.
        </p>
      </section>

      <section aria-labelledby="extensions" className={sectionClass}>
        <h2 id="extensions" className={h2}>
          8. Latch browser extensions
        </h2>
        <p className={p}>
          When we distribute an official Latch extension in the Chrome Web Store or another browser gallery, that
          extension is part of the Services covered by this policy. The canonical URL of this Privacy Policy will be
          linked from the store listing and from in-extension legal links (for example the options or about surface) so
          you always have a single up-to-date document.
        </p>
        <h3 className={h3}>8.1 How the extension talks to Latch</h3>
        <ul className={ul}>
          <li>
            The extension may call our APIs with browser <span className="font-mono">fetch</span> using credentials so
            the HTTP-only session cookie is included, similar to a website origin calling our APIs.
          </li>
          <li>
            Our servers may validate an allowlisted browser extension origin (for example{" "}
            <span className="font-mono">chrome-extension://…</span>) when operators configure cross-origin access. We
            do not open credentialed cross-origin access to arbitrary origins.
          </li>
          <li>
            For WebAuthn ceremonies initiated inside an extension context, we may validate an allowlisted Chrome
            extension identifier and compare it to the WebAuthn client data origin, and we may accept an explicit
            extension id header when some proxies omit the Origin header. This reduces confusion between different
            extensions and protects passkey ceremonies from unexpected callers.
          </li>
        </ul>
        <h3 className={h3}>8.2 Extension permissions and local storage</h3>
        <p className={p}>
          Browser extensions declare permissions in a manifest (for example storage, alarms, host access, or script
          injection). The exact permission list for each Latch extension build will be summarized in the Chrome Web
          Store listing and in release notes when the extension ships. This Privacy Policy does not replace that
          technical disclosure — read both together.
        </p>
      </section>

      <section aria-labelledby="retention" className={sectionClass}>
        <h2 id="retention" className={h2}>
          9. Retention
        </h2>
        <ul className={ul}>
          <li>
            <strong className="text-foreground">Sessions:</strong> rolling thirty (30) day activity window as described in
            Section 3.1.
          </li>
          <li>
            <strong className="text-foreground">WebAuthn challenges:</strong> short-lived (on the order of five (5)
            minutes) and removed after successful completion where the application deletes the challenge record.
          </li>
          <li>
            <strong className="text-foreground">Account records:</strong> retained while your account is active and for
            a reasonable period afterward for legal, security, and dispute-resolution purposes unless a shorter period is
            required by law.
          </li>
          <li>
            <strong className="text-foreground">Server logs:</strong> retained according to our hosting provider’s
            rotation and our internal retention schedule.
          </li>
        </ul>
      </section>

      <section aria-labelledby="security" className={sectionClass}>
        <h2 id="security" className={h2}>
          10. Security
        </h2>
        <p className={p}>
          We implement administrative, technical, and organizational measures appropriate to the risk, including TLS for
          data in transit, access controls on production infrastructure, HTTP-only session cookies, and allowlisted
          cross-origin access for extension integrations. No method of transmission or storage is completely secure;
          we encourage you to use device passcodes, hardware security keys where available, and reputable wallet
          software.
        </p>
      </section>

      <section aria-labelledby="international" className={sectionClass}>
        <h2 id="international" className={h2}>
          11. International users and transfers
        </h2>
        <p className={p}>
          We may process and store information in the United States and other countries where we or our subprocessors
          operate. Those countries may have different data protection laws than your own. Where required, we will rely on
          appropriate safeguards for international transfers (for example Standard Contractual Clauses for data from the
          European Economic Area, and UK-approved transfer mechanisms where applicable).
        </p>
      </section>

      <section aria-labelledby="rights" className={sectionClass}>
        <h2 id="rights" className={h2}>
          12. Your privacy rights
        </h2>
        <p className={p}>
          Depending on where you live, you may have rights to access, correct, delete, or export personal information,
          or to object to or restrict certain processing. We do not currently provide a self-service account deletion
          control in the product; to exercise these rights, contact us at{" "}
          <a className="font-mono text-primary underline underline-offset-4 hover:opacity-90" href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
            {PRIVACY_CONTACT_EMAIL}
          </a>{" "}
          and we will respond in line with applicable law. You may also have the right to lodge a complaint with a data
          protection authority.
        </p>
      </section>

      <section aria-labelledby="us-states" className={sectionClass}>
        <h2 id="us-states" className={h2}>
          13. United States (California and other states)
        </h2>
        <p className={p}>
          If you are a California resident, the California Consumer Privacy Act (“CCPA”) may grant you additional rights
          regarding personal information, including rights to know, delete, and correct, and to opt out of certain
          “sales” or “sharing” of personal information. We do not sell personal information for money and we do not
          share it for cross-context behavioral advertising as part of the implementation described in this policy. If
          our practices change, we will update this disclosure.
        </p>
        <div className={tableWrap}>
          <table className="w-full min-w-[280px] border-collapse">
            <caption className="sr-only">Categories of personal information collected (CCPA-style summary)</caption>
            <thead>
              <tr>
                <th scope="col" className={th}>
                  Category
                </th>
                <th scope="col" className={th}>
                  Examples in Latch
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={td}>Identifiers</td>
                <td className={td}>Internal user ids, wallet and smart account addresses, session cookie value.</td>
              </tr>
              <tr>
                <td className={td}>Internet or network information</td>
                <td className={td}>IP address, user agent, request metadata in logs.</td>
              </tr>
              <tr>
                <td className={td}>Sensitive / authentication data (statutory categories vary)</td>
                <td className={td}>
                  WebAuthn credential ids and public keys; we do not store raw biometric templates (see Section 3.2).
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="eea" className={sectionClass}>
        <h2 id="eea" className={h2}>
          14. European Economic Area, United Kingdom, and Switzerland
        </h2>
        <p className={p}>
          If GDPR or UK GDPR applies, we act as a controller for the processing described here unless we agree in
          writing to act as a processor on behalf of an organization you represent. This policy is intended to provide
          the transparency required by Articles 13–14 at a high level; regulators may require additional detail in
          records of processing activities maintained separately from this document.
        </p>
      </section>

      <section aria-labelledby="children" className={sectionClass}>
        <h2 id="children" className={h2}>
          15. Children
        </h2>
        <p className={p}>
          The Services are not directed to children under the age where they may not lawfully provide consent in their
          jurisdiction (for example 13 in the United States or 16 in parts of the EU for certain services). We do not
          knowingly collect personal information from children. If you believe we have collected information from a
          child, contact us and we will take appropriate steps to investigate and delete it where required by law.
        </p>
      </section>

      <section aria-labelledby="contact" className={sectionClass}>
        <h2 id="contact" className={h2}>
          16. Contact
        </h2>
        <p className={p}>
          Questions about this Privacy Policy or our practices:{" "}
          <a className="font-mono text-primary underline underline-offset-4 hover:opacity-90" href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
            {PRIVACY_CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>

      <section aria-labelledby="changes" className={sectionClass}>
        <h2 id="changes" className={h2}>
          17. Changes to this policy
        </h2>
        <p className={p}>
          We may update this Privacy Policy from time to time. We will post the updated version on this page and revise
          the “Last updated” date above. If changes are material, we will provide additional notice as required by law
          (for example a banner in the Services or email where we have contact details).
        </p>
      </section>

    </article>
  );
}
