import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({ children, className = "", padding = "md" }: CardProps) {
  return (
    <div
      className={`bg-[#FFFFFF] border border-[#E8E2DA] rounded-2xl ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
