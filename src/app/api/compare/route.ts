import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAnalysis } from "@/lib/analysis";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { photoAId, photoBId } = body;

    if (!photoAId || !photoBId) {
      return NextResponse.json(
        { error: "photoAId and photoBId are required" },
        { status: 400 }
      );
    }

    const [photoA, photoB] = await Promise.all([
      prisma.photo.findFirst({
        where: { id: photoAId, userId: session.user.id },
      }),
      prisma.photo.findFirst({
        where: { id: photoBId, userId: session.user.id },
      }),
    ]);

    if (!photoA || !photoB) {
      return NextResponse.json(
        { error: "One or both photos not found" },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionStatus: true },
    });
    const isPremium = user?.subscriptionStatus === "premium";

    const result = generateAnalysis(
      photoA.storageUrl,
      photoB.storageUrl,
      isPremium
    );

    const analysis = await prisma.analysis.create({
      data: {
        userId: session.user.id,
        photoAId: photoA.id,
        photoBId: photoB.id,
        resultJson: JSON.stringify(result),
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({
      id: analysis.id,
      createdAt: analysis.createdAt,
      analysis: result,
    });
  } catch (error) {
    console.error("POST /api/compare error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await prisma.analysis.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        photoAId: true,
        photoBId: true,
        resultJson: true,
        createdAt: true,
      },
    });

    const analyses = rows.map((a) => ({
      id: a.id,
      photoAId: a.photoAId,
      photoBId: a.photoBId,
      analysis: a.resultJson ? JSON.parse(a.resultJson) : null,
      createdAt: a.createdAt,
    }));

    return NextResponse.json({ analyses });
  } catch (error) {
    console.error("GET /api/compare error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
