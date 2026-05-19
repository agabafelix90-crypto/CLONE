-- Phase 2: Payment & SMS Security Hardening
-- This migration adds security measures for payment and SMS systems

-- Add rate limiting tables
CREATE TABLE IF NOT EXISTS payment_rate_limits (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    request_count INTEGER DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_rate_limits (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    message_count INTEGER DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add payment validation constraints
ALTER TABLE subscriptions
ADD CONSTRAINT payment_amount_check CHECK (amount >= 1000 AND amount <= 1000000),
ADD CONSTRAINT unique_momo_reference EXCLUDE (momo_reference WITH =) WHERE (momo_reference IS NOT NULL);

-- Add SMS validation constraints
ALTER TABLE sms_logs
ADD CONSTRAINT message_length_check CHECK (char_count <= 160),
ADD CONSTRAINT valid_phone_format CHECK (recipient_phone ~ '^\\+?\\d{10,15}$');

-- Create indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_payment_rate_limits_window ON payment_rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_sms_rate_limits_window ON sms_rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_subscriptions_momo_reference ON subscriptions(momo_reference);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sent_by_created ON sms_logs(sent_by, created_at DESC);

-- Security policies for rate limiting tables
ALTER TABLE payment_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only access their own rate limit records
CREATE POLICY "Users can view own payment rate limits" ON payment_rate_limits
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sms rate limits" ON sms_rate_limits
    FOR ALL USING (auth.uid() = user_id);

-- Service role can manage all rate limits
CREATE POLICY "Service role manages payment rate limits" ON payment_rate_limits
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages sms rate limits" ON sms_rate_limits
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Add audit triggers for payment and SMS operations
CREATE OR REPLACE FUNCTION audit_payment_operations()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, operation, record_id, old_values, new_values, performed_by)
        VALUES ('subscriptions', 'INSERT', NEW.id, NULL, row_to_json(NEW), NEW.user_id);
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, operation, record_id, old_values, new_values, performed_by)
        VALUES ('subscriptions', 'UPDATE', NEW.id, row_to_json(OLD), row_to_json(NEW), NEW.user_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION audit_sms_operations()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (table_name, operation, record_id, old_values, new_values, performed_by)
    VALUES ('sms_logs', 'INSERT', NEW.id, NULL, row_to_json(NEW), NEW.sent_by);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers
DROP TRIGGER IF EXISTS audit_subscriptions_trigger ON subscriptions;
CREATE TRIGGER audit_subscriptions_trigger
    AFTER INSERT OR UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION audit_payment_operations();

DROP TRIGGER IF EXISTS audit_sms_logs_trigger ON sms_logs;
CREATE TRIGGER audit_sms_logs_trigger
    AFTER INSERT ON sms_logs
    FOR EACH ROW EXECUTE FUNCTION audit_sms_operations();

-- Function to check and update payment rate limits
CREATE OR REPLACE FUNCTION check_payment_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    window_start TIMESTAMP WITH TIME ZONE;
    max_requests INTEGER := 5; -- Max 5 payment requests per hour
BEGIN
    -- Get or create rate limit record
    SELECT request_count, window_start INTO current_count, window_start
    FROM payment_rate_limits
    WHERE user_id = p_user_id;

    -- Reset window if expired (1 hour window)
    IF window_start IS NULL OR window_start < NOW() - INTERVAL '1 hour' THEN
        INSERT INTO payment_rate_limits (user_id, request_count, window_start)
        VALUES (p_user_id, 1, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
            request_count = 1,
            window_start = NOW(),
            updated_at = NOW();
        RETURN TRUE;
    END IF;

    -- Check if limit exceeded
    IF current_count >= max_requests THEN
        RETURN FALSE;
    END IF;

    -- Increment counter
    UPDATE payment_rate_limits
    SET request_count = request_count + 1, updated_at = NOW()
    WHERE user_id = p_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and update SMS rate limits
CREATE OR REPLACE FUNCTION check_sms_rate_limit(p_user_id UUID, p_message_count INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    window_start TIMESTAMP WITH TIME ZONE;
    max_messages INTEGER := 100; -- Max 100 SMS per hour
BEGIN
    -- Get or create rate limit record
    SELECT message_count, window_start INTO current_count, window_start
    FROM sms_rate_limits
    WHERE user_id = p_user_id;

    -- Reset window if expired (1 hour window)
    IF window_start IS NULL OR window_start < NOW() - INTERVAL '1 hour' THEN
        INSERT INTO sms_rate_limits (user_id, message_count, window_start)
        VALUES (p_user_id, p_message_count, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
            message_count = p_message_count,
            window_start = NOW(),
            updated_at = NOW();
        RETURN TRUE;
    END IF;

    -- Check if limit would be exceeded
    IF current_count + p_message_count > max_messages THEN
        RETURN FALSE;
    END IF;

    -- Increment counter
    UPDATE sms_rate_limits
    SET message_count = message_count + p_message_count, updated_at = NOW()
    WHERE user_id = p_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;