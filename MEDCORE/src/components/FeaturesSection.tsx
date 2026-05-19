import { motion } from "framer-motion";
import {
  Brain, Receipt, Bell, MessageSquare, Cake, FileText, Apple, Pill,
  Baby, Send, Database, BarChart3
} from "lucide-react";

const features = [
  { icon: Brain, title: "AI Employee Performance", desc: "AI assesses employee performance and provides insights." },
  { icon: Receipt, title: "Automatic Receipts", desc: "Receipts sent to patients automatically after payments." },
  { icon: Bell, title: "Debt Reminders", desc: "Automatic reminders for patients with outstanding balances." },
  { icon: MessageSquare, title: "Appointment SMS", desc: "SMS notifications for appointments, radiology & family planning." },
  { icon: Cake, title: "Birthday Reminders", desc: "AI detects birthdays and sends greetings via SMS." },
  { icon: FileText, title: "AI Report Writing", desc: "AI assists in obstetric ultrasound reports & prescriptions." },
  { icon: Apple, title: "Food Suggestions", desc: "Suggests foods for better healing and drug absorption." },
  { icon: Pill, title: "Drug Suggestions", desc: "Suggests additional drugs based on patient diagnosis." },
  { icon: Baby, title: "Ultrasound Detection", desc: "Auto-detects patients due for ultrasound & antenatal visits." },
  { icon: Send, title: "Bulk Messaging", desc: "One-click messages to all or targeted patient groups." },
  { icon: Database, title: "Electronic Health Records", desc: "Digital patient health records, easily accessible." },
  { icon: BarChart3, title: "District Reports", desc: "AI helps generate detailed district reports." },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-primary/10 text-primary mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Everything Your Clinic Needs, Digitalized
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From AI-powered assessments to automated communications, MediCoreSystem covers every aspect of clinic management.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group p-5 rounded-xl bg-card shadow-card hover:shadow-elevated transition-all duration-300 border border-border/50 hover:border-primary/20"
            >
              <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
