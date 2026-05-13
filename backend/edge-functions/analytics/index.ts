import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { clinic_id, metric } = await req.json()

    // Example: Get real-time analytics for clinic
    const { data: appointments } = await supabaseClient
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinic_id)

    const { data: sales } = await supabaseClient
      .from('sales')
      .select('*')
      .eq('clinic_id', clinic_id)

    const analytics = {
      total_appointments: appointments?.length || 0,
      total_sales: sales?.reduce((sum, sale) => sum + sale.total_price, 0) || 0,
      metric: metric
    }

    return new Response(JSON.stringify(analytics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})