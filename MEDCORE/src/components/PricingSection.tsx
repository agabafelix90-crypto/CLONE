import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free Trial",
    duration: "3 Days",
    price: "Free",
    description: "Test MediCoreSystem risk-free",
    features: [
      "All 12 core features",
      "Up to 50 patient records",
      "Basic SMS (10 messages/day)",
      "Electronic health records",
      "Email support",
      "Limited reports",
    ],
    highlighted: false,
  },
  {
    name: "Daily Plan",
    duration: "Per Day",
    price: "2,000",
    currency: "UGX",
    description: "Pay-as-you-use flexibility",
    features: [
      "All 12 core features",
      "Up to 500 patient records",
      "SMS messaging (100 messages/day)",
      "Full EHR access",
      "Automated receipts",
      "Disease statistics",
      "Email & phone support",
      "Storage: 10GB",
    ],
    highlighted: false,
  },
  {
    name: "Monthly Plan",
    duration: "Per Month",
    price: "50,000",
    currency: "UGX",
    description: "Save 17% vs daily plan",
    features: [
      "All 12 core features",
      "Up to 500 patient records",
      "SMS messaging (100 messages/day)",
      "Full EHR access",
      "Automated receipts",
      "Disease statistics",
      "Email & phone support",
      "Storage: 10GB",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    name: "Professional",
    duration: "Per Month",
    price: "100,000",
    currency: "UGX",
    description: "For growing clinics",
    features: [
      "All 12 core features",
      "Unlimited patient records",
      "SMS messaging (500 messages/day)",
      "AI-powered reports & suggestions",
      "Bulk messaging campaigns",
      "Advanced analytics & reports",
      "Priority phone & email support",
      "Storage: 100GB",
      "API access",
      "24/7 support",
    ],
    highlighted: false,
  },
  {
    name: "Enterprise",
    duration: "Custom",
    price: "Custom",
    description: "For hospital networks",
    features: [
      "All Professional features",
      "Multi-clinic management",
      "Unlimited SMS messaging",
      "Custom integrations",
      "Dedicated account manager",
      "Training & onboarding",
      "Unlimited storage",
      "Advanced security & compliance",
      "White-label options",
      "SLA guarantee",
    ],
    highlighted: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase bg-primary/10 text-primary mb-4">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
            Choose the perfect plan for your clinic. Start free, upgrade anytime.
          </p>
          <p className="text-xs text-muted-foreground">
            Aligned with Uganda's National ICT Policy 2022 for digital transformation and innovation.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
                plan.highlighted
                  ? "md:scale-105 ring-2 ring-primary shadow-2xl"
                  : "shadow-card hover:shadow-elevated"
              }`}
            >
              {/* Background */}
              <div
                className={`absolute inset-0 ${
                  plan.highlighted
                    ? "bg-gradient-to-br from-primary/10 to-primary/5"
                    : "bg-card"
                }`}
              />

              {/* Popular Badge */}
              {plan.highlighted && (
                <motion.div
                  initial={{ y: -10 }}
                  animate={{ y: 0 }}
                  className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-bold px-4 py-1.5 text-center"
                >
                  MOST POPULAR
                </motion.div>
              )}

              <div className={`relative p-6 ${plan.highlighted ? "pt-12" : ""}`}>
                {/* Plan Name */}
                <h3 className="text-xl font-heading font-bold text-foreground mb-1">
                  {plan.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-6">{plan.description}</p>

                {/* Pricing */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    {plan.currency && (
                      <span className="text-sm text-muted-foreground ml-1">
                        {plan.currency}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{plan.duration}</p>
                </div>

                {/* CTA Button */}
                <Button
                  className={`w-full mb-6 ${
                    plan.highlighted
                      ? "gradient-hero text-primary-foreground hover:opacity-90"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {plan.name === "Free Trial"
                    ? "Start Free Trial"
                    : plan.name === "Enterprise"
                      ? "Contact Sales"
                      : "Get Started"}
                </Button>

                {/* Features List */}
                <div className="space-y-3 border-t border-border/50 pt-6">
                  {plan.features.map((feature, j) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 + j * 0.02 }}
                      className="flex items-start gap-3"
                    >
                      <Check className="w-4 h-4 text-clinic-green shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ or Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 bg-card rounded-xl p-8 border border-border/50 text-center"
        >
          <h3 className="text-xl font-heading font-bold text-foreground mb-4">
            All Plans Include
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              "24/7 System Uptime",
              "Data Backup & Security",
              "Regular Updates",
              "Community Support",
            ].map((item) => (
              <div key={item} className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5 text-clinic-green" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>

          {/* Add-on Services */}
          <div className="border-t border-border/50 pt-6">
            <h4 className="text-lg font-heading font-semibold text-foreground mb-4">
              Optional Add-ons (Extra Revenue Streams)
            </h4>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { name: "Extra SMS Credits", price: "500 UGX per 100 SMS" },
                { name: "API Access", price: "10,000 UGX/month" },
                { name: "Premium Support", price: "15,000 UGX/month" },
                { name: "Custom Training", price: "50,000 UGX one-time" },
                { name: "White-label Branding", price: "100,000 UGX/month" },
                { name: "Advanced Analytics", price: "25,000 UGX/month" },
              ].map((addon) => (
                <div key={addon.name} className="bg-muted/50 rounded-lg p-4">
                  <p className="font-medium text-foreground text-sm">{addon.name}</p>
                  <p className="text-xs text-muted-foreground">{addon.price}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
