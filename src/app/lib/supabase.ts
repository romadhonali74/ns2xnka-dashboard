// lib/supabase.ts
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { cookies } from "next/dist/server/request/cookies";


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

declare module '@supabase/supabase-js' {
  interface User {
    role?: string;
  }
}

export type CustomUser = User & {
  role?: string;
  user_metadata?: {
    role?: string;
  };
};

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
  );
}

// Client di Client Component
export const createBrowserClient = () => createClient(supabaseUrl, supabaseAnonKey);

// Client di Server Component / Middleware (baca dari cookie)
export const createServerSupabaseClient = async () => {
  const cookieStore = cookies();
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${(await cookieStore).get("sb-access-token")?.value || ""}`,
      },
    },
  });
};

// Singleton (optional)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);


