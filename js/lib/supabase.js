import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jzfdxstpomdcoucywimy.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_f7FTaja3G59yW29OAGulbQ_KwllAjL5'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)