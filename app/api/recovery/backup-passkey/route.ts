import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nowMs } from "@/lib/db";
import { getOrCreateSession } from "@/lib/session";

export const runtime = "nodejs";

/**
 * Recovery hook (DB + UX integration point):
 * - Today: this endpoint just records intent/metadata for adding a backup passkey.
 * - Future: wire this to an on-chain method that adds a second signer/guardian.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await getOrCreateSession();
    const body = (await request.json().catch(() => ({}))) as {
      smartAccountAddress?: string;
      label?: string;
    };

    if (!body.smartAccountAddress || typeof body.smartAccountAddress !== "string") {
      return NextResponse.json({ error: "Missing smartAccountAddress" }, { status: 400 });
    }

    const owned = await prisma.smartAccount.findFirst({
      where: { userId, smartAccountAddress: body.smartAccountAddress },
      select: { smartAccountAddress: true },
    });

    if (!owned) {
      return NextResponse.json({ error: "Unknown account for this session user" }, { status: 404 });
    }

    // The legacy SQLite schema used a composite PK that included a nullable
    // credential_id; Postgres can't do that, so we hand-roll the upsert by
    // looking for the existing intent row first.
    const existing = await prisma.accountSigner.findFirst({
      where: {
        smartAccountAddress: body.smartAccountAddress,
        signerType: "backup_passkey_intent",
        credentialId: null,
      },
      select: { id: true },
    });

    const data = {
      smartAccountAddress: body.smartAccountAddress,
      signerType: "backup_passkey_intent",
      credentialId: null,
      label: body.label ?? "backup-passkey",
      createdAt: BigInt(nowMs()),
    };

    if (existing) {
      await prisma.accountSigner.update({ where: { id: existing.id }, data });
    } else {
      await prisma.accountSigner.create({ data });
    }

    return NextResponse.json({
      ok: true,
      next: "Call /api/webauthn/registration/* to register a second passkey, then attach it on-chain in a future step.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Recovery hook failed" },
      { status: 500 }
    );
  }
}
