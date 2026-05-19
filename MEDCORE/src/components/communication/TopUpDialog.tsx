import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Phone, CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";

const PRESET_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

const TopUpDialog = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const requestPayment = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("momo-topup", {
        body: {
          action: "request_payment",
          user_id: user?.id,
          amount: Number(amount),
          phone: phone,
        },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setReferenceId(data.reference_id);
      setPaymentStatus("PENDING");
      setPolling(true);
      toast.info("Payment request sent! Please check your phone to approve.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to initiate payment");
    },
  });

  const checkStatus = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("momo-topup", {
        body: {
          action: "check_status",
          user_id: user?.id,
          reference_id: referenceId,
        },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setPaymentStatus(data.status);
      if (data.status === "SUCCESSFUL") {
        setPolling(false);
        queryClient.invalidateQueries({ queryKey: ["sms-credits"] });
        queryClient.invalidateQueries({ queryKey: ["sms-credit-transactions"] });
        toast.success(`Top-up successful! UGX ${Number(amount).toLocaleString()} added.`);
      } else if (data.status === "FAILED") {
        setPolling(false);
        toast.error("Payment failed: " + (data.reason || "User rejected or timed out"));
      }
    },
  });

  // Poll for payment status
  useEffect(() => {
    if (!polling || !referenceId) return;
    const interval = setInterval(() => {
      checkStatus.mutate();
    }, 5000);
    // Stop after 2 minutes
    const timeout = setTimeout(() => {
      setPolling(false);
      if (paymentStatus === "PENDING") {
        setPaymentStatus("TIMEOUT");
        toast.error("Payment request timed out. Please try again.");
      }
    }, 120000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [polling, referenceId]);

  const reset = () => {
    setAmount("");
    setPhone("");
    setReferenceId(null);
    setPaymentStatus(null);
    setPolling(false);
  };

  const handleSubmit = () => {
    if (!amount || Number(amount) < 500) {
      toast.error("Minimum top-up is UGX 500");
      return;
    }
    if (!phone || phone.length < 10) {
      toast.error("Enter a valid phone number (e.g. 256782000000)");
      return;
    }
    requestPayment.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CreditCard className="w-4 h-4" /> Top Up Credits
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" /> MTN MoMo Top-Up
          </DialogTitle>
        </DialogHeader>

        {!referenceId ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (UGX) *</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((a) => (
                  <Button
                    key={a}
                    size="sm"
                    variant={amount === String(a) ? "default" : "outline"}
                    onClick={() => setAmount(String(a))}
                    className="text-xs"
                  >
                    {a.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">MTN Phone Number *</label>
              <Input
                placeholder="256782000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Format: 256XXXXXXXXX</p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={requestPayment.isPending}
              className="w-full gap-2"
            >
              {requestPayment.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Phone className="w-4 h-4" />
              )}
              Request Payment
            </Button>
          </div>
        ) : (
          <div className="space-y-4 text-center py-4">
            {paymentStatus === "PENDING" && (
              <>
                <Clock className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
                <p className="text-lg font-semibold">Waiting for approval...</p>
                <p className="text-sm text-muted-foreground">
                  Please check your phone and approve the payment of UGX {Number(amount).toLocaleString()}
                </p>
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
              </>
            )}
            {paymentStatus === "SUCCESSFUL" && (
              <>
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="text-lg font-semibold text-emerald-600">Payment Successful!</p>
                <p className="text-sm text-muted-foreground">
                  UGX {Number(amount).toLocaleString()} has been added to your SMS credits.
                </p>
                <Button onClick={() => { setOpen(false); reset(); }}>Done</Button>
              </>
            )}
            {(paymentStatus === "FAILED" || paymentStatus === "TIMEOUT") && (
              <>
                <XCircle className="w-12 h-12 text-destructive mx-auto" />
                <p className="text-lg font-semibold text-destructive">
                  {paymentStatus === "TIMEOUT" ? "Request Timed Out" : "Payment Failed"}
                </p>
                <p className="text-sm text-muted-foreground">Please try again.</p>
                <Button onClick={reset} variant="outline">Try Again</Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TopUpDialog;
