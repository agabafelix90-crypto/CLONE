import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployee } from "@/contexts/EmployeeContext";
import { useTheme } from "@/hooks/use-theme";
import { canAccessRoute, type EmployeeSession } from "@/lib/employee-auth";
import {
  Home, CreditCard, DollarSign, Pill, Stethoscope, FlaskConical, Heart,
  ClipboardList, Users, Settings, BarChart3, Package, CalendarCheck,
  LogOut, ChevronLeft, ChevronRight, Activity, Microscope, Moon, Sun, MessageSquare
} from "lucide-react";
import logo from "@/assets/medicore-logo.png";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  userName: string;
}

const menuItems = [
  { label: "Home Page", icon: Home, path: "/dashboard" },
  { label: "Billing", icon: CreditCard, path: "/dashboard/billing" },
  { label: "Cashier", icon: DollarSign, path: "/dashboard/cashier" },
  { label: "Pharmacy", icon: Pill, path: "/dashboard/pharmacy" },
  { label: "Radiographer", icon: Microscope, path: "/dashboard/radiology" },
  { label: "Store", icon: Package, path: "/dashboard/store" },
  { label: "Doctor", icon: Stethoscope, path: "/dashboard/doctor" },
  { label: "Laboratory", icon: FlaskConical, path: "/dashboard/laboratory" },
  { label: "Nurse", icon: Heart, path: "/dashboard/nurse" },
  { label: "Triage", icon: Activity, path: "/dashboard/triage" },
  { label: "Pt Appointments", icon: CalendarCheck, path: "/dashboard/appointments" },
  { label: "Communication", icon: MessageSquare, path: "/dashboard/communication" },
];

const sidebarBottomItems = [
  { label: "Stock Tracking", icon: Package, path: "/dashboard/stock" },
  { label: "Disease Statistics", icon: BarChart3, path: "/dashboard/statistics" },
  { label: "Sales History", icon: ClipboardList, path: "/dashboard/sales" },
  { label: "Settings", icon: Settings, path: "/dashboard/settings" },
];

const DashboardSidebar = ({ collapsed, onToggle, userName }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { employee: currentEmployee } = useEmployee();
  const { resolvedTheme, setTheme } = useTheme();
  const visibleMenuItems = menuItems.filter((item) => canAccessRoute(currentEmployee, item.path));
  const visibleBottomItems = sidebarBottomItems.filter((item) => canAccessRoute(currentEmployee, item.path));

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <aside className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col glass-sidebar bg-sidebar transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-4 border-b border-sidebar-border">
        <img src={logo} alt="CP" className="h-8 w-8 shrink-0" />
        {!collapsed && <span className="font-heading text-sm font-bold text-sidebar-foreground truncate">MediCore</span>}
        <button onClick={onToggle} className="ml-auto text-sidebar-foreground/50 hover:text-sidebar-foreground">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* User */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center text-primary-foreground text-xs font-bold">
              {userName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">{userName}</p>
              <p className="text-[10px] text-sidebar-foreground/50">Staff</p>
            </div>
          </div>
        </div>
      )}

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {visibleMenuItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`clinic-sidebar-item w-full ${active ? "active" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}

        <div className="my-3 border-t border-sidebar-border" />

        {visibleBottomItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`clinic-sidebar-item w-full ${active ? "active" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Theme Toggle & Logout */}
      <div className="px-2 py-3 border-t border-sidebar-border space-y-0.5">
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="clinic-sidebar-item w-full"
          title={collapsed ? (resolvedTheme === "dark" ? "Light Mode" : "Dark Mode") : undefined}
        >
          {resolvedTheme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          {!collapsed && <span>{resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
        </button>
        <button
          onClick={handleLogout}
          className="clinic-sidebar-item w-full hover:!text-destructive"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
