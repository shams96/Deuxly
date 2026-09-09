"use client";

import { useSession } from "next-auth/react";
import { SessionProvider } from "next-auth/react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import CameraCapture from "@/components/CameraCapture";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

function AppContent() {
  const { data: session } = useSession();

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1C1C1C] leading-[1.1]">
              Capture your progress
            </h1>
            <p className="mt-3 text-base text-[#6B6560]">
              Take a standardized photo to track your skin journey
            </p>
            {!session?.user && (
              <p className="mt-2 text-sm text-[#9C958D]">
                Preview the camera below. Sign up to save your photos and track progress.
              </p>
            )}
          </div>
          <CameraCapture />
          {!session?.user && (
            <div className="mt-8 p-6 rounded-2xl bg-white border border-[#E8E2DA] text-center">
              <h3 className="text-lg font-semibold text-[#1C1C1C] mb-2">
                Ready to track your skin journey?
              </h3>
              <p className="text-sm text-[#6B6560] mb-4">
                Create an account to save photos, view history, and compare progress over time.
              </p>
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <SessionProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <AppContent />
        <Footer />
      </div>
    </SessionProvider>
  );
}
