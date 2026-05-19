import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PartyPopper, Settings, Users, Pill, FlaskConical, Layers, Stethoscope, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const WelcomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const clinicName = user?.user_metadata?.clinic_name || "Your Clinic";

  const steps = [
    { icon: Settings, title: "Add Employees", desc: "Click on Settings to add authenticated staff accounts with secure passwords. Do not use weak defaults like 12345." },
    { icon: Users, title: "Employee Settings", desc: "Use the employee screen to assign roles and permissions. Require strong alphanumeric passwords and periodically rotate credentials." },
    { icon: Pill, title: "Set Drugs", desc: "Add your pharmacy inventory and prices." },
    { icon: FlaskConical, title: "Set Lab/Radiology Exams", desc: "Configure available tests and pricing." },
    { icon: Layers, title: "Set Categories & Procedures", desc: "Organize your services and define medical procedures and costs." },
    { icon: Stethoscope, title: "Start Managing", desc: "Select your name and go to any department to start managing your clinic!" },
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <div className="bg-card rounded-2xl shadow-elevated p-8 border border-border/50">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full gradient-hero flex items-center justify-center mx-auto mb-4">
              <PartyPopper className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Welcome to {clinicName}!</h1>
            <p className="text-muted-foreground mt-2">🎉 Let's get your clinic set up and running.</p>
          </div>

          <div className="space-y-4 mb-8">
            <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">🚀 Setup Guide</h2>
            {steps.map((s, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl bg-muted/50 border border-border/30">
                <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center shrink-0 mt-0.5">
                  <s.icon className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{s.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-clinic-teal-light border border-primary/20 mb-6">
            <h3 className="font-semibold text-sm text-foreground mb-2">📝 Important Notes</h3>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
              <li>Charges are based on active usage — no usage, no charges</li>
              <li>Multiple users: UGX 500 per active user per 24 hours</li>
              <li>Single user clinics: minimum UGX 700 daily rate</li>
              <li>Keep your account active to avoid deletion after 30 days of inactivity</li>
            </ul>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-3 rounded-lg font-semibold gradient-hero text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Get Started
          </button>

          <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
            <Phone className="w-3 h-3" /> For support: 0752648844 | MEDCORE SYSTEMS
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomePage;
