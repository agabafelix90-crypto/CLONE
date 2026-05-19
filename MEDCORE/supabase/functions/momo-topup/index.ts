import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUBSCRIPTION_KEY = Deno.env.get("MTN_MOMO_SUBSCRIPTION_KEY");
    const SECONDARY_KEY = Deno.env.get("MTN_MOMO_SECONDARY_KEY");
    const MOMO_ENV = Deno.env.get("MTN_MOMO_ENVIRONMENT") || "sandbox";

    const activeKey = SUBSCRIPTION_KEY || SECONDARY_KEY;
    if (!activeKey) {
      throw new Error("MTN MoMo credentials not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get("Authorization") ?? "";
    const bearerToken = authHeader.replace("Bearer ", "").trim();
    const isServiceRoleCall = bearerToken === supabaseKey;

    const body = await req.json();
    const { action, user_id, amount, phone, reference_id } = body;

    if (!isServiceRoleCall) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
      if (!anonKey || !bearerToken) {
        throw new Error("Unauthorized request");
      }
      const authClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userErr } = await authClient.auth.getUser();
      if (userErr || !userData.user || userData.user.id !== user_id) {
        throw new Error("Forbidden: user identity mismatch");
      }
    }

    const baseUrl = MOMO_ENV === "sandbox"
      ? "https://sandbox.momodeveloper.mtn.com"
      : "https://momodeveloper.mtn.com";

    // Helper to get access token
    const getAccessToken = async () => {
      const API_USER = Deno.env.get("MTN_MOMO_API_USER_ID");
      const API_KEY = Deno.env.get("MTN_MOMO_API_KEY");

      if (!API_USER || !API_KEY) {
        throw new Error("MTN MoMo API User/Key not configured. Run provision_sandbox first.");
      }

      const tokenRes = await fetch(`${baseUrl}/collection/token/`, {
        method: "POST",
        headers: {
          "Authorization": "Basic " + btoa(`${API_USER}:${API_KEY}`),
          "Ocp-Apim-Subscription-Key": activeKey,
        },
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("Token error:", tokenRes.status, errText);
        throw new Error(`Token request failed: ${tokenRes.status} - ${errText}`);
      }

      const tokenData = await tokenRes.json();
      return tokenData.access_token;
    };

    if (action === "request_payment") {
      // SECURITY: Rate limiting - max 5 payment requests per hour per user
      const { data: rateLimitData, error: rateLimitError } = await supabase
        .rpc("check_payment_rate_limit", { p_user_id: user_id });

      if (rateLimitError || !rateLimitData) {
        throw new Error("Payment request rate limit exceeded. Please wait before trying again.");
      }

      // SECURITY: Amount validation - between 1000 and 1,000,000 UGX
      if (!amount || amount < 1000 || amount > 1000000) {
        throw new Error("Invalid payment amount. Must be between UGX 1,000 and UGX 1,000,000.");
      }

      // SECURITY: Phone number validation
      const cleanPhone = phone.replace(/\D/g, "");
      if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 15) {
        throw new Error("Invalid phone number format.");
      }

      // SECURITY: Check for existing pending payments to prevent duplicates
      const { data: existingPayment } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user_id)
        .eq("payment_status", "pending")
        .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .maybeSingle();

      if (existingPayment) {
        throw new Error("You have a pending payment request. Please complete it first or wait 5 minutes.");
      }

      const accessToken = await getAccessToken();
      const refId = crypto.randomUUID();

      // Determine currency based on environment
      const currency = MOMO_ENV === "sandbox" ? "EUR" : "UGX";

      // Request to Pay
      const payRes = await fetch(`${baseUrl}/collection/v1_0/requesttopay`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "X-Reference-Id": refId,
          "X-Target-Environment": MOMO_ENV,
          "Ocp-Apim-Subscription-Key": activeKey,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          amount: String(amount),
          currency,
          externalId: `MEDCORE-${Date.now()}`,
          payer: {
            partyIdType: "MSISDN",
            partyId: phone.replace(/\D/g, ""),
          },
          payerMessage: "MEDICORE SYSTEMS Subscription Payment",
          payeeNote: "MEDICORE SYSTEMS",
        }),
      });

      if (payRes.status !== 202) {
        const errText = await payRes.text();
        console.error("RequestToPay error:", payRes.status, errText);
        throw new Error(`RequestToPay failed: ${payRes.status} - ${errText}`);
      }

      return new Response(JSON.stringify({
        success: true,
        reference_id: refId,
        message: "Payment request sent. Please approve on your phone.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "check_status") {
      if (!reference_id) throw new Error("reference_id required");

      const accessToken = await getAccessToken();

      const statusRes = await fetch(`${baseUrl}/collection/v1_0/requesttopay/${reference_id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "X-Target-Environment": MOMO_ENV,
          "Ocp-Apim-Subscription-Key": activeKey,
        },
      });

      if (!statusRes.ok) {
        const errText = await statusRes.text();
        console.error("Status check error:", statusRes.status, errText);
        return new Response(JSON.stringify({
          success: true,
          status: "PENDING",
          reason: "Still processing",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const statusData = await statusRes.json();

      return new Response(JSON.stringify({
        success: true,
        status: statusData.status || "PENDING",
        reason: statusData.reason || null,
        financial_id: statusData.financialTransactionId || null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "provision_sandbox") {
      const provisionSecret = Deno.env.get("MOMO_PROVISION_SECRET");
      const suppliedSecret = req.headers.get("x-provision-secret");
      if (
        MOMO_ENV !== "sandbox" ||
        !provisionSecret ||
        !suppliedSecret ||
        suppliedSecret !== provisionSecret
      ) {
        throw new Error("Sandbox provisioning is disabled");
      }
      console.log("Provisioning sandbox with key prefix:", activeKey?.substring(0, 8));
      
      const apiUserId = crypto.randomUUID();
      const createUserRes = await fetch(`${baseUrl}/v1_0/apiuser`, {
        method: "POST",
        headers: {
          "X-Reference-Id": apiUserId,
          "Ocp-Apim-Subscription-Key": activeKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ providerCallbackHost: "https://webhook.site" }),
      });

      if (!createUserRes.ok && createUserRes.status !== 201) {
        const errText = await createUserRes.text();
        throw new Error(`Create API User failed: ${createUserRes.status} - ${errText}`);
      }

      const createKeyRes = await fetch(`${baseUrl}/v1_0/apiuser/${apiUserId}/apikey`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": activeKey,
        },
      });

      if (!createKeyRes.ok) {
        const errText = await createKeyRes.text();
        throw new Error(`Create API Key failed: ${createKeyRes.status} - ${errText}`);
      }

      const keyData = await createKeyRes.json();

      return new Response(JSON.stringify({
        success: true,
        api_user_id: apiUserId,
        api_key: keyData.apiKey,
        message: "Sandbox credentials provisioned. Save these as secrets.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action. Use 'request_payment', 'check_status', or 'provision_sandbox'");
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("MoMo error:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
