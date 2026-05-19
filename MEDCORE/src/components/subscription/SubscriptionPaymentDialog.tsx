import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SUBSCRIPTION_PLANS } from "@/hooks/use-subscription";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Loader2, Phone, CheckCircle, XCircle, Clock, Shield, Sparkles,
  CreditCard, FileText,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SubscriptionPaymentDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string>("monthly");
  const [phone, setPhone] = useState("");
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [manualTransactionId, setManualTransactionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"momo" | "manual">("momo");

  const plan = SUBSCRIPTION_PLANS.find((p) => p.key === selectedPlan)!;

  const requestPayment = useMutation({
    mutationFn: async () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.days);

      const { data, error } = await supabase.functions.invoke("momo-topup", {
        body: {
          action: "request_payment",
          user_id: user?.id,
          amount: plan.price,
          phone,
        },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Create pending subscription record
      const { error: subError } = await supabase.from("subscriptions").insert({
        user_id: user!.id,
        plan: plan.key,
        amount: plan.price,
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        payment_status: "pending",
        momo_reference: data.reference_id,
        phone_number: phone,
      } as any);
      if (subError) throw subError;

      return data;
    },
    onSuccess: (data) => {
      setReferenceId(data.reference_id);
      setPaymentStatus("PENDING");
      setPolling(true);
      toast.info("Payment request sent! Check your phone to approve.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to initiate payment");
    },
  });

  const submitManualPayment = useMutation({
    mutationFn: async () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.days);

      // Create pending subscription record for manual payment
      const { data, error } = await supabase.from("subscriptions").insert({
        user_id: user!.id,
        plan: plan.key,
        amount: plan.price,
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        payment_status: "pending_manual",
        payment_method: "manual",
        manual_transaction_id: manualTransactionId,
        phone_number: phone,
      } as any);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Manual payment request submitted! Admin will verify and activate your subscription.");
      onOpenChange(false);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit manual payment request");
    },
  });

  const checkStatus = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("momo-topup", {
        body: {
          action: "check_status",
          reference_id: referenceId,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.status === "SUCCESSFUL") {
        setPaymentStatus("SUCCESSFUL");
        setPolling(false);
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
        toast.success("Subscription activated successfully!");
      } else if (data.status === "FAILED") {
        setPaymentStatus("FAILED");
        setPolling(false);
        toast.error("Payment failed. Please try again.");
      }
    },
    onError: () => {
      // Continue polling on error
    },
  });

  useEffect(() => {
    if (!polling || !referenceId) return;
    const interval = setInterval(() => checkStatus.mutate(), 3000); // Check every 3 seconds instead of 5
    const timeout = setTimeout(() => {
      setPolling(false);
      if (paymentStatus === "PENDING") {
        setPaymentStatus("TIMEOUT");
        toast.error("Payment request timed out. Please try again.");
      }
    }, 60000); // Reduced timeout to 1 minute instead of 2
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [polling, referenceId]);

  const reset = () => {
    setSelectedPlan("monthly");
    setPhone("");
    setReferenceId(null);
    setPaymentStatus(null);
    setPolling(false);
    setManualTransactionId("");
    setPaymentMethod("momo");
  };

  const handleSubmit = () => {
    // SECURITY: Amount validation
    if (plan.price < 1000 || plan.price > 1000000) {
      toast.error("Invalid subscription amount.");
      return;
    }

    if (paymentMethod === "momo") {
      if (!phone || phone.length < 10) {
        toast.error("Enter a valid phone number (e.g. 256782000000)");
        return;
      }
      requestPayment.mutate();
    } else {
      if (!phone || phone.length < 10) {
        toast.error("Enter your phone number");
        return;
      }
      if (!manualTransactionId.trim()) {
        toast.error("Enter the transaction ID from your payment");
        return;
      }
      submitManualPayment.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            System Subscription
          </DialogTitle>
        </DialogHeader>

        {!referenceId ? (
          <div className="space-y-5">
            {/* Plan selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Plan</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUBSCRIPTION_PLANS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setSelectedPlan(p.key)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      selectedPlan === p.key
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <p className="text-sm font-semibold text-foreground">{p.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      UGX {p.price.toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-1">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">{plan.label} Plan</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                UGX {plan.price.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                Covers system access, SMS sending, cloud hosting & support for {plan.days} day{plan.days > 1 ? "s" : ""}
              </p>
            </div>

            {/* Payment Method Tabs */}
            <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "momo" | "manual")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="momo" className="gap-2">
                  <Phone className="w-4 h-4" />
                  MoMo Payment
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2">
                  <CreditCard className="w-4 h-4" />
                  Manual Payment
                </TabsTrigger>
              </TabsList>

              <TabsContent value="momo" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">MTN Phone Number *</Label>
                  <Input
                    placeholder="256782000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Format: 256XXXXXXXXX</p>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="space-y-4 mt-4">
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Manual Payment Instructions
                      </p>
                      <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                        <p>1. Pay UGX {plan.price.toLocaleString()} to: <strong>256752648844</strong></p>
                        <p>2. Note the Transaction ID from your payment confirmation</p>
                        <p>3. Enter the Transaction ID below</p>
                        <p>4. Submit - Admin will verify and activate your subscription</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Your Phone Number *</Label>
                  <Input
                    placeholder="256XXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Transaction ID *</Label>
                  <Input
                    placeholder="Enter transaction ID from payment"
                    value={manualTransactionId}
                    onChange={(e) => setManualTransactionId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This should match the ID shown in your payment confirmation
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <Button
              onClick={handleSubmit}
              disabled={requestPayment.isPending || submitManualPayment.isPending}
              className="w-full gap-2"
            >
              {(requestPayment.isPending || submitManualPayment.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : paymentMethod === "momo" ? (
                <Phone className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {paymentMethod === "momo"
                ? `Pay UGX ${plan.price.toLocaleString()} via MoMo`
                : "Submit Manual Payment Request"
              }
            </Button>
          </div>
        ) : (
          <div className="space-y-4 text-center py-4">
            {paymentStatus === "PENDING" && (
              <>
                <Clock className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
                <p className="text-lg font-semibold">Waiting for approval...</p>
                <p className="text-sm text-muted-foreground">
                  Approve UGX {plan.price.toLocaleString()} on your phone
                </p>
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
              </>
            )}
            {paymentStatus === "SUCCESSFUL" && (
              <>
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="text-lg font-semibold text-emerald-600">Subscription Activated!</p>
                <p className="text-sm text-muted-foreground">
                  Your {plan.label} plan is now active.
                </p>
                <Button onClick={() => { onOpenChange(false); reset(); }}>Continue</Button>
              </>
            )}
            {(paymentStatus === "FAILED" || paymentStatus === "TIMEOUT") && (
              <>
                <XCircle className="w-12 h-12 text-destructive mx-auto" />
                <p className="text-lg font-semibold text-destructive">
                  {paymentStatus === "TIMEOUT" ? "Request Timed Out" : "Payment Failed"}
                </p>
                <Button onClick={reset} variant="outline">Try Again</Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPaymentDialog;
