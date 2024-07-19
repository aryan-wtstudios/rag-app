import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabse'

// Create a single supabase client for interacting with your database
const supabase = createClient<Database>(
    process.env.EXPO_PUBLIC_SUPABASE_URL || "", 
    process.env.EXPO_PUBLIC_SUPABASE_KEY || "")


 export default supabase