// types/auth.ts
import { User } from "@supabase/supabase-js";

// Definisikan struktur user_metadata yang diharapkan
export type UserMetadata = {
  role?: "admin" | "user" | "manager"; // Enum roles yang mungkin
  full_name?: string;
  avatar_url?: string;
  // Tambahkan properti lain yang digunakan dalam aplikasi Anda
};

export type AppUser = User & {
  role?: string; // Untuk backward compatibility
  user_metadata?: UserMetadata;
  app_role?: string; // Field dari database users table
  user_role?: string; // Field dari database users table
};

export type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
};
