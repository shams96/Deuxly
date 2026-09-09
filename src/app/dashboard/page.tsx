"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DashboardPage() {
  const { data: session } = useSession();
  const isPremium = session?.user.subscriptionStatus === "premium";

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1C1C1C] mb-1">
            Welcome back, {session?.user.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-[#6B6560]">
            Track your skincare progress over time
          </p>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-[#E8E2DA]">
          <div
            className={`w-3 h-3 rounded-full ${
              isPremium ? "bg-[#8A9A7B]" : "bg-[#C4A484]"
            }`}
          />
          <span className="text-sm text-[#1C1C1C]">
            {isPremium ? "Premium Plan" : "Free Plan"}
          </span>
          {!isPremium && (
            <Link
              href="/dashboard/settings?tab=subscription"
              className="ml-auto text-sm font-medium text-[#C6B8A4] hover:text-[#B8A892] transition-colors"
            >
              Upgrade
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/dashboard/capture"
            className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl bg-white border border-[#E8E2DA] hover:border-[#C6B8A4] transition-colors"
          >
            <svg className="w-8 h-8 text-[#C6B8A4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.954-.166 1.989.382 2.82m5.834 0a2.31 2.31 0 012.82 0m2.82 0a2.31 2.31 0 012.82 0m2.82 0a2.31 2.31 0 01.382-2.82M18 10.5h.007M15 10.5h.007M12 10.5h.007M9 10.5h.007M6 10.5h.007M18 15.75h.007M15 15.75h.007M12 15.75h.007M9 15.75h.007M6 15.75h.007M12 21a9 9 0 100-18 9 9 0 000 18z" />
            </svg>
            <span className="text-sm font-medium text-[#1C1C1C]">
              Capture Photo
            </span>
          </Link>

          <Link
            href="/dashboard/history"
            className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl bg-white border border-[#E8E2DA] hover:border-[#C6B8A4] transition-colors"
          >
            <svg className="w-8 h-8 text-[#C6B8A4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-[#1C1C1C]">
              View History
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E2DA]">
          <h2 className="text-lg font-semibold text-[#1C1C1C] mb-4">
            Recent Activity
          </h2>

          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg
              className="w-16 h-16 text-[#E8E2DA] mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18.75 6.75h.008v.008h-.008V6.75zm-3.75 0h.008v.008h-.008V6.75zm-3.75 0h.008v.008h-.008V6.75z"
              />
            </svg>
            <h3 className="text-lg font-medium text-[#1C1C1C] mb-2">
              No photos yet
            </h3>
            <p className="text-sm text-[#6B6560] mb-6 max-w-xs">
              Start documenting your skincare journey by capturing your first
              photo
            </p>
            <Link
              href="/dashboard/capture"
              className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-[#C6B8A4] text-white font-medium hover:bg-[#B8A892] transition-colors"
            >
              Take your first photo
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
