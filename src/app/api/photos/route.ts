import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { makeKey, putObject } from "@/lib/storage";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateAndNormalizeImage, MAX_UPLOAD_BYTES } from "@/lib/imageValidation";
import { withPhotoUrls } from "@/lib/photoUrls";

const LIST_SELECT = {
  id: true,
  label: true,
  notes: true,
  capturedAt: true,
  thumbnailUrl: true,
  width: true,
  height: true,
  fileSize: true,
} as const;

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10) || 50));
    const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);

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
      select: LIST_SELECT,
    });

    return NextResponse.json({ photos: photos.map(withPhotoUrls) });
  } catch (error) {
    console.error("GET /api/photos error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    if (!(await checkRateLimit(`upload:${userId}`, 10, 60_000))) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_UPLOAD_BYTES + 1_000_000) {
      return NextResponse.json({ error: "Upload too large" }, { status: 413 });
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
          { status: 403 },
        );
      }
    }

    const formData = await request.formData();
    const file = formData.get("image");
    const label = ((formData.get("label") as string) ?? "").trim();
    const notes = ((formData.get("notes") as string) ?? "").trim() || null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }
    if (!label) {
      return NextResponse.json({ error: "Label is required" }, { status: 400 });
    }
    if (label.length > 120 || (notes?.length ?? 0) > 2000) {
      return NextResponse.json({ error: "Label or notes too long" }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Image is larger than 12 MB" }, { status: 413 });
    }

    const raw = Buffer.from(await file.arrayBuffer());
    const result = await validateAndNormalizeImage(raw);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const origKey = makeKey(userId, "image/jpeg", "orig");
    const thumbKey = makeKey(userId, "image/jpeg", "thumb");
    await putObject(origKey, result.jpeg, "image/jpeg");
    await putObject(thumbKey, result.thumbnail, "image/jpeg");

    const photo = await prisma.photo.create({
      data: {
        userId,
        label,
        notes,
        storageUrl: origKey,
        thumbnailUrl: thumbKey,
        contentType: "image/jpeg",
        width: result.width,
        height: result.height,
        fileSize: result.jpeg.length,
      },
      select: LIST_SELECT,
    });

    return NextResponse.json(withPhotoUrls(photo), { status: 201 });
  } catch (error) {
    console.error("POST /api/photos error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
