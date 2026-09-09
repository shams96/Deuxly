"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requirePremium?: boolean;
}

export default function ProtectedRoute({
  children,
  requirePremium = false,
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F7F4]">
        <div className="w-8 h-8 border-2 border-[#C6B8A4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return null;
  }

  const isPremium = session.user.subscriptionStatus === "premium";

  if (requirePremium && !isPremium) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F7F4] px-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E2DA]">
            <h2 className="text-xl font-semibold text-[#1C1C1C] mb-2">
              Premium Feature
            </h2>
            <p className="text-sm text-[#6B6560] mb-6">
              This feature is available to premium subscribers. Upgrade your
              account to unlock exclusive skincare analysis tools.
            </p>
            <button
              onClick={() => router.push("/dashboard/settings?tab=subscription")}
              className="w-full py-3 px-4 rounded-xl bg-[#C6B8A4] text-white font-medium hover:bg-[#B8A892] transition-colors"
            >
              Upgrade to Premium
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
