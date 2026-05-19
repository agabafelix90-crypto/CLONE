import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User, Calendar, FileText, Pill, FlaskConical, Microscope,
  Heart, Activity, Phone, MapPin, Clock, Stethoscope
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface PatientFileDialogProps {
  patient: Tables<"patients"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<string, string> = {
  "Just Come": "bg-muted text-muted-foreground",
  "Admitted": "bg-accent/15 text-accent",
  "Outpatient": "bg-primary/15 text-primary",
  "In Labour": "bg-destructive/15 text-destructive",
  "On Antenatal": "bg-primary/15 text-primary",
  "Post Natal": "bg-primary/10 text-primary",
  "Discharged": "bg-muted text-muted-foreground",
};

const severityColors: Record<string, string> = {
  Critical: "bg-destructive text-destructive-foreground",
  critical: "bg-destructive text-destructive-foreground",
  Moderate: "bg-[hsl(var(--clinic-orange))] text-white",
  moderate: "bg-[hsl(var(--clinic-orange))] text-white",
  Mild: "bg-[hsl(var(--clinic-green))] text-white",
  mild: "bg-[hsl(var(--clinic-green))] text-white",
};

export default function PatientFileDialog({ patient, open, onOpenChange }: PatientFileDialogProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch patient appointments
  const { data: appointments = [] } = useQuery({
    queryKey: ["patient-appointments", patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patient.id)
        .order("appointment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!patient?.id && open,
  });

  // Fetch patient lab tests
  const { data: labTests = [] } = useQuery({
    queryKey: ["patient-lab-tests", patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      const { data, error } = await supabase
        .from("lab_tests")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!patient?.id && open,
  });

  // Fetch patient prescriptions
  const { data: prescriptions = [] } = useQuery({
    queryKey: ["patient-prescriptions", patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      const { data, error } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!patient?.id && open,
  });

  if (!patient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="w-5 h-5" />
            Patient File: {patient.name}
            <Badge className={statusColors[patient.status] || "bg-muted"}>
              {patient.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="lab">Lab Results</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Age</p>
                        <p className="text-sm">{patient.age} years</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Gender</p>
                        <p className="text-sm">{patient.gender || "Not specified"}</p>
                      </div>
                    </div>
                    {patient.phone && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          Phone
                        </p>
                        <p className="text-sm">{patient.phone}</p>
                      </div>
                    )}
                    {patient.address && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Address
                        </p>
                        <p className="text-sm">{patient.address}</p>
                      </div>
                    )}
                    {patient.blood_group && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Blood Group</p>
                        <p className="text-sm">{patient.blood_group} {patient.rhesus}</p>
                      </div>
                    )}
                    {patient.allergies && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Allergies</p>
                        <p className="text-sm text-destructive">{patient.allergies}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" />
                      Medical Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {patient.chief_complaint && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Chief Complaint</p>
                        <p className="text-sm">{patient.chief_complaint}</p>
                      </div>
                    )}
                    {patient.diagnosis && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Diagnosis</p>
                        <p className="text-sm">{patient.diagnosis}</p>
                      </div>
                    )}
                    {patient.severity && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Severity</p>
                        <Badge className={severityColors[patient.severity] || "bg-muted"}>
                          {patient.severity}
                        </Badge>
                      </div>
                    )}
                    {patient.symptoms && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Symptoms</p>
                        <p className="text-sm">{patient.symptoms}</p>
                      </div>
                    )}
                    {patient.ward && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Ward</p>
                        <p className="text-sm">{patient.ward} {patient.bed_number && `(Bed ${patient.bed_number})`}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Emergency Contact */}
              {(patient.nok_name || patient.nok_contact) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Emergency Contact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {patient.nok_name && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Name</p>
                          <p className="text-sm">{patient.nok_name}</p>
                        </div>
                      )}
                      {patient.nok_relationship && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Relationship</p>
                          <p className="text-sm">{patient.nok_relationship}</p>
                        </div>
                      )}
                      {patient.nok_contact && (
                        <div className="col-span-2">
                          <p className="text-sm font-medium text-muted-foreground">Contact</p>
                          <p className="text-sm">{patient.nok_contact}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="appointments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Appointment History ({appointments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appointments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No appointments found</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointments.map((apt) => (
                          <TableRow key={apt.id}>
                            <TableCell className="text-sm">
                              {new Date(apt.appointment_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-sm">{apt.appointment_time || "—"}</TableCell>
                            <TableCell className="text-sm">{apt.doctor_name || "—"}</TableCell>
                            <TableCell className="text-sm">{apt.reason || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={apt.status === "completed" ? "default" : "secondary"}>
                                {apt.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm max-w-[200px] truncate">{apt.notes || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lab" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FlaskConical className="w-4 h-4" />
                    Lab Test Results ({labTests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {labTests.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No lab tests found</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Test Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Normal Range</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {labTests.map((test) => (
                          <TableRow key={test.id}>
                            <TableCell className="text-sm font-medium">{test.test_name}</TableCell>
                            <TableCell className="text-sm">{test.category}</TableCell>
                            <TableCell className="text-sm">
                              {test.result || "—"}
                              {test.is_positive !== null && (
                                <Badge variant={test.is_positive ? "destructive" : "default"} className="ml-2">
                                  {test.is_positive ? "Positive" : "Negative"}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">{test.normal_range || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={test.status === "completed" ? "default" : "secondary"}>
                                {test.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(test.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prescriptions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Pill className="w-4 h-4" />
                    Prescription History ({prescriptions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {prescriptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No prescriptions found</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Drug Name</TableHead>
                          <TableHead>Dosage</TableHead>
                          <TableHead>Frequency</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prescriptions.map((rx) => (
                          <TableRow key={rx.id}>
                            <TableCell className="text-sm font-medium">{rx.drug_name}</TableCell>
                            <TableCell className="text-sm">{rx.dosage}</TableCell>
                            <TableCell className="text-sm">{rx.frequency}</TableCell>
                            <TableCell className="text-sm">{rx.quantity}</TableCell>
                            <TableCell>
                              <Badge variant={rx.status === "dispensed" ? "default" : "secondary"}>
                                {rx.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(rx.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Medical History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Registration Date</p>
                      <p className="text-sm">{new Date(patient.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                      <p className="text-sm">{new Date(patient.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {patient.triaged_at && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Triaged At</p>
                      <p className="text-sm">{new Date(patient.triaged_at).toLocaleDateString()}</p>
                    </div>
                  )}

                  {patient.admitted_date && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Admitted Date</p>
                      <p className="text-sm">{new Date(patient.admitted_date).toLocaleDateString()}</p>
                    </div>
                  )}

                  {/* Additional medical history fields */}
                  {patient.religion && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Religion</p>
                      <p className="text-sm">{patient.religion}</p>
                    </div>
                  )}

                  {/* Maternity information */}
                  {(patient.gravida || patient.para || patient.abortions) && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-2">Obstetric History</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {patient.gravida && (
                          <div>
                            <p className="text-xs text-muted-foreground">Gravida</p>
                            <p className="text-sm">{patient.gravida}</p>
                          </div>
                        )}
                        {patient.para && (
                          <div>
                            <p className="text-xs text-muted-foreground">Para</p>
                            <p className="text-sm">{patient.para}</p>
                          </div>
                        )}
                        {patient.abortions && (
                          <div>
                            <p className="text-xs text-muted-foreground">Abortions</p>
                            <p className="text-sm">{patient.abortions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}