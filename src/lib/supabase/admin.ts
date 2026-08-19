import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const validUrl = supabaseUrl && supabaseUrl !== "your-supabase-url" ? supabaseUrl : "https://placeholder.supabase.co";
const validKey = serviceKey && serviceKey !== "your-service-role-key" ? serviceKey : "placeholder-service-key";

if (!serviceKey || serviceKey === "your-service-role-key") {
  console.warn("Supabase admin client not configured — missing service role key.");
}

export const supabaseAdmin: SupabaseClient = createClient(validUrl, validKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});