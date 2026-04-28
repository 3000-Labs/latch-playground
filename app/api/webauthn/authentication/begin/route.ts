import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/types";
import { prisma } from "@/lib/prisma";
import { nowMs } from "@/lib/db";
import { getOrCreateSession } from "@/lib/session";
import { getExpectedOriginFromRequest, getRpIdFromRequest } from "@/lib/webauthn-server";
import * as crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { userId } = await getOrCreateSession();
    const rpID = getRpIdFromRequest(request);
    const expectedOrigin = getExpectedOriginFromRequest(request);

    const creds = await prisma.webauthnCredential.findMany({
      where: { userId },
      select: { credentialId: true, transports: true },
    });

    const allowCredentials =
      creds.length > 0
        ? creds.map((c) => ({
            id: c.credentialId,
            type: "public-key" as const,
            transports: (() => {
              try {
                const parsed = c.transports ? JSON.parse(c.transports) : null;
                return Array.isArray(parsed) ? parsed : undefined;
              } catch {
                return undefined;
              }
            })(),
          }))
        : undefined;

    // Discoverable login support: if this is a fresh session with no known creds,
    // omit allowCredentials and let the browser pick a resident credential.
    const options = (await generateAuthenticationOptions({
      rpID,
      userVerification: "preferred",
      allowCredentials,
      timeout: 60_000,
    })) as PublicKeyCredentialRequestOptionsJSON;

    if (!options?.challenge) {
      throw new Error("WebAuthn authentication options missing challenge");
    }

    const now = nowMs();
    const expiresAt = now + 5 * 60 * 1000;
    await prisma.webauthnChallenge.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        purpose: "authentication",
        challenge: options.challenge,
        rpId: rpID,
        origin: expectedOrigin,
        expiresAt: BigInt(expiresAt),
        createdAt: BigInt(now),
      },
    });

    return NextResponse.json({ options });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Authentication begin failed" },
      { status: 500 }
    );
  }
}
