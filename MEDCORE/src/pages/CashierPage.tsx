import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  DollarSign, CheckCircle, Clock, CreditCard, Search, User, FlaskConical,
  Microscope, Pill, FileText, ChevronDown, ChevronUp, Receipt, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { generatePDF } from "@/lib/pdf-generator";
import { useToast } from "@/hooks/use-toast";

interface BillingItem {
  id: string;
  patient_id: string;
  item_type: string;
  item_name: string;
  amount: number;
  quantity: number;
  total_amount: number;
  status: string;
  reference_id: string | null;
  notes: string | null;
  billed_by: string | null;
  paid_at: string | null;
  created_at: string;
}

const typeIcons: Record<string, any> = {
  lab_test: FlaskConical,
  radiology: Microscope,
  prescription: Pill,
  procedure: FileText,
};

const typeColors: Record<string, string> = {
  lab_test: "bg-blue-100 text-blue-700",
  radiology: "bg-amber-100 text-amber-700",
  prescription: "bg-emerald-100 text-emerald-700",
  procedure: "bg-purple-100 text-purple-700",
};

const CashierPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [receiptItem, setReceiptItem] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  // Fetch pending billing items with patient info
  const { data: pendingItems = [], isLoading } = useQuery({
    queryKey: ["cashier-pending", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("billing_items")
        .select("*")
        .eq("status", "pending")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as BillingItem[];
    },
    refetchInterval: 5000,
  });

  // Fetch patient names
  const patientIds = [...new Set(pendingItems.map(i => i.patient_id))];
  const { data: patients = [] } = useQuery({
    queryKey: ["cashier-patients", patientIds, user?.id],
    enabled: patientIds.length > 0 && !!user,
    queryFn: async () => {
      if (patientIds.length === 0 || !user) return [];
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, phone, age, gender")
        .in("id", patientIds)
        .eq("owner_id", user.id);
      if (error) throw error;
      return data;
    },
  });

  const patientMap = Object.fromEntries(patients.map(p => [p.id, p]));

  // Group by patient
  const grouped = pendingItems.reduce((acc, item) => {
    if (!acc[item.patient_id]) acc[item.patient_id] = [];
    acc[item.patient_id].push(item);
    return acc;
  }, {} as Record<string, BillingItem[]>);

  // Mark as paid
  const payMutation = useMutation({
    mutationFn: async ({ itemIds, patientId }: { itemIds: string[]; patientId: string }) => {
      const { error } = await supabase
        .from("billing_items")
        .update({
          status: "paid",
          billed_by: user?.id,
          paid_at: new Date().toISOString(),
        } as any)
        .in("id", itemIds);
      if (error) throw error;

      // Get patient info for SMS
      const patient = patientMap[patientId];
      const items = pendingItems.filter(i => itemIds.includes(i.id));
      const totalPaid = items.reduce((s, i) => s + i.total_amount, 0);

      // Send payment SMS if patient has phone (exclude OTC pharmacy sales)
      if (patient?.phone) {
        const clinicName = user?.user_metadata?.clinic_name || "MEDICORE";
        const balance = 0; // Could calculate outstanding balance
        const message = `Dear ${patient.name}, ${clinicName} has received your payment of UGX ${totalPaid.toLocaleString()}. Your balance is UGX ${balance.toLocaleString()}. Thank you for trusting us with your health. God bless you.`;
        
        try {
          await supabase.functions.invoke("send-sms", {
            body: {
              messages: [{
                phone: patient.phone,
                text: message,
                recipient_name: patient.name,
                patient_id: patientId,
                message_type: "payment_confirmation",
                category: "billing",
              }],
              sent_by: user?.id,
            },
          });
        } catch (e) {
          console.error("SMS send failed:", e);
        }
      }

      return { patient, totalPaid, items };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cashier-pending"] });
      toast.success(`Payment of UGX ${data.totalPaid.toLocaleString()} recorded for ${data.patient?.name}`);
      setReceiptItem(data);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Mark as credit
  const creditMutation = useMutation({
    mutationFn: async ({ itemIds }: { itemIds: string[] }) => {
      const { error } = await supabase
        .from("billing_items")
        .update({
          status: "credit",
          billed_by: user?.id,
        } as any)
        .in("id", itemIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashier-pending"] });
      toast.info("Items marked as credit. Reflected on Billing page.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filteredPatients = Object.keys(grouped).filter(pid => {
    const patient = patientMap[pid];
    if (!search) return true;
    return patient?.name?.toLowerCase().includes(search.toLowerCase());
  });

  const totalPending = pendingItems.reduce((s, i) => s + i.total_amount, 0);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to access cashier functions.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Cashier</h1>
          <p className="text-sm text-muted-foreground">Process payments for patient services</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-lg bg-amber-100 text-amber-800 text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {pendingItems.length} pending
          </div>
          <div className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            UGX {totalPending.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search patient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No pending payments</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPatients.map(pid => {
            const patient = patientMap[pid];
            const items = grouped[pid];
            const total = items.reduce((s, i) => s + i.total_amount, 0);
            const itemIds = items.map(i => i.id);

            return (
              <PatientBillCard
                key={pid}
                patient={patient}
                items={items}
                total={total}
                onPay={() => payMutation.mutate({ itemIds, patientId: pid })}
                onCredit={() => creditMutation.mutate({ itemIds })}
                paying={payMutation.isPending}
              />
            );
          })}
        </div>
      )}

      {/* Receipt Dialog */}
      <Dialog open={!!receiptItem} onOpenChange={() => setReceiptItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Payment Receipt
            </DialogTitle>
          </DialogHeader>
          {receiptItem && (
            <div id="receipt-content" className="space-y-4 print:text-black">
              <div className="text-center border-b pb-3">
                <p className="font-bold text-lg">MEDICORE</p>
                <p className="text-xs text-muted-foreground">{new Date().toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm"><strong>Patient:</strong> {receiptItem.patient?.name}</p>
                <p className="text-sm"><strong>Phone:</strong> {receiptItem.patient?.phone || "N/A"}</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Item</th>
                    <th className="text-left py-1">Type</th>
                    <th className="text-right py-1">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptItem.items?.map((item: any) => (
                    <tr key={item.id} className="border-b border-border/30">
                      <td className="py-1">{item.item_name}</td>
                      <td className="py-1 capitalize">{item.item_type.replace("_", " ")}</td>
                      <td className="py-1 text-right">UGX {item.total_amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td colSpan={2} className="py-2">Total</td>
                    <td className="py-2 text-right">UGX {receiptItem.totalPaid?.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
              <Button onClick={async () => {
                try {
                  await generatePDF('receipt-content', `receipt-${Date.now()}.pdf`);
                  toast({ title: "PDF Generated", description: "Receipt PDF has been downloaded." });
                } catch (error) {
                  console.error('PDF generation error:', error);
                  toast({ title: "Error", description: "Failed to generate PDF. Please try again.", variant: "destructive" });
                }
              }} variant="outline" className="w-full">
                Download PDF Receipt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const PatientBillCard = ({ patient, items, total, onPay, onCredit, paying }: any) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card shadow-card overflow-hidden"
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{patient?.name || "Unknown"}</p>
            <p className="text-xs text-muted-foreground">
              {patient?.age}y · {patient?.gender || "N/A"} · {items.length} item{items.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-foreground">UGX {total.toLocaleString()}</p>
          <button onClick={() => setExpanded(!expanded)} className="p-1 text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="space-y-2">
            {items.map((item: BillingItem) => {
              const Icon = typeIcons[item.item_type] || FileText;
              const colorClass = typeColors[item.item_type] || "bg-muted text-muted-foreground";
              return (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.item_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.item_type.replace("_", " ")}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold">UGX {item.total_amount.toLocaleString()}</p>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Button onClick={onPay} disabled={paying} className="flex-1 gap-2">
              <CheckCircle className="w-4 h-4" />
              {paying ? "Processing..." : "Paid"}
            </Button>
            <Button onClick={onCredit} variant="outline" className="flex-1 gap-2">
              <CreditCard className="w-4 h-4" />
              Credit
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CashierPage;
