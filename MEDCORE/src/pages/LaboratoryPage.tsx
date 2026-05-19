import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, isWithinInterval } from "date-fns";
import {
  Microscope, Search, ChevronLeft, Plus, FlaskConical, Clock,
  CheckCircle2, AlertTriangle, FileText, BarChart3, RefreshCw,
  ClipboardList, Calendar, TrendingUp, Users, Eye, Loader2,
  Beaker, TestTubes
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
import { Checkbox } from "@/components/ui/checkbox";
import { generatePDF } from "@/lib/pdf-generator";
import { usePatients } from "@/hooks/use-clinic-data";
import { useLabTests, useInsertLabTest, useUpdateLabTest, useLabTemplates, useInsertLabTemplate } from "@/hooks/use-lab-data";
import type { LabTest } from "@/hooks/use-lab-data";
import PrintableClinicHeader from "@/components/print/PrintableClinicHeader";
import PrintedByFooter from "@/components/print/PrintedByFooter";
import PrintableLabReport, {
  type LabInterpretation,
  INTERPRETATION_LABELS,
  isQualitativeTest,
} from "@/components/print/PrintableLabReport";

const statusConfig: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", class: "bg-[hsl(var(--clinic-orange))]/15 text-[hsl(var(--clinic-orange))]", icon: <Clock className="w-3 h-3" /> },
  "in-progress": { label: "In Progress", class: "bg-[hsl(var(--clinic-blue))]/15 text-[hsl(var(--clinic-blue))]", icon: <FlaskConical className="w-3 h-3" /> },
  completed: { label: "Completed", class: "bg-[hsl(var(--clinic-green))]/15 text-[hsl(var(--clinic-green))]", icon: <CheckCircle2 className="w-3 h-3" /> },
};

const testCategories = [
  "Hematology", "Biochemistry", "Microbiology", "Urinalysis", "Serology",
  "Parasitology", "Immunology", "Hormones", "Other"
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const LaboratoryPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("queue");
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [resultForm, setResultForm] = useState({ result: "", notes: "", interpretation: "normal" as LabInterpretation });
  const [orderForm, setOrderForm] = useState({ patientId: "", testName: "", category: "Hematology", notes: "", normalRange: "" });
  const [templateForm, setTemplateForm] = useState({ testName: "", category: "Hematology", normalRanges: "", price: "" });

  const { data: patients = [] } = usePatients();
  const { data: labTests = [], isLoading, refetch } = useLabTests();
  const { data: templates = [] } = useLabTemplates();
  const insertLabTest = useInsertLabTest();
  const updateLabTest = useUpdateLabTest();
  const insertTemplate = useInsertLabTemplate();

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const testsToday = labTests.filter(t => new Date(t.created_at) >= todayStart).length;
  const testsWeek = labTests.filter(t => new Date(t.created_at) >= weekStart).length;
  const testsMonth = labTests.filter(t => new Date(t.created_at) >= monthStart).length;
  const testsYear = labTests.filter(t => new Date(t.created_at) >= yearStart).length;
  const pendingTests = labTests.filter(t => t.status === "pending");
  const inProgressTests = labTests.filter(t => t.status === "in-progress");
  const completedTests = labTests.filter(t => t.status === "completed");

  const filteredTests = useMemo(() => {
    return labTests.filter(t => {
      const patient = patients.find(p => p.id === t.patient_id);
      const matchSearch = !search ||
        t.test_name.toLowerCase().includes(search.toLowerCase()) ||
        (patient?.name || "").toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [labTests, patients, search]);

  const getPatientName = (patientId: string) => patients.find(p => p.id === patientId)?.name || "Unknown";

  // ─── Order Test ───
  const handleOrderTest = async () => {
    if (!orderForm.patientId || !orderForm.testName.trim()) {
      toast({ title: "Error", description: "Patient and test name are required.", variant: "destructive" });
      return;
    }
    try {
      await insertLabTest.mutateAsync({
        patient_id: orderForm.patientId,
        test_name: orderForm.testName,
        category: orderForm.category,
        status: "pending",
        normal_range: orderForm.normalRange || null,
        notes: orderForm.notes || null,
      });
      toast({ title: "Test Ordered", description: `${orderForm.testName} ordered successfully.` });
      setOrderForm({ patientId: "", testName: "", category: "Hematology", notes: "", normalRange: "" });
      setShowOrderDialog(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // ─── Enter Result ───
  const handleSubmitResult = async () => {
    if (!selectedTest || !resultForm.result.trim()) {
      toast({ title: "Error", description: "Result is required.", variant: "destructive" });
      return;
    }
    try {
      await updateLabTest.mutateAsync({
        id: selectedTest.id,
        result: resultForm.result,
        notes: resultForm.notes || null,
        is_positive: resultForm.interpretation === "positive",
        result_data: { interpretation: resultForm.interpretation },
        status: "completed",
      });
      toast({ title: "Result Saved", description: `Result recorded for ${selectedTest.test_name}.` });
      setResultForm({ result: "", notes: "", interpretation: "normal" as LabInterpretation });
      setSelectedTest(null);
      setShowResultDialog(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleStartTest = async (test: LabTest) => {
    try {
      await updateLabTest.mutateAsync({ id: test.id, status: "in-progress" });
      toast({ title: "Test Started", description: `Processing ${test.test_name}.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.testName.trim()) {
      toast({ title: "Error", description: "Test name is required.", variant: "destructive" });
      return;
    }
    try {
      await insertTemplate.mutateAsync({
        test_name: templateForm.testName,
        category: templateForm.category,
        normal_ranges: templateForm.normalRanges || null,
        price: parseFloat(templateForm.price) || 0,
        parameters: [],
      });
      toast({ title: "Template Saved", description: `${templateForm.testName} template created.` });
      setTemplateForm({ testName: "", category: "Hematology", normalRanges: "", price: "" });
      setShowTemplateDialog(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const openEnterResult = (test: LabTest) => {
    setSelectedTest(test);
    const savedInterp = (test.result_data as any)?.interpretation as LabInterpretation | undefined;
    setResultForm({ result: test.result || "", notes: test.notes || "", interpretation: savedInterp || (test.is_positive ? "positive" : "normal") });
    setShowResultDialog(true);
  };

  const selectTemplateForOrder = (templateName: string) => {
    const tmpl = templates.find(t => t.test_name === templateName);
    if (tmpl) {
      setOrderForm(prev => ({ ...prev, testName: tmpl.test_name, category: tmpl.category, normalRange: tmpl.normal_ranges || "" }));
    }
  };

  // ─── Statistics data ───
  const categoryStats = useMemo(() => {
    const map: Record<string, { total: number; positive: number; males: number; females: number }> = {};
    const completed = labTests.filter(t => t.status === "completed");
    completed.forEach(t => {
      if (!map[t.test_name]) map[t.test_name] = { total: 0, positive: 0, males: 0, females: 0 };
      map[t.test_name].total++;
      if (t.is_positive) {
        map[t.test_name].positive++;
        const patient = patients.find(p => p.id === t.patient_id);
        if (patient?.gender?.toLowerCase() === "male") map[t.test_name].males++;
        else map[t.test_name].females++;
      }
    });
    return Object.entries(map).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.total - a.total);
  }, [labTests, patients]);

  const stats = [
    { label: "Tests Today", value: testsToday, icon: <Calendar className="w-5 h-5" />, color: "text-primary", bg: "bg-primary/10", emoji: "📅" },
    { label: "This Week", value: testsWeek, icon: <BarChart3 className="w-5 h-5" />, color: "text-[hsl(var(--clinic-blue))]", bg: "bg-[hsl(var(--clinic-blue))]/10", emoji: "📊" },
    { label: "This Month", value: testsMonth, icon: <TrendingUp className="w-5 h-5" />, color: "text-[hsl(var(--clinic-green))]", bg: "bg-[hsl(var(--clinic-green))]/10", emoji: "📈" },
    { label: "This Year", value: testsYear, icon: <ClipboardList className="w-5 h-5" />, color: "text-[hsl(var(--clinic-gold))]", bg: "bg-[hsl(var(--clinic-gold))]/10", emoji: "🎯" },
  ];

  const handlePrint = async (test: LabTest) => {
    setSelectedTest(test);

    try {
      // Generate PDF automatically
      await generatePDF('lab-print-area', `lab-report-${test.test_name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      toast({ title: "PDF Generated", description: "Lab report PDF has been downloaded." });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({ title: "Error", description: "Failed to generate PDF. Please try again.", variant: "destructive" });
    }
  };

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
            <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground">Laboratory</h1>
            <p className="text-sm text-muted-foreground">Test ordering, results & statistics</p>
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
            <Input placeholder="Search tests or patients..." className="pl-9 w-64" value={search} onChange={e => setSearch(e.target.value)} />
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
          <Plus className="w-4 h-4" /> Order Test
        </Button>
        <Button variant="outline" onClick={() => setShowTemplateDialog(true)} className="gap-1.5">
          <ClipboardList className="w-4 h-4" /> Create Template
        </Button>
        <Button variant="outline" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="queue" className="gap-1.5"><Clock className="w-4 h-4" /> Queue</TabsTrigger>
          <TabsTrigger value="results" className="gap-1.5"><CheckCircle2 className="w-4 h-4" /> Results</TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5"><FileText className="w-4 h-4" /> Templates</TabsTrigger>
          <TabsTrigger value="statistics" className="gap-1.5"><BarChart3 className="w-4 h-4" /> Stats</TabsTrigger>
        </TabsList>

        {/* QUEUE TAB */}
        <TabsContent value="queue" className="mt-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <FlaskConical className="w-4 h-4" /> Pending & In-Progress Tests
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
                      <TableHead>Test</TableHead>
                      <TableHead className="hidden md:table-cell">Category</TableHead>
                      <TableHead className="hidden lg:table-cell">Ordered</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTests.filter(t => t.status !== "completed").length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No pending tests</TableCell></TableRow>
                    ) : (
                      filteredTests.filter(t => t.status !== "completed").map((t, i) => {
                        const config = statusConfig[t.status] || statusConfig.pending;
                        return (
                          <motion.tr key={t.id} className="border-b transition-colors hover:bg-muted/50" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                            <TableCell className="font-medium text-foreground">{getPatientName(t.patient_id)}</TableCell>
                            <TableCell className="text-foreground">{t.test_name}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{t.category}</TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{format(new Date(t.created_at), "dd/MM HH:mm")}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] gap-1 ${config.class}`}>{config.icon} {config.label}</Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              {t.status === "pending" && (
                                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleStartTest(t)}>
                                  <FlaskConical className="w-3 h-3" /> Start
                                </Button>
                              )}
                              {(t.status === "pending" || t.status === "in-progress") && (
                                <Button size="sm" className="gap-1 text-xs" onClick={() => openEnterResult(t)}>
                                  <CheckCircle2 className="w-3 h-3" /> Result
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

        {/* RESULTS TAB */}
        <TabsContent value="results" className="mt-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Completed Results
                <Badge variant="secondary">{completedTests.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Test</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead className="hidden lg:table-cell">Interpretation</TableHead>
                    <TableHead className="hidden sm:table-cell">Completed</TableHead>
                    <TableHead className="text-right">Print</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTests.filter(t => t.status === "completed").length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No completed tests</TableCell></TableRow>
                  ) : (
                    filteredTests.filter(t => t.status === "completed").map((t, i) => (
                      <motion.tr key={t.id} className="border-b transition-colors hover:bg-muted/50" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                        <TableCell className="font-medium text-foreground">{getPatientName(t.patient_id)}</TableCell>
                        <TableCell className="text-foreground">{t.test_name}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{t.category}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{t.result || "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {(() => {
                            const interp = ((t.result_data as any)?.interpretation as LabInterpretation) || (t.is_positive ? "positive" : "normal");
                            const info = INTERPRETATION_LABELS[interp];
                            const isAlert = ["positive", "low", "high"].includes(interp);
                            return (
                              <Badge className={`text-[10px] ${isAlert ? "bg-destructive/15 text-destructive" : ""}`} variant="secondary">
                                {info?.label || "NORMAL"}
                              </Badge>
                            );
                          })()}
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

        {/* TEMPLATES TAB */}
        <TabsContent value="templates" className="mt-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" /> Test Templates
                  <Badge variant="secondary">{templates.length}</Badge>
                </CardTitle>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowTemplateDialog(true)}>
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="hidden md:table-cell">Normal Ranges</TableHead>
                    <TableHead className="hidden sm:table-cell">Price</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No templates yet</TableCell></TableRow>
                  ) : (
                    templates.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium text-foreground">{t.test_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{t.category}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">{t.normal_ranges || "—"}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{t.price > 0 ? `UGX ${t.price.toLocaleString()}` : "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => {
                            setOrderForm(prev => ({ ...prev, testName: t.test_name, category: t.category, normalRange: t.normal_ranges || "" }));
                            setShowOrderDialog(true);
                          }}>
                            <Plus className="w-3 h-3" /> Use
                          </Button>
                        </TableCell>
                      </TableRow>
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
                <BarChart3 className="w-4 h-4" /> Laboratory Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test Name</TableHead>
                    <TableHead>Total Tests</TableHead>
                    <TableHead>Positive Cases</TableHead>
                    <TableHead className="hidden md:table-cell">Males Positive</TableHead>
                    <TableHead className="hidden md:table-cell">Females Positive</TableHead>
                    <TableHead className="hidden lg:table-cell">Positivity Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryStats.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No completed tests for statistics</TableCell></TableRow>
                  ) : (
                    categoryStats.map((s, i) => (
                      <motion.tr key={s.name} className="border-b transition-colors hover:bg-muted/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                        <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                        <TableCell>{s.total}</TableCell>
                        <TableCell>
                          <Badge className={s.positive > 0 ? "bg-destructive/15 text-destructive text-[10px]" : "text-[10px]"} variant="secondary">
                            {s.positive}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{s.males}</TableCell>
                        <TableCell className="hidden md:table-cell">{s.females}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {s.total > 0 ? `${Math.round((s.positive / s.total) * 100)}%` : "0%"}
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

      {/* ─── ORDER TEST DIALOG ─── */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Order Lab Test</DialogTitle></DialogHeader>
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
            {templates.length > 0 && (
              <div>
                <Label className="text-xs">From Template (optional)</Label>
                <Select onValueChange={selectTemplateForOrder}>
                  <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                  <SelectContent>
                    {templates.map(t => <SelectItem key={t.id} value={t.test_name}>{t.test_name} ({t.category})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs">Test Name *</Label>
              <Input value={orderForm.testName} onChange={e => setOrderForm(prev => ({ ...prev, testName: e.target.value }))} placeholder="e.g. Full Blood Count" />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={orderForm.category} onValueChange={v => setOrderForm(prev => ({ ...prev, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {testCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Normal Range</Label>
              <Input value={orderForm.normalRange} onChange={e => setOrderForm(prev => ({ ...prev, normalRange: e.target.value }))} placeholder="e.g. 4.5-11.0 x10^9/L" />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={orderForm.notes} onChange={e => setOrderForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Clinical notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDialog(false)}>Cancel</Button>
            <Button onClick={handleOrderTest} disabled={insertLabTest.isPending}>
              {insertLabTest.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Order Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── ENTER RESULT DIALOG ─── */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Enter Result — {selectedTest?.test_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p><span className="font-medium text-foreground">Patient:</span> {selectedTest ? getPatientName(selectedTest.patient_id) : ""}</p>
              <p><span className="font-medium text-foreground">Category:</span> {selectedTest?.category}</p>
              {selectedTest?.normal_range && <p><span className="font-medium text-foreground">Normal Range:</span> {selectedTest.normal_range}</p>}
            </div>
            <div>
              <Label className="text-xs">Result *</Label>
              <Textarea value={resultForm.result} onChange={e => setResultForm(prev => ({ ...prev, result: e.target.value }))} placeholder="Enter test result..." rows={3} />
            </div>
            <div>
              <Label className="text-xs">Interpretation *</Label>
              <Select value={resultForm.interpretation} onValueChange={v => setResultForm(prev => ({ ...prev, interpretation: v as LabInterpretation }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {isQualitativeTest(selectedTest?.test_name || "") ? (
                    <>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="relatively_low">Relatively Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="relatively_high">Relatively High</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={resultForm.notes} onChange={e => setResultForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Additional notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResultDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitResult} disabled={updateLabTest.isPending}>
              {updateLabTest.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Save Result
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── CREATE TEMPLATE DIALOG ─── */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Create Test Template</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Test Name *</Label>
              <Input value={templateForm.testName} onChange={e => setTemplateForm(prev => ({ ...prev, testName: e.target.value }))} placeholder="e.g. Malaria RDT" />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={templateForm.category} onValueChange={v => setTemplateForm(prev => ({ ...prev, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {testCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Normal Ranges</Label>
              <Input value={templateForm.normalRanges} onChange={e => setTemplateForm(prev => ({ ...prev, normalRanges: e.target.value }))} placeholder="e.g. Negative" />
            </div>
            <div>
              <Label className="text-xs">Price (UGX)</Label>
              <Input type="number" value={templateForm.price} onChange={e => setTemplateForm(prev => ({ ...prev, price: e.target.value }))} placeholder="e.g. 15000" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveTemplate} disabled={insertTemplate.isPending}>
              {insertTemplate.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden PDF generation area */}
      {selectedTest && (
        <div className="hidden">
          {(() => {
            const patient = patients.find(p => p.id === selectedTest.patient_id);
            return (
              <PrintableLabReport
                patientName={patient?.name || "Unknown"}
                patientAge={patient?.age}
                patientGender={patient?.gender || undefined}
                testName={selectedTest.test_name}
                category={selectedTest.category}
                result={selectedTest.result}
                normalRange={selectedTest.normal_range}
                interpretation={((selectedTest.result_data as any)?.interpretation as LabInterpretation) || (selectedTest.is_positive ? "positive" : "normal")}
                notes={selectedTest.notes}
                orderedDate={selectedTest.created_at}
                completedDate={selectedTest.completed_at}
              />
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default LaboratoryPage;
