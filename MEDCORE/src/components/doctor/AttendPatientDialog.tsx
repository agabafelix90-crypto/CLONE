import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAIAssistant } from "@/hooks/use-ai-assistant";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText, Stethoscope, Pill, FlaskConical, Microscope, ClipboardList,
  Printer, Receipt, UserX, RefreshCw, Plus, Trash2, Calendar, Sparkles, Loader2,
  Apple, Brain
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Tables<"patients">;
}

const ROUTES = ["IV", "IM", "Oral", "Topical", "Rectal", "Sublingual", "Inhalation", "SC", "Nasal"];
const FREQUENCIES = [
  "Once a day for", "Once Noct for", "Twice Daily for", "Stat for", "tds for", "OD for",
  "BID noct for", "12 Hourly for", "24 Hourly for", "8 Hourly for", "6 Hourly for",
  "2 Hourly for", "3 Hourly for", "prn", "QD quaque die for"
];
const DURATION_UNITS = ["Days", "Weeks", "Months", "Doses"];

const estimateQuantity = (frequency: string, duration: number, unit: string) => {
  const freq = frequency || "";
  let timesPerDay = 1;
  if (freq.includes("Twice") || freq.includes("BID") || freq.includes("12 Hourly")) timesPerDay = 2;
  else if (freq.includes("tds") || freq.includes("8 Hourly")) timesPerDay = 3;
  else if (freq.includes("6 Hourly")) timesPerDay = 4;
  const safeDuration = Math.max(1, duration || 1);
  if (unit === "Doses") return safeDuration;
  return timesPerDay * safeDuration;
};

interface PrescriptionRow {
  id: string;
  route: string;
  drug_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  duration_unit: string;
  quantity: number;
  unit_price: number;
  unit: string;
  available: number;
  inventory_id: string;
}

interface ClinicalGuidelineRow {
  id: string;
  condition_key: string;
  condition_label: string;
  line_of_treatment: string;
  drug_name: string;
  route: string;
  dosage: string;
  frequency: string;
  duration_value: number;
  duration_unit: string;
  pregnancy_safe: boolean | null;
  notes: string | null;
}

const AttendPatientDialog = ({ open, onOpenChange, patient }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("pc");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState(patient.diagnosis || "");
  const [presentingComplaint, setPresentingComplaint] = useState(patient.chief_complaint || "");
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([]);
  const [conditionSearch, setConditionSearch] = useState("");
  const [aiDrugSuggestion, setAiDrugSuggestion] = useState<string | null>(null);
  const [aiFoodSuggestion, setAiFoodSuggestion] = useState<string | null>(null);
  const ai = useAIAssistant();

  // Fetch vitals
  const { data: vitals } = useQuery({
    queryKey: ["patient-vitals", patient.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vitals")
        .select("*")
        .eq("patient_id", patient.id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Fetch pharmacy inventory for prescribing
  const { data: inventory = [] } = useQuery({
    queryKey: ["pharmacy-inventory-for-rx"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pharmacy_inventory")
        .select("id, drug_name, unit_price, quantity_in_stock, unit")
        .gt("quantity_in_stock", 0)
        .order("drug_name");
      return data || [];
    },
  });

  // Fetch existing lab tests
  const { data: labTests = [] } = useQuery({
    queryKey: ["patient-lab-tests", patient.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("lab_tests")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Fetch existing prescriptions
  const { data: existingRx = [] } = useQuery({
    queryKey: ["patient-prescriptions", patient.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const bmi = vitals && (vitals as any).weight && (vitals as any).height
    ? ((vitals as any).weight / Math.pow((vitals as any).height / 100, 2)).toFixed(1)
    : null;

  const normalizedDiagnosis = (conditionSearch || diagnosis || "").trim().toLowerCase();

  const { data: guidelineRows = [] } = useQuery({
    queryKey: ["clinical-drug-guidelines", normalizedDiagnosis],
    enabled: normalizedDiagnosis.length >= 2,
    queryFn: async () => {
      const diagnosisKey = normalizedDiagnosis.replace(/\s+/g, "_");
      const { data, error } = await supabase
        .from("clinical_drug_guidelines")
        .select("*")
        .or(`condition_key.eq.${diagnosisKey},condition_label.ilike.%${normalizedDiagnosis}%`)
        .order("line_of_treatment")
        .order("drug_name");
      if (error) throw error;
      return (data || []) as ClinicalGuidelineRow[];
    },
  });

  const addGuidelineToPrescription = (row: ClinicalGuidelineRow) => {
    const drug = inventory.find((d) => d.drug_name.toLowerCase() === row.drug_name.toLowerCase());
    const qty = estimateQuantity(row.frequency || "", row.duration_value || 1, row.duration_unit || "Days");
    setPrescriptions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        route: row.route || "Oral",
        drug_name: row.drug_name,
        dosage: row.dosage || "",
        frequency: row.frequency || "",
        duration: String(row.duration_value || 1),
        duration_unit: row.duration_unit || "Days",
        quantity: qty,
        unit_price: drug?.unit_price || 0,
        unit: drug?.unit || "Tablets",
        available: drug?.quantity_in_stock || 0,
        inventory_id: drug?.id || "",
      },
    ]);
  };

  // Add prescription row
  const addPrescriptionRow = () => {
    setPrescriptions(prev => [...prev, {
      id: crypto.randomUUID(),
      route: "Oral",
      drug_name: "",
      dosage: "",
      frequency: "",
      duration: "1",
      duration_unit: "Days",
      quantity: 0,
      unit_price: 0,
      unit: "",
      available: 0,
      inventory_id: "",
    }]);
  };

  const updatePrescription = (id: string, field: string, value: any) => {
    setPrescriptions(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [field]: value };
      
      // Auto-fill drug info when drug is selected
      if (field === "drug_name") {
        const drug = inventory.find(d => d.drug_name === value);
        if (drug) {
          updated.unit_price = drug.unit_price;
          updated.unit = drug.unit || "Tablets";
          updated.available = drug.quantity_in_stock;
          updated.inventory_id = drug.id;
        }
      }
      
      // Auto-calculate quantity
      if (["frequency", "duration", "duration_unit"].includes(field)) {
        const freq = updated.frequency;
        const dur = parseInt(updated.duration) || 1;
        let timesPerDay = 1;
        if (freq.includes("Twice") || freq.includes("BID") || freq.includes("12 Hourly")) timesPerDay = 2;
        else if (freq.includes("tds") || freq.includes("8 Hourly")) timesPerDay = 3;
        else if (freq.includes("6 Hourly")) timesPerDay = 4;
        else if (freq.includes("Stat")) timesPerDay = 1;
        
        let totalDays = dur;
        if (updated.duration_unit === "Weeks") totalDays = dur * 7;
        else if (updated.duration_unit === "Months") totalDays = dur * 30;
        
        updated.quantity = timesPerDay * totalDays;
      }
      
      return updated;
    }));
  };

  const removePrescription = (id: string) => {
    setPrescriptions(prev => prev.filter(p => p.id !== id));
  };

  const treatmentTotal = prescriptions.reduce((s, p) => s + (p.quantity * p.unit_price), 0);

  // Save treatment plan
  const saveTreatment = useMutation({
    mutationFn: async () => {
      // Update patient diagnosis
      await supabase.from("patients").update({
        diagnosis,
        chief_complaint: presentingComplaint,
      }).eq("id", patient.id);

      // Insert prescriptions and billing items
      for (const rx of prescriptions) {
        if (!rx.drug_name) continue;
        
        await supabase.from("prescriptions").insert({
          patient_id: patient.id,
          drug_name: rx.drug_name,
          dosage: rx.dosage,
          frequency: `${rx.frequency} ${rx.duration} ${rx.duration_unit}`,
          quantity: rx.quantity,
          prescribed_by: user?.id,
          notes: `Route: ${rx.route}`,
          status: "pending",
        });

        // Add to billing
        await supabase.from("billing_items").insert({
          patient_id: patient.id,
          item_type: "prescription",
          item_name: rx.drug_name,
          amount: rx.unit_price,
          quantity: rx.quantity,
          total_amount: rx.quantity * rx.unit_price,
          billed_by: user?.id,
          reference_id: rx.inventory_id || null,
          status: "pending",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["patient-prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["cashier-pending"] });
    },
    onSuccess: () => {
      toast.success("Treatment plan saved & sent to cashier");
      setPrescriptions([]);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const opdNumber = `${new Date(patient.created_at).getFullYear()}${String(new Date(patient.created_at).getMonth() + 1).padStart(2, '0')}-${patient.id.substring(0, 4)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0">
        {/* Patient Header */}
        <div className="sticky top-0 z-10 bg-card border-b p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold text-lg">
                {patient.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-heading font-bold text-foreground">{patient.name}</h2>
                <p className="text-xs text-muted-foreground">
                  OPD: {opdNumber} · Age: {patient.age}y · {patient.gender || "N/A"} · {patient.phone || "No phone"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print
              </Button>
              <Button variant="outline" size="sm">
                <Receipt className="w-3.5 h-3.5 mr-1" /> Invoice
              </Button>
              <Button variant="outline" size="sm">
                <UserX className="w-3.5 h-3.5 mr-1" /> Discharge
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refer
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] divide-x">
          {/* Left: Patient Info Panel */}
          <div className="p-4 space-y-4 bg-muted/20">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Patient Details</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Age:</span> {patient.age} years</p>
                <p><span className="text-muted-foreground">Sex:</span> {patient.gender || "—"}</p>
                <p><span className="text-muted-foreground">Phone:</span> {patient.phone || "—"}</p>
                <p><span className="text-muted-foreground">Address:</span> {patient.address || "—"}</p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Next of Kin</h3>
              <p className="text-sm">{patient.nok_name || "—"} ({patient.nok_relationship || "—"})</p>
              <p className="text-xs text-muted-foreground">{patient.nok_contact || "—"}</p>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Allergies</h3>
              <p className="text-sm text-destructive">{patient.allergies || "NKDA"}</p>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Vital Signs</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">BP:</span> {vitals?.systolic && vitals?.diastolic ? `${vitals.systolic}/${vitals.diastolic} mmHg` : "—"}</p>
                <p><span className="text-muted-foreground">Temp:</span> {vitals?.temperature ? `${vitals.temperature}°C` : "—"}</p>
                <p><span className="text-muted-foreground">SpO₂:</span> {vitals?.oxygen_sat ? `${vitals.oxygen_sat}%` : "—"}</p>
                <p><span className="text-muted-foreground">Pulse:</span> {vitals?.pulse ? `${vitals.pulse} bpm` : "—"}</p>
                <p><span className="text-muted-foreground">RR:</span> {vitals?.respiratory_rate ? `${vitals.respiratory_rate}/min` : "—"}</p>
                <p><span className="text-muted-foreground">BMI:</span> {bmi || "—"}</p>
              </div>
            </div>
          </div>

          {/* Right: Clinical Tabs */}
          <div className="p-4">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid grid-cols-6 w-full">
                <TabsTrigger value="pc" className="text-xs">P/C</TabsTrigger>
                <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
                <TabsTrigger value="dx" className="text-xs">Dx</TabsTrigger>
                <TabsTrigger value="rx" className="text-xs">Rx</TabsTrigger>
                <TabsTrigger value="investigations" className="text-xs">Inv.</TabsTrigger>
                <TabsTrigger value="rxchart" className="text-xs">Rx Chart</TabsTrigger>
              </TabsList>

              {/* P/C - Presenting Complaint */}
              <TabsContent value="pc" className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Presenting Complaints</h3>
                </div>
                <textarea
                  className="w-full min-h-[150px] rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                  placeholder="Enter presenting complaints..."
                  value={presentingComplaint}
                  onChange={(e) => setPresentingComplaint(e.target.value)}
                />
              </TabsContent>

              {/* Clinical Notes */}
              <TabsContent value="notes" className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Clinical Notes</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    disabled={ai.loading}
                    onClick={async () => {
                      const result = await ai.generate({
                        action: "clinical_notes",
                        data: {
                          name: patient.name,
                          age: patient.age,
                          gender: patient.gender,
                          chief_complaint: presentingComplaint || patient.chief_complaint,
                          diagnosis: diagnosis,
                          symptoms: patient.symptoms,
                          vitals: vitals ? `BP: ${vitals.systolic}/${vitals.diastolic}, T: ${vitals.temperature}, P: ${vitals.pulse}` : undefined,
                        },
                      });
                      if (result) setClinicalNotes(prev => prev ? prev + "\n\n--- AI Generated ---\n" + result : result);
                    }}
                  >
                    {ai.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    AI Assist
                  </Button>
                </div>
                <textarea
                  className="w-full min-h-[200px] rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                  placeholder="Enter clinical findings, examination notes..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                />
              </TabsContent>

              {/* Diagnosis */}
              <TabsContent value="dx" className="space-y-3 mt-4">
                <h3 className="text-sm font-semibold">Diagnosis</h3>
                <textarea
                  className="w-full min-h-[120px] rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                  placeholder="Enter diagnosis..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
                <Button onClick={() => {
                  supabase.from("patients").update({ diagnosis }).eq("id", patient.id);
                  toast.success("Diagnosis saved");
                }} size="sm">Save Diagnosis</Button>
              </TabsContent>

              {/* Treatment Plan (Rx) */}
              <TabsContent value="rx" className="space-y-4 mt-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-semibold">Treatment Plan</h3>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs"
                      disabled={ai.loading || !diagnosis}
                      onClick={async () => {
                        const result = await ai.generate({
                          action: "drug_suggestions",
                          data: {
                            diagnosis: diagnosis || presentingComplaint,
                            age: patient.age,
                            gender: patient.gender,
                            allergies: patient.allergies,
                          },
                        });
                        if (result) setAiDrugSuggestion(result);
                      }}
                    >
                      {ai.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      AI Drug Suggestions
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs"
                      disabled={ai.loading || !diagnosis}
                      onClick={async () => {
                        const result = await ai.generate({
                          action: "food_suggestions",
                          data: {
                            diagnosis: diagnosis || presentingComplaint,
                            age: patient.age,
                            gender: patient.gender,
                            allergies: patient.allergies,
                          },
                        });
                        if (result) setAiFoodSuggestion(result);
                      }}
                    >
                      {ai.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Apple className="w-3 h-3" />}
                      AI Diet Advice
                    </Button>
                    <Button size="sm" onClick={addPrescriptionRow} variant="outline" className="gap-1 text-xs">
                      <Plus className="w-3.5 h-3.5" /> Add Drug
                    </Button>
                  </div>
                </div>

                <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Guideline-based options (editable after adding)
                    </p>
                    <Input
                      className="h-8 max-w-xs text-xs"
                      placeholder="Condition search (e.g. pneumonia)"
                      value={conditionSearch}
                      onChange={(e) => setConditionSearch(e.target.value)}
                    />
                  </div>
                  {normalizedDiagnosis.length < 2 ? (
                    <p className="text-xs text-muted-foreground">
                      Enter diagnosis or condition search to load guideline recommendations.
                    </p>
                  ) : guidelineRows.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No saved guideline rows for this condition.</p>
                  ) : (
                    <div className="space-y-2">
                      {guidelineRows.map((g) => {
                        const stock = inventory.find((d) => d.drug_name.toLowerCase() === g.drug_name.toLowerCase());
                        return (
                          <div key={g.id} className="flex items-center justify-between gap-3 p-2 rounded border bg-background">
                            <div className="min-w-0">
                              <p className="text-xs font-medium">
                                {g.condition_label} · {g.line_of_treatment.replace("_", " ")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {g.drug_name} ({g.route}) · {g.dosage || "Dose not set"} · {g.frequency || "Frequency not set"} · {g.duration_value} {g.duration_unit}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                Stock: {stock?.quantity_in_stock ?? 0} {stock?.unit || "units"}
                                {g.pregnancy_safe === false ? " · Pregnancy: caution" : ""}
                                {g.notes ? ` · ${g.notes}` : ""}
                              </p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => addGuidelineToPrescription(g)}>
                              Add to Rx
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* AI Drug Suggestion Panel */}
                {aiDrugSuggestion && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Drug Suggestions</span>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setAiDrugSuggestion(null)}>Dismiss</Button>
                    </div>
                    <pre className="whitespace-pre-wrap text-muted-foreground leading-relaxed">{aiDrugSuggestion}</pre>
                  </div>
                )}

                {/* AI Food Suggestion Panel */}
                {aiFoodSuggestion && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1"><Apple className="w-3 h-3" /> AI Dietary Recommendations</span>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setAiFoodSuggestion(null)}>Dismiss</Button>
                    </div>
                    <pre className="whitespace-pre-wrap text-muted-foreground leading-relaxed">{aiFoodSuggestion}</pre>
                  </div>
                )}

                {prescriptions.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-2">Route</th>
                          <th className="text-left p-2">Drug</th>
                          <th className="text-left p-2">Dosage</th>
                          <th className="text-left p-2">Frequency</th>
                          <th className="text-left p-2">Duration</th>
                          <th className="text-left p-2">Drug Qty</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescriptions.map((rx) => (
                          <tr key={rx.id} className="border-b">
                            <td className="p-1">
                              <Select value={rx.route} onValueChange={(v) => updatePrescription(rx.id, "route", v)}>
                                <SelectTrigger className="h-8 text-xs w-20"><SelectValue /></SelectTrigger>
                                <SelectContent>{ROUTES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                              </Select>
                            </td>
                            <td className="p-1">
                              <Select value={rx.drug_name} onValueChange={(v) => updatePrescription(rx.id, "drug_name", v)}>
                                <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Select drug" /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {inventory.map(d => (
                                    <SelectItem key={d.id} value={d.drug_name}>
                                      {d.drug_name} ({d.quantity_in_stock} {d.unit})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-1">
                              <Input className="h-8 text-xs w-20" placeholder="e.g. 500mg" value={rx.dosage} onChange={(e) => updatePrescription(rx.id, "dosage", e.target.value)} />
                            </td>
                            <td className="p-1">
                              <Select value={rx.frequency} onValueChange={(v) => updatePrescription(rx.id, "frequency", v)}>
                                <SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>{FREQUENCIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                              </Select>
                            </td>
                            <td className="p-1">
                              <div className="flex gap-1">
                                <Input className="h-8 text-xs w-12" type="number" min="1" value={rx.duration} onChange={(e) => updatePrescription(rx.id, "duration", e.target.value)} />
                                <Select value={rx.duration_unit} onValueChange={(v) => updatePrescription(rx.id, "duration_unit", v)}>
                                  <SelectTrigger className="h-8 text-xs w-20"><SelectValue /></SelectTrigger>
                                  <SelectContent>{DURATION_UNITS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                </Select>
                              </div>
                            </td>
                            <td className="p-1">
                              <div className="text-xs">
                                <p className="font-medium">{rx.quantity} {rx.unit}</p>
                                <p className="text-muted-foreground">UGX {(rx.quantity * rx.unit_price).toLocaleString()}</p>
                                <p className="text-[10px] text-muted-foreground">{rx.available} available</p>
                              </div>
                            </td>
                            <td className="p-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removePrescription(rx.id)}>
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {prescriptions.length > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-sm font-semibold">Expected Treatment Bill: UGX {treatmentTotal.toLocaleString()}</p>
                    <Button onClick={() => saveTreatment.mutate()} disabled={saveTreatment.isPending} size="sm">
                      {saveTreatment.isPending ? "Saving..." : "Update Treatment Plan"}
                    </Button>
                  </div>
                )}

                {/* Existing Prescriptions */}
                {existingRx.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mt-4 mb-2">Previous Prescriptions</h4>
                    <div className="space-y-1">
                      {existingRx.map(rx => (
                        <div key={rx.id} className="flex items-center justify-between p-2 rounded bg-muted/30 text-xs">
                          <span className="font-medium">{rx.drug_name}</span>
                          <span className="text-muted-foreground">{rx.dosage} · {rx.frequency} · Qty: {rx.quantity}</span>
                          <Badge variant={rx.status === "dispensed" ? "default" : "secondary"} className="text-[10px]">{rx.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Investigations */}
              <TabsContent value="investigations" className="space-y-4 mt-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">🧪 Laboratory Tests</h3>
                  {labTests.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No lab tests ordered yet</p>
                  ) : (
                    <div className="space-y-1">
                      {labTests.map(test => (
                        <div key={test.id} className="flex items-center justify-between p-2 rounded bg-muted/30 text-xs">
                          <span className="font-medium">{test.test_name}</span>
                          <Badge variant={test.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                            {test.status}
                          </Badge>
                          {test.result && <span className="text-muted-foreground">{test.result}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {labTests.some(t => t.status === "pending") ? "Status: Tests pending in laboratory" : ""}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">🩻 Radiology Exams</h3>
                  <p className="text-xs text-muted-foreground">Use the patient menu to order radiology exams</p>
                </div>
              </TabsContent>

              {/* Treatment Chart */}
              <TabsContent value="rxchart" className="space-y-3 mt-4">
                <h3 className="text-sm font-semibold">Treatment Chart</h3>
                {existingRx.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No treatment entries yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-2">Date</th>
                          <th className="text-left p-2">Drug</th>
                          <th className="text-left p-2">Dosage</th>
                          <th className="text-left p-2">Qty</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {existingRx.map(rx => (
                          <tr key={rx.id} className="border-b">
                            <td className="p-2 text-muted-foreground">{new Date(rx.created_at).toLocaleDateString()}</td>
                            <td className="p-2 font-medium">{rx.drug_name}</td>
                            <td className="p-2">{rx.dosage}</td>
                            <td className="p-2">{rx.quantity}</td>
                            <td className="p-2"><Badge variant="secondary" className="text-[10px]">{rx.status}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendPatientDialog;
