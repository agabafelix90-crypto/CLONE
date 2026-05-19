import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GENIUS_API_URL =
  "https://geniussmsgroup.com/api/json/messages1/jsonMessagesService";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GENIUS_USERNAME = Deno.env.get("GENIUS_SMS_USERNAME");
    const GENIUS_PASSWORD = Deno.env.get("GENIUS_SMS_PASSWORD");
    const GENIUS_SENDER_ID = Deno.env.get("GENIUS_SMS_SENDER_ID");

    if (!GENIUS_USERNAME || !GENIUS_PASSWORD || !GENIUS_SENDER_ID) {
      throw new Error("Genius SMS credentials not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get("Authorization") ?? "";
    const bearerToken = authHeader.replace("Bearer ", "").trim();
    const isServiceRoleCall = bearerToken === supabaseKey;

    const { messages, sent_by } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error("No messages provided");
    }

    if (!sent_by) {
      throw new Error("sent_by (user_id) is required");
    }

    if (!isServiceRoleCall) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
      if (!anonKey || !bearerToken) {
        throw new Error("Unauthorized request");
      }
      const authClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userErr } = await authClient.auth.getUser();
      if (userErr || !userData.user || userData.user.id !== sent_by) {
        throw new Error("Forbidden: sender identity mismatch");
      }
    }

    // SECURITY: Rate limiting - max 100 SMS per hour per user
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .rpc("check_sms_rate_limit", { p_user_id: sent_by, p_message_count: messages.length });

    if (rateLimitError || !rateLimitData) {
      throw new Error("SMS sending rate limit exceeded. Maximum 100 messages per hour.");
    }

    // SECURITY: Message validation
    for (const msg of messages) {
      if (!msg.phone || !msg.text) {
        throw new Error("Phone number and message text are required for all messages");
      }

      // SECURITY: Phone number format validation
      const cleanPhone = msg.phone.replace(/\D/g, "");
      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        throw new Error(`Invalid phone number format: ${msg.phone}`);
      }

      // SECURITY: Message length validation (160 chars max for single SMS)
      if (msg.text.length > 160) {
        throw new Error("Message too long. Maximum 160 characters per SMS.");
      }

      // SECURITY: Content validation - prevent malicious content
      const maliciousPatterns = [
        /<script/i, /javascript:/i, /vbscript:/i, /onload=/i, /onerror=/i,
        /<iframe/i, /<object/i, /<embed/i, /<form/i, /<input/i
      ];

      for (const pattern of maliciousPatterns) {
        if (pattern.test(msg.text)) {
          throw new Error("Message contains potentially malicious content");
        }
      }
    }

    // Check facility credit balance
    const { data: creditData } = await supabase
      .from("sms_credits")
      .select("balance")
      .eq("user_id", sent_by)
      .maybeSingle();

    const currentBalance = creditData?.balance || 0;

    // Estimate total cost: we'll use Genius API cost after sending, but pre-check minimum
    const totalRecipients = messages.length;
    const estimatedCostPerSms = 50; // UGX 50 minimum per SMS
    const estimatedTotal = totalRecipients * estimatedCostPerSms;

    if (currentBalance < estimatedTotal) {
      throw new Error(`Insufficient SMS credit balance. Current: UGX ${currentBalance.toLocaleString()}, Estimated cost: UGX ${estimatedTotal.toLocaleString()}. Please top up.`);
    }

    const results = [];

    // Group messages by text content to batch where possible
    const grouped: Record<string, typeof messages> = {};
    for (const msg of messages) {
      const key = msg.text;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(msg);
    }

    let totalCostDeducted = 0;

    for (const [messageBody, group] of Object.entries(grouped)) {
      const numbers = group.map((m: any) => m.phone.replace(/\D/g, ""));

      const payload = {
        user: { username: GENIUS_USERNAME, password: GENIUS_PASSWORD },
        messages: [
          {
            numbers,
            senderid: GENIUS_SENDER_ID,
            messageBody,
          },
        ],
      };

      let apiResponse: any = null;
      let status = "failed";

      try {
        const res = await fetch(GENIUS_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        apiResponse = await res.json();
        if (apiResponse.status === "SUCCESS" || apiResponse.status === "SENT") {
          status = "sent";
        }
      } catch (err) {
        apiResponse = { error: String(err) };
      }

      // Log each individual recipient and calculate cost
      for (const msg of group) {
        const charCount = messageBody.length;
        const smsCost = apiResponse?.cost || Math.max(charCount * 0.9, 50);
        
        if (status === "sent") {
          totalCostDeducted += smsCost;
        }

        const logEntry = {
          recipient_name: msg.recipient_name || null,
          recipient_phone: msg.phone,
          patient_id: msg.patient_id || null,
          message: messageBody,
          message_type: msg.message_type || "manual",
          category: msg.category || "general",
          char_count: charCount,
          cost: smsCost,
          status,
          api_response: apiResponse,
          sent_by: sent_by || null,
        };

        await supabase.from("sms_logs").insert(logEntry);
      }

      results.push({ messageBody: messageBody.substring(0, 50), recipients: numbers.length, status, apiResponse });
    }

    // Deduct credits for successfully sent messages
    if (totalCostDeducted > 0) {
      const newBalance = Math.max(0, currentBalance - totalCostDeducted);
      
      await supabase.from("sms_credits").upsert({
        user_id: sent_by,
        balance: newBalance,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      // Log deduction transaction
      await supabase.from("sms_credit_transactions").insert({
        user_id: sent_by,
        type: "deduction",
        amount: totalCostDeducted,
        balance_after: newBalance,
        description: `SMS sent to ${totalRecipients} recipient(s)`,
        status: "completed",
      });
    }

    return new Response(JSON.stringify({ success: true, results, cost_deducted: totalCostDeducted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("SMS send error:", errorMessage);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
