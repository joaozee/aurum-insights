import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export default function QuickAccessCard({ icon: Icon, title, description, page, gradient }) {
  return (
    <Link to={createPageUrl(page)}>
      <div className={cn(
        "group relative overflow-hidden rounded-2xl p-5 transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/10 cursor-pointer",
        gradient
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
        <div className="relative z-10">
          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-base font-semibold text-white mb-0.5">{title}</h3>
          <p className="text-xs text-white/70">{description}</p>
        </div>
        <ArrowRight className="absolute top-4 right-4 h-4 w-4 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );
}