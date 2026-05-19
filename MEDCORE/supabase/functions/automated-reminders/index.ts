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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get("Authorization") ?? "";
    const bearerToken = authHeader.replace("Bearer ", "").trim();
    const isServiceRoleCall = bearerToken === supabaseKey;

    const { action, user_id } = await req.json();

    if (!user_id) throw new Error("user_id is required");

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

    const results: any[] = [];

    // Check SMS settings from user preferences (stored in sms_credits for now)
    const { data: creditData } = await supabase
      .from("sms_credits")
      .select("balance")
      .eq("user_id", user_id)
      .maybeSingle();

    const balance = creditData?.balance || 0;

    if (action === "appointment_reminders") {
      // Find tomorrow's appointments that haven't been reminded
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      const { data: appointments } = await supabase
        .from("appointments")
        .select("id, patient_id, appointment_date, appointment_time, reason")
        .eq("appointment_date", tomorrowStr)
        .eq("status", "pending")
        .eq("reminder_sent", false);

      if (!appointments || appointments.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: "No appointment reminders needed", sent: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get patient phones
      const patientIds = appointments.map(a => a.patient_id);
      const { data: patients } = await supabase
        .from("patients")
        .select("id, name, phone")
        .in("id", patientIds);

      const patientMap = Object.fromEntries((patients || []).map(p => [p.id, p]));

      const messages = [];
      const appointmentIds = [];

      for (const apt of appointments) {
        const patient = patientMap[apt.patient_id];
        if (!patient?.phone) continue;

        const timeStr = apt.appointment_time ? ` at ${apt.appointment_time}` : "";
        const message = `Dear ${patient.name}, this is a reminder of your appointment tomorrow${timeStr}${apt.reason ? ` for ${apt.reason}` : ""}. Please be on time. Thank you.`;

        messages.push({
          phone: patient.phone,
          text: message,
          recipient_name: patient.name,
          patient_id: patient.id,
          message_type: "appointment_reminder",
          category: "appointment",
        });
        appointmentIds.push(apt.id);
      }

      if (messages.length > 0 && balance > 0) {
        // Send via send-sms function
        const smsUrl = `${supabaseUrl}/functions/v1/send-sms`;
        const smsRes = await fetch(smsUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages, sent_by: user_id }),
        });

        const smsResult = await smsRes.json();

        // Mark reminders as sent
        if (smsResult.success) {
          await supabase
            .from("appointments")
            .update({ reminder_sent: true })
            .in("id", appointmentIds);
        }

        results.push({ type: "appointments", sent: messages.length, result: smsResult });
      }
    }

    if (action === "debt_reminders") {
      // Find patients with credit/unpaid billing items
      const { data: creditItems } = await supabase
        .from("billing_items")
        .select("patient_id, total_amount")
        .eq("status", "credit");

      if (!creditItems || creditItems.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: "No debt reminders needed", sent: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Sum debts per patient
      const debtMap: Record<string, number> = {};
      for (const item of creditItems) {
        debtMap[item.patient_id] = (debtMap[item.patient_id] || 0) + item.total_amount;
      }

      const patientIds = Object.keys(debtMap);
      const { data: patients } = await supabase
        .from("patients")
        .select("id, name, phone")
        .in("id", patientIds);

      const messages = [];
      for (const patient of (patients || [])) {
        if (!patient.phone) continue;
        const debt = debtMap[patient.id];
        if (!debt || debt <= 0) continue;

        // Fetch clinic name from user metadata
        const { data: userData } = await supabase.auth.admin.getUserById(user_id);
        const clinicName = userData?.user?.user_metadata?.clinic_name || "MEDICORE";

        const message = `Dear ${patient.name}, you have an outstanding balance of UGX ${debt.toLocaleString()} at ${clinicName}. Kindly clear your balance at your earliest convenience. Thank you.`;

        messages.push({
          phone: patient.phone,
          text: message,
          recipient_name: patient.name,
          patient_id: patient.id,
          message_type: "debt_reminder",
          category: "billing",
        });
      }

      if (messages.length > 0 && balance > 0) {
        const smsUrl = `${supabaseUrl}/functions/v1/send-sms`;
        const smsRes = await fetch(smsUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages, sent_by: user_id }),
        });

        const smsResult = await smsRes.json();
        results.push({ type: "debts", sent: messages.length, result: smsResult });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results, totalSent: results.reduce((s, r) => s + (r.sent || 0), 0) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
