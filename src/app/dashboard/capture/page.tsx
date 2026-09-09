import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CameraCapture from "@/components/CameraCapture";

export default async function CapturePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1C1C1C] mb-1">Capture</h1>
        <p className="text-sm text-[#6B6560]">
          Take a standardized photo for accurate tracking
        </p>
      </div>

      <CameraCapture />
    </div>
  );
}
