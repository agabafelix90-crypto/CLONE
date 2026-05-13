/**
 * Permission checking utilities for direct section access
 */
import { urls } from './config.dev';

const permissionAliases = {
  view_sales: ['sales'],
  view_inventory: ['store', 'selldrugs'],
  manage_employees: ['manage_employees'],
};

const normalizePermissions = (permissions = []) => {
  return Array.from(new Set(
    (permissions || []).flatMap((permission) => {
      const normalized = permission?.toString().trim().toLowerCase();
      if (!normalized) return [];
      return permissionAliases[normalized] || [normalized];
    })
  ));
};

const fetchClinicPermissions = async (token) => {
  try {
    const response = await fetch(urls.fetchpermissions, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return normalizePermissions(data.permissions || []);
  } catch (error) {
    console.error('Error fetching clinic permissions:', error);
    return [];
  }
};

/**
 * Check if an employee has permission for a specific action
 * @param {string} token - Clinic session token
 * @param {string} employeeName - Name of the employee
 * @param {string} requiredPermission - The permission to check
 * @returns {Promise<boolean>} - True if employee has permission
 */
export const hasPermission = async (token, employeeName, requiredPermission) => {
  try {
    const response = await fetch(urls.fetchpermissions2, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, employeeName }),
    });

    if (!response.ok) {
      const fallbackPermissions = await fetchClinicPermissions(token);
      return fallbackPermissions.includes(requiredPermission);
    }

    const data = await response.json();
    const permissions = normalizePermissions(data.permissions || []);

    if (data.success === false) {
      const fallbackPermissions = await fetchClinicPermissions(token);
      return fallbackPermissions.includes(requiredPermission);
    }

    return permissions.includes(requiredPermission);
  } catch (error) {
    console.error('Error checking permission:', error);
    const fallbackPermissions = await fetchClinicPermissions(token);
    return fallbackPermissions.includes(requiredPermission);
  }
};

/**
 * Get all permissions for an employee
 * @param {string} token - Clinic session token
 * @param {string} employeeName - Name of the employee
 * @returns {Promise<string[]>} - Array of permission strings
 */
export const getEmployeePermissions = async (token, employeeName) => {
  try {
    const response = await fetch(urls.fetchpermissions2, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, employeeName }),
    });

    if (!response.ok) {
      return await fetchClinicPermissions(token);
    }

    const data = await response.json();
    if (data.success === false) {
      return await fetchClinicPermissions(token);
    }

    return normalizePermissions(data.permissions || []);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return await fetchClinicPermissions(token);
  }
};

/**
 * Navigate to a section with employee and permission check
 * @param {string} section - The section path to navigate to
 * @param {string} token - Clinic session token
 * @param {string} employeeName - Name of the employee
 * @param {function} navigate - React Router navigate function
 * @param {string} theme - Optional theme parameter
 */
export const navigateToSection = async (
  section,
  token,
  employeeName,
  navigate,
  theme = 'blue'
) => {
  try {
    // Verify session is still valid
    const securityResponse = await fetch(urls.security, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!securityResponse.ok) {
      navigate('/login');
      return;
    }

    const securityData = await securityResponse.json();
    if (securityData.message !== 'Session valid') {
      navigate('/login');
      return;
    }

    // Navigate to the section with employee info
    navigate(`${section}?token=${token}&employee=${encodeURIComponent(employeeName)}&theme=${theme}`);
  } catch (error) {
    console.error('Error navigating to section:', error);
    navigate('/login');
  }
};

/**
 * Create a direct access URL for a section
 * @param {string} section - The section path
 * @param {string} token - Clinic session token
 * @param {string} employeeName - Name of the employee
 * @param {string} theme - Optional theme
 * @returns {string} - The complete URL
 */
export const getSectionUrl = (section, token, employeeName, theme = 'blue') => {
  return `${section}?token=${token}&employee=${encodeURIComponent(employeeName)}&theme=${theme}`;
};

/**
 * Get employee name and theme from URL parameters
 * @returns {Object} - { employeeName, theme, token }
 */
export const getEmployeeInfoFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    employeeName: params.get('employee') || null,
    theme: params.get('theme') || 'blue',
    token: params.get('token') || null,
  };
};
