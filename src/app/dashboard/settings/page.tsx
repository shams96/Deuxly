"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "@/lib/signOut";

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
    const currentEmail = session?.user?.email ?? "";
    const typed = window.prompt(
      `This permanently deletes your account, photos and analyses.\n\nType your email (${currentEmail}) to confirm:`,
    );
    if (!typed) return;

    setLoading(true);
    try {
      const start = await fetch("/api/auth/delete-account", { method: "POST" });
      if (!start.ok) {
        alert("Could not start account deletion. Please try again.");
        return;
      }
      const { token } = await start.json();
      const res = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, confirmEmail: typed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Account deletion failed.");
        return;
      }
      signOut({ callbackUrl: "/" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink mb-1">Settings</h1>
        <p className="text-sm text-ink-2">Manage your account and subscription</p>
      </div>

      <div className="flex gap-2 border-b border-line">
        <button
          onClick={() => setTab("subscription")}
          className={`pb-3 px-4 text-sm font-medium transition-colors ${
            tab === "subscription"
              ? "text-accent-ink border-b-2 border-accent"
              : "text-ink-2 hover:text-ink"
          }`}
        >
          Subscription
        </button>
        <button
          onClick={() => setTab("account")}
          className={`pb-3 px-4 text-sm font-medium transition-colors ${
            tab === "account"
              ? "text-accent-ink border-b-2 border-accent"
              : "text-ink-2 hover:text-ink"
          }`}
        >
          Account
        </button>
      </div>

      {tab === "subscription" && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-surface border border-line">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-ink">Current Plan</h3>
                <p className="text-sm text-ink-2">{isPremium ? "Premium" : "Free"}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isPremium ? "bg-success/10 text-success-ink" : "bg-warning/10 text-warning"
                }`}
              >
                {isPremium ? "Active" : "Limited"}
              </span>
            </div>

            {isPremium ? (
              <button
                onClick={handleManage}
                disabled={loading}
                className="w-full py-3 rounded-xl border border-line text-ink font-medium hover:bg-surface-2 transition-colors disabled:opacity-50"
              >
                Manage Subscription
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-accent text-on-fill font-medium hover:bg-accent-strong transition-colors disabled:opacity-50"
              >
                Upgrade to Premium
              </button>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-line">
            <h4 className="font-medium text-ink mb-3">Plan Comparison</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-2">Photo captures/month</span>
                <span className="text-ink">{isPremium ? "Unlimited" : "4"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-2">History retention</span>
                <span className="text-ink">{isPremium ? "Forever" : "30 days"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-2">Visual overlays</span>
                <span className="text-ink">{isPremium ? "Full" : "Limited"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-2">High-res export</span>
                <span className="text-ink">{isPremium ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "account" && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-surface border border-line">
            <h3 className="font-medium text-ink mb-2">Email</h3>
            <p className="text-sm text-ink-2">{session?.user.email}</p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-line">
            <h3 className="font-medium text-ink mb-3">Session</h3>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full py-3 rounded-xl border border-line text-ink font-medium hover:bg-surface-2 transition-colors"
            >
              Sign Out
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-danger/20">
            <h3 className="font-medium text-danger-ink mb-2">Danger Zone</h3>
            <p className="text-sm text-ink-2 mb-3">
              Permanently delete your account and all data. This cannot be undone.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="w-full py-3 rounded-xl bg-danger text-on-fill font-medium hover:bg-danger-strong transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
