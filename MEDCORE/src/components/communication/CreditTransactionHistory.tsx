import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Receipt } from "lucide-react";
import { format } from "date-fns";

const CreditTransactionHistory = () => {
  const { user } = useAuth();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["sms-credit-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_credit_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" /> Credit Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No transactions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-2 text-muted-foreground font-medium">Type</th>
                  <th className="p-2 text-muted-foreground font-medium">Amount</th>
                  <th className="p-2 text-muted-foreground font-medium">Balance After</th>
                  <th className="p-2 text-muted-foreground font-medium">Description</th>
                  <th className="p-2 text-muted-foreground font-medium">Status</th>
                  <th className="p-2 text-muted-foreground font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx: any) => (
                  <tr key={tx.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="p-2">
                      <Badge variant={tx.type === "topup" ? "default" : "secondary"} className="text-[10px]">
                        {tx.type === "topup" ? "↑ Top-up" : "↓ Usage"}
                      </Badge>
                    </td>
                    <td className={`p-2 font-mono text-xs ${tx.type === "topup" ? "text-emerald-500" : "text-destructive"}`}>
                      {tx.type === "topup" ? "+" : "-"}UGX {Number(tx.amount).toLocaleString()}
                    </td>
                    <td className="p-2 font-mono text-xs">UGX {Number(tx.balance_after).toLocaleString()}</td>
                    <td className="p-2 max-w-[200px] truncate text-xs">{tx.description}</td>
                    <td className="p-2">
                      <Badge
                        variant={tx.status === "completed" ? "default" : tx.status === "failed" ? "destructive" : "secondary"}
                        className="text-[10px]"
                      >
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {tx.created_at ? format(new Date(tx.created_at), "dd/MM/yy HH:mm") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreditTransactionHistory;
