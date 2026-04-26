import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

export default function AchievementUnlockNotification({ badge, onClose }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Auto close after 5 seconds
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const colorClasses = {
    gold: "from-yellow-400 to-amber-500",
    silver: "from-gray-300 to-gray-400",
    bronze: "from-orange-400 to-orange-500",
    purple: "from-purple-400 to-purple-500",
    green: "from-green-400 to-green-500",
    blue: "from-blue-400 to-blue-500",
    red: "from-red-400 to-red-500"
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          className="fixed bottom-24 lg:bottom-8 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]"
        >
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-violet-500/50 rounded-2xl p-6 shadow-2xl shadow-violet-500/20">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShow(false);
                setTimeout(onClose, 300);
              }}
              className="absolute top-2 right-2 h-8 w-8 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="flex items-start gap-4">
              <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${colorClasses[badge.color]} flex items-center justify-center shadow-lg flex-shrink-0`}>
                <Trophy className="h-8 w-8 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  <span className="text-violet-400 text-xs font-semibold uppercase">Nova Conquista!</span>
                </div>
                <h4 className="text-white font-bold text-lg mb-1">{badge.name}</h4>
                <p className="text-gray-400 text-sm">{badge.description}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}