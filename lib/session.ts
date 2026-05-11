import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { nowMs } from "@/lib/db";
import { crossSiteCookieAttrs } from "@/lib/cookie-cross-site";
import * as crypto from "crypto";

const SESSION_COOKIE_NAME = "sid";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export type SessionInfo = {
  sessionId: string;
  userId: string;
};

function randomId() {
  return crypto.randomUUID();
}

export async function getOrCreateSession(): Promise<SessionInfo> {
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE_NAME)?.value;
  const now = nowMs();

  if (existing) {
    const row = await prisma.session.findUnique({
      where: { id: existing },
      select: { id: true, userId: true, expiresAt: true },
    });

    if (row && row.expiresAt > BigInt(now)) {
      await prisma.session.update({
        where: { id: row.id },
        data: { expiresAt: BigInt(now + SESSION_TTL_MS) },
      });
      jar.set(SESSION_COOKIE_NAME, row.id, {
        httpOnly: true,
        path: "/",
        maxAge: Math.floor(SESSION_TTL_MS / 1000),
        ...crossSiteCookieAttrs(),
      });
      return { sessionId: row.id, userId: row.userId };
    }
  }

  const userId = randomId();
  const sessionId = randomId();

  await prisma.$transaction([
    prisma.user.create({ data: { id: userId, createdAt: BigInt(now) } }),
    prisma.session.create({
      data: {
        id: sessionId,
        userId,
        createdAt: BigInt(now),
        expiresAt: BigInt(now + SESSION_TTL_MS),
      },
    }),
  ]);

  jar.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    ...crossSiteCookieAttrs(),
  });

  return { sessionId, userId };
}
