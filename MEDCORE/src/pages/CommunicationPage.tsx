import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Send, MessageSquare, Users, History, Search, Loader2, Wallet, RefreshCw, Receipt, Bell } from "lucide-react";
import { useAutomatedReminders } from "@/hooks/use-ai-assistant";
import { format } from "date-fns";
import TopUpDialog from "@/components/communication/TopUpDialog";
import CreditTransactionHistory from "@/components/communication/CreditTransactionHistory";

const CommunicationPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { sendReminders, loading: remindersLoading } = useAutomatedReminders();

  // Manual SMS state
  const [manualPhone, setManualPhone] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualMessage, setManualMessage] = useState("");

  // Bulk SMS state
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkFilter, setBulkFilter] = useState("all");
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [bulkSearch, setBulkSearch] = useState("");

  // SMS Logs
  const { data: smsLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["sms-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Patients for bulk
  const { data: patients = [] } = useQuery({
    queryKey: ["patients-for-sms", bulkFilter, bulkSearch],
    queryFn: async () => {
      let query = supabase
        .from("patients")
        .select("id, name, phone, gender, religion, status")
        .not("phone", "is", null);

      if (bulkFilter === "male") query = query.eq("gender", "Male");
      else if (bulkFilter === "female") query = query.eq("gender", "Female");
      else if (bulkFilter === "admitted") query = query.eq("status", "Admitted");
      else if (bulkFilter === "outpatient") query = query.eq("status", "Outpatient");

      if (bulkSearch) query = query.ilike("name", `%${bulkSearch}%`);

      const { data, error } = await query.order("name").limit(200);
      if (error) throw error;
      return data;
    },
  });

  const sendSmsMutation = useMutation({
    mutationFn: async (messages: any[]) => {
      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: { messages, sent_by: user?.id },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error || "SMS sending failed");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sms-logs"] });
      const totalSent = data.results?.reduce((acc: number, r: any) => acc + (r.status === "sent" ? r.recipients : 0), 0) || 0;
      toast.success(`SMS sent to ${totalSent} recipient(s)`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send SMS");
    },
  });

  const handleManualSend = () => {
    if (!manualPhone || !manualMessage) {
      toast.error("Phone number and message are required");
      return;
    }

    // SECURITY: Phone number validation
    const cleanPhone = manualPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      toast.error("Invalid phone number format");
      return;
    }

    // SECURITY: Message length validation
    if (manualMessage.length > 160) {
      toast.error("Message too long. Maximum 160 characters.");
      return;
    }

    // SECURITY: Content validation
    const maliciousPatterns = [
      /<script/i, /javascript:/i, /vbscript:/i, /onload=/i, /onerror=/i,
      /<iframe/i, /<object/i, /<embed/i, /<form/i, /<input/i
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(manualMessage)) {
        toast.error("Message contains potentially malicious content");
        return;
      }
    }

    sendSmsMutation.mutate([
      { phone: manualPhone, text: manualMessage, recipient_name: manualName, message_type: "manual" },
    ]);
    setManualPhone("");
    setManualName("");
    setManualMessage("");
  };

  const handleBulkSend = () => {
    if (selectedPatients.length === 0 || !bulkMessage) {
      toast.error("Select recipients and enter a message");
      return;
    }

    // SECURITY: Message length validation
    if (bulkMessage.length > 160) {
      toast.error("Message too long. Maximum 160 characters.");
      return;
    }

    // SECURITY: Content validation
    const maliciousPatterns = [
      /<script/i, /javascript:/i, /vbscript:/i, /onload=/i, /onerror=/i,
      /<iframe/i, /<object/i, /<embed/i, /<form/i, /<input/i
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(bulkMessage)) {
        toast.error("Message contains potentially malicious content");
        return;
      }
    }

    // SECURITY: Rate limiting check (max 50 recipients per bulk send)
    if (selectedPatients.length > 50) {
      toast.error("Too many recipients. Maximum 50 per bulk send.");
      return;
    }

    const messages = selectedPatients.map((pid) => {
      const pt = patients.find((p) => p.id === pid);
      return {
        phone: pt?.phone || "",
        text: bulkMessage,
        recipient_name: pt?.name,
        patient_id: pid,
        message_type: "bulk",
        category: "bulk",
      };
    }).filter((m) => m.phone);

    sendSmsMutation.mutate(messages);
    setSelectedPatients([]);
    setBulkMessage("");
  };

  const togglePatient = (id: string) => {
    setSelectedPatients((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedPatients.length === patients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(patients.map((p) => p.id));
    }
  };

  const charCount = manualMessage.length || bulkMessage.length;

  // Balance check (Genius SMS shared account)
  const { data: balanceData, isLoading: balanceLoading, refetch: refetchBalance } = useQuery({
    queryKey: ["sms-balance"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("check-sms-balance");
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data as { balance: number; message: string };
    },
    staleTime: 5 * 60 * 1000,
  });

  // Facility credit balance
  const { data: creditData, isLoading: creditLoading, refetch: refetchCredit } = useQuery({
    queryKey: ["sms-credits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_credits")
        .select("balance")
        .eq("user_id", user?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Communication Center</h1>
          <p className="text-muted-foreground text-sm">Send SMS messages to patients via Genius SMS</p>
        </div>
        {/* Credit Balance Card */}
        <div className="flex items-center gap-3 flex-wrap">
          <Card className="glass-card border-primary/20">
            <CardContent className="p-3 flex items-center gap-3">
              <Wallet className="w-5 h-5 text-primary" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">My SMS Credits</p>
                {creditLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <p className="text-lg font-bold text-primary">
                    UGX {(creditData?.balance || 0).toLocaleString()}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetchCredit()} disabled={creditLoading}>
                <RefreshCw className={`w-3.5 h-3.5 ${creditLoading ? "animate-spin" : ""}`} />
              </Button>
            </CardContent>
          </Card>
          <TopUpDialog />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={remindersLoading}
            onClick={() => user?.id && sendReminders("debt_reminders", user.id)}
          >
            <Bell className="w-4 h-4" />
            {remindersLoading ? "Sending..." : "Send Debt Reminders"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Sent", value: smsLogs.filter((l) => l.status === "sent").length, color: "text-emerald-500" },
          { label: "Failed", value: smsLogs.filter((l) => l.status === "failed").length, color: "text-destructive" },
          { label: "Today", value: smsLogs.filter((l) => l.created_at?.startsWith(new Date().toISOString().split("T")[0])).length, color: "text-primary" },
          { label: "Total Cost", value: `UGX ${smsLogs.reduce((acc, l) => acc + (Number(l.cost) || 0), 0).toLocaleString()}`, color: "text-amber-500" },
        ].map((stat) => (
          <Card key={stat.label} className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="manual" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="manual" className="gap-2"><Send className="w-4 h-4" /> Quick SMS</TabsTrigger>
          <TabsTrigger value="bulk" className="gap-2"><Users className="w-4 h-4" /> Bulk SMS</TabsTrigger>
          <TabsTrigger value="logs" className="gap-2"><History className="w-4 h-4" /> SMS History</TabsTrigger>
          <TabsTrigger value="credits" className="gap-2"><Receipt className="w-4 h-4" /> Credits</TabsTrigger>
        </TabsList>

        {/* Manual SMS */}
        <TabsContent value="manual">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Send Quick SMS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Recipient Name</label>
                  <Input placeholder="John Doe" value={manualName} onChange={(e) => setManualName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Phone Number *</label>
                  <Input placeholder="256782000000" value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Message *</label>
                <Textarea
                  placeholder="Type your message here..."
                  value={manualMessage}
                  onChange={(e) => setManualMessage(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">{manualMessage.length} characters · Est. cost: UGX {Math.max(manualMessage.length * 0.9, 150).toFixed(0)}</p>
              </div>
              <Button onClick={handleManualSend} disabled={sendSmsMutation.isPending} className="gap-2">
                {sendSmsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send SMS
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk SMS */}
        <TabsContent value="bulk">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Bulk SMS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={bulkFilter} onValueChange={setBulkFilter}>
                  <SelectTrigger><SelectValue placeholder="Filter patients" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Patients</SelectItem>
                    <SelectItem value="male">Male Only</SelectItem>
                    <SelectItem value="female">Female Only</SelectItem>
                    <SelectItem value="admitted">Admitted</SelectItem>
                    <SelectItem value="outpatient">Outpatient</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search patients..."
                    value={bulkSearch}
                    onChange={(e) => setBulkSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="border border-border rounded-lg max-h-48 overflow-y-auto">
                <div className="flex items-center gap-2 p-2 border-b border-border bg-muted/30">
                  <Checkbox
                    checked={patients.length > 0 && selectedPatients.length === patients.length}
                    onCheckedChange={selectAll}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    Select All ({patients.length}) · {selectedPatients.length} selected
                  </span>
                </div>
                {patients.map((pt) => (
                  <div key={pt.id} className="flex items-center gap-2 p-2 hover:bg-muted/20 border-b border-border/50 last:border-0">
                    <Checkbox
                      checked={selectedPatients.includes(pt.id)}
                      onCheckedChange={() => togglePatient(pt.id)}
                    />
                    <span className="text-sm flex-1 truncate">{pt.name}</span>
                    <span className="text-xs text-muted-foreground">{pt.phone}</span>
                    <Badge variant="outline" className="text-[10px]">{pt.status}</Badge>
                  </div>
                ))}
                {patients.length === 0 && (
                  <p className="p-4 text-center text-sm text-muted-foreground">No patients with phone numbers found</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Message *</label>
                <Textarea
                  placeholder="Type your bulk message..."
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  {bulkMessage.length} chars · {selectedPatients.length} recipients · Est. cost: UGX {(selectedPatients.length * Math.max(bulkMessage.length * 0.9, 150)).toFixed(0)}
                </p>
              </div>

              <Button onClick={handleBulkSend} disabled={sendSmsMutation.isPending || selectedPatients.length === 0} className="gap-2">
                {sendSmsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send to {selectedPatients.length} Recipients
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Logs */}
        <TabsContent value="logs">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> SMS History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : smsLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No SMS messages sent yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="p-2 text-muted-foreground font-medium">Recipient</th>
                        <th className="p-2 text-muted-foreground font-medium">Phone</th>
                        <th className="p-2 text-muted-foreground font-medium">Message</th>
                        <th className="p-2 text-muted-foreground font-medium">Type</th>
                        <th className="p-2 text-muted-foreground font-medium">Status</th>
                        <th className="p-2 text-muted-foreground font-medium">Cost</th>
                        <th className="p-2 text-muted-foreground font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {smsLogs.map((log: any) => (
                        <tr key={log.id} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="p-2">{log.recipient_name || "—"}</td>
                          <td className="p-2 font-mono text-xs">{log.recipient_phone}</td>
                          <td className="p-2 max-w-[200px] truncate">{log.message}</td>
                          <td className="p-2"><Badge variant="outline" className="text-[10px]">{log.message_type}</Badge></td>
                          <td className="p-2">
                            <Badge variant={log.status === "sent" ? "default" : "destructive"} className="text-[10px]">
                              {log.status}
                            </Badge>
                          </td>
                          <td className="p-2 text-xs">{log.cost || 0}</td>
                          <td className="p-2 text-xs text-muted-foreground">
                            {log.created_at ? format(new Date(log.created_at), "dd/MM/yy HH:mm") : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credits Tab */}
        <TabsContent value="credits">
          <CreditTransactionHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunicationPage;
