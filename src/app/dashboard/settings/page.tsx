"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";

type Tab = "subscription" | "account";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("subscription");
  const [loading, setLoading] = useState(false);

  const isPremium = session?.user.subscriptionStatus === "premium";

  const handleUpgrade = async () => {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setLoading(false);
  };

  const handleManage = async () => {
    setLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure? This will delete all your data permanently.")) return;
    await fetch("/api/auth/delete-account", { method: "POST" });
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1C1C1C] mb-1">Settings</h1>
        <p className="text-sm text-[#6B6560]">Manage your account and subscription</p>
      </div>

      <div className="flex gap-2 border-b border-[#E8E2DA]">
        <button
          onClick={() => setTab("subscription")}
          className={`pb-3 px-4 text-sm font-medium transition-colors ${
            tab === "subscription"
              ? "text-[#C6B8A4] border-b-2 border-[#C6B8A4]"
              : "text-[#6B6560] hover:text-[#1C1C1C]"
          }`}
        >
          Subscription
        </button>
        <button
          onClick={() => setTab("account")}
          className={`pb-3 px-4 text-sm font-medium transition-colors ${
            tab === "account"
              ? "text-[#C6B8A4] border-b-2 border-[#C6B8A4]"
              : "text-[#6B6560] hover:text-[#1C1C1C]"
          }`}
        >
          Account
        </button>
      </div>

      {tab === "subscription" && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-[#E8E2DA]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-[#1C1C1C]">Current Plan</h3>
                <p className="text-sm text-[#6B6560]">{isPremium ? "Premium" : "Free"}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isPremium ? "bg-[#8A9A7B]/10 text-[#8A9A7B]" : "bg-[#C4A484]/10 text-[#C4A484]"
                }`}
              >
                {isPremium ? "Active" : "Limited"}
              </span>
            </div>

            {isPremium ? (
              <button
                onClick={handleManage}
                disabled={loading}
                className="w-full py-3 rounded-xl border border-[#E8E2DA] text-[#1C1C1C] font-medium hover:bg-[#F3F0EB] transition-colors disabled:opacity-50"
              >
                Manage Subscription
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#C6B8A4] text-white font-medium hover:bg-[#B8A892] transition-colors disabled:opacity-50"
              >
                Upgrade to Premium
              </button>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E8E2DA]">
            <h4 className="font-medium text-[#1C1C1C] mb-3">Plan Comparison</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B6560]">Photo captures/month</span>
                <span className="text-[#1C1C1C]">{isPremium ? "Unlimited" : "4"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6560]">History retention</span>
                <span className="text-[#1C1C1C]">{isPremium ? "Forever" : "30 days"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6560]">Visual overlays</span>
                <span className="text-[#1C1C1C]">{isPremium ? "Full" : "Limited"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6560]">High-res export</span>
                <span className="text-[#1C1C1C]">{isPremium ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "account" && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-[#E8E2DA]">
            <h3 className="font-medium text-[#1C1C1C] mb-2">Email</h3>
            <p className="text-sm text-[#6B6560]">{session?.user.email}</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E8E2DA]">
            <h3 className="font-medium text-[#1C1C1C] mb-3">Session</h3>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full py-3 rounded-xl border border-[#E8E2DA] text-[#1C1C1C] font-medium hover:bg-[#F3F0EB] transition-colors"
            >
              Sign Out
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#B87A7A]/20">
            <h3 className="font-medium text-[#B87A7A] mb-2">Danger Zone</h3>
            <p className="text-sm text-[#6B6560] mb-3">
              Permanently delete your account and all data. This cannot be undone.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="w-full py-3 rounded-xl bg-[#B87A7A] text-white font-medium hover:bg-[#A86A6A] transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
