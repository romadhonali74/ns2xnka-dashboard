// app/add/page.tsx (atau nama file Anda untuk halaman tambah)
"use client";
import { useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input"; // Pastikan Input diimpor
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { useAuth } from "../../providers/auth_provider";

type UnknownRecord = Record<string, unknown>;
function extractBureu(user: unknown): string | null {
  if (user && typeof user === "object") {
    const root = user as UnknownRecord;
    const appMeta = root["app_metadata"];
    if (appMeta && typeof appMeta === "object") {
      const obj = appMeta as UnknownRecord;
      const bureu = obj["bureu"];
      if (typeof bureu === "string") return bureu.toLowerCase();
    }
    const userMeta = root["user_metadata"];
    if (userMeta && typeof userMeta === "object") {
      const obj = userMeta as UnknownRecord;
      const bureu = obj["bureu"];
      if (typeof bureu === "string") return bureu.toLowerCase();
    }
    const rawApp = root["raw_app_meta_data"];
    if (rawApp && typeof rawApp === "object") {
      const obj = rawApp as UnknownRecord;
      const bureu = obj["bureu"];
      if (typeof bureu === "string") return bureu.toLowerCase();
    }
    const rawUser = root["raw_user_meta_data"];
    if (rawUser && typeof rawUser === "object") {
      const obj = rawUser as UnknownRecord;
      const bureu = obj["bureu"];
      if (typeof bureu === "string") return bureu.toLowerCase();
    }
  }
  return null;
}

export default function AddSignificantIssuePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tanggal, setTanggal] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Pastikan format tanggal sudah YYYY-MM-DD sebelum dikirim ke API/Supabase
      // Jika input type="date", ini sudah otomatis dalam format YYYY-MM-DD
      const bureu = extractBureu(user);
      const response = await fetch("/api/significant-issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(bureu ? { "x-bureu": bureu } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ tanggal, keterangan }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      router.replace("/issues"); // Go back to the list page after saving
      router.refresh(); // Revalidate data on the list page
    } catch (err: unknown) {
      console.error("Failed to add significant issue:", err);
      // Pengecekan tipe untuk error yang lebih baik, seperti yang dibahas sebelumnya
      if (err instanceof Error) {
        setError(err.message || "Gagal menambahkan masalah signifikan.");
      } else {
        setError("Gagal menambahkan masalah signifikan (unknown error).");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#f1f2f7" }}
    >
      <div className="w-full max-w-md">
        <Card className="shadow-lg bg-white border-none">
          <CardHeader className="pb-1"></CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label
                  htmlFor="tanggal"
                  className="text-sm font-medium"
                  style={{ color: "#273240" }}
                >
                  Tanggal<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tanggal"
                  name="tanggal"
                  type="date" // <--- UBAH DI SINI!
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="keterangan"
                  className="text-sm font-medium"
                  style={{ color: "#273240" }}
                >
                  Keterangan
                </Label>
                <Textarea
                  id="keterangan"
                  name="keterangan"
                  placeholder="Significant Issue"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  rows={5}
                />
              </div>

              <Button
                type="submit"
                className="w-full text-white"
                disabled={isLoading}
                style={{ backgroundColor: "#0075cf" }}
              >
                {isLoading ? "Menyimpan..." : "Simpan"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
