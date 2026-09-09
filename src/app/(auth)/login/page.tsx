"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F7F4] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#1C1C1C] mb-2">
            Welcome to Deuxly
          </h1>
          <p className="text-sm text-[#6B6560]">
            Your luxury skincare companion
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E2DA]">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#B87A7A]/10 text-[#B87A7A] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#1C1C1C] mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#E8E2DA] bg-white text-[#1C1C1C] placeholder-[#9C958D] focus:outline-none focus:ring-2 focus:ring-[#C6B8A4] focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#1C1C1C] mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#E8E2DA] bg-white text-[#1C1C1C] placeholder-[#9C958D] focus:outline-none focus:ring-2 focus:ring-[#C6B8A4] focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#C6B8A4] text-white font-medium hover:bg-[#B8A892] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E8E2DA]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-[#9C958D]">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#E8E2DA] bg-white text-[#1C1C1C] font-medium hover:bg-[#F3F0EB] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.03 2.53-2.16 3.31v2.77h3.49c2.04-1.88 3.22-4.64 3.22-7.89z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.49-2.77c-.98.66-2.23 1.06-3.79 1.06-2.92 0-5.39-1.97-6.27-4.63H2.18v2.84C3.99 20.53 7.73 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.73 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.7-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.65 0 3.12.56 4.28 1.67l3.21-3.21C17.46 2.09 14.97 1 12 1 7.73 1 3.99 3.47 2.18 7.07l2.85 2.84c.88-2.66 3.35-4.53 6.27-4.53z"
                  />
                </svg>
                Google
              </button>

              <button
                onClick={() => signIn("apple", { callbackUrl: "/" })}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#E8E2DA] bg-white text-[#1C1C1C] font-medium hover:bg-[#F3F0EB] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Apple
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-[#6B6560]">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-[#C6B8A4] hover:text-[#B8A892] transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
