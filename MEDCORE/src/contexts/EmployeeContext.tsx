import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { EmployeeSession } from "@/lib/employee-auth";

interface EmployeeContextType {
  employee: EmployeeSession | null;
  setEmployee: (employee: EmployeeSession | null) => void;
  clearEmployee: () => void;
}

const EmployeeContext = createContext<EmployeeContextType>({
  employee: null,
  setEmployee: () => {},
  clearEmployee: () => {},
});

export const useEmployee = () => useContext(EmployeeContext);

export const EmployeeProvider = ({ children }: { children: ReactNode }) => {
  const [employee, setEmployeeState] = useState<EmployeeSession | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("currentEmployee");
      if (stored) {
        setEmployeeState(JSON.parse(stored));
      }
    } catch {
      setEmployeeState(null);
    }
  }, []);

  // Clear employee when user logs out
  useEffect(() => {
    if (!user) {
      setEmployeeState(null);
      sessionStorage.removeItem("currentEmployee");
    }
  }, [user]);

  const setEmployee = (emp: EmployeeSession | null) => {
    setEmployeeState(emp);
    if (emp) {
      sessionStorage.setItem("currentEmployee", JSON.stringify(emp));
    } else {
      sessionStorage.removeItem("currentEmployee");
    }
  };

  const clearEmployee = () => setEmployee(null);

  return (
    <EmployeeContext.Provider value={{ employee, setEmployee, clearEmployee }}>
      {children}
    </EmployeeContext.Provider>
  );
};
