import { Phone, Mail } from "lucide-react";
import logo from "@/assets/medicore-logo.png";

const FooterSection = () => {
  return (
    <footer id="contact" className="bg-sidebar py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="MediCore" className="h-8 w-8" />
              <span className="font-heading text-lg font-bold text-sidebar-foreground">MediCoreSystem</span>
            </div>
            <p className="text-sm text-sidebar-foreground/60 leading-relaxed">
              AI-powered healthcare management platform. Revolutionize how your clinic operates.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-sidebar-foreground mb-4">Contact Us</h4>
            <div className="flex flex-col gap-3">
              <a href="tel:+256752648844" className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">
                <Phone className="w-4 h-4" /> +256752648844
              </a>
              <a href="tel:+256782547057" className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">
                <Phone className="w-4 h-4" /> +256782547057
              </a>
              <a href="mailto:info@medicoresystem.com" className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">
                <Mail className="w-4 h-4" /> info@medicoresystem.com
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-sidebar-foreground mb-4">Legal</h4>
            <div className="flex flex-col gap-3">
              <a href="/privacy-policy" className="text-sm text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">
                Privacy Policy
              </a>
              <a href="/terms-of-service" className="text-sm text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">
                Terms of Service
              </a>
              <a href="/compliance" className="text-sm text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors">
                MoH Compliance
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-sidebar-border pt-6 text-center">
          <p className="text-xs text-sidebar-foreground/50">© 2026 MediCoreSystem. All Rights Reserved. Created by MEDCORE SYSTEMS.</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
