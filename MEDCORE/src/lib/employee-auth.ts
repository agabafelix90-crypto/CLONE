// CRITICAL SECURITY FIX: Remove password field from client-side interface
// Passwords are NEVER stored or processed client-side for security
export interface EmployeeSession {
  id: string;
  name: string;
  role: string;
  permissions?: Record<string, boolean>;
  rating?: number;
  // password field REMOVED - passwords never stored client-side
}

// SECURITY: Removed insecure client-side password hashing functions
// All password operations now happen server-side only with proper bcrypt hashing

export const normalizeEmployeeList = (employees: EmployeeSession[]): EmployeeSession[] =>
  employees.map((employee) => {
    // SECURITY: Removed password processing - passwords never handled client-side
    return {
      ...employee,
      permissions: employee.permissions || {},
    };
  });

const routePermissionMap: Record<string, string> = {
  "/dashboard/billing": "editBills",
  "/dashboard/cashier": "cashier",
  "/dashboard/pharmacy": "dispensary",
  "/dashboard/radiology": "radiology",
  "/dashboard/store": "store",
  "/dashboard/doctor": "doctor",
  "/dashboard/laboratory": "laboratory",
  "/dashboard/nurse": "nurse",
  "/dashboard/triage": "triage",
  "/dashboard/appointments": "manageServices",
  "/dashboard/communication": "sendSMS",
  "/dashboard/stock": "manageDrugs",
  "/dashboard/statistics": "clinicStats",
  "/dashboard/sales": "salesHistory",
};

export const canAccessRoute = (
  currentEmployee: EmployeeSession | null,
  pathname: string,
): boolean => {
  if (!currentEmployee) return true;
  if (currentEmployee.role?.toLowerCase() === "administrator") return true;
  const key = routePermissionMap[pathname];
  if (!key) return true;
  return !!currentEmployee.permissions?.[key];
};
