import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import DashboardSidebar from "@/components/DashboardSidebar";
import NotificationCenter from "@/components/NotificationCenter";
import PatientSearchBar from "@/components/PatientSearchBar";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployee } from "@/contexts/EmployeeContext";
import { useNotificationGenerator } from "@/hooks/use-notifications";
import { ChevronLeft, Star } from "lucide-react";
import { canAccessRoute, type EmployeeSession } from "@/lib/employee-auth";

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const { employee: currentEmployee } = useEmployee();
  const location = useLocation();
  const navigate = useNavigate();

  const userName = currentEmployee?.name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "ADMIN";
  const employeeRating = currentEmployee?.rating || 4;
  const isSubPage = location.pathname !== "/dashboard";

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
      );
    }
    return stars;
  };

  // Auto-generate system notifications on dashboard load
  useNotificationGenerator();

  useEffect(() => {
    if (!canAccessRoute(currentEmployee, location.pathname)) {
      navigate("/dashboard", { replace: true });
    }
  }, [currentEmployee, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        userName={userName}
      />
      <main className={`transition-all duration-300 ${collapsed ? "ml-16" : "ml-60"}`}>
        {/* Top bar with notifications */}
        <div className="sticky top-0 z-30 flex items-center gap-4 px-6 py-2 bg-background/60 backdrop-blur-xl border-b border-border/30">
          {isSubPage && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <PatientSearchBar />
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-medium text-foreground hidden md:inline">{userName}</span>
            <div className="hidden md:flex gap-0.5">{renderStars(employeeRating)}</div>
          </div>
          <NotificationCenter />
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
