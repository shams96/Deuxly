"use client";

import Link from "next/link";
import { Card } from "./Card";
import { Button } from "./Button";

interface PaywallProps {
  featureName: string;
  children: React.ReactNode;
}

export function Paywall({ featureName, children }: PaywallProps) {
  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none">{children}</div>
      <Card className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 bg-[#FFFFFF]/90 backdrop-blur-sm">
        <p className="text-sm font-medium text-[#6B6560] mb-2">Premium Feature</p>
        <h3 className="text-xl font-semibold text-[#1C1C1C] mb-2">{featureName}</h3>
        <p className="text-sm text-[#6B6560] max-w-xs mb-6">
          Unlock this feature and more with Deuxly Premium. Track, compare, and perfect your skin journey.
        </p>
        <ul className="text-left text-sm text-[#6B6560] space-y-2 mb-6">
          <li className="flex items-center gap-2">
            <span className="text-[#C6B8A4]">✦</span>
            Unlimited photo history
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[#C6B8A4]">✦</span>
            Advanced progress analytics
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[#C6B8A4]">✦</span>
            Personalized insights
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[#C6B8A4]">✦</span>
            Priority support
          </li>
        </ul>
        <Link href="/signup">
          <Button size="lg">Upgrade to Premium</Button>
        </Link>
      </Card>
    </div>
  );
}
