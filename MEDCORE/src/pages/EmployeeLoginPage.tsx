import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Star, ChevronRight, Shield, Plus, X, Edit2, Check, X as XIcon } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc,
  updateDoc 
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployee } from "@/contexts/EmployeeContext";
import type { EmployeeSession } from "@/lib/employee-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/medicore-logo.png";

interface EmployeeEntry {
  id: string;
  full_name: string;
  role: string;
  email: string;
  active: boolean;
  permissions: Record<string, boolean>;
  rating?: number;
  security_code?: string;
}

const EmployeeLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { setEmployee } = useEmployee();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<EmployeeEntry[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeEntry | null>(null);
  const [securityCode, setSecurityCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpRole, setNewEmpRole] = useState("admin");
  const [newEmpCode, setNewEmpCode] = useState("");
  const [isEditingClinicName, setIsEditingClinicName] = useState(false);
  const [tempClinicName, setTempClinicName] = useState("");

  const ROLE_OPTIONS = [
    { label: "Administrator", value: "admin" },
    { label: "Doctor", value: "doctor" },
    { label: "Nurse", value: "nurse" },
    { label: "Cashier", value: "cashier" },
    { label: "Pharmacist", value: "pharmacist" },
    { label: "Receptionist", value: "receptionist" },
  ];
  const clinicName = user?.displayName || "DIVINE CARE MEDICAL CENTER";

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchEmployees = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const q = query(
          collection(db, "clinic_employees"),
          where("owner_id", "==", user.uid),
          where("active", "==", true)
        );
        const querySnapshot = await getDocs(q);
        const remote = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as EmployeeEntry[];
        setEmployees(remote);
      } catch (error) {
        console.error("Error fetching employees:", error);
        setErrorMsg("Failed to load employees. Please check your connection and try again.");
        setEmployees([]);
      }
      setLoading(false);
    };

    fetchEmployees();
  }, [user, navigate]);

  const handleLogin = async () => {
    setErrorMsg("");

    if (!selectedEmployee) {
      setErrorMsg("Select an employee record to proceed.");
      return;
    }

    if (!securityCode.trim()) {
      setErrorMsg("Enter your security code to continue.");
      return;
    }

    if (!user) {
      setErrorMsg("User session expired. Please sign in again.");
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    try {
      const empRef = doc(db, "clinic_employees", selectedEmployee.id);
      const empSnap = await getDoc(empRef);
      
      if (empSnap.exists()) {
        const data = empSnap.data();
        if (data.owner_id === user.uid && data.security_code === securityCode.trim()) {
          const sessionEmployee: EmployeeSession = {
            id: empSnap.id,
            name: data.full_name,
            role: data.role,
            rating: data.rating || 4,
            permissions: data.permissions || {},
          };

          setEmployee(sessionEmployee);
          navigate("/dashboard", { replace: true });
          toast({ title: `Signed in as ${sessionEmployee.name}` });
        } else {
          setErrorMsg("Employee validation failed. Check code and retry.");
        }
      } else {
        setErrorMsg("Employee record not found.");
      }
    } catch (error) {
      setErrorMsg("An error occurred during login. Please try again.");
    }
    setLoading(false);
  };



  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-3 h-3 ${i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
        />
      );
    }
    return stars;
  };

  const handleAddEmployee = async () => {
    setErrorMsg("");
    if (!newEmpName.trim() || !newEmpCode.trim()) {
      setErrorMsg("Name and security code are required.");
      return;
    }
    if (newEmpName !== newEmpName.toUpperCase()) {
      setErrorMsg("Name must be CAPITAL LETTERS.");
      return;
    }
    if (!/^[0-9]{4,8}$/.test(newEmpCode)) {
      setErrorMsg("Security PIN must be 4-8 digits long, numbers only.");
      return;
    }
    const validRoles = ROLE_OPTIONS.map((r) => r.value);
    if (!validRoles.includes(newEmpRole)) {
      setErrorMsg("Selected role is invalid.");
      return;
    }
    if (!user) {
      setErrorMsg("Session expired. Sign in again.");
      return;
    }

    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "clinic_employees"), {
        owner_id: user.uid,
        full_name: newEmpName.trim(),
        role: newEmpRole,
        email: null,
        security_code: newEmpCode,
        active: true,
        rating: 4,
        permissions: {},
        created_at: new Date().toISOString()
      });
      
      toast({ title: "Employee Created ✅", description: `${newEmpName} added successfully. Next: select them and enter PIN to login.` });
      setNewEmpName("");
      setNewEmpCode("");
      setNewEmpRole("admin");
      setShowAddForm(false);

      // Refresh local list
      const newEmp: EmployeeEntry = {
        id: docRef.id,
        full_name: newEmpName.trim(),
        role: newEmpRole,
        email: "",
        active: true,
        permissions: {},
        rating: 4
      };
      setEmployees(prev => [...prev, newEmp]);
    } catch (error: any) {
      console.error("Error creating employee:", error);
      setErrorMsg(`Failed to create employee: ${error.message}. Please check your connection and try again.`);
    }
    setLoading(false);
  };

  const handleClinicNameUpdate = async () => {
    if (!user || !tempClinicName.trim()) return;

    try {
      const { error } = await supabase.auth.updateUser({
        data: { clinic_name: tempClinicName.trim() }
      });

      if (error) {
        toast({ title: "Error", description: "Failed to update clinic name.", variant: "destructive" });
        return;
      }

      toast({ title: "Success", description: "Clinic name updated successfully." });
      setIsEditingClinicName(false);
      // The clinicName will update automatically since it reads from user metadata
    } catch (error) {
      toast({ title: "Error", description: "Failed to update clinic name.", variant: "destructive" });
    }
  };

  const startEditingClinicName = () => {
    setTempClinicName(clinicName);
    setIsEditingClinicName(true);
  };

  const cancelEditingClinicName = () => {
    setIsEditingClinicName(false);
    setTempClinicName("");
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid grid-cols-12 h-screen">
        <aside className="col-span-2 bg-[#081c3f] text-white p-4 flex flex-col justify-between shadow-lg">
          <div>
            <h1 className="text-xl font-bold mb-2">MEDCORE UG</h1>
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider text-slate-300">Subscription Balance:</p>
              <p className="text-2xl font-black text-amber-300">UGX 1620.12</p>
            </div>
            <button onClick={() => navigate('/dashboard/billing')} className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#081c3f] rounded-md py-2 font-semibold mb-5 transition-all duration-200 hover:scale-105">Make a Payment</button>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/dashboard/settings')}
                className={`w-full text-left px-3 py-2 rounded-md transition-all duration-200 hover:bg-white/20 hover:scale-102 ${
                  location.pathname === '/dashboard/settings' ? 'bg-emerald-500 text-[#081c3f] border-l-4 border-emerald-300' : 'bg-white/5'
                }`}
              >
                Settings (admin only)
              </button>
              <button
                onClick={() => navigate('/dashboard/set-drugs')}
                className={`w-full text-left px-3 py-2 rounded-md transition-all duration-200 hover:bg-white/20 hover:scale-102 ${
                  location.pathname === '/dashboard/set-drugs' ? 'bg-emerald-500 text-[#081c3f] border-l-4 border-emerald-300' : 'bg-white/5'
                }`}
              >
                Set Drugs
              </button>
              <button
                onClick={() => navigate('/dashboard/store')}
                className={`w-full text-left px-3 py-2 rounded-md transition-all duration-200 hover:bg-white/20 hover:scale-102 ${
                  location.pathname === '/dashboard/store' ? 'bg-emerald-500 text-[#081c3f] border-l-4 border-emerald-300' : 'bg-white/5'
                }`}
              >
                Re-Stock Drugs
              </button>
              <button
                onClick={() => navigate('/dashboard/set-lab-exams')}
                className={`w-full text-left px-3 py-2 rounded-md transition-all duration-200 hover:bg-white/20 hover:scale-102 ${
                  location.pathname === '/dashboard/set-lab-exams' ? 'bg-emerald-500 text-[#081c3f] border-l-4 border-emerald-300' : 'bg-white/5'
                }`}
              >
                Set Lab and Radiology Exams
              </button>
              <button
                onClick={() => navigate('/dashboard/appointments')}
                className={`w-full text-left px-3 py-2 rounded-md transition-all duration-200 hover:bg-white/20 hover:scale-102 ${
                  location.pathname === '/dashboard/appointments' ? 'bg-emerald-500 text-[#081c3f] border-l-4 border-emerald-300' : 'bg-white/5'
                }`}
              >
                Set Services and Procedures
              </button>
              <button
                onClick={() => navigate('/dashboard/set-drugs')}
                className={`w-full text-left px-3 py-2 rounded-md transition-all duration-200 hover:bg-white/20 hover:scale-102 ${
                  location.pathname === '/dashboard/set-drugs' ? 'bg-emerald-500 text-[#081c3f] border-l-4 border-emerald-300' : 'bg-white/5'
                }`}
              >
                Set Categories
              </button>
              <button
                onClick={() => navigate('/dashboard/appointments')}
                className={`w-full text-left px-3 py-2 rounded-md transition-all duration-200 hover:bg-white/20 hover:scale-102 ${
                  location.pathname === '/dashboard/appointments' ? 'bg-emerald-500 text-[#081c3f] border-l-4 border-emerald-300' : 'bg-white/5'
                }`}
              >
                Set Family Planning
              </button>
              <button
                onClick={() => navigate('/dashboard/stock')}
                className={`w-full text-left px-3 py-2 rounded-md transition-all duration-200 hover:bg-white/20 hover:scale-102 ${
                  location.pathname === '/dashboard/stock' ? 'bg-emerald-500 text-[#081c3f] border-l-4 border-emerald-300' : 'bg-white/5'
                }`}
              >
                Stock Tracking
              </button>
            </div>
          </div>
          <div>
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold">Clinic Name</p>
                {!isEditingClinicName ? (
                  <button onClick={startEditingClinicName} className="text-slate-300 hover:text-white transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <button onClick={handleClinicNameUpdate} className="text-green-400 hover:text-green-300 transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={cancelEditingClinicName} className="text-red-400 hover:text-red-300 transition-colors">
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {isEditingClinicName ? (
                <input
                  type="text"
                  value={tempClinicName}
                  onChange={(e) => setTempClinicName(e.target.value)}
                  className="w-full px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
                  placeholder="Enter clinic name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleClinicNameUpdate();
                    if (e.key === 'Escape') cancelEditingClinicName();
                  }}
                  autoFocus
                />
              ) : (
                <p className="text-xs text-slate-300 truncate">{clinicName}</p>
              )}
            </div>
            <p className="text-sm font-bold mb-1">Disease Statistics</p>
            <button
              onClick={() => navigate('/dashboard/statistics')}
              className={`w-full text-left px-3 py-2 rounded-md transition-all duration-200 hover:bg-white/20 hover:scale-102 ${
                location.pathname === '/dashboard/statistics' ? 'bg-emerald-500 text-[#081c3f] border-l-4 border-emerald-300' : 'bg-white/5'
              }`}
            >
              Disease Bar Graphs
            </button>
          </div>
        </aside>

        <main className="col-span-10 p-8 flex flex-col">
          <header className="text-center mb-6">
            <h1 className="text-4xl font-black">{clinicName.toUpperCase()}</h1>
            <p className="text-xl font-semibold">{new Date().toLocaleString()}</p>
            <p className="text-sm text-slate-500 mt-1">Please select your name before you perform any action on this platform</p>
          </header>

          <section className="mb-8">
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { label: "Cashier" },
                { label: "Billing" },
                { label: "Dispensary & Shelves" },
                { label: "Triage" },
                { label: "Radiographer" },
              ].map((item) => (
                <button key={item.label} className="px-5 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-all duration-200 hover:scale-105 hover:shadow-lg">
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <section className="flex-1 overflow-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {employees.length > 0 ? employees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => { setSelectedEmployee(emp); setSecurityCode(""); setErrorMsg(""); }}
                  className="py-4 px-3 bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 font-bold uppercase transition-all duration-200 hover:scale-105 hover:shadow-lg transform"
                >
                  {emp.full_name}
                </button>
              )) : (
                <div className="col-span-full p-6 text-center bg-white rounded-xl shadow-sm border border-dashed border-slate-300 hover:shadow-md transition-shadow duration-200">
                  <p>No employees yet.</p>
                  <button onClick={() => setShowAddForm(true)} className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105">Create Initial Employee</button>
                </div>
              )}
            </div>
          </section>

          <section className="mt-8 p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200">
            {selectedEmployee ? (
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <span className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center text-lg font-bold">{selectedEmployee.full_name.charAt(0)}</span>
                  <div>
                    <p className="text-lg font-bold">{selectedEmployee.full_name}</p>
                    <p className="text-sm text-slate-500">{selectedEmployee.role}</p>
                  </div>
                </div>

                {errorMsg && <p className="text-sm text-red-500 mb-2">{errorMsg}</p>}

                <div className="space-y-3">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="password"
                      inputMode="numeric"
                      value={securityCode}
                      placeholder="Numeric PIN"
                      onChange={(e) => setSecurityCode(e.target.value.replace(/[^0-9]/g, ""))}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={handleLogin} className="w-full hover:scale-105 transition-transform duration-200">Login</Button>
                  <Button variant="ghost" onClick={() => setSelectedEmployee(null)} className="w-full hover:bg-slate-100 transition-colors duration-200">Cancel</Button>
                </div>
              </div>
            ) : (
              showAddForm ? (
                <div className="max-w-md mx-auto space-y-4">
                  <h3 className="font-bold text-lg">Create Initial Employee</h3>
                  {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

                  <div>
                    <Label className="text-xs">Employee Name</Label>
                    <Input
                      placeholder="LINNET"
                      value={newEmpName}
                      onChange={(e) => setNewEmpName(e.target.value.toUpperCase())}
                    />
                    <p className="text-[10px] text-slate-500">CAPITAL LETTERS only</p>
                  </div>

                  <div>
                    <Label className="text-xs">Role</Label>
                    <Select value={newEmpRole} onValueChange={setNewEmpRole}>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Security PIN</Label>
                    <Input
                      type="password"
                      inputMode="numeric"
                      placeholder="4-8 digits"
                      value={newEmpCode}
                      onChange={(e) => setNewEmpCode(e.target.value.replace(/[^0-9]/g, ""))}
                      maxLength={8}
                    />
                    <p className="text-[10px] text-slate-500">Numeric PIN only</p>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleAddEmployee} className="flex-1 hover:scale-105 transition-transform duration-200">Create Employee</Button>
                    <Button variant="ghost" onClick={() => setShowAddForm(false)} className="flex-1 hover:bg-slate-100 transition-colors duration-200">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="max-w-md mx-auto text-center text-slate-600">
                  <p>Tap a user button above to login with your PIN, or create a user if none exist.</p>
                </div>
              )
            )}
          </section>

          <footer className="mt-6 bg-black text-white text-sm px-4 py-3 rounded-lg flex gap-2 justify-around">
            <button className="btn-secondary hover:bg-slate-700 transition-colors duration-200 hover:scale-105">Store</button>
            <button className="btn-secondary hover:bg-slate-700 transition-colors duration-200 hover:scale-105">Patient Details</button>
            <button className="btn-secondary hover:bg-slate-700 transition-colors duration-200 hover:scale-105">Doctor</button>
            <button className="btn-secondary hover:bg-slate-700 transition-colors duration-200 hover:scale-105">Lab</button>
            <button className="btn-secondary hover:bg-slate-700 transition-colors duration-200 hover:scale-105">Nurse</button>
            <button className="btn-secondary hover:bg-slate-700 transition-colors duration-200 hover:scale-105">Pt Appointments</button>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default EmployeeLoginPage;

