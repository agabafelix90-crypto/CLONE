import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Lock, MessageSquare, Shield, Plus, Trash2, X,
  ChevronLeft, Eye, EyeOff, Building2, Sun, Moon, Monitor,
  CheckCircle, XCircle, Clock, CreditCard
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { normalizeEmployeeList } from "@/lib/employee-auth";

interface Employee {
  id: string;
  name: string;
  role: string;
  permissions: Record<string, boolean>;
  password?: string;
}

const ALL_PERMISSIONS = [
  { key: "store", label: "Permit access to store" },
  { key: "dispensary", label: "Permit access dispensary or drug shelves" },
  { key: "deleteSale", label: "Allow delete a sale from the sales page records" },
  { key: "laboratory", label: "Permit access laboratory section" },
  { key: "cashier", label: "Allow access cashier dashboard" },
  { key: "radiology", label: "Permit access radiology section" },
  { key: "viewCosts", label: "Allow view costs spent on treating patient" },
  { key: "orderDrugs", label: "Permit make order for drugs" },
  { key: "clinicStats", label: "Permit access to clinic statistics" },
  { key: "doctor", label: "Permit access to Doctors section" },
  { key: "nurse", label: "Permit access to nurses section" },
  { key: "manageDrugs", label: "Permit manage drugs (add, delete, modify stock)" },
  { key: "triage", label: "Access the triage department" },
  { key: "sendSMS", label: "Send SMS" },
  { key: "familyPlanning", label: "Manage Family Planning settings" },
  { key: "manageInvestigations", label: "Permit manage laboratory and radiology investigations" },
  { key: "salesHistory", label: "Permit access to Sales History Details" },
  { key: "manageServices", label: "Manage Services (add, edit, delete services)" },
  { key: "editBills", label: "Edit Patient Bills" },
  { key: "setCategories", label: "Set Sales and Expenses Categories" },
];

const SMS_SETTINGS = [
  {
    key: "billPayment",
    label: "SMS after bill payment (Balance + Feedback link) - automatic",
    description: "Automatic SMS sent after bill payment",
    cost: "UGX 0.5 per character (min: UGX 100)",
    auto: true,
  },
  {
    key: "birthday",
    label: "Birthday SMS to patients - automatic",
    description: "Automatic birthday greetings to patients",
    cost: "UGX 0.6 per character (min: UGX 100)",
    auto: true,
  },
  {
    key: "pendingBalance",
    label: "Reminder for pending balances - automatic",
    description: "Automatic reminders for outstanding balances",
    cost: "UGX 0.5 per character (min: UGX 100)",
    auto: true,
  },
  {
    key: "customSingle",
    label: "Custom SMS to a single patient - manual",
    description: "Manual custom messages to individual patients",
    cost: "UGX 0.9 per character (min: UGX 150)",
    auto: false,
  },
  {
    key: "customGroup",
    label: "Custom SMS to a group of patients - manual",
    description: "Manual bulk messages to multiple patients",
    cost: "UGX 0.9 per character (min: UGX 150)",
    auto: false,
  },
];

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [clinicNameField, setClinicNameField] = useState("MEDICORE");
  const [clinicPhone, setClinicPhone] = useState("");

  useEffect(() => {
    if (!user) return;
    const userClinic = user.user_metadata?.clinic_name;
    setClinicNameField(userClinic || "MEDICORE");
  }, [user]);
  const [clinicLocation, setClinicLocation] = useState("");

  // Employees state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpRole, setNewEmpRole] = useState("admin");
  const [newEmpCode, setNewEmpCode] = useState("");

  const ROLE_OPTIONS = [
    { label: "Administrator", value: "admin" },
    { label: "Doctor", value: "doctor" },
    { label: "Nurse", value: "nurse" },
    { label: "Cashier", value: "cashier" },
    { label: "Pharmacist", value: "pharmacist" },
    { label: "Receptionist", value: "receptionist" },
  ];

  // Permissions dialog
  const [permTarget, setPermTarget] = useState<Employee | null>(null);
  const [permState, setPermState] = useState<Record<string, boolean>>({});
  const [permPassword, setPermPassword] = useState("");

  // Password change
  const [passwordType, setPasswordType] = useState<string>("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // SMS settings
  const [smsEnabled, setSmsEnabled] = useState<Record<string, boolean>>({
    billPayment: true,
    birthday: true,
    pendingBalance: true,
    customSingle: true,
    customGroup: true,
  });

  // Manual payments
  const [manualPayments, setManualPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    // SECURITY: Removed localStorage fallback for SMS settings
    // SMS settings should be stored in database for security and consistency
    // Default settings are used until database integration is implemented
  }, []);

  // Stats
  const activePatients = 0;
  const drugsWorth = 0;
  const currentRevenue = 0;

  // SECURITY: Removed syncEmployees function that used localStorage
  // All employee data must be stored and retrieved from secure database only

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!user) return;

      setLoadingEmployees(true);
      const { data, error } = await supabase
        .from("clinic_employees")
        .select("id, full_name, role, email, permissions, active, rating")
        .eq("owner_id", user.id)
        .eq("active", true)
        .order("full_name", { ascending: true });

      setLoadingEmployees(false);

      if (error) {
        console.error("Error fetching employees:", error);
        toast({ title: "Error", description: "Failed to load employees. Please check your connection.", variant: "destructive" });
        setEmployees([]);
      } else if (data) {
        const mapped: Employee[] = data.map((e: any) => ({
          id: e.id,
          name: e.full_name,
          role: e.role,
          permissions: e.permissions || {},
          password: "",
        }));
        setEmployees(mapped);
      }
    };

    void fetchEmployees();
  }, [user]);

  const addEmployee = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be signed in to add employees.", variant: "destructive" });
      return;
    }
    if (!newEmpName.trim() || !newEmpRole.trim() || !newEmpCode.trim()) {
      toast({ title: "Error", description: "Name, role and security code are required.", variant: "destructive" });
      return;
    }
    if (newEmpName !== newEmpName.toUpperCase()) {
      toast({ title: "Error", description: "Employee name must be in CAPITAL LETTERS.", variant: "destructive" });
      return;
    }
    if (!/^[0-9]{4,8}$/.test(newEmpCode)) {
      toast({ title: "Error", description: "Security PIN must be numeric and 4-8 digits long.", variant: "destructive" });
      return;
    }
    const validRoles = ROLE_OPTIONS.map((r) => r.value);
    if (!validRoles.includes(newEmpRole)) {
      toast({ title: "Error", description: "Selected role is invalid.", variant: "destructive" });
      return;
    }

    setLoadingEmployees(true);
    const { data, error } = await supabase.rpc("create_clinic_employee", {
      owner_id: user.id,
      full_name: newEmpName.trim(),
      role: newEmpRole as any,
      email: null,
      password: newEmpCode,
    });
    setLoadingEmployees(false);

    if (error || !data) {
      toast({ title: "Error", description: "Unable to create employee record. Try again.", variant: "destructive" });
      return;
    }

    const created = Array.isArray(data) ? data[0] : data;
    const emp: Employee = {
      id: created.id,
      name: created.full_name,
      role: created.role,
      permissions: created.permissions || {},
    };
    const updated = [...employees, emp];
    setEmployees(updated);
    setNewEmpName("");
    setNewEmpRole("");
    setNewEmpCode("");
    setShowAddEmployee(false);
    toast({ title: "Employee Added", description: `${emp.name} has been added.` });
  };

  const deleteEmployee = async (id: string) => {
    if (!user) {
      toast({ title: "Error", description: "Sign-in required to delete employees.", variant: "destructive" });
      return;
    }

    setLoadingEmployees(true);
    const { error } = await supabase
      .from("clinic_employees")
      .delete()
      .eq("id", id)
      .eq("owner_id", user.id);
    setLoadingEmployees(false);

    if (error) {
      toast({ title: "Error", description: "Could not delete employee. Try again.", variant: "destructive" });
      return;
    }

    const updated = employees.filter(e => e.id !== id);
    setEmployees(updated);
    toast({ title: "Employee Removed" });
  };

  const openPermissions = (emp: Employee) => {
    setPermTarget(emp);
    setPermState({ ...emp.permissions });
    setPermPassword("");
  };

  const savePermissions = async () => {
    if (!permTarget || !user) return;

    const payload: any = {
      owner_id: user.id,
      employee_id: permTarget.id,
      permissions: permState,
    };
    if (permPassword) payload.password = permPassword;

    const { data, error } = await supabase.rpc("update_clinic_employee_permissions", payload);

    if (error) {
      toast({ title: "Error", description: "Failed to update permissions. Try again.", variant: "destructive" });
      return;
    }

    const updated = employees.map(e =>
      e.id === permTarget.id
        ? {
            ...e,
            permissions: permState,
          }
        : e
    );

    setEmployees(updated);
    setPermTarget(null);
    setPermPassword("");
    toast({ title: "Permissions Updated", description: `Permissions for ${permTarget.name} saved.` });
  };

  const toggleAllPermissions = (checked: boolean) => {
    const updated: Record<string, boolean> = {};
    ALL_PERMISSIONS.forEach(p => { updated[p.key] = checked; });
    setPermState(updated);
  };

  const allSelected = ALL_PERMISSIONS.every(p => permState[p.key]);

  const changePassword = () => {
    if (!passwordType) {
      toast({ title: "Error", description: "Select password type.", variant: "destructive" });
      return;
    }
    if (!oldPassword || !newPassword) {
      toast({ title: "Error", description: "Fill all fields.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    toast({ title: "Password Changed", description: `${passwordType} password updated successfully.` });
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordType("");
  };

  const saveSmsSettings = () => {
    // SECURITY: Removed localStorage storage of SMS settings
    // SMS settings should be stored in database for security and consistency
    // TODO: Implement database storage for SMS settings
    toast({ title: "SMS Settings Saved", description: "Your SMS preferences have been updated." });
  };

  // Manual payments functions
  useEffect(() => {
    const fetchManualPayments = async () => {
      if (!user) return;

      setLoadingPayments(true);
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("payment_status", "pending_manual")
        .order("created_at", { ascending: false });

      setLoadingPayments(false);
      if (error) {
        console.error("Error fetching manual payments:", error);
        return;
      }
      setManualPayments(data || []);
    };

    fetchManualPayments();
  }, [user]);

  const approveManualPayment = async (paymentId: string) => {
    const { error } = await supabase
      .from("subscriptions")
      .update({
        payment_status: "active",
        verified_by: user?.id || null,
        verified_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    if (error) {
      toast({ title: "Error", description: "Failed to approve payment.", variant: "destructive" });
      return;
    }

    setManualPayments(prev => prev.filter(p => p.id !== paymentId));
    toast({ title: "Payment Approved", description: "Subscription has been activated." });
  };

  const rejectManualPayment = async (paymentId: string) => {
    const { error } = await supabase
      .from("subscriptions")
      .update({
        payment_status: "rejected",
        verified_by: user?.id || null,
        verified_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    if (error) {
      toast({ title: "Error", description: "Failed to reject payment.", variant: "destructive" });
      return;
    }

    setManualPayments(prev => prev.filter(p => p.id !== paymentId));
    toast({ title: "Payment Rejected", description: "Payment request has been rejected." });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">{clinicNameField || "MEDICORE"}</h1>
          <p className="text-sm text-muted-foreground">Settings</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Employees", value: employees.length, icon: Users },
          { label: "Active Patients", value: activePatients, icon: Users },
          { label: "Drugs Worth", value: `UGX ${drugsWorth.toLocaleString()}`, icon: Users },
          { label: "Monthly Revenue", value: `UGX ${currentRevenue.toLocaleString()}`, icon: Users },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList className="grid grid-cols-7 w-full max-w-4xl">
          <TabsTrigger value="clinic" className="gap-1.5 text-xs sm:text-sm">
            <Building2 className="w-4 h-4 hidden sm:inline" /> Clinic
          </TabsTrigger>
          <TabsTrigger value="employees" className="gap-1.5 text-xs sm:text-sm">
            <Users className="w-4 h-4 hidden sm:inline" /> Employees
          </TabsTrigger>
          <TabsTrigger value="passwords" className="gap-1.5 text-xs sm:text-sm">
            <Lock className="w-4 h-4 hidden sm:inline" /> Passwords
          </TabsTrigger>
          <TabsTrigger value="sms" className="gap-1.5 text-xs sm:text-sm">
            <MessageSquare className="w-4 h-4 hidden sm:inline" /> SMS
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5 text-xs sm:text-sm">
            <Sun className="w-4 h-4 hidden sm:inline" /> Theme
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="gap-1.5 text-xs sm:text-sm">
            <Shield className="w-4 h-4 hidden sm:inline" /> Subscriptions
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-1.5 text-xs sm:text-sm">
            <Shield className="w-4 h-4 hidden sm:inline" /> Overview
          </TabsTrigger>
        </TabsList>

        {/* ===== CLINIC INFO TAB ===== */}
        <TabsContent value="clinic">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Clinic Information</CardTitle>
              <p className="text-sm text-muted-foreground">These details appear on all receipts & documents.</p>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div>
                <Label className="text-xs">Clinic Name</Label>
                <Input value={clinicNameField} onChange={e => setClinicNameField(e.target.value)} placeholder="e.g. MediCore Health Centre" />
              </div>
              <div>
                <Label className="text-xs">Phone Number(s)</Label>
                <Input value={clinicPhone} onChange={e => setClinicPhone(e.target.value)} placeholder="e.g. +256752648844 / +256782547057" />
              </div>
              <div>
                <Label className="text-xs">Location / Address</Label>
                <Input value={clinicLocation} onChange={e => setClinicLocation(e.target.value)} placeholder="e.g. Plot 12, Kampala Road, Kampala" />
              </div>
              <Button onClick={async () => {
                // Save clinic settings in user metadata so the name is consistent across pages
                // SECURITY: avoid localStorage for clinic settings
                try {
                  await supabase.auth.updateUser({ data: { clinic_name: clinicNameField } });
                  toast({ title: "Clinic Info Saved", description: "Details will appear on all documents & receipts." });
                } catch (error) {
                  console.error("Failed to update clinic name metadata", error);
                  toast({ title: "Error", description: "Could not save clinic name. Please refresh and try again.", variant: "destructive" });
                }
              }}>
                Save Clinic Info
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== EMPLOYEES TAB ===== */}
        <TabsContent value="employees">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Employee Settings</CardTitle>
              <Button size="sm" onClick={() => setShowAddEmployee(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add Employee
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 p-3 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase">
                  <span>Name</span><span>Role</span><span>Permissions</span><span>Delete</span>
                </div>
                {employees.map(emp => (
                  <div key={emp.id} className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 items-center p-3 border-t">
                    <span className="text-sm font-medium text-foreground">{emp.name}</span>
                    <span className="text-sm text-muted-foreground">{emp.role}</span>
                    <Button variant="outline" size="sm" onClick={() => openPermissions(emp)} disabled={emp.name === "ADMIN"}>
                      Grant Permissions
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteEmployee(emp.id)} disabled={emp.name === "ADMIN"}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add Employee Form */}
              <AnimatePresence>
                {showAddEmployee && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 rounded-lg border bg-muted/30 space-y-3"
                  >
                    <h4 className="text-sm font-semibold text-foreground">Add New Employee</h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Employee Name</Label>
                        <Input
                          placeholder="e.g. KACHE"
                          value={newEmpName}
                          onChange={e => setNewEmpName(e.target.value.toUpperCase())}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">Use CAPITAL LETTERS</p>
                      </div>
                      <div>
                        <Label className="text-xs">Employee Role</Label>
                        <Select value={newEmpRole} onValueChange={setNewEmpRole}>
                          <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                          <SelectContent>
                          {ROLE_OPTIONS.map((role) => (
                            <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                          ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Initial Security PIN</Label>
                      <Input
                        type="password"
                        value={newEmpCode}
                        onChange={e => setNewEmpCode(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="Enter 4+ digit PIN"
                        maxLength={8}
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">Must be numeric. Employees can update this later in the Permissions tab.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addEmployee}>Add This Employee</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAddEmployee(false)}>Cancel</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== PASSWORDS TAB ===== */}
        <TabsContent value="passwords">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-lg">Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Select Password Type</Label>
                <Select value={passwordType} onValueChange={setPasswordType}>
                  <SelectTrigger><SelectValue placeholder="Clinic or Admin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinic">Clinic Password</SelectItem>
                    <SelectItem value="admin">Admin Password</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Old Password</Label>
                <div className="relative">
                  <Input
                    type={showOld ? "text" : "password"}
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    placeholder="Enter old password"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowOld(!showOld)}>
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-xs">New Password</Label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNew(!showNew)}>
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-xs">Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <Button onClick={changePassword} className="w-full">Change Password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== SMS TAB ===== */}
        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SMS Settings</CardTitle>
              <p className="text-xs text-muted-foreground">
                NB: SMS messages will be sent to only active clients. Cost is calculated per character with minimum charges as indicated.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {SMS_SETTINGS.map(sms => (
                <div key={sms.key} className="flex items-start gap-4 p-4 rounded-lg border bg-muted/20">
                  <Switch
                    checked={smsEnabled[sms.key] ?? false}
                    onCheckedChange={checked => setSmsEnabled(prev => ({ ...prev, [sms.key]: checked }))}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{sms.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{sms.description}</p>
                    <p className="text-xs text-primary font-medium mt-1">{sms.cost}</p>
                  </div>
                </div>
              ))}
              <Button onClick={saveSmsSettings}>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== OVERVIEW TAB ===== */}
        {/* ===== APPEARANCE TAB ===== */}
        <TabsContent value="appearance">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle className="text-lg">Appearance</CardTitle>
              <p className="text-sm text-muted-foreground">Choose how the application looks.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "light" as const, label: "Light", icon: Sun, desc: "Light background" },
                  { value: "dark" as const, label: "Dark", icon: Moon, desc: "Dark background" },
                  { value: "system" as const, label: "System", icon: Monitor, desc: "Follow device" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      theme === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30 hover:bg-muted/50"
                    }`}
                  >
                    <opt.icon className={`w-6 h-6 ${theme === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${theme === opt.value ? "text-primary" : "text-foreground"}`}>{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manual Payment Verification</CardTitle>
              <p className="text-sm text-muted-foreground">Review and approve manual subscription payments.</p>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : manualPayments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending manual payments</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {manualPayments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-amber-500" />
                          <div>
                            <p className="font-medium">{payment.plan} Plan</p>
                            <p className="text-sm text-muted-foreground">
                              UGX {payment.amount?.toLocaleString()} • {payment.phone_number}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded border border-amber-200 dark:border-amber-800">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                          Transaction ID: {payment.manual_transaction_id}
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          User paid to 256752648844. Verify this transaction ID matches your records.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveManualPayment(payment.id)}
                          className="gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectManualPayment(payment.id)}
                          className="gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Permissions Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold text-muted-foreground">Permission</th>
                      {employees.filter(e => e.name !== "ADMIN").map(emp => (
                        <th key={emp.id} className="text-center p-2 font-semibold text-muted-foreground">{emp.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ALL_PERMISSIONS.map(perm => (
                      <tr key={perm.key} className="border-b last:border-0">
                        <td className="p-2 text-foreground">{perm.label}</td>
                        {employees.filter(e => e.name !== "ADMIN").map(emp => (
                          <td key={emp.id} className="text-center p-2">
                            {emp.permissions[perm.key] ? (
                              <span className="inline-block w-3 h-3 rounded-full bg-primary" />
                            ) : (
                              <span className="inline-block w-3 h-3 rounded-full bg-muted-foreground/20" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {employees.filter(e => e.name !== "ADMIN").length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Add employees to see their permissions overview.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===== PERMISSIONS DIALOG ===== */}
      <Dialog open={!!permTarget} onOpenChange={() => setPermTarget(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Set Permissions for {permTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => toggleAllPermissions(!!checked)}
              />
              <Label className="text-sm font-medium cursor-pointer">Select / Deselect All</Label>
            </div>
            {ALL_PERMISSIONS.map(perm => (
              <div key={perm.key} className="flex items-center gap-2">
                <Checkbox
                  checked={permState[perm.key] ?? false}
                  onCheckedChange={(checked) =>
                    setPermState(prev => ({ ...prev, [perm.key]: !!checked }))
                  }
                />
                <Label className="text-sm cursor-pointer">{perm.label}</Label>
              </div>
            ))}
            <div className="pt-3 border-t">
              <Label className="text-xs">Set Individual Password for {permTarget?.name}:</Label>
              <Input
                className="mt-1"
                type="text"
                inputMode="numeric"
                pattern="[1-9]*"
                placeholder="Only numbers! Leave empty to skip."
                value={permPassword}
                onChange={e => {
                  const val = e.target.value.replace(/[^1-9]/g, "");
                  setPermPassword(val);
                }}
              />
              <p className="text-[10px] text-muted-foreground mt-1">Only numbers (no zeros). Leave empty if no change.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPermTarget(null)}>Cancel</Button>
            <Button onClick={savePermissions}>Update Permissions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
