import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId } = await getOrCreateSession();

    const accounts = await prisma.smartAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        smartAccountAddress: true,
        credentialId: true,
        deployed: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      accounts: accounts.map((a) => ({
        smartAccountAddress: a.smartAccountAddress,
        credentialId: a.credentialId,
        deployed: !!a.deployed,
        createdAt: Number(a.createdAt),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "List accounts failed" },
      { status: 500 }
    );
  }
}
