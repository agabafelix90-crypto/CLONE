import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Building2, MapPin, Globe, Home, Calendar, Users, User, Phone, Lock, Eye, EyeOff, Mail, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/medicore-logo.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [formData, setFormData] = useState({
    email: "", clinicName: "", district: "", country: "", town: "", yearOpening: "",
    numEmployees: "", ownersNames: "", ownersAddress: "", contactNumber: "",
    whatsappNumber: "", password: "", confirmPassword: "",
  });

  const update = (key: string, val: string) => setFormData(prev => ({ ...prev, [key]: val }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (formData.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setShowTermsDialog(true);
  };

  const confirmRegistration = async () => {
    if (!acceptTerms || !acceptPrivacy) {
      toast({ title: "Please accept both terms and privacy policy", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: formData.ownersNames,
          clinic_name: formData.clinicName,
          district: formData.district,
          country: formData.country,
          town: formData.town,
          contact_number: formData.contactNumber,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } else {
      setRegistered(true);
      setShowTermsDialog(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center">
          <div className="bg-card rounded-2xl shadow-elevated p-10 border border-border/50 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Check Your Email!</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We've sent a verification link to <strong className="text-foreground">{formData.email}</strong>.
              Please check your inbox (and spam folder) and click the link to verify your account.
            </p>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground">
                🎉 You'll get a <strong>14-day free trial</strong> to explore all features once verified!
              </p>
            </div>
            <Link
              to="/login"
              className="inline-block w-full py-2.5 rounded-lg font-semibold gradient-hero text-primary-foreground hover:opacity-90 transition-opacity text-center"
            >
              Go to Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const fields = [
    { key: "email", label: "Email", icon: Mail, placeholder: "you@clinic.com", type: "email" },
    { key: "clinicName", label: "Clinic Name", icon: Building2, placeholder: "Enter facility/clinic/medical centre/hospital name" },
    { key: "district", label: "District", icon: MapPin, placeholder: "Enter district" },
    { key: "country", label: "Country", icon: Globe, placeholder: "Enter country" },
    { key: "town", label: "Town", icon: Home, placeholder: "Enter town" },
    { key: "yearOpening", label: "Year of Opening", icon: Calendar, placeholder: "e.g., 2020" },
    { key: "numEmployees", label: "Number of Employees", icon: Users, placeholder: "e.g., 10" },
    { key: "ownersNames", label: "Owners' Names", icon: User, placeholder: "Enter owners' names" },
    { key: "ownersAddress", label: "Owners' Address", icon: MapPin, placeholder: "Enter owners' address" },
    { key: "contactNumber", label: "Contact Number", icon: Phone, placeholder: "e.g., 0777123456" },
    { key: "whatsappNumber", label: "WhatsApp Number", icon: Phone, placeholder: "Enter WhatsApp number" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <img src={logo} alt="MediCore" className="h-10 w-10" />
          </Link>
          <h1 className="text-2xl font-heading font-bold text-foreground">Create Clinic Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Register your clinic · 14-day free trial included!</p>
        </div>

        <form onSubmit={handleRegister} className="bg-card rounded-2xl shadow-elevated p-8 space-y-4 border border-border/50">
          <div className="grid sm:grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.key} className={f.key === "email" ? "sm:col-span-2" : ""}>
                <label className="text-xs font-medium text-foreground mb-1 block">{f.label}</label>
                <div className="relative">
                  <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type={f.type || "text"}
                    placeholder={f.placeholder}
                    value={formData[f.key as keyof typeof formData]}
                    onChange={(e) => update(f.key, e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={(e) => update("password", e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-9 pr-9 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg font-semibold gradient-hero text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? "Creating account..." : "Register Clinic"}
          </button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div>
          </div>

          <button
            type="button"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
              if (error) toast({ title: "Google sign-in failed", description: String(error), variant: "destructive" });
            }}
            className="w-full py-2.5 rounded-lg font-medium border border-input bg-background text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Back to Login</Link>
          </p>
        </form>

        <div className="flex items-center justify-center gap-2 mt-5 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5" /> Secure & Encrypted Registration · Your data is protected
        </div>
      </motion.div>

      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Terms & Privacy Policy</DialogTitle>
            <DialogDescription>
              Before creating your account, please review and accept our terms of service and privacy policy.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the{" "}
                <Link to="/terms-of-service" target="_blank" className="text-primary hover:underline">
                  Terms of Service
                </Link>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="privacy"
                checked={acceptPrivacy}
                onCheckedChange={(checked) => setAcceptPrivacy(checked as boolean)}
              />
              <label
                htmlFor="privacy"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the{" "}
                <Link to="/privacy-policy" target="_blank" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTermsDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRegistration}
              disabled={!acceptTerms || !acceptPrivacy || loading}
            >
              {loading ? "Creating account..." : "Accept & Register"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegisterPage;
