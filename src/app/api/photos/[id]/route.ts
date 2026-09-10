import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteObjects } from "@/lib/storage";
import { withPhotoUrls } from "@/lib/photoUrls";

const SELECT = {
  id: true,
  label: true,
  notes: true,
  capturedAt: true,
  thumbnailUrl: true,
  width: true,
  height: true,
  fileSize: true,
} as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const photo = await prisma.photo.findFirst({
      where: { id, userId: session.user.id },
      select: SELECT,
    });
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }
    return NextResponse.json(withPhotoUrls(photo));
  } catch (error) {
    console.error("GET /api/photos/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const label = typeof body.label === "string" ? body.label.trim() : undefined;
    const notes =
      typeof body.notes === "string" ? body.notes.trim() || null : undefined;

    if ((label?.length ?? 0) > 120 || (notes?.length ?? 0) > 2000) {
      return NextResponse.json({ error: "Label or notes too long" }, { status: 400 });
    }

    const photo = await prisma.photo.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    const updated = await prisma.photo.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(notes !== undefined && { notes }),
      },
      select: SELECT,
    });
    return NextResponse.json(withPhotoUrls(updated));
  } catch (error) {
    console.error("PATCH /api/photos/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const photo = await prisma.photo.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, storageUrl: true, thumbnailUrl: true },
    });
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    await prisma.photo.delete({ where: { id } });
    await deleteObjects([photo.storageUrl, photo.thumbnailUrl ?? ""]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/photos/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
