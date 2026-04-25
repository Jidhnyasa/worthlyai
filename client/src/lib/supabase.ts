import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set — auth will not work");
}

export const supabase = createClient(
  SUPABASE_URL  || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY || "placeholder",
);

export type SupabaseUser = Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"];
