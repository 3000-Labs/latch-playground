// Time helper kept here so existing imports `from "@/lib/db"` keep compiling.
// All actual DB access has moved to Prisma; see `lib/prisma.ts`.

export function nowMs(): number {
  return Date.now();
}
