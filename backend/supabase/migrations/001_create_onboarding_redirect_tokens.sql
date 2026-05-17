-- ============================================================================
-- Migration: Create Onboarding Redirect Tokens Table
-- ============================================================================
-- Purpose: Manage ephemeral tokens for clinic onboarding/login redirect flows
-- This table stores short-lived UUID tokens that grant temporary access
-- during the initial clinic setup and login processes.
-- ============================================================================

-- Drop existing table if present (safe for idempotency)
DROP TABLE IF EXISTS onboarding_redirect_tokens CASCADE;

-- ============================================================================
-- Main Table
-- ============================================================================
CREATE TABLE onboarding_redirect_tokens (
  -- Primary key: surrogate UUID for internal record identification
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- The actual redirect token (must be unique for lookup)
  token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  
  -- Reference to the clinic this token grants access to
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Optional: store the original clinic session token for traceability
  original_token TEXT,
  
  -- Track if token has been used (prevents token reuse)
  used BOOLEAN DEFAULT false,
  
  -- Timestamp when token was created
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- When token expires (1 hour by default)
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
  
  -- Optional: IP address or user agent that created the token (for audit)
  created_from_ip TEXT,
  
  -- Optional: timestamp when token was actually used/redeemed
  used_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Fast lookup by token value (critical for login redirects)
CREATE INDEX idx_onboarding_tokens_token 
  ON onboarding_redirect_tokens(token);

-- Fast lookup by clinic (for admin audits/cleanup per clinic)
CREATE INDEX idx_onboarding_tokens_clinic_id 
  ON onboarding_redirect_tokens(clinic_id);

-- Fast expiry cleanup (find expired tokens quickly)
CREATE INDEX idx_onboarding_tokens_expires_at 
  ON onboarding_redirect_tokens(expires_at);

-- Combined index for efficient expiry + unused token queries
CREATE INDEX idx_onboarding_tokens_expires_unused 
  ON onboarding_redirect_tokens(expires_at, used) 
  WHERE used = false;

-- Fast lookup for active tokens by clinic
CREATE INDEX idx_onboarding_tokens_clinic_active 
  ON onboarding_redirect_tokens(clinic_id, expires_at, used) 
  WHERE used = false;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================
-- Enable RLS on the table
ALTER TABLE onboarding_redirect_tokens ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to view tokens for their clinic
CREATE POLICY "clinic_members_can_view_own_tokens" 
  ON onboarding_redirect_tokens 
  FOR SELECT 
  USING (
    clinic_id IN (
      SELECT clinic_id 
      FROM profiles 
      WHERE id = auth.uid() AND clinic_id IS NOT NULL
    )
  );

-- Policy 2: Only authenticated clinic admins can insert tokens (for their clinic)
CREATE POLICY "clinic_admins_can_create_tokens" 
  ON onboarding_redirect_tokens 
  FOR INSERT 
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id 
      FROM profiles 
      WHERE id = auth.uid() 
        AND clinic_id IS NOT NULL 
        AND role = 'admin'
    )
  );

-- Policy 3: Only authenticated users can update tokens (mark as used)
CREATE POLICY "authenticated_users_can_mark_token_used" 
  ON onboarding_redirect_tokens 
  FOR UPDATE 
  USING (
    clinic_id IN (
      SELECT clinic_id 
      FROM profiles 
      WHERE id = auth.uid() AND clinic_id IS NOT NULL
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id 
      FROM profiles 
      WHERE id = auth.uid() AND clinic_id IS NOT NULL
    )
  );

-- Policy 4: Admin-only deletion (for cleanup)
CREATE POLICY "clinic_admins_can_delete_tokens" 
  ON onboarding_redirect_tokens 
  FOR DELETE 
  USING (
    clinic_id IN (
      SELECT clinic_id 
      FROM profiles 
      WHERE id = auth.uid() 
        AND clinic_id IS NOT NULL 
        AND role = 'admin'
    )
  );

-- ============================================================================
-- Cleanup: Query to delete expired tokens (run periodically or via trigger)
-- ============================================================================
-- Use this query in your Node.js cleanup job:
-- DELETE FROM onboarding_redirect_tokens WHERE expires_at < NOW();

-- Or if you want to be more conservative (only delete very old tokens):
-- DELETE FROM onboarding_redirect_tokens 
-- WHERE expires_at < NOW() - INTERVAL '1 day';

-- ============================================================================
-- Optional: Create a function for safe token cleanup
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_onboarding_tokens()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  count INTEGER;
BEGIN
  DELETE FROM onboarding_redirect_tokens 
  WHERE expires_at < NOW() OR (used = true AND used_at < NOW() - INTERVAL '7 days');
  
  GET DIAGNOSTICS count = ROW_COUNT;
  RETURN QUERY SELECT count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Optional: Create a function to safely consume a token (mark as used)
-- ============================================================================
CREATE OR REPLACE FUNCTION consume_onboarding_token(p_token UUID)
RETURNS TABLE(clinic_id UUID, valid BOOLEAN) AS $$
BEGIN
  -- Check if token exists and is valid
  RETURN QUERY
  UPDATE onboarding_redirect_tokens
  SET used = true, used_at = NOW()
  WHERE token = p_token 
    AND used = false 
    AND expires_at > NOW()
  RETURNING onboarding_redirect_tokens.clinic_id, true;
  
  -- If no rows were updated, return invalid
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Verification Queries (run after migration to verify setup)
-- ============================================================================
-- Check table exists:
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'onboarding_redirect_tokens';

-- Check indexes:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'onboarding_redirect_tokens';

-- Check RLS is enabled:
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'onboarding_redirect_tokens';

-- Check policies:
-- SELECT policyname, qual, with_check FROM pg_policies WHERE tablename = 'onboarding_redirect_tokens';
