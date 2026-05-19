import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, UserPlus, Activity, Thermometer, Heart, Wind, Ruler, Weight, Droplets } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { usePatients, useInsertPatient, useInsertVitals } from "@/hooks/use-clinic-data";

interface PatientForm {
  firstName: string;
  lastName: string;
  phone: string;
  ageYears: string;
  ageMonths: string;
  ageWeeks: string;
  gender: string;
  religion: string;
  address: string;
  dob: Date | undefined;
  refuseDob: boolean;
  nokName: string;
  nokRelationship: string;
  nokContact: string;
}

interface VitalsForm {
  temperature: string;
  bloodPressureSys: string;
  bloodPressureDia: string;
  pulse: string;
  respiratoryRate: string;
  oxygenSat: string;
  height: string;
  weight: string;
  chiefComplaint: string;
  symptoms: string;
  allergies: string;
  severity: string;
}

const initialPatient: PatientForm = {
  firstName: "", lastName: "", phone: "",
  ageYears: "", ageMonths: "", ageWeeks: "",
  gender: "", religion: "", address: "",
  dob: undefined, refuseDob: false,
  nokName: "", nokRelationship: "", nokContact: "",
};

const initialVitals: VitalsForm = {
  temperature: "", bloodPressureSys: "", bloodPressureDia: "",
  pulse: "", respiratoryRate: "", oxygenSat: "",
  height: "", weight: "", chiefComplaint: "", symptoms: "",
  allergies: "", severity: "",
};

const TriagePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<"registration" | "vitals">("registration");
  const [patient, setPatient] = useState<PatientForm>(initialPatient);
  const [vitals, setVitals] = useState<VitalsForm>(initialVitals);
  const [saving, setSaving] = useState(false);

  const { data: recentPatients = [] } = usePatients();
  const insertPatient = useInsertPatient();
  const insertVitals = useInsertVitals();

  // Queue = recently triaged patients
  const queue = recentPatients
    .filter(p => p.triaged_at)
    .slice(0, 20)
    .map(p => ({ name: p.name, severity: p.severity || "Mild", time: p.triaged_at ? new Date(p.triaged_at).toLocaleTimeString() : "" }));

  const updatePatient = (field: keyof PatientForm, value: string | Date | undefined | boolean) => {
    setPatient(prev => ({ ...prev, [field]: value }));
  };

  const updateVitals = (field: keyof VitalsForm, value: string) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  };

  const proceedToVitals = () => {
    if (!patient.firstName.trim() || !patient.lastName.trim()) {
      toast({ title: "Error", description: "First and last name are required.", variant: "destructive" });
      return;
    }
    if (!patient.gender) {
      toast({ title: "Error", description: "Please select gender.", variant: "destructive" });
      return;
    }
    setStep("vitals");
  };

  const submitTriage = async () => {
    if (!vitals.chiefComplaint.trim()) {
      toast({ title: "Error", description: "Chief complaint is required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const age = parseInt(patient.ageYears) || 0;
      const newPatient = await insertPatient.mutateAsync({
        name: `${patient.firstName} ${patient.lastName}`.toUpperCase(),
        age,
        phone: patient.phone || null,
        address: patient.address || null,
        religion: patient.religion || null,
        gender: patient.gender || null,
        dob: patient.dob ? format(patient.dob, "yyyy-MM-dd") : null,
        nok_name: patient.nokName || null,
        nok_relationship: patient.nokRelationship || null,
        nok_contact: patient.nokContact || null,
        chief_complaint: vitals.chiefComplaint,
        symptoms: vitals.symptoms || null,
        allergies: vitals.allergies || null,
        severity: vitals.severity || "Mild",
        status: "Outpatient",
        triaged_at: new Date().toISOString(),
      });

      // Save vitals
      if (vitals.temperature || vitals.bloodPressureSys || vitals.pulse) {
        await insertVitals.mutateAsync({
          patient_id: newPatient.id,
          temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
          systolic: vitals.bloodPressureSys ? parseInt(vitals.bloodPressureSys) : null,
          diastolic: vitals.bloodPressureDia ? parseInt(vitals.bloodPressureDia) : null,
          pulse: vitals.pulse ? parseInt(vitals.pulse) : null,
          respiratory_rate: vitals.respiratoryRate ? parseInt(vitals.respiratoryRate) : null,
          oxygen_sat: vitals.oxygenSat ? parseInt(vitals.oxygenSat) : null,
          notes: vitals.chiefComplaint || null,
        });
      }

      toast({ title: "Patient Triaged", description: `${patient.firstName} ${patient.lastName} added to queue as ${vitals.severity || "Mild"}.` });
      setPatient(initialPatient);
      setVitals(initialVitals);
      setStep("registration");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const bmi = vitals.height && vitals.weight
    ? (parseFloat(vitals.weight) / Math.pow(parseFloat(vitals.height) / 100, 2)).toFixed(1)
    : null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold text-foreground">Triage</h1>
          <p className="text-sm text-muted-foreground">Patient Registration & Vitals Assessment</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
          <Activity className="w-4 h-4" />
          Queue: {queue.length}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <div>
          <Tabs value={step} className="space-y-6">
            <TabsList className="grid grid-cols-2 w-full max-w-sm">
              <TabsTrigger value="registration" onClick={() => setStep("registration")} className="gap-1.5">
                <UserPlus className="w-4 h-4" /> Registration
              </TabsTrigger>
              <TabsTrigger value="vitals" disabled={step === "registration"} className="gap-1.5">
                <Activity className="w-4 h-4" /> Vitals
              </TabsTrigger>
            </TabsList>

            <TabsContent value="registration">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader><CardTitle className="text-lg">Patient Information</CardTitle></CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><Label className="text-xs">First Name *</Label><Input placeholder="Enter first name" value={patient.firstName} onChange={e => updatePatient("firstName", e.target.value)} /></div>
                      <div><Label className="text-xs">Last Name *</Label><Input placeholder="Enter last name" value={patient.lastName} onChange={e => updatePatient("lastName", e.target.value)} /></div>
                    </div>
                    <div><Label className="text-xs">Phone Number</Label><Input placeholder="Enter phone number" value={patient.phone} onChange={e => updatePatient("phone", e.target.value)} /></div>
                    <div>
                      <Label className="text-xs">Age</Label>
                      <div className="grid grid-cols-3 gap-3 mt-1">
                        <div><Input placeholder="Years" type="number" min="0" value={patient.ageYears} onChange={e => updatePatient("ageYears", e.target.value)} /><p className="text-[10px] text-muted-foreground mt-0.5 text-center">Years</p></div>
                        <div><Input placeholder="Months" type="number" min="0" max="11" value={patient.ageMonths} onChange={e => updatePatient("ageMonths", e.target.value)} /><p className="text-[10px] text-muted-foreground mt-0.5 text-center">Months</p></div>
                        <div><Input placeholder="Weeks" type="number" min="0" max="4" value={patient.ageWeeks} onChange={e => updatePatient("ageWeeks", e.target.value)} /><p className="text-[10px] text-muted-foreground mt-0.5 text-center">Weeks</p></div>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Gender *</Label>
                        <Select value={patient.gender} onValueChange={v => updatePatient("gender", v)}>
                          <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                          <SelectContent>{["Male", "Female"].map(g => <SelectItem key={g} value={g.toLowerCase()}>{g}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Religion</Label>
                        <Select value={patient.religion} onValueChange={v => updatePatient("religion", v)}>
                          <SelectTrigger><SelectValue placeholder="Select Religion" /></SelectTrigger>
                          <SelectContent>{["Christian", "Muslim", "Other"].map(r => <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div><Label className="text-xs">Address</Label><Input placeholder="Full address" value={patient.address} onChange={e => updatePatient("address", e.target.value)} /></div>
                    <div>
                      <Label className="text-xs">Date of Birth (Optional)</Label>
                      <div className="flex items-center gap-3 mt-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-[220px] justify-start text-left font-normal", !patient.dob && "text-muted-foreground")} disabled={patient.refuseDob}>
                              <CalendarIcon className="mr-2 h-4 w-4" />{patient.dob ? format(patient.dob, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={patient.dob} onSelect={d => updatePatient("dob", d)} disabled={date => date > new Date() || date < new Date("1900-01-01")} initialFocus className={cn("p-3 pointer-events-auto")} />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Checkbox checked={patient.refuseDob} onCheckedChange={checked => { updatePatient("refuseDob", !!checked); if (checked) updatePatient("dob", undefined); }} />
                        <Label className="text-xs cursor-pointer text-muted-foreground">Patient refuses to provide date of birth</Label>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-semibold text-foreground mb-3">Next of Kin Information (Optional)</h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div><Label className="text-xs">Next of Kin Name</Label><Input placeholder="Full name" value={patient.nokName} onChange={e => updatePatient("nokName", e.target.value)} /></div>
                        <div>
                          <Label className="text-xs">Relationship</Label>
                          <Select value={patient.nokRelationship} onValueChange={v => updatePatient("nokRelationship", v)}>
                            <SelectTrigger><SelectValue placeholder="Select Relationship" /></SelectTrigger>
                            <SelectContent>{["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"].map(r => <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="mt-3"><Label className="text-xs">Contact Number</Label><Input placeholder="Phone number" value={patient.nokContact} onChange={e => updatePatient("nokContact", e.target.value)} /></div>
                    </div>
                    <Button onClick={proceedToVitals} className="w-full sm:w-auto">Proceed to Triage <Activity className="w-4 h-4 ml-1" /></Button>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="vitals">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{patient.firstName} {patient.lastName}</p>
                    <p className="text-xs text-muted-foreground">{patient.gender} · {patient.ageYears ? `${patient.ageYears}y` : ""}{patient.ageMonths ? ` ${patient.ageMonths}m` : ""}{patient.ageWeeks ? ` ${patient.ageWeeks}w` : ""}</p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto" onClick={() => setStep("registration")}>Edit Info</Button>
                </div>
                <Card>
                  <CardHeader><CardTitle className="text-lg">Vital Signs</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <VitalInput icon={Thermometer} label="Temperature (°C)" value={vitals.temperature} onChange={v => updateVitals("temperature", v)} placeholder="e.g. 36.5" />
                      <div>
                        <Label className="text-xs flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-destructive" /> Blood Pressure (mmHg)</Label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <Input placeholder="Sys" type="number" value={vitals.bloodPressureSys} onChange={e => updateVitals("bloodPressureSys", e.target.value)} />
                          <Input placeholder="Dia" type="number" value={vitals.bloodPressureDia} onChange={e => updateVitals("bloodPressureDia", e.target.value)} />
                        </div>
                      </div>
                      <VitalInput icon={Activity} label="Pulse (bpm)" value={vitals.pulse} onChange={v => updateVitals("pulse", v)} placeholder="e.g. 72" />
                      <VitalInput icon={Wind} label="Respiratory Rate (/min)" value={vitals.respiratoryRate} onChange={v => updateVitals("respiratoryRate", v)} placeholder="e.g. 18" />
                      <VitalInput icon={Droplets} label="Oxygen Saturation (%)" value={vitals.oxygenSat} onChange={v => updateVitals("oxygenSat", v)} placeholder="e.g. 98" />
                      <VitalInput icon={Ruler} label="Height (cm)" value={vitals.height} onChange={v => updateVitals("height", v)} placeholder="e.g. 170" />
                      <VitalInput icon={Weight} label="Weight (kg)" value={vitals.weight} onChange={v => updateVitals("weight", v)} placeholder="e.g. 65" />
                      {bmi && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                          <span className="text-xs font-medium text-muted-foreground">BMI:</span>
                          <span className="text-lg font-heading font-bold text-foreground">{bmi}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-lg">Assessment</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs">Chief Complaint *</Label>
                      <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px] mt-1" placeholder="Describe the patient's main complaint..." value={vitals.chiefComplaint} onChange={e => updateVitals("chiefComplaint", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Signs & Symptoms</Label>
                      <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[60px] mt-1" placeholder="List observed signs and symptoms..." value={vitals.symptoms} onChange={e => updateVitals("symptoms", e.target.value)} />
                    </div>
                    <div><Label className="text-xs">Known Allergies</Label><Input placeholder="List known allergies or NKDA" value={vitals.allergies} onChange={e => updateVitals("allergies", e.target.value)} /></div>
                    <div>
                      <Label className="text-xs">Severity Level</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {[
                          { value: "Critical", color: "bg-destructive text-destructive-foreground" },
                          { value: "Moderate", color: "bg-clinic-orange text-primary-foreground" },
                          { value: "Mild", color: "bg-clinic-green text-primary-foreground" },
                        ].map(s => (
                          <button key={s.value} onClick={() => updateVitals("severity", s.value)} className={cn("px-4 py-2 rounded-lg text-sm font-medium border transition-all", vitals.severity === s.value ? s.color : "border-border text-foreground hover:bg-muted")}>
                            {s.value}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button onClick={submitTriage} disabled={saving}>{saving ? "Saving..." : "Submit to Queue"}</Button>
                      <Button variant="outline" onClick={() => setStep("registration")}>Back</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Triage Queue</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {queue.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No patients in queue</p>
              ) : (
                queue.map((q, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/30">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", q.severity === "Critical" ? "bg-destructive" : q.severity === "Moderate" ? "bg-clinic-orange" : "bg-clinic-green")} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{q.name}</p>
                      <p className="text-[10px] text-muted-foreground">{q.time}</p>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">{q.severity}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const VitalInput = ({ icon: Icon, label, value, onChange, placeholder }: {
  icon: React.ElementType; label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) => (
  <div>
    <Label className="text-xs flex items-center gap-1.5"><Icon className="w-3.5 h-3.5 text-primary" /> {label}</Label>
    <Input className="mt-1" type="number" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

export default TriagePage;
