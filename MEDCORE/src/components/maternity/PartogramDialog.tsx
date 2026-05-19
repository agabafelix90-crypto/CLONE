import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, BarChart3, Stethoscope, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, AreaChart, Area, BarChart, Bar,
} from "recharts";
import type { Mother, FHREntry, VEEntry, ContractionEntry, VitalsEntry, UrineEntry } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  mother: Mother;
}

type GraphType = "fhr" | "dilation" | "vitals" | "urine" | null;

const PartogramDialog = ({ open, onClose, mother }: Props) => {
  const { toast } = useToast();
  const [activeGraph, setActiveGraph] = useState<GraphType>(null);

  const [maternal, setMaternal] = useState({
    lnmp: mother.lnmp, dateAdmission: "", timeAdmission: "",
    gravida: mother.gravida, para: mother.para, weeksGestation: "",
    membranesRuptured: "", riskFactors: "",
  });
  const [maternalConfirmed, setMaternalConfirmed] = useState(false);

  const [fhr, setFhr] = useState<FHREntry[]>([]);
  const [ve, setVe] = useState<VEEntry[]>([]);
  const [contractions, setContractions] = useState<ContractionEntry[]>([]);
  const [vitals, setVitals] = useState<VitalsEntry[]>([]);
  const [urine, setUrine] = useState<UrineEntry[]>([]);
  const [notes, setNotes] = useState("");
  const [drugs, setDrugs] = useState("");
  const [prescription, setPrescription] = useState("");

  const addEntry = <T extends { id: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, template: Omit<T, "id">) => {
    setter((prev) => [...prev, { ...template, id: `${Date.now()}` } as T]);
  };

  const removeEntry = <T extends { id: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: string) => {
    setter((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEntry = <T extends { id: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: string, key: string, value: string) => {
    setter((prev) => prev.map((e) => (e.id === id ? { ...e, [key]: value } : e)));
  };

  const SectionCard = ({ title, children, onAdd, onGraph }: { title: string; children: React.ReactNode; onAdd?: () => void; onGraph?: () => void }) => (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-heading">{title}</CardTitle>
          <div className="flex gap-1">
            {onAdd && <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={onAdd}><Plus className="w-3 h-3" /> Add</Button>}
            {onGraph && <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={onGraph}><BarChart3 className="w-3 h-3" /> Graph</Button>}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );

  const EmptyState = ({ label }: { label: string }) => (
    <p className="text-xs text-muted-foreground italic py-2">No {label} data yet</p>
  );

  // Chart renderers
  const renderFHRChart = () => {
    const data = fhr.map((e) => ({ time: e.time, rate: parseFloat(e.rate) || 0 }));
    if (data.length === 0) return <p className="text-xs text-muted-foreground italic text-center py-8">Add FHR entries to see the graph</p>;
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
          <YAxis domain={[80, 200]} tick={{ fontSize: 11 }} className="fill-muted-foreground" label={{ value: "bpm", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }} />
          <ReferenceLine y={160} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: "High", position: "right", style: { fontSize: 10, fill: "hsl(var(--destructive))" } }} />
          <ReferenceLine y={110} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: "Normal", position: "right", style: { fontSize: 10, fill: "hsl(var(--primary))" } }} />
          <ReferenceLine y={100} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: "Low", position: "right", style: { fontSize: 10, fill: "hsl(var(--destructive))" } }} />
          <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} name="FHR (bpm)" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderDilationChart = () => {
    const data = ve.map((e) => ({ time: e.time, dilation: parseFloat(e.dilation) || 0, descent: parseFloat(e.descent) || 0 }));
    if (data.length === 0) return <p className="text-xs text-muted-foreground italic text-center py-8">Add VE entries to see the graph</p>;
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="left" domain={[0, 10]} tick={{ fontSize: 11 }} label={{ value: "cm", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 5]} tick={{ fontSize: 11 }} label={{ value: "Descent", angle: 90, position: "insideRight", style: { fontSize: 11 } }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {/* Alert & Action lines (WHO partograph standard) */}
          <ReferenceLine yAxisId="left" y={4} stroke="hsl(var(--destructive)/0.5)" strokeDasharray="6 3" label={{ value: "Active Phase", position: "right", style: { fontSize: 9, fill: "hsl(var(--destructive))" } }} />
          <Line yAxisId="left" type="monotone" dataKey="dilation" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} name="Dilation (cm)" />
          <Line yAxisId="right" type="monotone" dataKey="descent" stroke="hsl(var(--accent-foreground))" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} name="Descent" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderVitalsChart = () => {
    const data = vitals.map((e) => {
      const bpParts = e.bp.split("/");
      return {
        time: e.time,
        systolic: parseFloat(bpParts[0]) || 0,
        diastolic: parseFloat(bpParts[1]) || 0,
        pulse: parseFloat(e.pulse) || 0,
        temp: parseFloat(e.temp) || 0,
      };
    });
    if (data.length === 0) return <p className="text-xs text-muted-foreground italic text-center py-8">Add vitals entries to see the graph</p>;
    return (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="systolic" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} name="Systolic BP" />
          <Line type="monotone" dataKey="diastolic" stroke="hsl(0 70% 50%)" strokeWidth={2} dot={{ r: 3 }} name="Diastolic BP" />
          <Line type="monotone" dataKey="pulse" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Pulse" />
          <Line type="monotone" dataKey="temp" stroke="hsl(var(--accent-foreground))" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 3 }} name="Temp (°C)" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderUrineChart = () => {
    const data = urine.map((e) => ({ time: e.time, volume: parseFloat(e.volume) || 0 }));
    if (data.length === 0) return <p className="text-xs text-muted-foreground italic text-center py-8">Add urine entries to see the graph</p>;
    return (
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} label={{ value: "ml", angle: -90, position: "insideLeft", style: { fontSize: 11 } }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }} />
          <Area type="monotone" dataKey="volume" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.15)" strokeWidth={2} name="Volume (ml)" />
          <ReferenceLine y={30} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: "Min Output", position: "right", style: { fontSize: 9, fill: "hsl(var(--destructive))" } }} />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const graphTitles: Record<string, string> = {
    fhr: "Fetal Heart Rate Trend",
    dilation: "Cervical Dilation & Descent",
    vitals: "Maternal Vitals Trend",
    urine: "Urine Output Trend",
  };

  const renderActiveGraph = () => {
    switch (activeGraph) {
      case "fhr": return renderFHRChart();
      case "dilation": return renderDilationChart();
      case "vitals": return renderVitalsChart();
      case "urine": return renderUrineChart();
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="font-heading flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            Labor Progress Tracker for {mother.name}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[75vh]">
          <div className="px-4 pb-4 space-y-4">
            {/* Graph overlay */}
            {activeGraph && (
              <Card className="border-2 border-primary/30 shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-heading flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      {graphTitles[activeGraph]}
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setActiveGraph(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>{renderActiveGraph()}</CardContent>
              </Card>
            )}

            {/* Maternal Information */}
            <SectionCard title="MATERNAL INFORMATION">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Name</Label><Input value={mother.name} readOnly className="bg-muted h-8 text-sm" /></div>
                <div><Label className="text-xs">Age</Label><Input value={String(mother.age)} readOnly className="bg-muted h-8 text-sm" /></div>
                <div><Label className="text-xs">LNMP</Label><Input type="date" className="h-8 text-sm" value={maternal.lnmp} onChange={(e) => setMaternal({ ...maternal, lnmp: e.target.value })} /></div>
                <div><Label className="text-xs">Date of Admission</Label><Input type="date" className="h-8 text-sm" value={maternal.dateAdmission} onChange={(e) => setMaternal({ ...maternal, dateAdmission: e.target.value })} /></div>
                <div><Label className="text-xs">Time of Admission</Label><Input type="time" className="h-8 text-sm" value={maternal.timeAdmission} onChange={(e) => setMaternal({ ...maternal, timeAdmission: e.target.value })} /></div>
                <div><Label className="text-xs">Gravida</Label><Input className="h-8 text-sm" value={maternal.gravida} onChange={(e) => setMaternal({ ...maternal, gravida: e.target.value })} /></div>
                <div><Label className="text-xs">Para</Label><Input className="h-8 text-sm" value={maternal.para} onChange={(e) => setMaternal({ ...maternal, para: e.target.value })} /></div>
                <div><Label className="text-xs">Weeks of Gestation</Label><Input className="h-8 text-sm" value={maternal.weeksGestation} onChange={(e) => setMaternal({ ...maternal, weeksGestation: e.target.value })} /></div>
                <div><Label className="text-xs">Membranes Ruptured At</Label><Input className="h-8 text-sm" value={maternal.membranesRuptured} onChange={(e) => setMaternal({ ...maternal, membranesRuptured: e.target.value })} /></div>
                <div><Label className="text-xs">Risk Factors</Label><Input className="h-8 text-sm" value={maternal.riskFactors} onChange={(e) => setMaternal({ ...maternal, riskFactors: e.target.value })} /></div>
              </div>
              {!maternalConfirmed && (
                <Button size="sm" className="mt-3" onClick={() => { setMaternalConfirmed(true); toast({ title: "Maternal details confirmed" }); }}>
                  Confirm Maternal Details
                </Button>
              )}
            </SectionCard>

            {/* FHR */}
            <SectionCard
              title="FETAL MONITORING"
              onAdd={() => addEntry(setFhr, { time: "", rate: "" })}
              onGraph={() => setActiveGraph(activeGraph === "fhr" ? null : "fhr")}
            >
              {fhr.length === 0 ? <EmptyState label="fetal heart rate" /> : (
                <Table>
                  <TableHeader><TableRow><TableHead className="text-xs">Time</TableHead><TableHead className="text-xs">Rate (bpm)</TableHead><TableHead className="w-8" /></TableRow></TableHeader>
                  <TableBody>
                    {fhr.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="p-1"><Input type="time" className="h-7 text-xs" value={e.time} onChange={(ev) => updateEntry(setFhr, e.id, "time", ev.target.value)} /></TableCell>
                        <TableCell className="p-1"><Input className="h-7 text-xs" value={e.rate} onChange={(ev) => updateEntry(setFhr, e.id, "rate", ev.target.value)} /></TableCell>
                        <TableCell className="p-1"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeEntry(setFhr, e.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </SectionCard>

            {/* Cervical Dilation */}
            <SectionCard
              title="CERVICAL DILATION"
              onAdd={() => addEntry(setVe, { time: "", dilation: "", descent: "" })}
              onGraph={() => setActiveGraph(activeGraph === "dilation" ? null : "dilation")}
            >
              {ve.length === 0 ? <EmptyState label="cervical dilation" /> : (
                <Table>
                  <TableHeader><TableRow><TableHead className="text-xs">Time</TableHead><TableHead className="text-xs">Dilation (cm)</TableHead><TableHead className="text-xs">Descent</TableHead><TableHead className="w-8" /></TableRow></TableHeader>
                  <TableBody>
                    {ve.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="p-1"><Input type="time" className="h-7 text-xs" value={e.time} onChange={(ev) => updateEntry(setVe, e.id, "time", ev.target.value)} /></TableCell>
                        <TableCell className="p-1"><Input className="h-7 text-xs" value={e.dilation} onChange={(ev) => updateEntry(setVe, e.id, "dilation", ev.target.value)} /></TableCell>
                        <TableCell className="p-1"><Input className="h-7 text-xs" value={e.descent} onChange={(ev) => updateEntry(setVe, e.id, "descent", ev.target.value)} /></TableCell>
                        <TableCell className="p-1"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeEntry(setVe, e.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </SectionCard>

            {/* Contractions */}
            <SectionCard title="CONTRACTIONS" onAdd={() => addEntry(setContractions, { time: "", frequency: "", duration: "", strength: "" })}>
              {contractions.length === 0 ? <EmptyState label="contractions" /> : (
                <Table>
                  <TableHeader><TableRow><TableHead className="text-xs">Time</TableHead><TableHead className="text-xs">Freq (per 10min)</TableHead><TableHead className="text-xs">Duration (sec)</TableHead><TableHead className="text-xs">Strength</TableHead><TableHead className="w-8" /></TableRow></TableHeader>
                  <TableBody>
                    {contractions.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="p-1"><Input type="time" className="h-7 text-xs" value={e.time} onChange={(ev) => updateEntry(setContractions, e.id, "time", ev.target.value)} /></TableCell>
                        <TableCell className="p-1"><Input className="h-7 text-xs" value={e.frequency} onChange={(ev) => updateEntry(setContractions, e.id, "frequency", ev.target.value)} /></TableCell>
                        <TableCell className="p-1"><Input className="h-7 text-xs" value={e.duration} onChange={(ev) => updateEntry(setContractions, e.id, "duration", ev.target.value)} /></TableCell>
                        <TableCell className="p-1"><Input className="h-7 text-xs" value={e.strength} onChange={(ev) => updateEntry(setContractions, e.id, "strength", ev.target.value)} /></TableCell>
                        <TableCell className="p-1"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeEntry(setContractions, e.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </SectionCard>

            {/* Mother's Vitals */}
            <SectionCard
              title="MOTHER'S VITALS"
              onAdd={() => addEntry(setVitals, { time: "", bp: "", pulse: "", temp: "" })}
              onGraph={() => setActiveGraph(activeGraph === "vitals" ? null : "vitals")}
            >
              {vitals.length === 0 ? <EmptyState label="mother's vitals" /> : (
                <Table>
                  <TableHeader><TableRow><TableHead className="text-xs">Time</TableHead><TableHead className="text-xs">BP</TableHead><TableHead className="text-xs">Pulse</TableHead><TableHead className="text-xs">Temp (°C)</TableHead><TableHead className="w-8" /></TableRow></TableHeader>
                  <TableBody>
                    {vitals.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="p-1"><Input type="time" className="h-7 text-xs" value={e.time} onChange={(ev) => updateEntry(setVitals, e.id, "time", ev.target.value)} /></TableCell>
                        <TableCell className="p-1"><Input className="h-7 text-xs" value={e.bp} onChange={(ev) => updateEntry(setVitals, e.id, "bp", ev.target.value)} /></TableCell>
                        <TableCell className="p-1"><Input className="h-7 text-xs" value={e.pulse} onChange={(ev) => updateEntry(setVitals, e.id, "pulse", ev.target.value)} /></TableCell>
                        <TableCell className="p-1"><Input className="h-7 text-xs" value={e.temp} onChange={(ev) => updateEntry(setVitals, e.id, "temp", ev.target.value)} /></TableCell>
                        <TableCell className="p-1"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeEntry(setVitals, e.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </SectionCard>

            {/* Urine */}
            <SectionCard
              title="URINE OUTPUT AND ANALYSIS"
              onAdd={() => addEntry(setUrine, { time: "", volume: "", protein: "", acetone: "" })}
              onGraph={() => setActiveGraph(activeGraph === "urine" ? null : "urine")}
            >
              {urine.length === 0 ? <EmptyState label="urine" /> : (
                <Table>
                  <TableHeader><TableRow><TableHead className="text-xs">Time</TableHead><TableHead className="text-xs">Volume (ml)</TableHead><TableHead className="text-xs">Protein</TableHead><TableHead className="text-xs">Acetone</TableHead><TableHead className="w-8" /></TableRow></TableHeader>
                  <TableBody>
                    {urine.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="p-1"><Input type="time" className="h-7 text-xs" value={e.time} onChange={(ev) => updateEntry(setUrine, e.id, "time", ev.target.value)} /></TableCell>
                        <TableCell className="p-1"><Input className="h-7 text-xs" value={e.volume} onChange={(ev) => updateEntry(setUrine, e.id, "volume", ev.target.value)} /></TableCell>
                        <TableCell className="p-1"><Input className="h-7 text-xs" value={e.protein} onChange={(ev) => updateEntry(setUrine, e.id, "protein", ev.target.value)} /></TableCell>
                        <TableCell className="p-1"><Input className="h-7 text-xs" value={e.acetone} onChange={(ev) => updateEntry(setUrine, e.id, "acetone", ev.target.value)} /></TableCell>
                        <TableCell className="p-1"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeEntry(setUrine, e.id)}><Trash2 className="w-3 h-3" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </SectionCard>

            {/* Notes */}
            <SectionCard title="NOTES">
              <textarea className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Add labor notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </SectionCard>

            {/* Drugs */}
            <SectionCard title="DRUGS GIVEN DURING LABOUR">
              {!drugs && <p className="text-xs text-muted-foreground italic">No drugs given to this mother yet.</p>}
              <textarea className="w-full min-h-[40px] rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" placeholder="Chart drugs given..." value={drugs} onChange={(e) => setDrugs(e.target.value)} />
            </SectionCard>

            {/* Prescription */}
            <SectionCard title="PRESCRIPTION">
              {!prescription && <p className="text-xs text-muted-foreground italic">No prescriptions for this mother.</p>}
              <textarea className="w-full min-h-[40px] rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" placeholder="Make a prescription..." value={prescription} onChange={(e) => setPrescription(e.target.value)} />
            </SectionCard>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PartogramDialog;
