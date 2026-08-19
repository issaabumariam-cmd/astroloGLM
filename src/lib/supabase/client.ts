import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isValidUrl = (url?: string) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const validUrl = isValidUrl(supabaseUrl) ? supabaseUrl! : "https://placeholder.supabase.co";
const validKey = supabaseAnonKey && supabaseAnonKey !== "your-supabase-anon-key"
  ? supabaseAnonKey
  : "placeholder-anon-key";

if (!isValidUrl(supabaseUrl)) {
  console.warn("Supabase URL not configured. Auth features will not work until credentials are set.");
}

export const supabase: SupabaseClient = createClient(validUrl, validKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});