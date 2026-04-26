import { useState, useEffect } from "react";
import { X, Bell, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Banner for displaying important system-wide notifications
 * Shows at the top of the app for critical announcements
 */
export default function NotificationBanner({ notification, onDismiss }) {
  const [visible, setVisible] = useState(true);

  if (!notification || !visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss(notification.id);
  };

  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertTriangle,
    info: Info
  };

  const Icon = icons[notification.severity] || Bell;

  const colors = {
    success: "bg-emerald-900/50 border-emerald-500/50 text-emerald-100",
    warning: "bg-amber-900/50 border-amber-500/50 text-amber-100",
    error: "bg-red-900/50 border-red-500/50 text-red-100",
    info: "bg-blue-900/50 border-blue-500/50 text-blue-100"
  };

  return (
    <div className={cn(
      "border-b px-4 py-3",
      colors[notification.severity] || colors.info
    )}>
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{notification.title}</p>
          <p className="text-sm opacity-90">{notification.message}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="flex-shrink-0 hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}