import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft, CalendarCheck, Plus, Clock, CheckCircle, X, Send
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAutomatedReminders } from "@/hooks/use-ai-assistant";
import { toast } from "sonner";

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [aptDate, setAptDate] = useState("");
  const [aptTime, setAptTime] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const { sendReminders, loading: remindersLoading } = useAutomatedReminders();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("appointment_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["apt-patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, phone, age")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const patientMap = Object.fromEntries(patients.map(p => [p.id, p]));

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("appointments").insert({
        patient_id: selectedPatientId,
        appointment_date: aptDate,
        appointment_time: aptTime || null,
        reason,
        notes,
        created_by: user?.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment scheduled");
      setShowAdd(false);
      setSelectedPatientId("");
      setAptDate("");
      setAptTime("");
      setReason("");
      setNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("appointments").update({ status } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter(a => a.appointment_date === today);
  const upcomingAppts = appointments.filter(a => a.appointment_date > today && a.status === "pending");
  const pastAppts = appointments.filter(a => a.appointment_date < today || a.status !== "pending");

  const displayAppts = tab === "today" ? todayAppts : tab === "upcoming" ? upcomingAppts : tab === "past" ? pastAppts : appointments;
  const filtered = displayAppts.filter(a => {
    if (!search) return true;
    const patient = patientMap[a.patient_id];
    return patient?.name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground">Appointments</h1>
            <p className="text-sm text-muted-foreground">Schedule & manage patient appointments</p>
          </div>
        </div>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" className="gap-1" disabled={remindersLoading} onClick={() => user?.id && sendReminders("appointment_reminders", user.id)}>
            <Send className="w-4 h-4" /> {remindersLoading ? "Sending..." : "Send Reminders"}
          </Button>
          <Button className="gap-1" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> Schedule
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="cursor-pointer" onClick={() => setTab("today")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-heading font-bold text-foreground">{todayAppts.length}</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setTab("upcoming")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-heading font-bold text-foreground">{upcomingAppts.length}</p>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setTab("past")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-heading font-bold text-foreground">{pastAppts.length}</p>
            <p className="text-xs text-muted-foreground">Past/Done</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 items-center">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-xs">
          <Input placeholder="Search patient..." value={search} onChange={e => setSearch(e.target.value)} className="pl-3" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No appointments</TableCell></TableRow>
              ) : (
                filtered.map(a => {
                  const patient = patientMap[a.patient_id];
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <p className="font-medium">{patient?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{patient?.phone}</p>
                      </TableCell>
                      <TableCell>{a.appointment_date}</TableCell>
                      <TableCell>{a.appointment_time || "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{a.reason || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === "completed" ? "default" : a.status === "cancelled" ? "destructive" : "secondary"}>
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {a.status === "pending" && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: a.id, status: "completed" })}>
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => updateStatus.mutate({ id: a.id, status: "cancelled" })}>
                                <X className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-1 block">Patient</label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.age}y)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Date</label>
                <Input type="date" value={aptDate} onChange={e => setAptDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Time</label>
                <Input type="time" value={aptTime} onChange={e => setAptTime(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Reason</label>
              <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Follow-up exam" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Notes</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!selectedPatientId || !aptDate || createMutation.isPending}>
              {createMutation.isPending ? "Scheduling..." : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentsPage;
