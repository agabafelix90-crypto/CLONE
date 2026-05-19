import { useState } from "react";
import { motion } from "framer-motion";
import { Baby, UserPlus, Users, Search, Phone, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { usePatients, useInsertPatient } from "@/hooks/use-clinic-data";
import type { Tables } from "@/integrations/supabase/types";
import type { Mother } from "@/components/maternity/types";
import AntenatalCardDialog from "@/components/maternity/AntenatalCardDialog";
import ObstetricHistoryDialog from "@/components/maternity/ObstetricHistoryDialog";
import AntenatalProgressDialog from "@/components/maternity/AntenatalProgressDialog";
import PartogramDialog from "@/components/maternity/PartogramDialog";
import LabourOutcomesDialog from "@/components/maternity/LabourOutcomesDialog";

const statusColor: Record<string, string> = {
  "Just Come": "bg-muted text-muted-foreground",
  "On Antenatal": "bg-primary/15 text-primary",
  "Post Natal": "bg-[hsl(var(--clinic-green))]/15 text-[hsl(var(--clinic-green))]",
  "In Labour": "bg-destructive/15 text-destructive",
  "Discharged": "bg-secondary text-secondary-foreground",
};

// Convert DB patient to Mother type for dialogs
const toMother = (p: Tables<"patients">): Mother => ({
  id: p.id,
  name: p.name,
  age: p.age,
  phone: p.phone || "",
  edd: p.edd || "",
  status: (p.status as Mother["status"]) || "Just Come",
  address: p.address || "",
  religion: p.religion || "",
  gravida: p.gravida || "",
  para: p.para || "",
  abortions: p.abortions || "",
  bloodGroup: p.blood_group || "",
  rhesus: p.rhesus || "",
  lnmp: p.lnmp || "",
});

const MaternityPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedMother, setSelectedMother] = useState<Mother | null>(null);
  const [dialog, setDialog] = useState<"antenatal" | "obstetric" | "progress" | "partogram" | "labour" | null>(null);

  const { data: allPatients = [], isLoading } = usePatients();
  const insertPatient = useInsertPatient();

  // Filter to maternity statuses
  const maternityStatuses = ["Just Come", "On Antenatal", "Post Natal", "In Labour", "Discharged"];
  const mothers = allPatients.filter(p => maternityStatuses.includes(p.status));

  const filtered = mothers.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || (m.phone || "").includes(search)
  );

  const ancCount = mothers.filter((m) => m.status === "On Antenatal").length;

  const openDialog = (patient: Tables<"patients">, d: typeof dialog) => {
    setSelectedMother(toMother(patient));
    setDialog(d);
  };

  const closeDialog = () => {
    setDialog(null);
    setSelectedMother(null);
  };

  const handleAddMother = async (name: string, age: string, phone: string, address: string, religion: string) => {
    try {
      await insertPatient.mutateAsync({
        name: name.toUpperCase(),
        age: parseInt(age) || 0,
        phone: phone || null,
        address: address || null,
        religion: religion || null,
        status: "Just Come",
        edd: "Not yet on ANC",
      });
      toast({ title: "Mother Added", description: `${name} has been registered.` });
      setAddOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
            <Baby className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground">Maternity Center Dashboard</h1>
            <p className="text-sm text-muted-foreground">Overview of Maternity Services</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search mothers..." className="pl-9 w-56" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Mothers on ANC", value: ancCount, icon: <Users className="w-5 h-5" />, color: "text-primary", bg: "bg-primary/10" },
          { label: "Total Mothers", value: mothers.length, icon: <Baby className="w-5 h-5" />, color: "text-accent", bg: "bg-accent/10" },
          { label: "Post Natal", value: mothers.filter((m) => m.status === "Post Natal").length, icon: <span className="text-lg">🤱</span>, color: "text-[hsl(var(--clinic-green))]", bg: "bg-[hsl(var(--clinic-green))]/10" },
          { label: "Just Come", value: mothers.filter((m) => m.status === "Just Come").length, icon: <span className="text-lg">🆕</span>, color: "text-[hsl(var(--clinic-orange))]", bg: "bg-[hsl(var(--clinic-orange))]/10" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}>{s.icon}</div>
                <div>
                  <p className="text-2xl font-heading font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button className="gap-2" onClick={() => toast({ title: "See All Mothers", description: `${mothers.length} mothers registered` })}>
          <Users className="w-4 h-4" /> See All Mothers
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => setAddOpen(true)}>
          <UserPlus className="w-4 h-4" /> Add New Mother
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">
            {isLoading ? "Loading..." : `Top 10 Expected Deliveries`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 && !isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">No mothers registered yet. Add a new mother to get started.</p>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.slice(0, 10).map((patient, i) => (
                <motion.div key={patient.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Card className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-heading font-bold text-sm text-foreground">{patient.name}</h3>
                          <p className="text-xs text-muted-foreground">Age: {patient.age}</p>
                        </div>
                        <Badge className={`text-[10px] ${statusColor[patient.status] || "bg-muted text-muted-foreground"}`}>{patient.status}</Badge>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {patient.phone || "—"}</p>
                        <p className="flex items-center gap-1"><Calendar className="w-3 h-3" /> EDD: {patient.edd || "—"}</p>
                      </div>
                      <Tabs defaultValue="anc" className="w-full">
                        <TabsList className="w-full h-8">
                          <TabsTrigger value="anc" className="text-[11px] flex-1">🍼 ANC & Partogram</TabsTrigger>
                          <TabsTrigger value="labour" className="text-[11px] flex-1">🤰 Labour Outcomes</TabsTrigger>
                        </TabsList>
                        <TabsContent value="anc" className="mt-2 space-y-1.5">
                          <Button variant="outline" size="sm" className="w-full text-xs justify-start" onClick={() => openDialog(patient, "obstetric")}>Obstetric History</Button>
                          <Button variant="outline" size="sm" className="w-full text-xs justify-start" onClick={() => openDialog(patient, "progress")}>Antenatal Progress Examination</Button>
                          <Button variant="outline" size="sm" className="w-full text-xs justify-start" onClick={() => openDialog(patient, "partogram")}>Partogram</Button>
                          <Button size="sm" className="w-full text-xs" onClick={() => openDialog(patient, "antenatal")}>Open Antenatal Card</Button>
                        </TabsContent>
                        <TabsContent value="labour" className="mt-2">
                          <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => openDialog(patient, "labour")}>View Labour Outcomes</Button>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Mother Dialog - inline simple version */}
      <AddMotherInline open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAddMother} />

      {selectedMother && dialog === "antenatal" && <AntenatalCardDialog open onClose={closeDialog} mother={selectedMother} />}
      {selectedMother && dialog === "obstetric" && <ObstetricHistoryDialog open onClose={closeDialog} mother={selectedMother} />}
      {selectedMother && dialog === "progress" && <AntenatalProgressDialog open onClose={closeDialog} mother={selectedMother} />}
      {selectedMother && dialog === "partogram" && <PartogramDialog open onClose={closeDialog} mother={selectedMother} />}
      {selectedMother && dialog === "labour" && <LabourOutcomesDialog open onClose={closeDialog} mother={selectedMother} />}
    </div>
  );
};

// Simple inline add mother dialog
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AddMotherInline = ({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (name: string, age: string, phone: string, address: string, religion: string) => void }) => {
  const [form, setForm] = useState({ name: "", age: "", phone: "", address: "", religion: "" });

  const handleSubmit = () => {
    if (!form.name.trim() || !form.age.trim()) return;
    onAdd(form.name.trim(), form.age, form.phone.trim(), form.address.trim(), form.religion);
    setForm({ name: "", age: "", phone: "", address: "", religion: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="font-heading">Add New Mother</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Full Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. MULUGI IMMACULATE" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Age *</Label><Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="26" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="07XXXXXXXX" /></div>
          </div>
          <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div>
            <Label>Religion</Label>
            <Select value={form.religion} onValueChange={(v) => setForm({ ...form, religion: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{["Christian", "Muslim", "Hindu", "Other"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name.trim() || !form.age.trim()}>Add Mother</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaternityPage;
