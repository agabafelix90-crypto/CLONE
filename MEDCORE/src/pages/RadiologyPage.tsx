import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import {
  Microscope, Search, ChevronLeft, Plus, Clock,
  CheckCircle2, FileText, BarChart3, RefreshCw,
  ClipboardList, Calendar, TrendingUp, Eye, Loader2,
  ImageIcon, ScanLine
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { usePatients } from "@/hooks/use-clinic-data";
import { useLabTests, useInsertLabTest, useUpdateLabTest, useLabTemplates } from "@/hooks/use-lab-data";
import type { LabTest } from "@/hooks/use-lab-data";
import PrintableClinicHeader from "@/components/print/PrintableClinicHeader";
import PrintedByFooter from "@/components/print/PrintedByFooter";

const statusConfig: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", class: "bg-[hsl(var(--clinic-orange))]/15 text-[hsl(var(--clinic-orange))]", icon: <Clock className="w-3 h-3" /> },
  "in-progress": { label: "In Progress", class: "bg-[hsl(var(--clinic-blue))]/15 text-[hsl(var(--clinic-blue))]", icon: <ScanLine className="w-3 h-3" /> },
  completed: { label: "Completed", class: "bg-[hsl(var(--clinic-green))]/15 text-[hsl(var(--clinic-green))]", icon: <CheckCircle2 className="w-3 h-3" /> },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const RadiologyPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("queue");
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [resultForm, setResultForm] = useState({ result: "", notes: "", finding: "normal" as string });
  const [orderForm, setOrderForm] = useState({ patientId: "", testName: "", notes: "" });

  const { data: patients = [] } = usePatients();
  // Filter only Radiology category tests
  const { data: allTests = [], isLoading, refetch } = useLabTests();
  const { data: allTemplates = [] } = useLabTemplates();
  const insertTest = useInsertLabTest();
  const updateTest = useUpdateLabTest();

  const radiologyTests = useMemo(() => allTests.filter(t => t.category === "Radiology"), [allTests]);
  const radiologyTemplates = useMemo(() => allTemplates.filter(t => t.category === "Radiology"), [allTemplates]);

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const testsToday = radiologyTests.filter(t => new Date(t.created_at) >= todayStart).length;
  const testsWeek = radiologyTests.filter(t => new Date(t.created_at) >= weekStart).length;
  const testsMonth = radiologyTests.filter(t => new Date(t.created_at) >= monthStart).length;
  const testsYear = radiologyTests.filter(t => new Date(t.created_at) >= yearStart).length;
  const pendingTests = radiologyTests.filter(t => t.status === "pending");
  const inProgressTests = radiologyTests.filter(t => t.status === "in-progress");
  const completedTests = radiologyTests.filter(t => t.status === "completed");

  const filteredTests = useMemo(() => {
    return radiologyTests.filter(t => {
      const patient = patients.find(p => p.id === t.patient_id);
      const matchSearch = !search ||
        t.test_name.toLowerCase().includes(search.toLowerCase()) ||
        (patient?.name || "").toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [radiologyTests, patients, search]);

  const getPatientName = (patientId: string) => patients.find(p => p.id === patientId)?.name || "Unknown";

  const handleOrderTest = async () => {
    if (!orderForm.patientId || !orderForm.testName.trim()) {
      toast({ title: "Error", description: "Patient and scan type are required.", variant: "destructive" });
      return;
    }
    try {
      await insertTest.mutateAsync({
        patient_id: orderForm.patientId,
        test_name: orderForm.testName,
        category: "Radiology",
        status: "pending",
        normal_range: null,
        notes: orderForm.notes || null,
      });
      toast({ title: "Scan Ordered", description: `${orderForm.testName} ordered successfully.` });
      setOrderForm({ patientId: "", testName: "", notes: "" });
      setShowOrderDialog(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleSubmitResult = async () => {
    if (!selectedTest || !resultForm.result.trim()) {
      toast({ title: "Error", description: "Findings are required.", variant: "destructive" });
      return;
    }
    try {
      await updateTest.mutateAsync({
        id: selectedTest.id,
        result: resultForm.result,
        notes: resultForm.notes || null,
        is_positive: resultForm.finding === "abnormal",
        result_data: { interpretation: resultForm.finding },
        status: "completed",
      });
      toast({ title: "Report Saved", description: `Radiology report for ${selectedTest.test_name} saved.` });
      setResultForm({ result: "", notes: "", finding: "normal" });
      setSelectedTest(null);
      setShowResultDialog(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleStartScan = async (test: LabTest) => {
    try {
      await updateTest.mutateAsync({ id: test.id, status: "in-progress" });
      toast({ title: "Scan Started", description: `Processing ${test.test_name}.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const openEnterResult = (test: LabTest) => {
    setSelectedTest(test);
    const savedFinding = (test.result_data as any)?.interpretation || (test.is_positive ? "abnormal" : "normal");
    setResultForm({ result: test.result || "", notes: test.notes || "", finding: savedFinding });
    setShowResultDialog(true);
  };

  const handlePrint = (test: LabTest) => {
    setSelectedTest(test);
    setShowPrintDialog(true);
  };

  const categoryStats = useMemo(() => {
    const map: Record<string, { total: number; abnormal: number; males: number; females: number }> = {};
    const completed = radiologyTests.filter(t => t.status === "completed");
    completed.forEach(t => {
      if (!map[t.test_name]) map[t.test_name] = { total: 0, abnormal: 0, males: 0, females: 0 };
      map[t.test_name].total++;
      if (t.is_positive) {
        map[t.test_name].abnormal++;
        const patient = patients.find(p => p.id === t.patient_id);
        if (patient?.gender?.toLowerCase() === "male") map[t.test_name].males++;
        else map[t.test_name].females++;
      }
    });
    return Object.entries(map).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.total - a.total);
  }, [radiologyTests, patients]);

  const stats = [
    { label: "Scans Today", value: testsToday, icon: <Calendar className="w-5 h-5" />, color: "text-primary", bg: "bg-primary/10", emoji: "📅" },
    { label: "This Week", value: testsWeek, icon: <BarChart3 className="w-5 h-5" />, color: "text-[hsl(var(--clinic-blue))]", bg: "bg-[hsl(var(--clinic-blue))]/10", emoji: "📊" },
    { label: "This Month", value: testsMonth, icon: <TrendingUp className="w-5 h-5" />, color: "text-[hsl(var(--clinic-green))]", bg: "bg-[hsl(var(--clinic-green))]/10", emoji: "📈" },
    { label: "This Year", value: testsYear, icon: <ClipboardList className="w-5 h-5" />, color: "text-[hsl(var(--clinic-gold))]", bg: "bg-[hsl(var(--clinic-gold))]/10", emoji: "🎯" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
            <Microscope className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground">Radiology</h1>
            <p className="text-sm text-muted-foreground">Imaging requests, reports & statistics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingTests.length > 0 && (
            <Badge className="bg-[hsl(var(--clinic-orange))]/15 text-[hsl(var(--clinic-orange))] border-[hsl(var(--clinic-orange))]/30 gap-1" variant="outline">
              <Clock className="w-3 h-3" /> {pendingTests.length} Pending
            </Badge>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search scans or patients..." className="pl-9 w-64" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </motion.div>

      {/* Stats */}
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

      {/* Actions row */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-2">
        <Button onClick={() => setShowOrderDialog(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> Order Scan
        </Button>
        <Button variant="outline" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="queue" className="gap-1.5"><Clock className="w-4 h-4" /> Queue</TabsTrigger>
          <TabsTrigger value="results" className="gap-1.5"><CheckCircle2 className="w-4 h-4" /> Reports</TabsTrigger>
          <TabsTrigger value="statistics" className="gap-1.5"><BarChart3 className="w-4 h-4" /> Stats</TabsTrigger>
        </TabsList>

        {/* QUEUE TAB */}
        <TabsContent value="queue" className="mt-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <ScanLine className="w-4 h-4" /> Pending & In-Progress Scans
                <Badge variant="secondary">{pendingTests.length + inProgressTests.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Scan Type</TableHead>
                      <TableHead className="hidden lg:table-cell">Ordered</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTests.filter(t => t.status !== "completed").length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No pending scans</TableCell></TableRow>
                    ) : (
                      filteredTests.filter(t => t.status !== "completed").map((t, i) => {
                        const config = statusConfig[t.status] || statusConfig.pending;
                        return (
                          <motion.tr key={t.id} className="border-b transition-colors hover:bg-muted/50" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                            <TableCell className="font-medium text-foreground">{getPatientName(t.patient_id)}</TableCell>
                            <TableCell className="text-foreground">{t.test_name}</TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{format(new Date(t.created_at), "dd/MM HH:mm")}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] gap-1 ${config.class}`}>{config.icon} {config.label}</Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              {t.status === "pending" && (
                                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleStartScan(t)}>
                                  <ScanLine className="w-3 h-3" /> Start
                                </Button>
                              )}
                              {(t.status === "pending" || t.status === "in-progress") && (
                                <Button size="sm" className="gap-1 text-xs" onClick={() => openEnterResult(t)}>
                                  <CheckCircle2 className="w-3 h-3" /> Report
                                </Button>
                              )}
                            </TableCell>
                          </motion.tr>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORTS TAB */}
        <TabsContent value="results" className="mt-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Completed Reports
                <Badge variant="secondary">{completedTests.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Scan Type</TableHead>
                    <TableHead>Findings</TableHead>
                    <TableHead className="hidden lg:table-cell">Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Completed</TableHead>
                    <TableHead className="text-right">Print</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTests.filter(t => t.status === "completed").length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No completed reports</TableCell></TableRow>
                  ) : (
                    filteredTests.filter(t => t.status === "completed").map((t, i) => (
                      <motion.tr key={t.id} className="border-b transition-colors hover:bg-muted/50" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                        <TableCell className="font-medium text-foreground">{getPatientName(t.patient_id)}</TableCell>
                        <TableCell className="text-foreground">{t.test_name}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{t.result || "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge className={`text-[10px] ${t.is_positive ? "bg-destructive/15 text-destructive" : ""}`} variant="secondary">
                            {t.is_positive ? "ABNORMAL" : "NORMAL"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {t.completed_at ? format(new Date(t.completed_at), "dd/MM/yy HH:mm") : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => handlePrint(t)}>
                            <FileText className="w-3 h-3" /> Print
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* STATISTICS TAB */}
        <TabsContent value="statistics" className="mt-4 space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Radiology Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scan Type</TableHead>
                    <TableHead>Total Scans</TableHead>
                    <TableHead>Abnormal</TableHead>
                    <TableHead className="hidden md:table-cell">Males Abnormal</TableHead>
                    <TableHead className="hidden md:table-cell">Females Abnormal</TableHead>
                    <TableHead className="hidden lg:table-cell">Abnormality Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryStats.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No completed scans for statistics</TableCell></TableRow>
                  ) : (
                    categoryStats.map((s, i) => (
                      <motion.tr key={s.name} className="border-b transition-colors hover:bg-muted/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                        <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                        <TableCell>{s.total}</TableCell>
                        <TableCell>
                          <Badge className={s.abnormal > 0 ? "bg-destructive/15 text-destructive text-[10px]" : "text-[10px]"} variant="secondary">
                            {s.abnormal}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{s.males}</TableCell>
                        <TableCell className="hidden md:table-cell">{s.females}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {s.total > 0 ? `${Math.round((s.abnormal / s.total) * 100)}%` : "0%"}
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── ORDER SCAN DIALOG ─── */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Order Radiology Scan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Patient *</Label>
              <Select value={orderForm.patientId} onValueChange={v => setOrderForm(prev => ({ ...prev, patientId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.age}Y)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {radiologyTemplates.length > 0 && (
              <div>
                <Label className="text-xs">From Catalog (optional)</Label>
                <Select onValueChange={v => {
                  const tmpl = radiologyTemplates.find(t => t.test_name === v);
                  if (tmpl) setOrderForm(prev => ({ ...prev, testName: tmpl.test_name }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Select scan type" /></SelectTrigger>
                  <SelectContent>
                    {radiologyTemplates.map(t => <SelectItem key={t.id} value={t.test_name}>{t.test_name} {t.price > 0 ? `(${Number(t.price).toLocaleString()} UGX)` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs">Scan Type *</Label>
              <Input value={orderForm.testName} onChange={e => setOrderForm(prev => ({ ...prev, testName: e.target.value }))} placeholder="e.g. Chest X-Ray, Abdominal Ultrasound" />
            </div>
            <div>
              <Label className="text-xs">Clinical Notes</Label>
              <Textarea value={orderForm.notes} onChange={e => setOrderForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Clinical indication..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDialog(false)}>Cancel</Button>
            <Button onClick={handleOrderTest} disabled={insertTest.isPending}>
              {insertTest.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Order Scan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── ENTER REPORT DIALOG ─── */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Radiology Report — {selectedTest?.test_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p><span className="font-medium text-foreground">Patient:</span> {selectedTest ? getPatientName(selectedTest.patient_id) : ""}</p>
              <p><span className="font-medium text-foreground">Scan:</span> {selectedTest?.test_name}</p>
            </div>
            <div>
              <Label className="text-xs">Findings *</Label>
              <Textarea value={resultForm.result} onChange={e => setResultForm(prev => ({ ...prev, result: e.target.value }))} placeholder="Describe radiological findings..." rows={4} />
            </div>
            <div>
              <Label className="text-xs">Conclusion *</Label>
              <Select value={resultForm.finding} onValueChange={v => setResultForm(prev => ({ ...prev, finding: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="abnormal">Abnormal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Impression / Notes</Label>
              <Textarea value={resultForm.notes} onChange={e => setResultForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Radiologist's impression..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResultDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitResult} disabled={updateTest.isPending}>
              {updateTest.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Save Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── PRINT REPORT DIALOG ─── */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Radiology Report (A4)</DialogTitle></DialogHeader>
          {selectedTest && (() => {
            const patient = patients.find(p => p.id === selectedTest.patient_id);
            return (
              <div id="radiology-print-area">
                <PrintableClinicHeader />
                <div className="mt-4 border rounded-lg p-6 space-y-4">
                  <h2 className="text-lg font-bold text-center uppercase tracking-wider">Radiology Report</h2>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm border-b pb-3">
                    <p><span className="font-medium">Patient:</span> {patient?.name || "Unknown"}</p>
                    <p><span className="font-medium">Age/Gender:</span> {patient?.age}Y / {patient?.gender || "—"}</p>
                    <p><span className="font-medium">Examination:</span> {selectedTest.test_name}</p>
                    <p><span className="font-medium">Date:</span> {selectedTest.completed_at ? format(new Date(selectedTest.completed_at), "dd/MM/yyyy HH:mm") : "—"}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-1">Findings</h3>
                    <p className="text-sm whitespace-pre-wrap">{selectedTest.result || "—"}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-1">Conclusion</h3>
                    <Badge className={`text-xs ${selectedTest.is_positive ? "bg-destructive/15 text-destructive" : "bg-[hsl(var(--clinic-green))]/15 text-[hsl(var(--clinic-green))]"}`} variant="secondary">
                      {selectedTest.is_positive ? "ABNORMAL" : "NORMAL"}
                    </Badge>
                  </div>
                  {selectedTest.notes && (
                    <div>
                      <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-1">Impression</h3>
                      <p className="text-sm whitespace-pre-wrap">{selectedTest.notes}</p>
                    </div>
                  )}
                  <div className="pt-8 flex justify-between text-sm border-t mt-6">
                    <div className="text-center">
                      <div className="border-b border-foreground w-48 mb-1" />
                      <p className="text-muted-foreground">Radiographer's Signature</p>
                    </div>
                    <div className="text-center">
                      <div className="border-b border-foreground w-48 mb-1" />
                      <p className="text-muted-foreground">Date</p>
                    </div>
                  </div>
                </div>
                <PrintedByFooter />
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrintDialog(false)}>Close</Button>
            <Button onClick={() => window.print()} className="gap-1.5">
              <FileText className="w-4 h-4" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RadiologyPage;
