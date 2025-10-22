"use client";
import { useEffect, useState } from "react";
import { Shield, User, Lock, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const supabase = createClientComponentClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      // Dapatkan session terbaru
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Session not created");
      }

      // Redirect dengan Next.js router
      router.push("/home");
      router.refresh(); // Penting untuk memperbarui middleware
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || "Login failed");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("Session after logout:", session);

      if (session) {
        router.push("/home");
      }
    };

    checkAuth();
  }, [router, supabase.auth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f2f7] px-4">
      <div className="bg-white shadow-lg rounded-xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-[#0075cf] w-16 h-16 rounded-full flex items-center justify-center">
            <Shield className="text-white" size={28} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800">
          Login Dashboard
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          Masuk ke sistem dashboard logistik
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="email"
              placeholder="Email"
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-2.5 text-gray-400"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Tombol */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-[#0075cf] hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-gray-400 text-xs mt-6">
          © 2024 Dashboard NKA
        </div>
      </div>
    </div>
  );
}
