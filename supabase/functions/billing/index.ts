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

    const { clinic_id, patient_id, items } = await req.json()

    // Calculate total
    const total = items.reduce((sum, item) => sum + item.amount, 0)

    // Insert billing items
    const billingItems = items.map(item => ({
      clinic_id,
      description: item.description,
      amount: item.amount
    }))

    const { data: insertedItems, error: itemsError } = await supabaseClient
      .from('billing_items')
      .insert(billingItems)

    if (itemsError) throw itemsError

    return new Response(JSON.stringify({ success: true, total, items: insertedItems }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
