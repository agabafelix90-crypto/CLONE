SELECT proname, prosrc, proargtypes, prorettype, proretset
FROM pg_proc
WHERE proname = 'consume_onboarding_token';
