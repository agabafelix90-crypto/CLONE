# Permission-Based Direct Access System

## Overview
This system allows employees to access sections directly based on their assigned permissions, without requiring them to first go through the Dashboard employee selection.

## How It Works

### Architecture
1. **RequireOnboardingGuard** - Validates clinic session and onboarding status
2. **PermissionGuard** - Checks if employee has permission for the specific section
3. **Permission Utilities** - Helper functions for permission checking and navigation

### Permission Mapping
Permissions are mapped to routes in `PermissionGuard.jsx`:
```javascript
const routePermissionMap = {
  '/store': 'Store',
  '/selldrugs': 'selldrugs',
  '/sales': 'sales',
  '/manageDrugs': 'manageDrugs',
  '/access-laboratory': 'access-laboratory',
  '/access-doctors-room': 'access-doctors-room',
  // ... and more
};
```

## Usage Patterns

### Pattern 1: Direct URL Access
An employee can access a section directly via URL if they have permission:
```
https://app.com/store?token=CLINIC_ID&employee=JohnDoe&theme=blue
```

The system will:
1. Validate the clinic session
2. Check if JohnDoe has "Store" permission
3. Allow or deny access accordingly

### Pattern 2: Programmatic Navigation
From within a component, use the utility functions:

```javascript
import { navigateToSection, hasPermission } from './permissionUtils';

// Check permission before navigating
const canAccessStore = await hasPermission(
  token,
  employeeName,
  'Store'
);

// Navigate if permitted
if (canAccessStore) {
  navigateToSection('/store', token, employeeName, navigate, theme);
}
```

### Pattern 3: Dashboard Integration
Update Dashboard to provide direct access links:

```javascript
// From Dashboard, navigate with employee info
const handleStoreClick = () => {
  navigateToSection(
    '/store',
    clinicSessionToken,
    selectedEmployee,
    navigate,
    selectedEmployeeTheme
  );
};
```

## Backend Integration

### Endpoints Used
- `urls.security` - Validate clinic session
- `urls.fetchpermissions2` - Get employee permissions
- `urls.updatepermissions` - Update employee permissions (admin only)

### Permission Schema
Permissions are stored in the `permissions` table:
```sql
CREATE TABLE permissions (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER,
  permission TEXT NOT NULL,
  UNIQUE (employee_id, permission)
);
```

## Available Permissions
1. `Store` - Access Store
2. `selldrugs` - Access Dispensary / Drug Shelves
3. `sales` - Access Cashier Dashboard
4. `manageDrugs` - Manage Drugs (add, delete, modify stock)
5. `access-laboratory` - Access Laboratory Section
6. `labTests` - Access Lab Tests
7. `access-doctors-room` - Access Doctors Room
8. `access-nurse` - Access Nurses Section
9. `access-radiographer` - Access Radiology Section
10. `manageLaboratory` - Manage Lab Investigations
11. `manageServices` - Manage Services
12. `set-sales-expenses-categories` - Set Sales & Expenses Categories
13. `clinicStatistics` - Access Statistics / Reports
14. `access-sales-details` - Access Sales History Details
15. `triage` - Access Triage Department
16. `familyPlanning` - Manage Family Planning Settings
17. `maternity-dashboard` - Access Maternity Dashboard
18. `credits` - View Credits

## Access Control Behavior

### When Employee HAS Permission
✅ Direct access allowed
✅ Can navigate via URL with employee parameter
✅ Component renders normally

### When Employee DOES NOT Have Permission
❌ Access denied (404 style message shown)
❌ User can return to Dashboard or previous page
❌ Permission-denied error message displayed

### When Employee Parameter NOT Provided
⚠️ For backward compatibility, access is allowed
✅ Components should handle missing employee info gracefully
📝 Some operations may require explicit employee selection

## Implementation Steps

### For Developers
1. Add permission to `AdminDashboard.jsx` permission list
2. Add route mapping in `PermissionGuard.jsx` route permission map
3. Update Dashboard navigation to use `navigateToSection()`
4. Test direct URL access with different employees

### For Administrators
1. Go to Employee Settings
2. Select an employee
3. Check/uncheck permissions as needed
4. Save permissions
5. Employee can now access those sections directly

## Examples

### Example 1: Store Access
```javascript
// URL: /store?token=clinic123&employee=JohnDoe&theme=blue
// PermissionGuard checks: Does JohnDoe have 'Store' permission?
// If YES → Component renders
// If NO → Access Denied page shows
```

### Example 2: Multiple Permissions Check
```javascript
import { getEmployeePermissions } from './permissionUtils';

const permissions = await getEmployeePermissions(token, 'JohnDoe');
// Returns: ['Store', 'sales', 'manageDrugs']

// Can now conditionally render UI based on permissions
{permissions.includes('Store') && <StoreLink />}
```

### Example 3: Safe Navigation
```javascript
import { navigateToSection, hasPermission } from './permissionUtils';

const handleNavigate = async () => {
  const can = await hasPermission(token, name, 'sales');
  if (can) {
    navigateToSection('/sales', token, name, navigate, theme);
  } else {
    showError('You don\'t have Cashier access');
  }
};
```

## Troubleshooting

### Issue: "You don't have permission to access this section"
**Solution:** 
1. Check employee is assigned the correct permission in Employee Settings
2. Verify employee name spelling matches exactly
3. Confirm clinic session is still valid

### Issue: Redirect to login on direct access
**Solution:**
1. Verify clinic session token is valid
2. Check URL parameters include `token=CLINIC_ID`
3. Ensure employee parameter is URL-encoded if it has spaces

### Issue: Employee info not persisting across pages
**Solution:**
1. Always pass `token` and `employee` query parameters in navigation links
2. Use `navigateToSection()` utility to ensure consistency
3. Store employee info in context if needed for multiple pages

## Migration Guide

### From Dashboard-Only Navigation
Old: User must go through Dashboard → Select Employee → Click Feature
```javascript
navigate(`/dashboard?token=${token}`);
// Then user clicks button to access feature
```

New: Direct access with permission check
```javascript
navigateToSection('/store', token, employeeName, navigate, theme);
// User bypasses Dashboard if they have permission
```

### Gradual Migration
1. Leave Dashboard unchanged (still works as before)
2. Add new direct access routes alongside Dashboard links
3. Update individual components to support employee parameter
4. Eventually deprecate Dashboard dependency for experienced users

## Security Considerations

✅ **Session Validation** - Every request validates clinic session
✅ **Permission Checking** - Server verifies employee has permission
✅ **Token-Based** - No hardcoded credentials in URLs
✅ **Logging** - Access attempts are logged on server (if implemented)

⚠️ **Note:** URLs with employee names are not encrypted. Do not share URLs publicly.

## Testing

### Test Cases
1. ✅ Employee with permission → Direct access works
2. ✅ Employee without permission → Access denied shown
3. ✅ Invalid token → Redirect to login
4. ✅ Expired session → Redirect to login
5. ✅ Admin adds permission → Employee gains access immediately
6. ✅ Admin removes permission → Employee loses access immediately

### Test URLs
```
# Store access - John has permission
http://localhost:5173/store?token=clinic123&employee=John&theme=blue

# Cashier access - Jane doesn't have permission
http://localhost:5173/sales?token=clinic123&employee=Jane&theme=white

# Direct lab access - Labs team member
http://localhost:5173/access-laboratory?token=clinic123&employee=LabTech&theme=blue
```
