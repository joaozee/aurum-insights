import { Crown } from "lucide-react";
import { cn } from "@/components/lib/utils";

export default function PremiumBadge({ className, size = "sm" }) {
  const sizes = {
    xs: "px-1.5 py-0.5 text-[10px]",
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm"
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold shadow-lg shadow-violet-500/30",
      sizes[size],
      className
    )}>
      <Crown className={size === "xs" ? "h-2.5 w-2.5" : size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      <span>Premium</span>
    </div>
  );
}