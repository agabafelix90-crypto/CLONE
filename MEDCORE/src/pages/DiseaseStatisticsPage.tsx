import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, BarChart3, Printer, Search, Sparkles, Loader2, Brain } from "lucide-react";
import { useAIAssistant } from "@/hooks/use-ai-assistant";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { generatePDF } from "@/lib/pdf-generator";
import { useToast } from "@/hooks/use-toast";

const DISEASES = [
  "Malaria", "Typhoid", "Urinary Tract Infection", "Pelvic Inflammatory Disease",
  "Yellow Fever", "Peptic Ulcers", "Cough, Flu, URTI", "Asthma",
  "Hypertension", "Diabetes", "Syphilis", "Hernias", "Others",
];

const DiseaseStatisticsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const ai = useAIAssistant();
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [selectedDisease, setSelectedDisease] = useState("Malaria");
  const [sex, setSex] = useState("all");
  const [ageFrom, setAgeFrom] = useState("0");
  const [ageTo, setAgeTo] = useState("120");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 12);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

  const normalizeRange = (from: number, to: number) => {
    const validatedFrom = Number.isFinite(from) && from >= 0 ? from : 0;
    const validatedTo = Number.isFinite(to) && to >= validatedFrom ? to : validatedFrom;
    return [validatedFrom, Math.min(validatedTo, 120)];
  };

  const validateDates = (from: string, to: string) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate > toDate) {
      return [new Date("2000-01-01"), new Date()];
    }
    return [fromDate, toDate];
  };

  const [validAgeFrom, validAgeTo] = normalizeRange(Number(ageFrom), Number(ageTo));
  const [validDateFrom, validDateTo] = validateDates(dateFrom, dateTo);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ["disease-stats-patients", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, age, gender, diagnosis, chief_complaint, created_at, owner_id")
        .eq("owner_id", user.id);
      if (error) throw error;
      return data;
    },
  });

  const chartData = useMemo(() => {
    const months: Record<string, { month: string; male: number; female: number; total: number }> = {};

    patients.forEach(p => {
      const createdDate = new Date(p.created_at);
      if (createdDate < validDateFrom || createdDate > validDateTo) return;
      if (p.age < validAgeFrom || p.age > validAgeTo) return;
      if (sex === "male" && p.gender?.toLowerCase() !== "male") return;
      if (sex === "female" && p.gender?.toLowerCase() !== "female") return;

      const diagLower = (p.diagnosis || "").toLowerCase() + " " + (p.chief_complaint || "").toLowerCase();
      if (!diagLower.includes(selectedDisease.toLowerCase().split(",")[0].trim().toLowerCase())) return;

      const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = createdDate.toLocaleDateString("en", { month: "short", year: "2-digit" });

      if (!months[monthKey]) months[monthKey] = { month: monthLabel, male: 0, female: 0, total: 0 };
      months[monthKey].total++;
      if (p.gender?.toLowerCase() === "male") months[monthKey].male++;
      else months[monthKey].female++;
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [patients, selectedDisease, sex, ageFrom, ageTo, dateFrom, dateTo]);

  const totalCases = chartData.reduce((s, d) => s + d.total, 0);

  if (authLoading || patientsLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view disease statistics.</p>
      </div>
    );
  }

  return (
    <div id="disease-stats-content" className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground">Disease Statistics</h1>
            <p className="text-sm text-muted-foreground">AI-powered clinical data analytics</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-foreground mb-1 block">Disease</label>
              <Select value={selectedDisease} onValueChange={setSelectedDisease}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DISEASES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Sex</label>
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Both</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Age Range</label>
              <div className="flex gap-1">
                <Input type="number" value={ageFrom} onChange={e => setAgeFrom(e.target.value)} className="w-16" min="0" />
                <span className="text-muted-foreground self-center">-</span>
                <Input type="number" value={ageTo} onChange={e => setAgeTo(e.target.value)} className="w-16" min="0" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">From</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">To</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {selectedDisease} cases of {sex === "all" ? "Both sex" : sex} aged {ageFrom}-{ageTo} years
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Total cases: {totalCases}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={ai.loading || chartData.length === 0}
              onClick={async () => {
                const result = await ai.generate({
                  action: "disease_analysis",
                  data: {
                    statistics: {
                      disease: selectedDisease,
                      period: `${dateFrom} to ${dateTo}`,
                      totalCases,
                      monthlyData: chartData,
                      filters: { sex, ageRange: `${ageFrom}-${ageTo}` },
                    },
                  },
                });
                if (result) setAiReport(result);
              }}
            >
              {ai.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
              AI Analysis
            </Button>
            <Button variant="outline" size="sm" onClick={async () => {
              try {
                await generatePDF('disease-stats-content', `disease-statistics-${Date.now()}.pdf`);
                toast({ title: "PDF Generated", description: "Disease statistics PDF has been downloaded." });
              } catch (error) {
                console.error('PDF generation error:', error);
                toast({ title: "Error", description: "Failed to generate PDF. Please try again.", variant: "destructive" });
              }
            }} className="gap-1">
              <Printer className="w-3.5 h-3.5" /> Download PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No matching data found for the selected filters</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                />
                <Legend />
                {sex === "all" ? (
                  <>
                    <Bar dataKey="male" fill="hsl(var(--primary))" name="Male" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="female" fill="hsl(var(--accent))" name="Female" radius={[4, 4, 0, 0]} />
                  </>
                ) : (
                  <Bar dataKey="total" fill="hsl(var(--primary))" name="Cases" radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Summary Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Monthly Breakdown</CardTitle></CardHeader>
        <CardContent>
          {chartData.length > 0 && (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="text-left py-2">Month</th>
                    <th className="text-right py-2">Male</th>
                    <th className="text-right py-2">Female</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map(d => (
                    <tr key={d.month} className="border-b border-border/30">
                      <td className="py-2 font-medium">{d.month}</td>
                      <td className="py-2 text-right">{d.male}</td>
                      <td className="py-2 text-right">{d.female}</td>
                      <td className="py-2 text-right font-bold">{d.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
           )}
        </CardContent>
      </Card>

      {/* AI Report */}
      {aiReport && (
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" /> AI Disease Analysis Report
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setAiReport(null)}>Dismiss</Button>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">{aiReport}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DiseaseStatisticsPage;
