import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteObjects } from "@/lib/storage";
import { checkRateLimit } from "@/lib/rateLimit";

const TOKEN_TTL_MS = 15 * 60 * 1000;

/** Step 1 — request deletion. Issues a short-lived confirmation token. */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await checkRateLimit(`delete-account:${session.user.id}`, 5, 60_000))) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
    await prisma.accountDeletionToken.upsert({
      where: { userId: session.user.id },
      create: { token, userId: session.user.id, expiresAt },
      update: { token, expiresAt },
    });

    return NextResponse.json({ token, expiresAt });
  } catch (error) {
    console.error("POST /api/auth/delete-account error:", error);
    return NextResponse.json({ error: "Failed to start deletion" }, { status: 500 });
  }
}

/** Step 2 — confirm. Requires the token and the account's own email typed back. */
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token : "";
    const confirmEmail =
      typeof body.confirmEmail === "string" ? body.confirmEmail.trim().toLowerCase() : "";

    const record = await prisma.accountDeletionToken.findUnique({
      where: { userId: session.user.id },
    });
    if (!record || record.token !== token || record.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired confirmation" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });
    if (!user || user.email.toLowerCase() !== confirmEmail) {
      return NextResponse.json({ error: "Email does not match" }, { status: 400 });
    }

    const photos = await prisma.photo.findMany({
      where: { userId: session.user.id },
      select: { storageUrl: true, thumbnailUrl: true },
    });
    const keys = photos.flatMap((p) => [p.storageUrl, p.thumbnailUrl ?? ""]);

    await prisma.user.delete({ where: { id: session.user.id } });
    await deleteObjects(keys);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/auth/delete-account error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
