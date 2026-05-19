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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      throw new Error("Unauthorized request");
    }
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData.user) {
      throw new Error("Unauthorized request");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("AI service not configured");
    }

    const { action, data } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "clinical_notes":
        systemPrompt = "You are an expert clinical assistant for a healthcare facility in Uganda. Generate concise, professional clinical notes based on patient data. Use standard medical terminology. Keep responses focused and practical.";
        userPrompt = `Generate clinical notes for this patient:\nName: ${data.name}\nAge: ${data.age}\nGender: ${data.gender}\nChief Complaint: ${data.chief_complaint}\nVitals: ${data.vitals || 'Not recorded'}\nDiagnosis: ${data.diagnosis || 'Pending'}\nSymptoms: ${data.symptoms || 'Not specified'}`;
        break;

      case "drug_suggestions":
        systemPrompt = "You are a clinical pharmacology assistant. Based on the diagnosis and patient profile, suggest appropriate medications with dosages, routes, and frequencies. Consider drug interactions and contraindications. Format as a concise list. Use drugs commonly available in East African pharmacies.";
        userPrompt = `Suggest treatment for:\nDiagnosis: ${data.diagnosis}\nAge: ${data.age}\nGender: ${data.gender}\nAllergies: ${data.allergies || 'NKDA'}\nWeight: ${data.weight || 'Unknown'}kg`;
        break;

      case "food_suggestions":
        systemPrompt = "You are a clinical nutrition advisor. Provide dietary recommendations based on the patient's condition. Consider locally available foods in Uganda/East Africa. Be practical and culturally sensitive.";
        userPrompt = `Dietary recommendations for:\nCondition: ${data.diagnosis}\nAge: ${data.age}\nGender: ${data.gender}\nAllergies: ${data.allergies || 'None'}`;
        break;

      case "report_generation":
        systemPrompt = "You are a medical report writer. Generate a professional, structured medical report suitable for clinical records. Include sections: Summary, Findings, Assessment, and Recommendations.";
        userPrompt = `Generate a medical report:\nPatient: ${data.name}\nAge: ${data.age}, ${data.gender}\nDiagnosis: ${data.diagnosis}\nTreatment Given: ${data.treatment || 'See prescriptions'}\nLab Results: ${data.lab_results || 'Pending'}\nVitals: ${data.vitals || 'See records'}`;
        break;

      case "disease_analysis":
        systemPrompt = "You are a public health epidemiologist. Analyze disease patterns and provide insights. Include trend observations, risk factors, and recommendations for the facility. Focus on actionable insights for a clinic in Uganda.";
        userPrompt = `Analyze these disease statistics:\n${JSON.stringify(data.statistics, null, 2)}\n\nProvide:\n1. Key trends\n2. High-risk observations\n3. Recommended interventions\n4. Seasonal patterns if any`;
        break;

      case "employee_assessment":
        systemPrompt = "You are an HR performance analyst for a healthcare facility. Based on the employee metrics, provide a fair performance assessment with specific, actionable feedback. Be constructive and balanced.";
        userPrompt = `Assess this employee:\nName: ${data.name}\nRole: ${data.role}\nPatients Handled: ${data.patients_handled || 0}\nPrescriptions Written: ${data.prescriptions || 0}\nAttendance Rate: ${data.attendance || 'N/A'}\nPeriod: ${data.period || 'This month'}`;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI request failed: ${response.status} - ${errText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "No response generated.";

    return new Response(
      JSON.stringify({ success: true, content, action }),
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
