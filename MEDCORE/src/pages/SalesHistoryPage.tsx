import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft, DollarSign, TrendingUp, Calendar, Printer, Sun, Moon, BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const SalesHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState("month");
  const [singleDate, setSingleDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [shift, setShift] = useState("all");
  const [view, setView] = useState("table");

  const { data: sales = [] } = useQuery({
    queryKey: ["sales-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pharmacy_sales")
        .select("*, pharmacy_sale_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["sales-expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_expenses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: billingPaid = [] } = useQuery({
    queryKey: ["billing-paid-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_items")
        .select("*")
        .eq("status", "paid");
      if (error) throw error;
      return data;
    },
  });

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const d = new Date(s.created_at);
      const dateStr = d.toISOString().split("T")[0];
      if (dateFilter === "single" && dateStr !== singleDate) return false;
      if (dateFilter === "range" && (dateStr < dateFrom || dateStr > dateTo)) return false;
      if (dateFilter === "month") {
        const now = new Date();
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      }
      const hour = d.getHours();
      if (shift === "day" && (hour < 6 || hour >= 18)) return false;
      if (shift === "night" && hour >= 6 && hour < 18) return false;
      return true;
    });
  }, [sales, dateFilter, singleDate, dateFrom, dateTo, shift]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.created_at);
      const dateStr = d.toISOString().split("T")[0];
      if (dateFilter === "single" && dateStr !== singleDate) return false;
      if (dateFilter === "range" && (dateStr < dateFrom || dateStr > dateTo)) return false;
      if (dateFilter === "month") {
        const now = new Date();
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      }
      return true;
    });
  }, [expenses, dateFilter, singleDate, dateFrom, dateTo]);

  const totalSales = filteredSales.reduce((s, sale) => s + sale.total_amount, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const drugCost = filteredSales.reduce((s, sale) => {
    const items = (sale as any).pharmacy_sale_items || [];
    return s + items.reduce((is: number, i: any) => is + (i.unit_price * i.quantity * 0.6), 0);
  }, 0);
  const cashAtHand = totalSales - totalExpenses;
  const grossProfit = totalSales - drugCost;
  const netProfit = grossProfit - totalExpenses;

  // Daily breakdown for chart
  const dailyData = useMemo(() => {
    const days: Record<string, { date: string; daySales: number; nightSales: number; dayExpenses: number; nightExpenses: number }> = {};

    sales.forEach(s => {
      const d = new Date(s.created_at);
      const dateStr = d.toISOString().split("T")[0];
      if (!days[dateStr]) days[dateStr] = { date: dateStr, daySales: 0, nightSales: 0, dayExpenses: 0, nightExpenses: 0 };
      const hour = d.getHours();
      if (hour >= 6 && hour < 18) days[dateStr].daySales += s.total_amount;
      else days[dateStr].nightSales += s.total_amount;
    });

    expenses.forEach(e => {
      const d = new Date(e.created_at);
      const dateStr = d.toISOString().split("T")[0];
      if (!days[dateStr]) days[dateStr] = { date: dateStr, daySales: 0, nightSales: 0, dayExpenses: 0, nightExpenses: 0 };
      if (e.shift === "night") days[dateStr].nightExpenses += e.amount;
      else days[dateStr].dayExpenses += e.amount;
    });

    return Object.values(days).sort((a, b) => a.date.localeCompare(b.date)).slice(-15);
  }, [sales, expenses]);

  const clinicName = user?.user_metadata?.clinic_name || "MEDICORE";

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground">Sales History</h1>
            <p className="text-sm text-muted-foreground">{clinicName} · Financial analytics</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="ml-auto gap-1" onClick={() => window.print()}>
          <Printer className="w-3.5 h-3.5" /> Print Report
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Date Filter</label>
          <Tabs value={dateFilter} onValueChange={setDateFilter}>
            <TabsList>
              <TabsTrigger value="single">📅 Single</TabsTrigger>
              <TabsTrigger value="range">📆 Range</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {dateFilter === "single" && (
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Date</label>
            <Input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} />
          </div>
        )}
        {dateFilter === "range" && (
          <>
            <div><label className="text-xs font-medium mb-1 block">From</label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
            <div><label className="text-xs font-medium mb-1 block">To</label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
          </>
        )}
        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Shift</label>
          <Tabs value={shift} onValueChange={setShift}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="day"><Sun className="w-3 h-3 mr-1" />Day</TabsTrigger>
              <TabsTrigger value="night"><Moon className="w-3 h-3 mr-1" />Night</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">View</label>
          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="table">📊 Table</TabsTrigger>
              <TabsTrigger value="graph">📈 Graph</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Sales", value: `UGX ${totalSales.toLocaleString()}`, icon: "💰", color: "bg-emerald-100 text-emerald-700" },
          { label: "Total Expenses", value: `UGX ${totalExpenses.toLocaleString()}`, icon: "📤", color: "bg-amber-100 text-amber-700" },
          { label: "Cash at Hand", value: `UGX ${cashAtHand.toLocaleString()}`, icon: "💵", color: "bg-blue-100 text-blue-700" },
          { label: "Net Profit", value: `UGX ${netProfit.toLocaleString()}`, icon: "📈", color: "bg-primary/10 text-primary" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.icon} {s.label}</p>
              <p className="text-lg font-heading font-bold text-foreground mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {view === "graph" ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Sales & Expenses Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Legend />
                <Bar dataKey="daySales" fill="hsl(var(--primary))" name="Day Sales" radius={[4, 4, 0, 0]} />
                <Bar dataKey="nightSales" fill="hsl(var(--accent))" name="Night Sales" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Sales table */}
          <Card>
            <CardHeader><CardTitle className="text-base">💰 Sales ({filteredSales.length} transactions)</CardTitle></CardHeader>
            <CardContent>
              {filteredSales.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No sales for selected period</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.slice(0, 50).map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.receipt_number}</TableCell>
                        <TableCell>{s.patient_name || "Walk-in"}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs capitalize">{s.sale_type.replace("_", " ")}</Badge></TableCell>
                        <TableCell className="font-medium">UGX {s.total_amount.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Expenses table */}
          <Card>
            <CardHeader><CardTitle className="text-base">📤 Expenses</CardTitle></CardHeader>
            <CardContent>
              {filteredExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No expenses recorded</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs">{new Date(e.created_at).toLocaleString()}</TableCell>
                        <TableCell className="font-medium">UGX {e.amount.toLocaleString()}</TableCell>
                        <TableCell>{e.description}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{e.category}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{e.recorded_by || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Combined Summary */}
      <Card>
        <CardHeader><CardTitle className="text-base">Combined Summary & Insights</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total Sales</span><span className="font-bold">UGX {totalSales.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Expenses</span><span className="font-bold">UGX {totalExpenses.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Drugs Used (est.)</span><span className="font-bold">UGX {Math.round(drugCost).toLocaleString()}</span></div>
              <div className="flex justify-between border-t pt-2"><span className="font-semibold">Net Profit</span><span className="font-bold text-emerald-600">UGX {netProfit.toLocaleString()}</span></div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Gross Profit</span><span>UGX {grossProfit.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Profit Margin</span><span>{totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(1) : 0}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Expense Ratio</span><span>{totalSales > 0 ? ((totalExpenses / totalSales) * 100).toFixed(1) : 0}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Drug Cost Ratio</span><span>{totalSales > 0 ? ((drugCost / totalSales) * 100).toFixed(1) : 0}%</span></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesHistoryPage;
