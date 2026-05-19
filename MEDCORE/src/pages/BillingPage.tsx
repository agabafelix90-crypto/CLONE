import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  CreditCard, DollarSign, Search, User, ChevronDown, ChevronUp,
  FileText, Receipt, AlertTriangle, CheckCircle, Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generatePDF } from "@/lib/pdf-generator";
import { useToast } from "@/hooks/use-toast";

const BillingPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  const { data: billingItems = [], isLoading } = useQuery({
    queryKey: ["billing-items", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("billing_items")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const patientIds = [...new Set(billingItems.map(i => i.patient_id))];
  const { data: patients = [] } = useQuery({
    queryKey: ["billing-patients", patientIds, user?.id],
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
  const grouped = billingItems.reduce((acc, item) => {
    if (!acc[item.patient_id]) acc[item.patient_id] = [];
    acc[item.patient_id].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const filteredPatients = Object.keys(grouped).filter(pid => {
    const patient = patientMap[pid];
    if (search && !patient?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (tab === "credit") return grouped[pid].some((i: any) => i.status === "credit");
    if (tab === "paid") return grouped[pid].every((i: any) => i.status === "paid");
    if (tab === "pending") return grouped[pid].some((i: any) => i.status === "pending");
    return true;
  });

  const totalRevenue = billingItems.filter(i => i.status === "paid").reduce((s, i) => s + i.total_amount, 0);
  const totalCredit = billingItems.filter(i => i.status === "credit").reduce((s, i) => s + i.total_amount, 0);
  const totalPending = billingItems.filter(i => i.status === "pending").reduce((s, i) => s + i.total_amount, 0);

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
        <p className="text-muted-foreground">Please sign in to access billing management.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Billing</h1>
          <p className="text-sm text-muted-foreground">Patient invoices & credit tracking</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Paid</p>
            <p className="text-lg font-bold text-foreground">UGX {totalRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">On Credit</p>
            <p className="text-lg font-bold text-foreground">UGX {totalCredit.toLocaleString()}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-lg font-bold text-foreground">UGX {totalPending.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search patient..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="credit">Credit</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No billing records found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPatients.map(pid => {
            const patient = patientMap[pid];
            const items = grouped[pid];
            return <PatientInvoiceCard key={pid} patient={patient} items={items} />;
          })}
        </div>
      )}
    </div>
  );
};

const PatientInvoiceCard = ({ patient, items }: { patient: any; items: any[] }) => {
  const [expanded, setExpanded] = useState(false);
  const totalBilled = items.reduce((s: number, i: any) => s + i.total_amount, 0);
  const totalPaid = items.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + i.total_amount, 0);
  const totalCredit = items.filter((i: any) => i.status === "credit").reduce((s: number, i: any) => s + i.total_amount, 0);
  const balance = totalBilled - totalPaid;

  const statusBadge = totalCredit > 0
    ? <Badge variant="outline" className="border-amber-500 text-amber-600">Credit: UGX {totalCredit.toLocaleString()}</Badge>
    : balance === 0
      ? <Badge className="bg-emerald-100 text-emerald-700">Fully Paid</Badge>
      : <Badge variant="outline" className="border-blue-500 text-blue-600">Balance: UGX {balance.toLocaleString()}</Badge>;

  return (
    <motion.div
      id="billing-invoice"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card shadow-card"
    >
      <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{patient?.name || "Unknown"}</p>
            <p className="text-xs text-muted-foreground">{patient?.phone || "No phone"} · {items.length} items</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {statusBadge}
          <p className="text-lg font-bold text-foreground">UGX {totalBilled.toLocaleString()}</p>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs">
                <th className="text-left py-1">Service</th>
                <th className="text-left py-1">Type</th>
                <th className="text-left py-1">Status</th>
                <th className="text-right py-1">Amount</th>
                <th className="text-right py-1">Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id} className="border-b border-border/20">
                  <td className="py-2 font-medium">{item.item_name}</td>
                  <td className="py-2 capitalize text-muted-foreground">{item.item_type.replace("_", " ")}</td>
                  <td className="py-2">
                    <Badge variant={item.status === "paid" ? "default" : item.status === "credit" ? "outline" : "secondary"} className="text-xs">
                      {item.status}
                    </Badge>
                  </td>
                  <td className="py-2 text-right">UGX {item.total_amount.toLocaleString()}</td>
                  <td className="py-2 text-right text-muted-foreground text-xs">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex justify-between items-center border-t pt-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total: UGX {totalBilled.toLocaleString()}</p>
              <p className="text-xs text-emerald-600">Paid: UGX {totalPaid.toLocaleString()}</p>
              {totalCredit > 0 && <p className="text-xs text-amber-600">Credit: UGX {totalCredit.toLocaleString()}</p>}
            </div>
            <Button variant="outline" size="sm" onClick={async () => {
              try {
                await generatePDF('billing-invoice', `invoice-${Date.now()}.pdf`);
                toast({ title: "PDF Generated", description: "Invoice PDF has been downloaded." });
              } catch (error) {
                console.error('PDF generation error:', error);
                toast({ title: "Error", description: "Failed to generate PDF. Please try again.", variant: "destructive" });
              }
            }} className="gap-1">
              <Receipt className="w-3.5 h-3.5" />
              Download PDF
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BillingPage;
