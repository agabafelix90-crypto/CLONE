# Admin Access & Permission Management Guide

## Fixed Issues

### Problem 1: "Permission not granted" Error When Accessing Admin Settings
**Root Cause**: The `permit()` and `code()` backend endpoints were using case-sensitive employee name matching while `fetchPermissions2()` was using case-insensitive matching. This inconsistency caused employee lookups to fail when employee names had different cases.

**Solution**: Updated both `permit()` and `code()` functions in `/backend/src/routes/legacy.js` to use `.ilike('name', employee)` for case-insensitive matching, making them consistent with `fetchPermissions2()`.

**Changed Files**:
- `backend/src/routes/legacy.js` - Functions: `permit()` (line ~2304) and `code()` (line ~2375)

### Problem 2: Unclear Admin Access Instructions
**Root Cause**: Users didn't know HOW to access admin settings, leading to confusion and permission errors.

**Solution**: Enhanced the Welcome Modal in Dashboard with step-by-step instructions clearly showing:
1. Click the "Settings (admin only)" button in the left sidebar
2. Enter the admin password (default: **12345**)
3. Access the Admin Dashboard to manage employees

**Changed Files**:
- `js/dashboard.jsx` - WelcomeModal component (lines ~186-210)

---

## How to Access Admin Settings (Step-by-Step)

### First Time Setup
1. **Log In**: Enter clinic credentials on the login page
2. **View Welcome Modal**: The system shows setup instructions automatically
3. **Click Settings**: In the left sidebar, click the **"Settings (admin only)"** button
4. **Enter Admin Password**: When prompted, enter `12345` (default admin password)
5. **Access Admin Dashboard**: You're now in the Admin Dashboard where you can:
   - Add and manage employees
   - Set employee permissions
   - Configure facility settings

### After First Login
1. **Select Admin Settings**: Click the **"Settings (admin only)"** button
2. **Enter Admin Password**: Type your admin password
3. **Manage**:
   - Add new employees
   - Modify permissions
   - Set lab/pharmacy inventory
   - Configure service categories

---

## Permission Flow Architecture

### Two-Tier Permission System

#### Tier 1: Clinic-Level Permissions
- Endpoint: `/security.php` or `/fetchpermissions.php`
- Used for: Initial clinic validation
- Returns: Default clinic-level permissions

#### Tier 2: Employee-Specific Permissions
- Endpoint: `/fetchpermissions2.php`
- Used for: Employee-specific role checks
- Parameters: `employeeName` + `token`
- Returns: Employee's specific permissions

### Authentication Flow
```
1. Login → Clinic session established (token = clinic_id)
2. Select Employee → Employee context added
3. Security Check → Employee password validated
   - Uses: /code.php endpoint
   - Now case-insensitive ✅
4. Permission Check → Action authorization
   - Uses: /permit.php endpoint
   - Now case-insensitive ✅
5. Admin Access → Admin password validation
   - Uses: /permitadmin.php endpoint
   - Validates clinic.password field
```

---

## Technical Details: Backend Changes

### Fix 1: permit() Function
**Before**:
```javascript
.eq('clinic_id', token)
.eq('name', employee)  // ❌ Case-sensitive
```

**After**:
```javascript
.eq('clinic_id', token)
.ilike('name', employee)  // ✅ Case-insensitive
```

### Fix 2: code() Function
**Before**:
```javascript
.eq('clinic_id', token)
.eq('name', employee)  // ❌ Case-sensitive
```

**After**:
```javascript
.eq('clinic_id', token)
.ilike('name', employee)  // ✅ Case-insensitive
```

Both functions now use Postgres `ilike` operator for case-insensitive pattern matching, ensuring employee names work regardless of case variations.

---

## Testing the Fixes

### Test Admin Access
1. Open: `http://localhost:5173/` (or `http://localhost:5174/`)
2. Log in with clinic credentials
3. Click **"Settings (admin only)"** button
4. Enter password: `12345`
5. Should navigate to Admin Dashboard ✅

### Test Employee Authentication
1. In Admin Dashboard, add an employee
2. Set employee name (e.g., "DOCTOR" or "doctor")
3. Log out
4. Log back in
5. Select employee (system handles case automatically)
6. Enter employee password
7. Should authenticate successfully ✅

---

## Security Notes

1. **Admin Password**: Default is `12345` - MUST change immediately in production
2. **Employee Passwords**: Stored as bcrypt hashes
3. **Session Token**: Clinic ID acts as session token, 6-hour TTL
4. **Case Handling**: All employee names now work regardless of case

---

## Endpoints Modified

| Endpoint | Method | Change | File |
|----------|--------|--------|------|
| `/permit.php` | POST | Case-insensitive employee lookup | `backend/src/routes/legacy.js` |
| `/code.php` | POST | Case-insensitive employee lookup | `backend/src/routes/legacy.js` |
| n/a | Component | Enhanced onboarding instructions | `js/dashboard.jsx` |

---

## Status

✅ **Backend Fixes Applied**
- `permit()` function: Case-insensitive matching enabled
- `code()` function: Case-insensitive matching enabled
- Both backends running (port 4000 & 5173)

✅ **Frontend Updates Applied**
- Welcome Modal: Clear step-by-step admin access instructions
- Admin password guidance: Shows default `12345`
- Frontend compiled and running

✅ **System Verification**
- Backend health check: Passing
- Frontend dev server: Running
- CORS: Configured for localhost:5173/5174
- Database connection: Active

---

## Troubleshooting

### Issue: Still getting "Permission not granted"
**Solution**: 
- Verify clinic.password is set in Supabase
- Try the default password `12345`
- Check admin modal is receiving password correctly
- Verify backend is using updated code (restart if needed)

### Issue: Employee name lookup fails
**Solution**:
- Employee names are now case-insensitive ✅
- Use any case variation (DOCTOR, doctor, Doctor all work)
- Verify employee exists in database first
- Check clinic_id matches current session

### Issue: Admin dashboard not loading
**Solution**:
- Clear browser cache
- Reload the page
- Verify backend health: `http://localhost:4000/api/health`
- Check browser console for specific errors

---

## Quick Start

### For Clinic Administrators
1. Log in with clinic credentials
2. Click "Settings (admin only)"
3. Enter: `12345`
4. Add employees and set permissions
5. Share employee credentials with staff

### For Employees
1. Ask admin for your login credentials
2. Log in with clinic name
3. Select your name from employee list
4. Enter your employee password
5. Access your assigned modules

---

*Last Updated: 2026-05-13*
*System: Medical Health Management - Full Stack*
