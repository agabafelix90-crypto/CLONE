import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  CreditCard, DollarSign, Pill, Stethoscope, FlaskConical, Heart,
  Activity, Package, Users, CalendarCheck, Microscope, Settings,
  Wallet, Brain, Receipt, Bell, MessageSquare, Cake, FileText, Apple,
  Baby, Send, Database, BarChart3, CheckCircle2
} from "lucide-react";
import LowStockAlert from "@/components/pharmacy/LowStockAlert";
import { useSubscription } from "@/hooks/use-subscription";
import SubscriptionPaymentDialog from "@/components/subscription/SubscriptionPaymentDialog";

const departments = [
  { label: "Cashier", icon: DollarSign, color: "bg-clinic-green", path: "/dashboard/cashier" },
  { label: "Billing", icon: CreditCard, color: "bg-clinic-blue", path: "/dashboard/billing" },
  { label: "Dispensary & Shelves", icon: Pill, color: "bg-clinic-orange", path: "/dashboard/pharmacy" },
  { label: "Triage", icon: Activity, color: "bg-primary", path: "/dashboard/triage" },
  { label: "Radiographer", icon: Microscope, color: "bg-clinic-gold", path: "/dashboard/radiology" },
  { label: "Store", icon: Package, color: "bg-clinic-navy", path: "/dashboard/store" },
  { label: "Doctor", icon: Stethoscope, color: "bg-clinic-teal", path: "/dashboard/doctor" },
  { label: "Lab", icon: FlaskConical, color: "bg-clinic-blue", path: "/dashboard/laboratory" },
  { label: "Nurse", icon: Heart, color: "bg-destructive", path: "/dashboard/nurse" },
  { label: "Pt Appointments", icon: CalendarCheck, color: "bg-clinic-green", path: "/dashboard/appointments" },
];

const features = [
  { title: "AI Employee Performance", icon: Brain, module: "Settings" },
  { title: "Automatic Receipts", icon: Receipt, module: "Billing/Cashier" },
  { title: "Debt Reminders", icon: Bell, module: "Communication" },
  { title: "Appointment SMS", icon: MessageSquare, module: "Communication" },
  { title: "Birthday Reminders", icon: Cake, module: "Communication" },
  { title: "AI Report Writing", icon: FileText, module: "Doctor/Radiology" },
  { title: "Food Suggestions", icon: Apple, module: "Doctor/Nurse" },
  { title: "Drug Suggestions", icon: Pill, module: "Pharmacy/Doctor" },
  { title: "Ultrasound Detection", icon: Baby, module: "Radiology" },
  { title: "Bulk Messaging", icon: Send, module: "Communication" },
  { title: "Electronic Health Records", icon: Database, module: "Doctor/Nurse" },
  { title: "District Reports", icon: BarChart3, module: "Statistics" },
];

const formatCountdown = (expiresAt: Date | null) => {
  if (!expiresAt) return "0d 0h 0m 0s";
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

const DashboardHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const clinicName = user?.user_metadata?.clinic_name || "MEDICORE";
  const [currentTime, setCurrentTime] = useState(new Date());
  const [countdown, setCountdown] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const { daysRemaining, subscription, expiresAt } = useSubscription();
  const isTrial = subscription?.plan === "trial";

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setCountdown(formatCountdown(expiresAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return (
    <div className="p-6 space-y-4">
      <LowStockAlert />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">{clinicName}</h1>
          <p className="text-sm text-muted-foreground">{currentTime.toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${isTrial ? "bg-amber-100 text-amber-800" : "bg-primary/10 text-primary"}`}>
            <Wallet className="w-4 h-4" />
            {isTrial ? "Free Trial · " : ""}{countdown || `${daysRemaining}d`}
          </div>
          <button
            onClick={() => setPaymentOpen(true)}
            className="px-4 py-2 rounded-lg gradient-hero text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Make Payment
          </button>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {departments.map((dept, i) => (
          <motion.button
            key={dept.label}
            onClick={() => navigate(dept.path)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -6, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group p-5 rounded-xl glass-elevated shadow-card hover:shadow-elevated hover:border-primary/20 transition-all text-center relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: `radial-gradient(circle at 50% 40%, hsl(var(--primary) / 0.08), transparent 70%)` }}
            />
            <div className={`relative w-12 h-12 rounded-xl ${dept.color} flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:rotate-3`}>
              <dept.icon className="w-6 h-6 text-primary-foreground transition-transform duration-300 group-hover:scale-110" />
            </div>
            <span className="relative text-sm font-medium text-foreground transition-colors duration-200 group-hover:text-primary">{dept.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Features Available Section */}
      <div className="mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20"
        >
          <h2 className="text-lg font-heading font-bold text-foreground mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-clinic-green" />
            System Features Available
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors"
              >
                <div className="flex items-center gap-2 flex-1">
                  <CheckCircle2 className="w-4 h-4 text-clinic-green shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.module}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Settings (admin only)", icon: Settings, path: "/dashboard/settings" },
          { label: "Set Drugs", icon: Pill, path: "/dashboard/set-drugs" },
          { label: "Set Lab Exams", icon: FlaskConical, path: "/dashboard/set-lab-exams" },
          { label: "Disease Statistics", icon: Activity, path: "/dashboard/statistics" },
        ].map(item => (
          <motion.button
            key={item.label}
            onClick={() => item.path && navigate(item.path)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/30 hover:bg-muted hover:border-primary/20 transition-colors text-left group"
          >
            <item.icon className="w-5 h-5 text-primary shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{item.label}</span>
          </motion.button>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-10">
        This system was created by MEDCORE SYSTEMS. For support contact 0752648844
      </p>

      <SubscriptionPaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} />
    </div>
  );
};

export default DashboardHome;
