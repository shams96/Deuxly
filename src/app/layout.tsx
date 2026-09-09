import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Deuxly",
  description: "The second look at your skin — properly framed.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Deuxly",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "mobile-web-app-capable": "yes",
    "apple-touch-icon": "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#C6B8A4",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F9F7F4] text-[#1C1C1C]">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
