import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ContextualTooltip({ id, title, description, position = "bottom", onDismiss }) {
  const [visible, setVisible] = useState(true);

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) {
      onDismiss(id);
    }
  };

  const positionClasses = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
    left: "right-full mr-2",
    right: "left-full ml-2"
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: position === "bottom" ? -10 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === "bottom" ? -10 : 10 }}
          className={`absolute ${positionClasses[position]} z-50 w-72`}
        >
          <div className="bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg shadow-2xl border border-violet-400/50 p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <HelpCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1">{title}</h4>
                <p className="text-violet-100 text-sm">{description}</p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}