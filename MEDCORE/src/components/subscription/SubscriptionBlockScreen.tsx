import { useState } from "react";
import { ShieldX, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import SubscriptionPaymentDialog from "./SubscriptionPaymentDialog";

const SubscriptionBlockScreen = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <ShieldX className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Subscription Expired
        </h1>
        <p className="text-muted-foreground">
          Your system subscription has expired. Please make a payment to continue using MEDICORE.
        </p>
        <Button onClick={() => setOpen(true)} size="lg" className="gap-2">
          <Phone className="w-4 h-4" />
          Make Payment
        </Button>
        <p className="text-xs text-muted-foreground">
          Contact 0752648844 for support
        </p>
      </div>
      <SubscriptionPaymentDialog open={open} onOpenChange={setOpen} />
    </div>
  );
};

export default SubscriptionBlockScreen;
