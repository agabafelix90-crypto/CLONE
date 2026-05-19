import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Mukasa Brian",
    role: "Medical Director, Kampala Medical Centre",
    text: "MediCoreSystem has completely transformed how we manage patient records. Everything is digital, fast, and reliable. Our efficiency improved by 60%! 🏥📊",
  },
  {
    name: "Nakato Florence",
    role: "Clinic Owner, Grace Health Clinic, Jinja",
    text: "I used to struggle with tracking drug inventory and patient debts. MediCore handles it all automatically — even sends SMS reminders to patients! 💊📱",
  },
  {
    name: "Ssempijja Ronald",
    role: "Lab Technician, Mbarara Regional Hospital",
    text: "The lab module is a game changer. Results are recorded and shared instantly. No more lost paperwork or delays. Highly recommend it! 🔬⚡",
  },
  {
    name: "Auma Patricia",
    role: "Head Nurse, Lira Community Health Centre",
    text: "Managing maternity records and antenatal visits is now so easy. MediCore even reminds mothers of their next appointment via SMS! 🤰✨",
  },
  {
    name: "Opio Samuel",
    role: "Administrator, Gulu Family Clinic",
    text: "We went from paper files to a fully digital system in one week. The AI report writing feature alone saves us hours every day! 🚀🖥️",
  },
  {
    name: "Nambi Harriet",
    role: "Cashier, Entebbe Wellness Centre",
    text: "Billing and receipts are now automatic. Patients get their receipts instantly and I can track every shilling. MediCore is a lifesaver! 💰🧾",
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-primary/10 text-primary mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Hear What Our Clients Say
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-xl bg-card shadow-card border border-border/50 hover:shadow-elevated transition-shadow"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-clinic-gold text-clinic-gold" />
                ))}
              </div>
              <p className="text-foreground mb-4 leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
