import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart, Search, Plus, Thermometer, Activity, Wind, Droplets,
  Clock, ChevronLeft, Pill, BedDouble, Users, AlertTriangle,
  CheckCircle2, XCircle, Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { usePatients, useVitals, useMedications, useWards, useInsertVitals, useUpdateMedication } from "@/hooks/use-clinic-data";
import type { Tables } from "@/integrations/supabase/types";

const statusConfig: Record<string, { label: string; class: string }> = {
  Admitted: { label: "Admitted", class: "bg-primary/15 text-primary" },
  "Just Come": { label: "Just Come", class: "bg-muted text-muted-foreground" },
  "On Antenatal": { label: "On ANC", class: "bg-primary/15 text-primary" },
  "Post Natal": { label: "Post Natal", class: "bg-[hsl(var(--clinic-green))]/15 text-[hsl(var(--clinic-green))]" },
  "In Labour": { label: "In Labour", class: "bg-destructive/15 text-destructive" },
  Discharged: { label: "Discharged", class: "bg-muted text-muted-foreground" },
  Outpatient: { label: "Outpatient", class: "bg-accent/15 text-accent" },
};

const medStatusConfig: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
  Pending: { label: "Pending", class: "bg-[hsl(var(--clinic-orange))]/15 text-[hsl(var(--clinic-orange))] border-[hsl(var(--clinic-orange))]/30", icon: <Clock className="w-3 h-3" /> },
  Given: { label: "Given", class: "bg-[hsl(var(--clinic-green))]/15 text-[hsl(var(--clinic-green))] border-[hsl(var(--clinic-green))]/30", icon: <CheckCircle2 className="w-3 h-3" /> },
  Missed: { label: "Missed", class: "bg-destructive/15 text-destructive border-destructive/30", icon: <XCircle className="w-3 h-3" /> },
  Held: { label: "Held", class: "bg-muted text-muted-foreground border-border", icon: <AlertTriangle className="w-3 h-3" /> },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const NursePage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("wards");
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Tables<"patients"> | null>(null);
  const [showVitalsDialog, setShowVitalsDialog] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({ temperature: "", bpSys: "", bpDia: "", pulse: "", respRate: "", oxygenSat: "", notes: "" });

  const { data: patients = [], isLoading: patientsLoading } = usePatients();
  const { data: allVitals = [] } = useVitals();
  const { data: allMedications = [] } = useMedications();
  const { data: dbWards = [] } = useWards();
  const insertVitals = useInsertVitals();
  const updateMedication = useUpdateMedication();

  // Ward stats
  const wards = dbWards.map(w => {
    const wardPatients = patients.filter(p => p.ward === w.name);
    return { ...w, occupied: wardPatients.length, patients: wardPatients };
  });

  const totalOccupied = patients.filter(p => p.ward).length;
  const totalBeds = wards.reduce((s, w) => s + w.total_beds, 0) || 1;
  const pendingMeds = allMedications.filter(m => m.status === "Pending").length;
  const criticalPatients = patients.filter(p => p.severity === "Critical").length;

  const patientVitals = selectedPatient ? allVitals.filter(v => v.patient_id === selectedPatient.id) : [];
  const patientMeds = selectedPatient ? allMedications.filter(m => m.patient_id === selectedPatient.id) : [];

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.ward || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleAdministerMed = async (medId: string) => {
    try {
      await updateMedication.mutateAsync({ id: medId, status: "Given" });
      toast({ title: "Medication Administered", description: "Record updated successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleSubmitVitals = async () => {
    if (!selectedPatient) return;
    try {
      await insertVitals.mutateAsync({
        patient_id: selectedPatient.id,
        temperature: vitalsForm.temperature ? parseFloat(vitalsForm.temperature) : null,
        systolic: vitalsForm.bpSys ? parseInt(vitalsForm.bpSys) : null,
        diastolic: vitalsForm.bpDia ? parseInt(vitalsForm.bpDia) : null,
        pulse: vitalsForm.pulse ? parseInt(vitalsForm.pulse) : null,
        respiratory_rate: vitalsForm.respRate ? parseInt(vitalsForm.respRate) : null,
        oxygen_sat: vitalsForm.oxygenSat ? parseInt(vitalsForm.oxygenSat) : null,
        notes: vitalsForm.notes || null,
      });
      setVitalsForm({ temperature: "", bpSys: "", bpDia: "", pulse: "", respRate: "", oxygenSat: "", notes: "" });
      setShowVitalsDialog(false);
      toast({ title: "Vitals Recorded", description: `Vitals saved for ${selectedPatient.name}.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const stats = [
    { label: "Total Patients", value: patients.length, icon: <Users className="w-5 h-5" />, color: "text-primary", bg: "bg-primary/10", emoji: "🏥" },
    { label: "Critical", value: criticalPatients, icon: <AlertTriangle className="w-5 h-5" />, color: "text-destructive", bg: "bg-destructive/10", emoji: "🚨" },
    { label: "Pending Meds", value: pendingMeds, icon: <Pill className="w-5 h-5" />, color: "text-[hsl(var(--clinic-orange))]", bg: "bg-[hsl(var(--clinic-orange))]/10", emoji: "💊" },
    { label: "Bed Occupancy", value: `${Math.round((totalOccupied / totalBeds) * 100)}%`, icon: <BedDouble className="w-5 h-5" />, color: "text-[hsl(var(--clinic-blue))]", bg: "bg-[hsl(var(--clinic-blue))]/10", emoji: "🛏️" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground">Nurse Station</h1>
            <p className="text-sm text-muted-foreground">Ward management, vitals & medication tracking</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search patient or ward..." className="pl-9 w-64" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
            <Card className="shadow-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}>{s.icon}</div>
                <div>
                  <p className="text-2xl font-heading font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.emoji} {s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="wards" className="gap-1.5"><BedDouble className="w-4 h-4" /> Wards</TabsTrigger>
          <TabsTrigger value="medications" className="gap-1.5"><Pill className="w-4 h-4" /> Medications</TabsTrigger>
          <TabsTrigger value="vitals" className="gap-1.5"><Activity className="w-4 h-4" /> Vitals</TabsTrigger>
        </TabsList>

        {/* WARDS TAB */}
        <TabsContent value="wards" className="space-y-4 mt-4">
          {!selectedPatient ? (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {wards.map((ward, i) => (
                  <motion.div key={ward.id} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
                    <Card className={`cursor-pointer transition-all hover:shadow-md ${selectedWard === ward.name ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedWard(selectedWard === ward.name ? null : ward.name)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-heading font-semibold text-foreground">{ward.name}</h3>
                          <Badge variant="secondary" className="text-xs">{ward.occupied}/{ward.total_beds} beds</Badge>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mb-3">
                          <div className="h-2 rounded-full gradient-hero transition-all" style={{ width: `${(ward.occupied / ward.total_beds) * 100}%` }} />
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {ward.patients.map(p => (
                            <Badge key={p.id} className={`text-[10px] ${(statusConfig[p.status] || statusConfig.Outpatient).class}`}>{p.name.split(" ")[0]}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-heading flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {selectedWard ? `${selectedWard} - Patients` : "All Patients"}
                    <Badge variant="secondary" className="ml-1">{(selectedWard ? filteredPatients.filter(p => p.ward === selectedWard) : filteredPatients).length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {patientsLoading ? (
                    <div className="flex items-center justify-center py-10 text-muted-foreground">Loading...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead className="hidden md:table-cell">Ward / Bed</TableHead>
                          <TableHead className="hidden lg:table-cell">Complaint</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(selectedWard ? filteredPatients.filter(p => p.ward === selectedWard) : filteredPatients).map((p, i) => (
                          <motion.tr key={p.id} className="border-b transition-colors hover:bg-muted/50" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                            <TableCell>
                              <p className="font-medium text-foreground">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.age}Y · {p.gender || "—"}</p>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{p.ward || "—"} · {p.bed_number || "—"}</TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[200px] truncate">{p.chief_complaint || p.diagnosis || "—"}</TableCell>
                            <TableCell>
                              <Badge className={`text-[10px] uppercase tracking-wide ${(statusConfig[p.status] || statusConfig.Outpatient).class}`}>
                                {(statusConfig[p.status] || statusConfig.Outpatient).label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" className="gap-1" onClick={() => setSelectedPatient(p)}>
                                <Eye className="w-3.5 h-3.5" /> View
                              </Button>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <PatientDetail
              patient={selectedPatient}
              vitals={patientVitals}
              medications={patientMeds}
              onBack={() => setSelectedPatient(null)}
              onAddVitals={() => setShowVitalsDialog(true)}
              onAdministerMed={handleAdministerMed}
            />
          )}
        </TabsContent>

        {/* MEDICATIONS TAB */}
        <TabsContent value="medications" className="mt-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Pill className="w-4 h-4" /> Medication Administration Record
                <Badge variant="secondary">{allMedications.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Drug</TableHead>
                    <TableHead className="hidden md:table-cell">Dose / Route</TableHead>
                    <TableHead className="hidden lg:table-cell">Frequency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allMedications.filter(m => {
                    const patient = patients.find(p => p.id === m.patient_id);
                    return !search || (patient?.name.toLowerCase().includes(search.toLowerCase()) || m.drug_name.toLowerCase().includes(search.toLowerCase()));
                  }).map((m, i) => {
                    const patient = patients.find(p => p.id === m.patient_id);
                    const config = medStatusConfig[m.status] || medStatusConfig.Pending;
                    return (
                      <motion.tr key={m.id} className="border-b transition-colors hover:bg-muted/50" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                        <TableCell>
                          <p className="font-medium text-foreground text-sm">{patient?.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{patient?.ward || "—"}</p>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{m.drug_name}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{m.dosage} · {m.route}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{m.frequency}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] gap-1 ${config.class}`}>{config.icon} {config.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {m.status === "Pending" ? (
                            <Button size="sm" className="gap-1 text-xs" onClick={() => handleAdministerMed(m.id)}>
                              <CheckCircle2 className="w-3 h-3" /> Give
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {m.administered_at ? new Date(m.administered_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                            </span>
                          )}
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VITALS TAB */}
        <TabsContent value="vitals" className="mt-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Activity className="w-4 h-4" /> Patient Vitals Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Temp (°C)</TableHead>
                    <TableHead className="hidden md:table-cell">BP (mmHg)</TableHead>
                    <TableHead className="hidden md:table-cell">Pulse</TableHead>
                    <TableHead className="hidden lg:table-cell">SpO₂</TableHead>
                    <TableHead className="hidden xl:table-cell">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allVitals.filter(v => {
                    const patient = patients.find(p => p.id === v.patient_id);
                    return !search || patient?.name.toLowerCase().includes(search.toLowerCase());
                  }).map((v, i) => {
                    const patient = patients.find(p => p.id === v.patient_id);
                    const tempHigh = (v.temperature || 0) >= 38;
                    const bpHigh = (v.systolic || 0) >= 140 || (v.diastolic || 0) >= 90;
                    const o2Low = (v.oxygen_sat || 100) < 94;
                    return (
                      <motion.tr key={v.id} className="border-b transition-colors hover:bg-muted/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                        <TableCell>
                          <p className="font-medium text-foreground text-sm">{patient?.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{patient?.ward || "—"}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(v.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </TableCell>
                        <TableCell className={`text-sm font-medium ${tempHigh ? "text-destructive" : "text-foreground"}`}>{v.temperature ?? "—"}°</TableCell>
                        <TableCell className={`hidden md:table-cell text-sm font-medium ${bpHigh ? "text-destructive" : "text-foreground"}`}>{v.systolic ?? "—"}/{v.diastolic ?? "—"}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-foreground">{v.pulse ?? "—"}</TableCell>
                        <TableCell className={`hidden lg:table-cell text-sm font-medium ${o2Low ? "text-destructive" : "text-foreground"}`}>{v.oxygen_sat ?? "—"}%</TableCell>
                        <TableCell className="hidden xl:table-cell text-xs text-muted-foreground max-w-[200px] truncate">{v.notes || "—"}</TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Vitals Dialog */}
      <Dialog open={showVitalsDialog} onOpenChange={setShowVitalsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Record Vitals — {selectedPatient?.name}</DialogTitle></DialogHeader>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label className="text-xs flex items-center gap-1"><Thermometer className="w-3 h-3" /> Temperature (°C)</Label><Input placeholder="36.5" value={vitalsForm.temperature} onChange={e => setVitalsForm(f => ({ ...f, temperature: e.target.value }))} /></div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Heart className="w-3 h-3" /> BP (mmHg)</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Input placeholder="Sys" value={vitalsForm.bpSys} onChange={e => setVitalsForm(f => ({ ...f, bpSys: e.target.value }))} />
                <Input placeholder="Dia" value={vitalsForm.bpDia} onChange={e => setVitalsForm(f => ({ ...f, bpDia: e.target.value }))} />
              </div>
            </div>
            <div><Label className="text-xs flex items-center gap-1"><Activity className="w-3 h-3" /> Pulse (bpm)</Label><Input placeholder="72" value={vitalsForm.pulse} onChange={e => setVitalsForm(f => ({ ...f, pulse: e.target.value }))} /></div>
            <div><Label className="text-xs flex items-center gap-1"><Wind className="w-3 h-3" /> Resp Rate (/min)</Label><Input placeholder="18" value={vitalsForm.respRate} onChange={e => setVitalsForm(f => ({ ...f, respRate: e.target.value }))} /></div>
            <div><Label className="text-xs flex items-center gap-1"><Droplets className="w-3 h-3" /> SpO₂ (%)</Label><Input placeholder="98" value={vitalsForm.oxygenSat} onChange={e => setVitalsForm(f => ({ ...f, oxygenSat: e.target.value }))} /></div>
          </div>
          <div><Label className="text-xs">Notes</Label><Textarea placeholder="Any observations..." value={vitalsForm.notes} onChange={e => setVitalsForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVitalsDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitVitals}>Save Vitals</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* Patient Detail Sub-Component */
interface PatientDetailProps {
  patient: Tables<"patients">;
  vitals: Tables<"vitals">[];
  medications: Tables<"medications">[];
  onBack: () => void;
  onAddVitals: () => void;
  onAdministerMed: (medId: string) => void;
}

const PatientDetail = ({ patient, vitals, medications, onBack, onAddVitals, onAdministerMed }: PatientDetailProps) => {
  const statusCfg = statusConfig[patient.status] || statusConfig.Outpatient;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card className="shadow-card gradient-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}><ChevronLeft className="w-5 h-5" /></Button>
            <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold text-lg">{patient.name.charAt(0)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-heading font-bold text-foreground">{patient.name}</h2>
                <Badge className={`text-[10px] ${statusCfg.class}`}>{statusCfg.label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{patient.age}Y · {patient.gender || "—"} · {patient.ward || "—"} · Bed {patient.bed_number || "—"}</p>
              <p className="text-sm text-muted-foreground">Dx: {patient.diagnosis || patient.chief_complaint || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-heading flex items-center gap-2"><Activity className="w-4 h-4" /> Vitals History</CardTitle>
              <Button size="sm" className="gap-1" onClick={onAddVitals}><Plus className="w-3 h-3" /> Record</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Temp</TableHead><TableHead>BP</TableHead><TableHead>Pulse</TableHead><TableHead>SpO₂</TableHead></TableRow></TableHeader>
              <TableBody>
                {vitals.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No vitals recorded</TableCell></TableRow>
                ) : vitals.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="text-xs text-muted-foreground">{new Date(v.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</TableCell>
                    <TableCell className={`text-sm ${(v.temperature || 0) >= 38 ? "text-destructive font-semibold" : "text-foreground"}`}>{v.temperature ?? "—"}°</TableCell>
                    <TableCell className={`text-sm ${(v.systolic || 0) >= 140 ? "text-destructive font-semibold" : "text-foreground"}`}>{v.systolic ?? "—"}/{v.diastolic ?? "—"}</TableCell>
                    <TableCell className="text-sm text-foreground">{v.pulse ?? "—"}</TableCell>
                    <TableCell className={`text-sm ${(v.oxygen_sat || 100) < 94 ? "text-destructive font-semibold" : "text-foreground"}`}>{v.oxygen_sat ?? "—"}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading flex items-center gap-2"><Pill className="w-4 h-4" /> Medication Chart</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Drug</TableHead><TableHead>Dose</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {medications.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No medications prescribed</TableCell></TableRow>
                ) : medications.map(m => {
                  const config = medStatusConfig[m.status] || medStatusConfig.Pending;
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium text-foreground text-sm">{m.drug_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.dosage} · {m.route}</TableCell>
                      <TableCell><Badge variant="outline" className={`text-[10px] gap-1 ${config.class}`}>{config.icon} {config.label}</Badge></TableCell>
                      <TableCell className="text-right">
                        {m.status === "Pending" && (
                          <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => onAdministerMed(m.id)}>
                            <CheckCircle2 className="w-3 h-3" /> Give
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default NursePage;
