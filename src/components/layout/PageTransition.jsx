import { motion } from "framer-motion";

export default function PageTransition({ children }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  return (
    <motion.div
      initial={{ opacity: 0, x: isMobile ? 24 : 0 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isMobile ? -24 : 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
}