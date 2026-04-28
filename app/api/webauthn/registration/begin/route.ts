import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/types";
import { prisma } from "@/lib/prisma";
import { nowMs } from "@/lib/db";
import { getOrCreateSession } from "@/lib/session";
import {
  getExpectedOriginFromRequest,
  getRpIdFromRequest,
  stableUserIdBytes,
} from "@/lib/webauthn-server";
import * as crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { userId } = await getOrCreateSession();
    const body = (await request.json().catch(() => ({}))) as { displayName?: string };
    const rpID = getRpIdFromRequest(request);
    const expectedOrigin = getExpectedOriginFromRequest(request);

    const options = (await generateRegistrationOptions({
      rpID,
      rpName: "Latch",
      userID: stableUserIdBytes(userId),
      userName: body.displayName || "local-user",
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
      supportedAlgorithmIDs: [-7],
      timeout: 60_000,
    })) as PublicKeyCredentialCreationOptionsJSON;

    if (!options?.challenge) {
      throw new Error("WebAuthn registration options missing challenge");
    }

    const now = nowMs();
    const expiresAt = now + 5 * 60 * 1000;
    await prisma.webauthnChallenge.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        purpose: "registration",
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
      { error: error instanceof Error ? error.message : "Registration begin failed" },
      { status: 500 }
    );
  }
}
