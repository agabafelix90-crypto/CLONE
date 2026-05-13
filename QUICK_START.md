# Permission-Based Access - Quick Start Guide

## For System Users

### How to Access Sections Directly

**Option 1: From Dashboard (Current Method - Still Works)**
1. Go to Dashboard
2. Select your name
3. Enter your password
4. Click the feature button (Store, Cashier, etc.)

**Option 2: Direct Link (New!)**
1. Ask admin for your direct access URL
2. Opens directly to your section
3. No Dashboard needed

### URL Format
If your name is "John" and section is Store:
```
https://yourapp.com/store?token=CLINIC_ID&employee=John&theme=blue
```

**Note:** Replace:
- `CLINIC_ID` = your clinic's token
- `John` = your employee name (must match exactly)
- `blue` = theme (blue or white)

---

## For Developers

### Quick Reference

#### 1. Check if Employee Can Access Something
```javascript
import { hasPermission } from './permissionUtils';

const canAccess = await hasPermission(token, employeeName, 'Store');
if (canAccess) {
  console.log('User can access Store');
}
```

#### 2. Get All Employee Permissions
```javascript
import { getEmployeePermissions } from './permissionUtils';

const perms = await getEmployeePermissions(token, employeeName);
console.log(perms); // ['Store', 'sales', 'manageDrugs']

// Conditionally render UI
{perms.includes('sales') && <CashierButton />}
```

#### 3. Navigate to Section Safely
```javascript
import { navigateToSection } from './permissionUtils';
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

const handleClick = () => {
  navigateToSection(
    '/store',           // target section
    token,              // clinic token
    employeeName,       // employee name
    navigate,           // react router navigate
    'blue'              // theme
  );
};
```

#### 4. Build Direct Access URL
```javascript
import { getSectionUrl } from './permissionUtils';

const url = getSectionUrl('/store', token, 'John', 'blue');
// Returns: /store?token=XYZ&employee=John&theme=blue

// Share this URL
window.open(url);
// Or: window.location.href = url;
```

#### 5. Extract Employee Info from URL
```javascript
import { getEmployeeInfoFromUrl } from './permissionUtils';

const { employeeName, theme, token } = getEmployeeInfoFromUrl();
console.log(`Logged in as ${employeeName}`);
```

### Common Patterns

#### Pattern A: Permission Check + Conditional Button
```javascript
import { hasPermission } from './permissionUtils';

export function FeatureButtons({ token, employeeName }) {
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    const loadPerms = async () => {
      const perms = await getEmployeePermissions(token, employeeName);
      setPermissions(perms);
    };
    loadPerms();
  }, []);

  return (
    <div>
      {permissions.includes('Store') && 
        <button onClick={goToStore}>📦 Store</button>
      }
      {permissions.includes('sales') && 
        <button onClick={goToCashier}>💰 Cashier</button>
      }
      {!permissions.includes('Store') && 
        <button disabled title="No permission">📦 Store (Locked)</button>
      }
    </div>
  );
}
```

#### Pattern B: Auto Navigation with Check
```javascript
import { navigateToSection, hasPermission } from './permissionUtils';

async function handleNavigate() {
  const hasPerm = await hasPermission(token, empName, 'Store');
  
  if (hasPerm) {
    navigateToSection('/store', token, empName, navigate, theme);
  } else {
    alert('You do not have access to Store');
  }
}
```

#### Pattern C: Route Component Helper
```javascript
// In a component that requires Store permission
import { getEmployeeInfoFromUrl } from './permissionUtils';

export default function StorePage() {
  const { employeeName, token, theme } = getEmployeeInfoFromUrl();
  
  if (!employeeName) {
    return <div>Error: Employee name not provided in URL</div>;
  }
  
  return (
    <div>
      <h1>Store - Welcome {employeeName}</h1>
      {/* Rest of component */}
    </div>
  );
}
```

---

## For Administrators

### Setting Employee Permissions

1. **Log in to Clinic Admin**
2. **Go to: Employee Settings** (or Admin Dashboard)
3. **Find the Employee**
4. **Click: Set Permissions**
5. **Check the boxes for their access:**
   - ☑️ Access Store
   - ☐ Access Dispensary
   - ☑️ Access Cashier Dashboard
   - ☐ Manage Drugs
   - etc.
6. **Click: Save**
7. **Employee can now access those sections directly**

### Creating Direct Access Links for Staff

```javascript
// In your admin panel or email template
const employeeName = 'John Doe';
const clinicToken = 'ABC123';
const section = 'store';
const theme = 'blue';

const directLink = 
  `https://yourapp.com/${section}` +
  `?token=${clinicToken}` +
  `&employee=${encodeURIComponent(employeeName)}` +
  `&theme=${theme}`;

// Share this link with employee
console.log(directLink);
// https://yourapp.com/store?token=ABC123&employee=John+Doe&theme=blue
```

---

## Common Issues & Solutions

### "Access Denied" Message

**Cause:** Employee doesn't have permission for that section

**Solution:**
1. Go to Employee Settings
2. Select the employee
3. Check the appropriate permission
4. Click Save
5. Employee can now access it

### "Session Invalid" or Redirects to Login

**Cause:** 
- Token is expired
- Token is invalid
- Session ended

**Solution:**
1. Employee needs to login again via Dashboard
2. Get fresh token
3. Try access again with new token

### Employee Name Not Recognized

**Cause:** Name doesn't match exactly (case sensitive)

**Example:**
```
❌ /store?token=ABC&employee=john         // 'john' (lowercase)
✅ /store?token=ABC&employee=John         // 'John' (capital J)
```

**Solution:** Use exact name as appears in Employee Settings

### Blank Page or Missing Employee Name

**Cause:** Employee parameter not in URL

**Current URL:** `?token=ABC&theme=blue`
**Needed:** `?token=ABC&employee=John&theme=blue`

---

## Permission Names Reference

Use these exact names when checking permissions:

```javascript
// In your permission checks use:
'Store'
'selldrugs'
'sales'
'manageDrugs'
'access-laboratory'
'labTests'
'access-doctors-room'
'access-nurse'
'access-radiographer'
'manageLaboratory'
'manageServices'
'set-sales-expenses-categories'
'clinicStatistics'
'access-sales-details'
'triage'
'familyPlanning'
'maternity-dashboard'
'credits'
```

---

## Testing Your Implementation

### Local Testing

```bash
# Test with valid employee
http://localhost:5173/store?token=test_clinic_123&employee=TestUser&theme=blue

# Test with invalid employee
http://localhost:5173/store?token=test_clinic_123&employee=InvalidUser&theme=blue

# Test without token
http://localhost:5173/store?employee=TestUser&theme=blue
```

### Expected Results

| URL | Token | Employee | Permission | Result |
|-----|-------|----------|-----------|---------|
| /store | ✅ Valid | ✅ Exists | ✅ Has | ✅ Access |
| /store | ✅ Valid | ✅ Exists | ❌ None | 🔒 Denied |
| /store | ❌ Invalid | ✅ Exists | ✅ Has | ↪️ Login |
| /store | ✅ Valid | ❌ Missing | ✅ Has | ⚠️ Check |

---

## Migration Checklist

- [ ] PermissionGuard.jsx created
- [ ] permissionUtils.js created
- [ ] App.jsx routes updated
- [ ] Dashboard.jsx navigation updated
- [ ] Documentation reviewed (PERMISSION_ACCESS_GUIDE.md)
- [ ] Test direct access URLs
- [ ] Verify permission checks work
- [ ] Test with multiple employees
- [ ] Verify Dashboard still works
- [ ] Communicate to employees new access method

---

## Getting Help

**Issue Type** | **Where to Look**
---|---
Why can't I access a section? | Check Employee Settings → Your Permissions
How do I create a direct link? | See "Creating Direct Access Links" section above
Code examples? | See "Common Patterns" section
Detailed guide? | Read PERMISSION_ACCESS_GUIDE.md
Troubleshooting? | See "Common Issues & Solutions" section
