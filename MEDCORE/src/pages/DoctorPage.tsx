import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Stethoscope, UserPlus, FolderOpen, Baby, Heart,
  Clock, ChevronRight, Search, Filter, MoreVertical,
  Activity, FileText, Pill, FlaskConical, Microscope
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { usePatients } from "@/hooks/use-clinic-data";
import type { Tables } from "@/integrations/supabase/types";
import OrderLabTestDialog from "@/components/doctor/OrderLabTestDialog";
import OrderRadiologyDialog from "@/components/doctor/OrderRadiologyDialog";
import AttendPatientDialog from "@/components/doctor/AttendPatientDialog";
import PatientFileDialog from "@/components/doctor/PatientFileDialog";

const severityColor: Record<string, string> = {
  Critical: "bg-destructive text-destructive-foreground",
  critical: "bg-destructive text-destructive-foreground",
  Moderate: "bg-[hsl(var(--clinic-orange))] text-white",
  moderate: "bg-[hsl(var(--clinic-orange))] text-white",
  Mild: "bg-[hsl(var(--clinic-green))] text-white",
  mild: "bg-[hsl(var(--clinic-green))] text-white",
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const DoctorPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("triage");
  const [labOrderPatient, setLabOrderPatient] = useState<Tables<"patients"> | null>(null);
  const [radiologyOrderPatient, setRadiologyOrderPatient] = useState<Tables<"patients"> | null>(null);
  const [attendPatient, setAttendPatient] = useState<Tables<"patients"> | null>(null);
  const [patientFilePatient, setPatientFilePatient] = useState<Tables<"patients"> | null>(null);

  const { data: allPatients = [], isLoading } = usePatients();

  // Categorize patients by status for the doctor workflow
  const triageQueue = allPatients.filter(p => p.status === "Outpatient" && p.triaged_at);
  const admittedQueue = allPatients.filter(p => p.status === "Admitted");
  const maternityQueue = allPatients.filter(p => ["On Antenatal", "In Labour", "Post Natal"].includes(p.status));
  const dischargedQueue = allPatients.filter(p => p.status === "Discharged");

  const queueMap: Record<string, { data: Tables<"patients">[]; icon: React.ReactNode; label: string }> = {
    triage: { data: triageQueue, icon: <Activity className="w-4 h-4" />, label: "From Triage" },
    admitted: { data: admittedQueue, icon: <span className="text-sm">🏥</span>, label: "Admitted" },
    maternity: { data: maternityQueue, icon: <Baby className="w-4 h-4" />, label: "Maternity" },
    discharged: { data: dischargedQueue, icon: <FileText className="w-4 h-4" />, label: "Discharged" },
  };

  const currentQueue = queueMap[activeTab];
  const filtered = currentQueue.data.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleAttend = (patient: Tables<"patients">) => {
    setAttendPatient(patient);
  };

  const stats = [
    { label: "From Triage", value: triageQueue.length, icon: <Activity className="w-5 h-5" />, color: "text-primary", bg: "bg-primary/10", tab: "triage", emoji: "🩺" },
    { label: "Admitted", value: admittedQueue.length, icon: <span className="text-lg">🏥</span>, color: "text-[hsl(var(--clinic-gold))]", bg: "bg-[hsl(var(--clinic-gold))]/10", tab: "admitted", emoji: "🛏️" },
    { label: "Maternity", value: maternityQueue.length, icon: <Baby className="w-5 h-5" />, color: "text-accent", bg: "bg-accent/10", tab: "maternity", emoji: "🤱" },
    { label: "Discharged", value: dischargedQueue.length, icon: <FileText className="w-5 h-5" />, color: "text-[hsl(var(--clinic-green))]", bg: "bg-[hsl(var(--clinic-green))]/10", tab: "discharged", emoji: "✅" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground">Doctor's Portal</h1>
            <p className="text-sm text-muted-foreground">Patient queues &amp; clinical workflow</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search patient..." className="pl-9 w-56" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
            <Card className={`cursor-pointer transition-all hover:shadow-md ${activeTab === s.tab ? "ring-2 ring-primary shadow-card" : ""}`} onClick={() => setActiveTab(s.tab)}>
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

      <div className="grid lg:grid-cols-[1fr_280px] gap-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  {currentQueue.icon}
                  {currentQueue.label}
                  <Badge variant="secondary" className="ml-1">{filtered.length}</Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">Loading patients...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead className="hidden md:table-cell">Age / Gender</TableHead>
                      <TableHead className="hidden lg:table-cell">Complaint</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead className="hidden sm:table-cell">Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No patients in this queue</TableCell></TableRow>
                    ) : (
                      filtered.map((p, i) => (
                        <motion.tr key={p.id} className="border-b transition-colors hover:bg-muted/50" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                          <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{p.age}Y · {p.gender || "—"}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[200px] truncate">{p.chief_complaint || p.diagnosis || "—"}</TableCell>
                          <TableCell>
                            <Badge className={`${severityColor[p.severity || "Mild"] || "bg-muted text-muted-foreground"} text-[10px] uppercase tracking-wide`}>
                              {p.severity || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{p.status}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleAttend(p)}><Stethoscope className="w-4 h-4 mr-2" /> Attend Patient</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setPatientFilePatient(p)}><FolderOpen className="w-4 h-4 mr-2" /> View File</DropdownMenuItem>
                                <DropdownMenuItem><Pill className="w-4 h-4 mr-2" /> Prescribe</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLabOrderPatient(p)}><FlaskConical className="w-4 h-4 mr-2" /> Order Lab</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setRadiologyOrderPatient(p)}><Microscope className="w-4 h-4 mr-2" /> Order Radiology</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
            <Card className="shadow-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-heading uppercase tracking-wider text-muted-foreground">Modules</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                {[
                  { label: "Maternity", icon: <Baby className="w-4 h-4" />, emoji: "🤱", path: "/dashboard/maternity" },
                  { label: "Nurses", icon: <Heart className="w-4 h-4" />, emoji: "🩺", path: "/dashboard/nurse" },
                  { label: "Triage", icon: <Activity className="w-4 h-4" />, emoji: "🔬", path: "/dashboard/triage" },
                ].map((m) => (
                  <Button key={m.label} variant="ghost" className="w-full justify-start gap-2 text-sm" onClick={() => navigate(m.path)}>
                    {m.icon}<span>{m.emoji} {m.label}</span><ChevronRight className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
                  </Button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      {labOrderPatient && (
        <OrderLabTestDialog
          open={!!labOrderPatient}
          onOpenChange={(open) => !open && setLabOrderPatient(null)}
          patient={labOrderPatient}
        />
      )}
      {radiologyOrderPatient && (
        <OrderRadiologyDialog
          open={!!radiologyOrderPatient}
          onOpenChange={(open) => !open && setRadiologyOrderPatient(null)}
          patient={radiologyOrderPatient}
        />
      )}
      {attendPatient && (
        <AttendPatientDialog
          open={!!attendPatient}
          onOpenChange={(open) => !open && setAttendPatient(null)}
          patient={attendPatient}
        />
      )}
      {patientFilePatient && (
        <PatientFileDialog
          open={!!patientFilePatient}
          onOpenChange={(open) => !open && setPatientFilePatient(null)}
          patient={patientFilePatient}
        />
      )}
    </div>
  );
};

export default DoctorPage;
