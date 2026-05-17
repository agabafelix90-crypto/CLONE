# Onboarding Redirect Tokens Migration Guide

## Overview

This guide explains how to apply the `onboarding_redirect_tokens` table migration to your Supabase database using three different methods.

**Status**: Your backend already has a fallback patch, but implementing this migration will provide:
- ✅ Proper schema in Supabase
- ✅ Production-ready indexes for performance
- ✅ Row Level Security (RLS) for data protection
- ✅ Token consumption tracking (prevents reuse)
- ✅ Automatic cleanup functions

---

## Method 1: Supabase Dashboard SQL Editor (Easiest)

### Steps:

1. **Log into Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Left sidebar → `SQL Editor`
   - Click `+ New Query`

3. **Copy & Paste the Migration**
   - Open: `backend/migrations/001_create_onboarding_redirect_tokens.sql`
   - Copy the entire SQL content
   - Paste into the Supabase SQL Editor

4. **Execute**
   - Click `Run` (or `Ctrl+Enter`)
   - Wait for the green checkmark ✅

5. **Verify**
   ```sql
   -- Run these queries to verify:
   SELECT table_name FROM information_schema.tables 
   WHERE table_name = 'onboarding_redirect_tokens';
   
   SELECT indexname FROM pg_indexes 
   WHERE tablename = 'onboarding_redirect_tokens';
   
   SELECT policyname FROM pg_policies 
   WHERE tablename = 'onboarding_redirect_tokens';
   ```

---

## Method 2: Supabase CLI (`supabase db push`)

### Prerequisites:
```bash
# Install Supabase CLI globally (if not already installed)
npm install -g supabase
# OR
choco install supabase-cli  # Windows

# Verify installation
supabase --version
```

### Steps:

1. **Create a Migration File in Your Supabase Folder**
   ```bash
   cd backend
   
   # Initialize Supabase migrations (if not already done)
   supabase init
   
   # This creates: supabase/migrations/ folder
   ```

2. **Add the Migration**
   ```bash
   # Copy the migration SQL to the Supabase migrations folder, or use the file already present at supabase/migrations/
   cp migrations/001_create_onboarding_redirect_tokens.sql supabase/migrations/
   ```

3. **Push to Database**
   ```bash
   # This connects to your remote Supabase project
   supabase db push
   
   # Follow prompts to authenticate if needed
   ```

4. **Verify Locally (Optional)**
   ```bash
   # If using local Supabase:
   supabase start
   supabase db query < supabase/migrations/001_create_onboarding_redirect_tokens.sql
   ```

---

## Method 3: Supabase CLI Query Command

### Quick One-Off Execution:

```bash
# Direct query execution
supabase db query \
  "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='onboarding_redirect_tokens')" \
  --project-ref your_project_ref

# Or run the entire migration:
supabase db execute --file backend/supabase/migrations/001_create_onboarding_redirect_tokens.sql
```

---

## Updating Your Node.js Backend Code

### Current Cleanup Job (Already Working ✅)

Your existing cleanup function in `backend/src/routes/legacy.js` will now work properly:

```javascript
async function cleanupExpiredOnboardingTokens() {
  try {
    const supabase = getSupabase();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('onboarding_redirect_tokens')
      .delete()
      .lt('expires_at', now);
    if (error) {
      console.error('Failed to cleanup expired onboarding tokens:', error);
    } else {
      console.log('Cleanup: removed expired onboarding redirect tokens');
    }
  } catch (err) {
    console.error('Cleanup job error:', err);
  }
}
```

### Enhanced: Use New Cleanup Function (Optional)

You can now use the SQL function for better performance:

```javascript
async function cleanupExpiredOnboardingTokens() {
  try {
    const supabase = getSupabase();
    
    // Option 1: Use the stored procedure (best for performance)
    const { data, error } = await supabase
      .rpc('cleanup_expired_onboarding_tokens');
    
    if (error) {
      console.error('Cleanup function error:', error);
      return;
    }
    
    console.log(`Cleanup: removed ${data?.[0]?.deleted_count || 0} expired onboarding tokens`);
  } catch (err) {
    console.error('Cleanup job error:', err);
  }
}
```

### Enhanced: Track Token Usage

Instead of just checking existence, you can now mark tokens as consumed:

```javascript
async function consumeOnboardingToken(token) {
  try {
    const supabase = getSupabase();
    
    // Use the new consume function
    const { data, error } = await supabase
      .rpc('consume_onboarding_token', { p_token: token });
    
    if (error) {
      console.error('Error consuming token:', error);
      return null;
    }
    
    const result = data?.[0];
    if (!result?.valid) {
      console.warn('Token is invalid, expired, or already used');
      return null;
    }
    
    console.log('Token consumed successfully for clinic:', result.clinic_id);
    return result.clinic_id;
  } catch (err) {
    console.error('Unexpected error:', err);
    return null;
  }
}
```

---

## Rollback Strategy (If Needed)

### To Remove the Migration:

```sql
-- Run in Supabase SQL Editor if you need to rollback
DROP FUNCTION IF EXISTS consume_onboarding_token(UUID);
DROP FUNCTION IF EXISTS cleanup_expired_onboarding_tokens();
DROP TABLE IF EXISTS onboarding_redirect_tokens CASCADE;
```

Or use Supabase CLI:
```bash
supabase db reset  # This will reset the entire database to initial state
```

---

## Testing the Migration

### 1. Test Token Creation

```javascript
// In your test or Node.js REPL
const supabase = getSupabase();

const { data: token, error } = await supabase
  .from('onboarding_redirect_tokens')
  .insert([
    {
      clinic_id: 'your-clinic-uuid-here',
      original_token: 'test-token',
      created_from_ip: '127.0.0.1'
    }
  ])
  .select('*')
  .single();

console.log('Created token:', token);
console.log('Error:', error);
```

### 2. Test Token Lookup

```javascript
const { data: found, error } = await supabase
  .from('onboarding_redirect_tokens')
  .select('clinic_id, used, expires_at')
  .eq('token', token.token)
  .single();

console.log('Found token:', found);
```

### 3. Test Token Consumption

```javascript
const { data: consumed, error } = await supabase
  .rpc('consume_onboarding_token', { p_token: token.token });

console.log('Consumed:', consumed);
// Should show: [{ clinic_id: 'xxx', valid: true }]
```

### 4. Test Cleanup

```javascript
const { data: cleanupResult, error } = await supabase
  .rpc('cleanup_expired_onboarding_tokens');

console.log('Deleted count:', cleanupResult?.[0]?.deleted_count);
```

---

## Row Level Security (RLS) Policies

The migration includes 4 RLS policies:

| Policy | Effect | Use Case |
|--------|--------|----------|
| `clinic_members_can_view_own_tokens` | SELECT | Clinic staff can view their tokens |
| `clinic_admins_can_create_tokens` | INSERT | Only admins create new tokens |
| `authenticated_users_can_mark_token_used` | UPDATE | Users can mark tokens as consumed |
| `clinic_admins_can_delete_tokens` | DELETE | Admins can delete old tokens |

### Disable RLS (If Not Using Auth)

If you're not using Supabase Auth yet, disable RLS:

```sql
ALTER TABLE onboarding_redirect_tokens DISABLE ROW LEVEL SECURITY;
```

---

## Monitoring & Performance

### Check Token Table Size

```sql
SELECT 
  COUNT(*) as total_tokens,
  COUNT(*) FILTER (WHERE used = false) as active_tokens,
  COUNT(*) FILTER (WHERE expires_at > NOW()) as valid_tokens,
  COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_tokens
FROM onboarding_redirect_tokens;
```

### Index Usage Statistics

```sql
SELECT 
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_returned
FROM pg_stat_user_indexes
WHERE relname = 'onboarding_redirect_tokens'
ORDER BY idx_scan DESC;
```

### Slow Query Detection

```sql
-- Find slow queries on your table
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE query LIKE '%onboarding_redirect_tokens%'
ORDER BY mean_time DESC;
```

---

## Troubleshooting

### Issue: "PGRST205" or "Could not find the table"

**Solution**: The table hasn't been created yet. Run the migration using one of the three methods above.

### Issue: RLS Policies Blocking Access

**Solution 1**: Temporarily disable RLS for testing:
```sql
ALTER TABLE onboarding_redirect_tokens DISABLE ROW LEVEL SECURITY;
```

**Solution 2**: Ensure your `profiles` table has the correct `clinic_id` and `role` columns.

### Issue: Slow Token Lookups

**Solution**: Verify indexes are being used:
```sql
EXPLAIN ANALYZE
SELECT * FROM onboarding_redirect_tokens
WHERE token = 'your-uuid-here'
  AND expires_at > NOW();
```

Should show "Index Scan" not "Sequential Scan".

---

## Next Steps

1. ✅ Run the migration using Method 1, 2, or 3
2. ✅ Update your Node.js cleanup job (optional but recommended)
3. ✅ Test token creation/consumption
4. ✅ Monitor performance
5. ✅ Enable RLS in production (after testing)

---

## Reference

- [Supabase SQL Editor Docs](https://supabase.com/docs/guides/database/sql-editor)
- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL Index Performance](https://www.postgresql.org/docs/current/indexes.html)
