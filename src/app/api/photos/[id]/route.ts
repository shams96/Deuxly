import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const photo = await prisma.photo.findFirst({
      where: { id, userId: session.user.id },
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

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    return NextResponse.json(photo);
  } catch (error) {
    console.error("GET /api/photos/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { label, notes } = body;

    const photo = await prisma.photo.findFirst({
      where: { id, userId: session.user.id },
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/photos/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const photo = await prisma.photo.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    await prisma.photo.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/photos/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
