import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import heroImg from "@/assets/hero-dashboard.png";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-primary/10 text-primary mb-6">
            AI-Powered Healthcare Management
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight text-foreground mb-6">
            What is{" "}
            <span className="text-gradient">MediCoreSystem</span>?
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
            A modern, AI-powered healthcare management platform designed to revolutionize how clinics and medical facilities operate. Optimize patient management, drug inventory, lab processing, and more.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/register")}
              className="px-7 py-3 rounded-lg font-semibold gradient-hero text-primary-foreground shadow-elevated hover:opacity-90 transition-all"
            >
              Register Now
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-7 py-3 rounded-lg font-semibold border border-border text-foreground hover:bg-muted transition-all"
            >
              Book a Demo
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative"
        >
          <div className="animate-float">
            <img
              src={heroImg}
              alt="MediCore Dashboard"
              className="w-full max-w-lg mx-auto drop-shadow-2xl"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
