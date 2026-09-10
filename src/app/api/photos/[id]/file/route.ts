import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getObject } from "@/lib/storage";

/**
 * The only way photo bytes reach a client. Requires a session and ownership of
 * the photo; storage keys are opaque and never exposed.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const photo = await prisma.photo.findFirst({
    where: { id, userId: session.user.id },
    select: { storageUrl: true, thumbnailUrl: true, contentType: true },
  });
  if (!photo) return new Response("Not found", { status: 404 });

  const variant = new URL(request.url).searchParams.get("variant");
  const key =
    variant === "thumb" && photo.thumbnailUrl
      ? photo.thumbnailUrl
      : photo.storageUrl;

  const bytes = await getObject(key);
  if (!bytes) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": variant === "thumb" ? "image/jpeg" : photo.contentType,
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
