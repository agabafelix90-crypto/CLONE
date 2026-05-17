# Onboarding Redirect Tokens - Quick Reference

## Quick Cleanup Queries (Copy-Paste Ready)

### 1. Delete Expired Tokens (Immediate)
```sql
DELETE FROM onboarding_redirect_tokens 
WHERE expires_at < NOW();
```

### 2. Delete Expired + Old Used Tokens
```sql
DELETE FROM onboarding_redirect_tokens 
WHERE expires_at < NOW() 
   OR (used = true AND used_at < NOW() - INTERVAL '7 days');
```

### 3. Delete All Tokens for a Specific Clinic
```sql
DELETE FROM onboarding_redirect_tokens 
WHERE clinic_id = 'your-clinic-uuid-here';
```

### 4. View Active Tokens
```sql
SELECT 
  id,
  token,
  clinic_id,
  used,
  created_at,
  expires_at,
  CASE 
    WHEN expires_at < NOW() THEN 'EXPIRED'
    WHEN used = true THEN 'USED'
    ELSE 'ACTIVE'
  END as status
FROM onboarding_redirect_tokens
WHERE clinic_id = 'your-clinic-uuid-here'
ORDER BY created_at DESC
LIMIT 20;
```

### 5. Token Statistics
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE used = false AND expires_at > NOW()) as active,
  COUNT(*) FILTER (WHERE expires_at < NOW()) as expired,
  COUNT(*) FILTER (WHERE used = true) as consumed
FROM onboarding_redirect_tokens;
```

### 6. Call Cleanup Function
```sql
SELECT cleanup_expired_onboarding_tokens();
-- Returns: number of deleted tokens
```

### 7. Consume a Token (Mark as Used)
```sql
SELECT consume_onboarding_token('your-token-uuid-here'::uuid);
-- Returns: [{ clinic_id: 'xxx', valid: true }] if successful
```

---

## Enhanced Node.js Backend Code

### Option A: Replace Existing Cleanup Function

Replace your current `cleanupExpiredOnboardingTokens()` in `backend/src/routes/legacy.js`:

```javascript
/**
 * Clean up expired onboarding redirect tokens
 * Uses the optimized PostgreSQL function for better performance
 */
async function cleanupExpiredOnboardingTokens() {
  try {
    const supabase = getSupabase();
    
    // Use the stored SQL function (most efficient)
    const { data, error } = await supabase
      .rpc('cleanup_expired_onboarding_tokens');
    
    if (error) {
      console.error('Failed to cleanup expired onboarding tokens:', error);
      return;
    }
    
    const deletedCount = data?.[0]?.deleted_count || 0;
    console.log(`✅ Cleanup: removed ${deletedCount} expired onboarding redirect tokens`);
  } catch (err) {
    console.error('❌ Cleanup job error:', err);
  }
}
```

### Option B: Add Token Consumption Function

Add this new function to your `backend/src/routes/legacy.js`:

```javascript
/**
 * Safely consume an onboarding redirect token (mark as used)
 * Prevents token reuse and validates expiry in one call
 * 
 * @param {string} token - The UUID token to consume
 * @returns {Promise<string|null>} - The clinic_id if valid, null otherwise
 */
async function consumeOnboardingToken(token) {
  try {
    const supabase = getSupabase();
    
    // Call the SQL function that:
    // 1. Checks token exists
    // 2. Checks token is not expired
    // 3. Checks token hasn't been used
    // 4. Atomically marks it as used + sets used_at timestamp
    const { data, error } = await supabase
      .rpc('consume_onboarding_token', { p_token: token });
    
    if (error) {
      console.error('❌ Error consuming onboarding token:', error);
      return null;
    }
    
    const result = data?.[0];
    
    if (!result?.valid) {
      console.warn('⚠️  Token is invalid, expired, or already used');
      return null;
    }
    
    console.log('✅ Token consumed successfully for clinic:', result.clinic_id);
    return result.clinic_id;
  } catch (err) {
    console.error('❌ Unexpected error in consumeOnboardingToken:', err);
    return null;
  }
}
```

### Option C: Update getClinicByToken Function

Enhance the existing lookup to use the new consumption function:

```javascript
/**
 * Get clinic by token (supports session tokens and redirect tokens)
 */
async function getClinicByToken(token) {
  const supabase = getSupabase();
  
  if (!token) return null;

  // Try direct clinic lookup first (for session tokens)
  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', token)
    .maybeSingle();

  if (clinicError) {
    console.error('Supabase getClinicByToken error (direct lookup):', clinicError);
  }

  if (clinic) return clinic;

  // If not found, check onboarding_redirect_tokens for ephemeral token
  // NEW: Use the safe consumption function
  const clinicId = await consumeOnboardingToken(token);
  
  if (clinicId) {
    // Token was valid and consumed - fetch the clinic
    const { data: redirectClinic, error: redirectError } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', clinicId)
      .maybeSingle();

    if (redirectError) {
      console.error('Error fetching clinic after token consumption:', redirectError);
      return null;
    }

    return redirectClinic;
  }

  return null;
}
```

### Option D: Update createOnboardingRedirectToken

Keep your current implementation (it already handles the fallback gracefully):

```javascript
/**
 * Create an ephemeral onboarding redirect token
 * Falls back to clinic_id if table doesn't exist
 */
async function createOnboardingRedirectToken(clinicId, originalToken = null) {
  const supabase = getSupabase();
  try {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    
    const payload = {
      clinic_id: clinicId,
      original_token: originalToken,
      created_from_ip: null, // Optional: capture from request.ip
      expires_at: expiresAt
    };
    
    const { data, error } = await supabase
      .from('onboarding_redirect_tokens')
      .insert([payload])
      .select('token')
      .maybeSingle();

    if (error) {
      console.error('createOnboardingRedirectToken error:', error);
      
      // Graceful fallback: if table missing, return clinic ID
      if (error.code === 'PGRST205' || 
          (error.message && error.message.includes('Could not find the table'))) {
        console.warn('⚠️  Onboarding redirect token table missing, falling back to clinic session token');
        return clinicId;
      }
      
      return null;
    }

    console.log('✅ Redirect token created:', data?.token);
    return data?.token || clinicId;
  } catch (err) {
    console.error('❌ createOnboardingRedirectToken unexpected error:', err);
    return clinicId; // Fallback to clinic ID
  }
}
```

---

## Installation Steps

### 1. Create Supabase Migration

```bash
cd backend
mkdir -p migrations
cp migrations/001_create_onboarding_redirect_tokens.sql supabase/migrations/
```

### 2. Apply Migration (Choose One Method)

**Via Supabase Dashboard (Easiest):**
- Go to SQL Editor
- Paste the migration SQL
- Click Run

**Via CLI:**
```bash
supabase db push
```

### 3. Update backend/src/routes/legacy.js

Replace the cleanup function and optionally add the consumption function (see examples above).

### 4. Restart Your Backend

```bash
npm restart
# or
node backend/src/server.js
```

### 5. Verify in Supabase Dashboard

```sql
SELECT COUNT(*) FROM onboarding_redirect_tokens;
-- Should return 0 initially
```

---

## Monitoring Checklist

- [ ] Migration applied successfully
- [ ] No errors in backend logs
- [ ] Cleanup job running every 15 minutes
- [ ] Token creation works (test in your login flow)
- [ ] Token lookup works (test redirect after login)
- [ ] Expired tokens removed by cleanup job
- [ ] RLS policies working (if enabled)

---

## Performance Tuning

### Slow Queries?

Check index usage:
```sql
EXPLAIN ANALYZE
SELECT clinic_id FROM onboarding_redirect_tokens
WHERE token = 'test-uuid'
  AND expires_at > NOW()
  AND used = false;
```

Expected output: Should use `idx_onboarding_tokens_token` or `idx_onboarding_tokens_expires_unused`

### Table Too Large?

Run cleanup more frequently:
```javascript
// In backend/src/server.js
startOnboardingCleanupJob(5 * 60 * 1000); // Run every 5 minutes instead of 15
```

---

## Rollback

If you need to remove the table:

```sql
-- Removes table, indexes, functions, and policies
DROP TABLE IF EXISTS onboarding_redirect_tokens CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_onboarding_tokens();
DROP FUNCTION IF EXISTS consume_onboarding_token(UUID);
```

Then your code will automatically fall back to using `clinic_id` as the token (thanks to the error handling already in place).

---

## Emergency: Disable If Causing Issues

If the new schema causes problems:

```javascript
// Temporarily disable cleanup in backend/src/routes/legacy.js
function startOnboardingCleanupJob(intervalMs = 15 * 60 * 1000) {
  // Disable: just don't start the interval
  console.warn('Onboarding cleanup job disabled for debugging');
  // const id = setInterval(() => cleanupExpiredOnboardingTokens().catch(() => {}), intervalMs);
  // return id;
}
```

And comment out the job starter in `server.js`:
```javascript
// Temporarily disabled for debugging
// const cleanupJobId = startOnboardingCleanupJob();
```

---

## Support

If you encounter issues:

1. Check Supabase status: https://status.supabase.com
2. Review migration logs in Supabase Dashboard
3. Check backend logs: `npm logs` or check terminal output
4. Verify credentials in `.env` file
5. Test with: `curl -X GET http://localhost:4000/health`
