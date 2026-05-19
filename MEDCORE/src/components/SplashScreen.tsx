import { motion } from "framer-motion";
import logo from "@/assets/medicore-logo.png";

const SplashScreen = () => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center gap-6"
    >
      <div className="h-20 w-20 rounded-2xl bg-primary/10 border border-primary/20 p-3 flex items-center justify-center shadow-elevated">
        <img src={logo} alt="MediCore" className="h-full w-full object-contain" />
      </div>
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="text-2xl font-heading font-bold text-foreground"
      >
        MediCore
      </motion.h1>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col items-center gap-3"
      >
        <div className="h-1 w-48 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full gradient-hero"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }}
          />
        </div>
        <p className="text-sm text-muted-foreground">Loading your workspace…</p>
      </motion.div>
    </motion.div>
  </div>
);

export default SplashScreen;
