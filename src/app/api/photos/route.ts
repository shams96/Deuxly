import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToStorage } from "@/lib/storage";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionStatus: true },
    });

    const isPremium = user?.subscriptionStatus === "premium";
    const where: Record<string, unknown> = { userId: session.user.id };
    if (!isPremium) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      where.capturedAt = { gte: cutoff };
    }

    const photos = await prisma.photo.findMany({
      where,
      orderBy: { capturedAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        label: true,
        notes: true,
        capturedAt: true,
        storageUrl: true,
        thumbnailUrl: true,
        width: true,
        height: true,
        fileSize: true,
      },
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error("GET /api/photos error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!checkRateLimit(`upload:${userId}`, 10, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionStatus: true },
    });

    const isPremium = user?.subscriptionStatus === "premium";
    if (!isPremium) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthlyCount = await prisma.photo.count({
        where: { userId, capturedAt: { gte: monthStart } },
      });
      if (monthlyCount >= 4) {
        return NextResponse.json(
          { error: "Monthly limit reached. Upgrade to Premium for unlimited captures." },
          { status: 403 }
        );
      }
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const label = (formData.get("label") as string) ?? "";
    const notes = (formData.get("notes") as string) ?? null;

    if (!file) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
    }

    if (!label.trim()) {
      return NextResponse.json(
        { error: "Label is required" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let processedBuffer = buffer;
    let thumbnailBuffer: Buffer | undefined;
    let width = 0;
    let height = 0;

    try {
      const sharp = await import("sharp");
      const metadata = await sharp.default(buffer).metadata();
      width = metadata.width ?? 0;
      height = metadata.height ?? 0;

      processedBuffer = await sharp
        .default(buffer)
        .jpeg({ quality: 85 })
        .toBuffer();

      thumbnailBuffer = await sharp
        .default(buffer)
        .resize(400, 400, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toBuffer();
    } catch {
      processedBuffer = buffer;
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_.-]/g, "");
    const key = `photos/${userId}/${timestamp}-${safeName}`;
    const thumbnailKey = `photos/${userId}/${timestamp}-thumb-${safeName}`;

    let storageUrl: string;
    let thumbnailUrl: string | null = null;

    try {
      storageUrl = await uploadToStorage(key, processedBuffer, file.type || "image/jpeg");
    } catch (err) {
      console.error("Primary storage upload failed:", err);
      storageUrl = `/uploads/${key}`;
    }

    if (thumbnailBuffer) {
      try {
        const thumbUrl = await uploadToStorage(thumbnailKey, thumbnailBuffer, "image/jpeg");
        thumbnailUrl = thumbUrl;
      } catch {
        thumbnailUrl = `/uploads/${thumbnailKey}`;
      }
    }

    const photo = await prisma.photo.create({
      data: {
        userId,
        label,
        notes,
        storageUrl,
        thumbnailUrl,
        width,
        height,
        fileSize: buffer.length,
      },
      select: {
        id: true,
        label: true,
        notes: true,
        capturedAt: true,
        storageUrl: true,
        thumbnailUrl: true,
        width: true,
        height: true,
        fileSize: true,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("POST /api/photos error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
