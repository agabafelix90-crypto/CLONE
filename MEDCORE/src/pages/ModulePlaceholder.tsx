import { motion } from "framer-motion";
import { Construction } from "lucide-react";
import { useLocation } from "react-router-dom";

const ModulePlaceholder = () => {
  const location = useLocation();
  const name = location.pathname.split("/").pop() || "Module";
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <div className="p-6 flex items-center justify-center min-h-[80vh]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-4">
          <Construction className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-heading font-bold text-foreground mb-2">{displayName}</h2>
        <p className="text-muted-foreground text-sm">This module is under development.</p>
      </motion.div>
    </div>
  );
};

export default ModulePlaceholder;
