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
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return null;
  }

  const isPremium = session.user.subscriptionStatus === "premium";

  if (requirePremium && !isPremium) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-surface rounded-2xl p-6 shadow-sm border border-line">
            <h2 className="text-xl font-semibold text-ink mb-2">
              Premium Feature
            </h2>
            <p className="text-sm text-ink-2 mb-6">
              This feature is available to premium subscribers. Upgrade your
              account to unlock exclusive skincare analysis tools.
            </p>
            <button
              onClick={() => router.push("/dashboard/settings?tab=subscription")}
              className="w-full py-3 px-4 rounded-xl bg-accent text-on-fill font-medium hover:bg-accent-strong transition-colors"
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
